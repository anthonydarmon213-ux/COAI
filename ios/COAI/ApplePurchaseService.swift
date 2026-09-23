import Foundation
import StoreKit

/// Used by the native subscription screen; remote purchases remain gated.
/// No products, prices or account token are invented locally. The authenticated
/// backend must supply the approved catalogue and a stable account token.
@MainActor
final class ApplePurchaseService {
    enum Failure: Error {
        case unavailable, busy, unknownProduct, unverifiedTransaction
        case differentAccount, serverNotConfirmed
    }
    enum Outcome: Equatable { case cancelled, pending, delivered }
    struct Offer: Identifiable {
        let id: String
        let displayPrice: String
        let period: String
        let hasSevenDayTrial: Bool
    }
    typealias Deliver = @MainActor (String) async throws -> PurchaseAcknowledgement

    private let productIDs: Set<String>
    private let accountToken: UUID
    private let deliver: Deliver
    private let authorizeAccount: @MainActor () async throws -> Void
    private let products = OfferCache<Product>()
    private var busy = false
    private var reconciling = false
    private var listener: Task<Void, Never>?

    init(productIDs: Set<String>, accountToken: UUID,
         authorizeAccount: @escaping @MainActor () async throws -> Void,
         deliver: @escaping Deliver) {
        self.productIDs = productIDs
        self.accountToken = accountToken
        self.deliver = deliver
        self.authorizeAccount = authorizeAccount
    }

    deinit { listener?.cancel() }

    /// Only pass periods from the authenticated COAI catalogue. StoreKit remains
    /// authoritative for localized prices, configured offers and eligibility.
    /// Missing products or mismatched periods must not become purchase buttons.
    func loadOffers(expectedPeriods: [String: String]) async throws -> [Offer] {
        guard !busy else { throw Failure.busy }
        return try await products.reload {
            guard !productIDs.isEmpty else { throw Failure.unavailable }
            guard Set(expectedPeriods.keys) == productIDs else { throw Failure.unknownProduct }
            let loaded = try await Product.products(for: productIDs)
            var offers: [Offer] = []
            var validated: [String: Product] = [:]
            for product in loaded {
                guard productIDs.contains(product.id), product.type == .autoRenewable,
                      let subscription = product.subscription,
                      let expected = expectedPeriods[product.id] else { continue }
                let period = subscription.subscriptionPeriod
                let matches = (expected == "P1M" && period.unit == .month && period.value == 1) ||
                    (expected == "P1Y" && period.unit == .year && period.value == 1)
                guard matches else { continue }
                let intro = subscription.introductoryOffer
                let sevenDays = intro.map {
                    (($0.period.unit == .day && $0.period.value == 7) ||
                     ($0.period.unit == .week && $0.period.value == 1)) && $0.periodCount == 1
                } ?? false
                let configuredTrial = intro?.paymentMode == .freeTrial && sevenDays
                let eligible = configuredTrial ? await subscription.isEligibleForIntroOffer : false
                validated[product.id] = product
                offers.append(Offer(id: product.id, displayPrice: product.displayPrice,
                                    period: expected, hasSevenDayTrial: configuredTrial && eligible))
            }
            return (validated, offers.sorted { $0.period == "P1M" && $1.period != "P1M" })
        }
    }

    /// Wire only to an explicit purchase button after displaying Apple's price,
    /// subscription period, renewal conditions and the account being charged.
    func purchase(productID: String) async throws -> Outcome {
        guard !busy && !products.isLoading else { throw Failure.busy }
        guard AppStore.canMakePayments else { throw Failure.unavailable }
        guard let product = products.values[productID] else { throw Failure.unknownProduct }
        busy = true
        defer { busy = false }
        try await authorizeAccount()
        try Task.checkCancellation()
        switch try await product.purchase(options: [.appAccountToken(accountToken)]) {
        case .userCancelled: return .cancelled
        case .pending: return .pending
        case .success(let result):
            try await process(result)
            return .delivered
        @unknown default: throw Failure.unavailable
        }
    }

    /// Explicit user action only: AppStore.sync may display an Apple login prompt.
    /// Returned count means processed transactions, NOT necessarily active access
    /// (refunds/expiry are reconciled by the server too).
    func restorePurchases() async throws -> Int {
        guard !busy && !products.isLoading else { throw Failure.busy }
        guard !productIDs.isEmpty else { throw Failure.unavailable }
        busy = true
        defer { busy = false }
        try await authorizeAccount()
        try Task.checkCancellation()
        try await AppStore.sync()
        return try await reconcile()
    }

    /// Invoke on authenticated startup/retry, never implies a new charge.
    func reconcile(updates: [VerificationResult<Transaction>] = []) async throws -> Int {
        guard !reconciling else { throw Failure.busy }
        reconciling = true
        defer { reconciling = false }
        try await authorizeAccount()
        try Task.checkCancellation()
        let batch = PurchaseRecoveryBatch()
        for result in updates { try await recover(result, into: batch) }
        for await result in Transaction.unfinished {
            try await recover(result, into: batch)
        }
        for await result in Transaction.currentEntitlements {
            try await recover(result, into: batch)
        }
        return try batch.result()
    }

    private func recover(_ result: VerificationResult<Transaction>, into batch: PurchaseRecoveryBatch) async throws {
        let id: UInt64?
        if case .verified(let transaction) = result { id = transaction.id } else { id = nil }
        try await batch.attempt(id: id) { try await self.processIfOwned(result) }
    }

    /// Retain the service for one authenticated account, stop on logout. Server
    /// delivery MUST be idempotent: purchase(), updates and retries may overlap.
    func startObserving(onError: @escaping @MainActor (Error) -> Void) {
        guard listener == nil else { return }
        listener = Task { [weak self] in
            for await result in Transaction.updates {
                guard !Task.isCancelled, let self else { return }
                do { _ = try await self.processIfOwned(result) }
                catch { onError(error) }
            }
        }
    }

    func stopObserving() { listener?.cancel(); listener = nil }

    private func processIfOwned(_ result: VerificationResult<Transaction>) async throws -> UInt64? {
        guard case .verified(let transaction) = result else { throw Failure.unverifiedTransaction }
        guard productIDs.contains(transaction.productID) else { return nil }
        try await process(result)
        return transaction.id
    }

    private func process(_ result: VerificationResult<Transaction>) async throws {
        guard case .verified(let transaction) = result else { throw Failure.unverifiedTransaction }
        guard productIDs.contains(transaction.productID), transaction.productType == .autoRenewable else {
            throw Failure.unknownProduct
        }
        guard transaction.appAccountToken == accountToken else { throw Failure.differentAccount }
        // Send the signed JWS, never client-provided plan/price/expiry claims.
        do {
            try await PurchaseDelivery.complete(transactionID: String(transaction.id), accountToken: accountToken,
                deliver: { try await self.deliver(result.jwsRepresentation) },
                finish: { await transaction.finish() })
        } catch PurchaseDelivery.Failure.serverNotConfirmed {
            throw Failure.serverNotConfirmed
        }
    }
}
