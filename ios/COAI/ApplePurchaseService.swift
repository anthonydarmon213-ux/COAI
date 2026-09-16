import Foundation
import StoreKit

/// Prepared integration, deliberately not instantiated by COAIApp yet.
/// No products, prices or account token are invented locally. The authenticated
/// backend must supply the approved catalogue and a stable account token.
@MainActor
final class ApplePurchaseService {
    enum Failure: Error {
        case unavailable, busy, unknownProduct, unverifiedTransaction
        case differentAccount, serverNotConfirmed
    }
    enum Outcome: Equatable { case cancelled, pending, delivered }
    typealias Deliver = @MainActor (String) async throws -> PurchaseAcknowledgement

    private let productIDs: Set<String>
    private let accountToken: UUID
    private let deliver: Deliver
    private var products: [String: Product] = [:]
    private var busy = false
    private var listener: Task<Void, Never>?

    init(productIDs: Set<String>, accountToken: UUID, deliver: @escaping Deliver) {
        self.productIDs = productIDs
        self.accountToken = accountToken
        self.deliver = deliver
    }

    deinit { listener?.cancel() }

    func loadProducts() async throws -> [Product] {
        guard !productIDs.isEmpty else { throw Failure.unavailable }
        let loaded = try await Product.products(for: productIDs)
        let allowed = loaded.filter { productIDs.contains($0.id) && $0.type == .autoRenewable }
        products = Dictionary(uniqueKeysWithValues: allowed.map { ($0.id, $0) })
        return allowed.sorted { $0.id < $1.id }
    }

    /// Wire only to an explicit purchase button after displaying Apple's price,
    /// subscription period, renewal conditions and the account being charged.
    func purchase(productID: String) async throws -> Outcome {
        guard !busy else { throw Failure.busy }
        guard AppStore.canMakePayments else { throw Failure.unavailable }
        guard let product = products[productID] else { throw Failure.unknownProduct }
        busy = true
        defer { busy = false }
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
        guard !busy else { throw Failure.busy }
        busy = true
        defer { busy = false }
        try await AppStore.sync()
        return try await reconcile()
    }

    /// Invoke on authenticated startup/retry, never implies a new charge.
    func reconcile() async throws -> Int {
        var seen = Set<UInt64>()
        var count = 0
        for await result in Transaction.unfinished {
            if let id = try await processIfOwned(result), seen.insert(id).inserted { count += 1 }
        }
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { throw Failure.unverifiedTransaction }
            if !seen.contains(transaction.id), let id = try await processIfOwned(result) {
                seen.insert(id)
                count += 1
            }
        }
        return count
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
        try Task.checkCancellation()
        // Send the signed JWS, never client-provided plan/price/expiry claims.
        let acknowledgement = try await deliver(result.jwsRepresentation)
        guard PurchaseDelivery.mayFinish(transactionID: String(transaction.id), accountToken: accountToken,
                                         acknowledgement: acknowledgement) else {
            throw Failure.serverNotConfirmed
        }
        try Task.checkCancellation()
        await transaction.finish()
    }
}
