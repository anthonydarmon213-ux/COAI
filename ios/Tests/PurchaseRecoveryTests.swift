import XCTest
@testable import COAICore

final class PurchaseRecoveryTests: XCTestCase {
    enum Failure: Error { case offline }

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
