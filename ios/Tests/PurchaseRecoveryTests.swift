import XCTest
@testable import COAICore

final class PurchaseRecoveryTests: XCTestCase {
    enum Failure: Error { case offline }

    func testAccessSnapshotConsistencyMatrix() {
        for apple in [false, true] {
            for stripe in [false, true] {
                for subscribed in [false, true] {
                    for programme in [false, true] {
                        let access = PurchaseAccess(subscribed: subscribed, programme: programme,
                                                    sources: .init(stripe: stripe, apple: apple))
                        XCTAssertEqual(access.isConsistent, subscribed == (apple || stripe) && (!subscribed || programme))
                    }
                }
            }
        }
    }

    func testAccessMessagesDoNotConfuseOtherMembershipWithApple() {
        let apple = PurchaseAccess(subscribed: true, programme: true, sources: .init(stripe: false, apple: true))
        XCTAssertTrue(apple.confirmation.contains("Apple est actif"))
        let stripe = PurchaseAccess(subscribed: true, programme: true, sources: .init(stripe: true, apple: false))
        XCTAssertTrue(stripe.confirmation.contains("Aucun abonnement Apple actif"))
        let historical = PurchaseAccess(subscribed: false, programme: true, sources: .init(stripe: false, apple: false))
        XCTAssertTrue(historical.confirmation.contains("déjà débloqués"))
        let expired = PurchaseAccess(subscribed: false, programme: false, sources: .init(stripe: false, apple: false))
        XCTAssertTrue(expired.confirmation.contains("Aucun abonnement actif"))
    }

    @MainActor
    func testInconsistentAccessNeverFinishesReceipt() async {
        let token = UUID()
        var finished = false
        do {
            _ = try await PurchaseDelivery.complete(transactionID: "1", accountToken: token,
                deliver: {
                    PurchaseAcknowledgement(transactionID: "1", accountToken: token, persisted: true,
                        access: PurchaseAccess(subscribed: true, programme: false, sources: .init(stripe: false, apple: true)))
                }, finish: { finished = true })
            XCTFail("Inconsistent server snapshot must be rejected")
        } catch {}
        XCTAssertFalse(finished)
    }

    @MainActor
    func testDeliveryReturnsConfirmedSnapshotAfterFinish() async throws {
        let token = UUID()
        let access = PurchaseAccess(subscribed: true, programme: true, sources: .init(stripe: false, apple: true))
        var finished = false
        let ack = try await PurchaseDelivery.complete(transactionID: "1", accountToken: token,
            deliver: { PurchaseAcknowledgement(transactionID: "1", accountToken: token, persisted: true, access: access) },
            finish: { finished = true })
        XCTAssertTrue(finished)
        XCTAssertEqual(ack.access, access)
    }

    @MainActor
    func testSchedulerThrottlesPagesButNotExplicitEvents() async {
        let scheduler = PurchaseRecoveryScheduler()
        let now = Date(timeIntervalSince1970: 1000)
        var calls = 0
        scheduler.request(now: now) { calls += 1 }
        await scheduler.waitUntilIdle()
        scheduler.request(now: now.addingTimeInterval(1)) { calls += 1 }
        await scheduler.waitUntilIdle()
        XCTAssertEqual(calls, 1)
        scheduler.request(force: true, now: now.addingTimeInterval(2)) { calls += 1 }
        await scheduler.waitUntilIdle()
        XCTAssertEqual(calls, 2)
    }

    @MainActor
    func testSchedulerCoalescesEventsDuringRecovery() async {
        let scheduler = PurchaseRecoveryScheduler()
        var calls = 0
        scheduler.request {
            calls += 1
            scheduler.request(force: true) { calls += 10 }
            scheduler.request(force: true) { calls += 100 }
        }
        await scheduler.waitUntilIdle()
        XCTAssertEqual(calls, 101)
    }

    @MainActor
    func testCancelledGenerationCannotClearNewSessionWork() async {
        let scheduler = PurchaseRecoveryScheduler()
        var calls = 0
        scheduler.request {
            scheduler.cancel()
            scheduler.request { calls += 1 }
        }
        await scheduler.waitUntilIdle()
        XCTAssertEqual(calls, 1)
    }

    @MainActor
    func testFailureDoesNotPreventOtherDeliveryAndIsNotHidden() async throws {
        let batch = PurchaseRecoveryBatch()
        var laterDelivered = false
        try await batch.attempt(id: 1) { throw Failure.offline }
        try await batch.attempt(id: 2) { laterDelivered = true; return 2 }
        XCTAssertTrue(laterDelivered)
        XCTAssertThrowsError(try batch.result())
    }

    @MainActor
    func testSuccessfulDuplicateIsNotDeliveredTwice() async throws {
        let batch = PurchaseRecoveryBatch()
        var calls = 0
        for _ in 0..<2 {
            try await batch.attempt(id: 7) { calls += 1; return 7 }
        }
        try await batch.attempt(id: 8) { nil } // unrelated product
        XCTAssertEqual(calls, 1)
        XCTAssertEqual(try batch.result(), 1)
    }

    @MainActor
    func testFailedReceiptRemainsRetryable() async throws {
        let batch = PurchaseRecoveryBatch()
        var retried = false
        try await batch.attempt(id: 7) { throw Failure.offline }
        try await batch.attempt(id: 7) { retried = true; return 7 }
        XCTAssertTrue(retried)
        XCTAssertEqual(try batch.result(), 1)
    }

    @MainActor
    func testCancellationStopsRecoveryImmediately() async throws {
        let batch = PurchaseRecoveryBatch()
        do {
            try await batch.attempt(id: 1) { throw CancellationError() }
            XCTFail("Cancellation must propagate")
        } catch is CancellationError {} catch { XCTFail("Unexpected error") }
    }
}
