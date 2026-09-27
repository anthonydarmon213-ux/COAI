import XCTest
import StoreKit
import StoreKitTest

// Runs the real purchase service against Apple's LOCAL StoreKit simulator.
// No COAI server, credentials, App Store Connect products or payments involved.
// This configuration and mock acknowledgement exist ONLY in the test bundle.
#if DEBUG && targetEnvironment(simulator)
@available(iOS 17.0, *)
final class COAIStoreKitLocalTests: XCTestCase {
    private let periods = ["fr.coai.localtest.essentiel.monthly": "P1M", "fr.coai.localtest.essentiel.annual": "P1Y"]
    private let monthly = "fr.coai.localtest.essentiel.monthly"
    private enum TestFailure: Error { case offline, unexpectedEnvironment }

    @MainActor
    private func localSession() throws -> SKTestSession {
        continueAfterFailure = false
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "COAILocal", withExtension: "storekit"))
        let session = try SKTestSession(contentsOf: url)
        session.resetToDefaultState()
        session.clearTransactions()
        session.disableDialogs = true
        session.storefront = "FRA"
        session.locale = Locale(identifier: "fr_FR")
        return session
    }

    // Decoding here is a TEST acknowledgement, never receipt verification.
    // Production still requires its independent Apple signature verifier.
    private func localPayload(_ jws: String) throws -> [String: Any] {
        let pieces = jws.split(separator: ".")
        XCTAssertEqual(pieces.count, 3)
        var base64 = String(try XCTUnwrap(pieces.dropFirst().first))
            .replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        base64 += String(repeating: "=", count: (4 - base64.count % 4) % 4)
        let data = try XCTUnwrap(Data(base64Encoded: base64))
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        guard payload["environment"] as? String == "Xcode" else { throw TestFailure.unexpectedEnvironment }
        return payload
    }

    @MainActor
    private func unfinishedIDs() async -> [UInt64] {
        var ids: [UInt64] = []
        for await result in StoreKit.Transaction.unfinished {
            if case .verified(let transaction) = result { ids.append(transaction.id) }
            if case .unverified(_, let error) = result { XCTFail("Local receipt verification failed: \(error)") }
        }
        return ids
    }

    @MainActor
    func testLocalPurchaseRetriesUnfinishedReceiptAfterServerFailure() async throws {
        let session = try localSession()
        defer { session.clearTransactions() }
        let token = UUID()
        var offline = true
        var deliveries = 0
        let access = PurchaseAccess(subscribed: true, programme: true, sources: .init(stripe: false, apple: true))
        let service = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: token,
            authorizeAccount: {}, deliver: { jws in
                let payload = try self.localPayload(jws)
                XCTAssertEqual((payload["appAccountToken"] as? String)?.lowercased(), token.uuidString.lowercased())
                deliveries += 1
                if offline { throw TestFailure.offline }
                return PurchaseAcknowledgement(transactionID: try XCTUnwrap(payload["transactionId"] as? String), accountToken: token, persisted: true, access: access)
            })
        let offers = try await service.loadOffers(expectedPeriods: periods)
        XCTAssertEqual(offers.count, 2)
        XCTAssertEqual(offers.first?.period, "P1M")
        XCTAssertTrue(offers.allSatisfy { $0.hasSevenDayTrial && !$0.displayPrice.isEmpty })
        XCTAssertTrue(try XCTUnwrap(offers.first { $0.period == "P1M" }).displayPrice.contains("19,99"))
        XCTAssertTrue(try XCTUnwrap(offers.first { $0.period == "P1Y" }).displayPrice.contains("119"))
        do {
            _ = try await service.purchase(productID: monthly)
            XCTFail("Server failure must not report delivered")
        } catch TestFailure.offline {}
        XCTAssertNil(service.latestAccess)
        var unfinished = await unfinishedIDs()
        for _ in 0..<30 where unfinished.isEmpty {
            try await Task.sleep(for: .milliseconds(100))
            unfinished = await unfinishedIDs()
        }
        XCTAssertEqual(unfinished.count, 1, "Failed delivery must remain retryable")
        offline = false
        let restored = try await service.restorePurchases()
        XCTAssertEqual(restored, 1)
        XCTAssertEqual(service.latestAccess, access)
        let remaining = await unfinishedIDs()
        XCTAssertTrue(remaining.isEmpty)
        XCTAssertEqual(deliveries, 2, "Recovery deduplicates unfinished and current entitlement")
    }

    @MainActor
    func testLocalCancelledAndPendingPurchasesNeverDeliverAccess() async throws {
        let session = try localSession()
        defer { session.clearTransactions(); session.resetToDefaultState() }
        var deliveries = 0
        let service = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: UUID(),
            authorizeAccount: {}, deliver: { _ in deliveries += 1; throw TestFailure.offline })
        _ = try await service.loadOffers(expectedPeriods: periods)
        try await session.setSimulatedError(.generic(.userCancelled), forAPI: .purchase)
        let cancelled = try await service.purchase(productID: monthly)
        XCTAssertEqual(cancelled, .cancelled)
        try await session.setSimulatedError(nil, forAPI: .purchase)
        session.askToBuyEnabled = true
        let pending = try await service.purchase(productID: monthly)
        XCTAssertEqual(pending, .pending)
        XCTAssertEqual(deliveries, 0)
        XCTAssertNil(service.latestAccess)
    }

    @MainActor
    func testLocalReceiptCannotBeRestoredIntoAnotherCOAIAccount() async throws {
        let session = try localSession()
        defer { session.clearTransactions() }
        let ownerToken = UUID()
        var ownerOffline = true
        var strangerDeliveries = 0
        let owner = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: ownerToken,
            authorizeAccount: {}, deliver: { jws in
                let payload = try self.localPayload(jws)
                if ownerOffline { throw TestFailure.offline }
                return PurchaseAcknowledgement(transactionID: try XCTUnwrap(payload["transactionId"] as? String),
                    accountToken: ownerToken, persisted: true,
                    access: .init(subscribed: true, programme: true, sources: .init(stripe: false, apple: true)))
            })
        _ = try await owner.loadOffers(expectedPeriods: periods)
        do { _ = try await owner.purchase(productID: monthly); XCTFail("Delivery should fail") }
        catch TestFailure.offline {}
        let stranger = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: UUID(),
            authorizeAccount: {}, deliver: { _ in strangerDeliveries += 1; throw TestFailure.offline })
        do { _ = try await stranger.restorePurchases(); XCTFail("Wrong account must be rejected") }
        catch ApplePurchaseService.Failure.differentAccount {}
        XCTAssertEqual(strangerDeliveries, 0)
        XCTAssertNil(stranger.latestAccess)
        ownerOffline = false
        let restored = try await owner.restorePurchases()
        XCTAssertEqual(restored, 1)
        XCTAssertEqual(owner.latestAccess?.sources.apple, true)
    }

    @MainActor
    func testLocalRefundUpdateDoesNotKeepActiveAccess() async throws {
        let session = try localSession()
        defer { session.clearTransactions() }
        let token = UUID()
        let service = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: token,
            authorizeAccount: {}, deliver: { jws in
                let payload = try self.localPayload(jws)
                let active = payload["revocationDate"] == nil
                return PurchaseAcknowledgement(transactionID: try XCTUnwrap(payload["transactionId"] as? String),
                    accountToken: token, persisted: true,
                    access: .init(subscribed: active, programme: active, sources: .init(stripe: false, apple: active)))
            })
        _ = try await service.loadOffers(expectedPeriods: periods)
        let outcome = try await service.purchase(productID: monthly)
        XCTAssertEqual(outcome, .delivered)
        XCTAssertEqual(service.latestAccess?.sources.apple, true)
        var afterPurchase = try await service.loadOffers(expectedPeriods: periods)
        for _ in 0..<30 where afterPurchase.contains(where: { $0.hasSevenDayTrial }) {
            try await Task.sleep(for: .milliseconds(100))
            afterPurchase = try await service.loadOffers(expectedPeriods: periods)
        }
        XCTAssertFalse(afterPurchase.isEmpty)
        XCTAssertTrue(afterPurchase.allSatisfy { !$0.hasSevenDayTrial }, "Consumed trial must not be offered again")
        let purchase = try XCTUnwrap(session.allTransactions().first)
        try session.refundTransaction(identifier: purchase.identifier)
        var update = await StoreKit.Transaction.latest(for: monthly)
        for _ in 0..<30 {
            if case .verified(let transaction) = update, transaction.revocationDate != nil { break }
            try await Task.sleep(for: .milliseconds(100))
            update = await StoreKit.Transaction.latest(for: monthly)
        }
        guard case .verified(let refunded) = update else { return XCTFail("Missing verified refund") }
        XCTAssertNotNil(refunded.revocationDate)
        let reconciled = try await service.reconcile(updates: [try XCTUnwrap(update)])
        XCTAssertEqual(reconciled, 1)
        XCTAssertEqual(service.latestAccess?.subscribed, false)
        XCTAssertEqual(service.latestAccess?.programme, false)
    }

    @MainActor
    func testLocalProductFetchFailureInvalidatesPreviouslyLoadedOffers() async throws {
        let session = try localSession()
        defer { session.clearTransactions(); session.resetToDefaultState() }
        var authorizations = 0
        let service = ApplePurchaseService(productIDs: Set(periods.keys), accountToken: UUID(),
            authorizeAccount: { authorizations += 1 }, deliver: { _ in throw TestFailure.offline })
        let offers = try await service.loadOffers(expectedPeriods: periods)
        XCTAssertEqual(offers.count, 2)
        try await session.setSimulatedError(.generic(.networkError(URLError(.notConnectedToInternet))), forAPI: .loadProducts)
        do { _ = try await service.loadOffers(expectedPeriods: periods); XCTFail("Expected product loading failure") }
        catch {}
        do { _ = try await service.purchase(productID: monthly); XCTFail("Stale offer must not start a purchase") }
        catch ApplePurchaseService.Failure.unknownProduct {}
        XCTAssertEqual(authorizations, 0)
        XCTAssertTrue(session.allTransactions().isEmpty)
    }
}
#endif
