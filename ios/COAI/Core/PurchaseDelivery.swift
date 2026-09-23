import Foundation

struct AppleAccountResponse: Decodable {
    let appAccountToken: UUID
}

struct AppleCatalogueResponse: Decodable {
    struct Product: Decodable { let id: String; let period: String }
    let version: Int
    let name: String
    let products: [Product]
    var purchasesEnabled: Bool? = nil

    func validatedPeriods() throws -> [String: String] {
        let approved = ["fr.coai.mobile.essentiel.monthly": "P1M",
                        "fr.coai.mobile.essentiel.annual": "P1Y"]
        guard version == 1, products.count == approved.count,
              Set(products.map(\.id)).count == products.count,
              products.allSatisfy({ approved[$0.id] == $0.period }) else {
            throw PurchaseDelivery.Failure.serverNotConfirmed
        }
        return Dictionary(uniqueKeysWithValues: products.map { ($0.id, $0.period) })
    }
}

/// Neither StoreKit success nor a restored receipt proves COAI delivered access.
/// This acknowledgement must come from an authenticated server verifier, after
/// persisting the Apple transaction and updating the user's effective access.
struct PurchaseAcknowledgement: Equatable, Decodable {
    let transactionID: String
    let accountToken: UUID
    let persisted: Bool
}

enum PurchaseDelivery {
    enum Failure: Error { case serverNotConfirmed }

    /// Keep delivery and finish in one tested sequence. A network failure or
    /// cancellation must leave the transaction available for a later retry.
    @MainActor
    static func complete(transactionID: String, accountToken: UUID,
                         deliver: () async throws -> PurchaseAcknowledgement,
                         finish: () async -> Void) async throws {
        try Task.checkCancellation()
        let acknowledgement = try await deliver()
        guard mayFinish(transactionID: transactionID, accountToken: accountToken,
                        acknowledgement: acknowledgement) else {
            throw Failure.serverNotConfirmed
        }
        try Task.checkCancellation()
        await finish()
    }

    static func mayFinish(transactionID: String, accountToken: UUID,
                          acknowledgement: PurchaseAcknowledgement) -> Bool {
        acknowledgement.persisted && !transactionID.isEmpty &&
        acknowledgement.transactionID == transactionID &&
        acknowledgement.accountToken == accountToken
    }
}

/// Recover independent receipts even when one is rejected or temporarily fails.
/// Deduplicate only acknowledged deliveries; failed receipts remain retryable.
@MainActor
final class PurchaseRecoveryBatch {
    private var delivered = Set<UInt64>()
    private var errors: [UInt64: Error] = [:]
    private var unidentifiedError: Error?

    func attempt(id: UInt64?, process: () async throws -> UInt64?) async throws {
        try Task.checkCancellation()
        if let id, delivered.contains(id) { return }
        do {
            if let processed = try await process() {
                delivered.insert(processed)
                errors.removeValue(forKey: processed)
            }
        } catch is CancellationError {
            throw CancellationError()
        } catch {
            try Task.checkCancellation()
            if let id { errors[id] = error }
            else if unidentifiedError == nil { unidentifiedError = error }
        }
    }

    func result() throws -> Int {
        try Task.checkCancellation()
        if let error = unidentifiedError ?? errors.values.first { throw error }
        return delivered.count
    }
}

/// One recovery at a time. StoreKit events arriving during a pass request one
/// more pass; normal page changes are throttled. Session cancellation invalidates
/// old completions, including operations which don't promptly honor cancellation.
@MainActor
final class PurchaseRecoveryScheduler {
    private var task: Task<Void, Never>?
    private var pending: (@MainActor () async -> Void)?
    private var generation = UUID()
    private var lastStarted: Date?

    func request(force: Bool = false, now: Date = Date(), operation: @escaping @MainActor () async -> Void) {
        if task != nil {
            if force { pending = operation }
            return
        }
        if !force, let lastStarted, now.timeIntervalSince(lastStarted) < 30 { return }
        lastStarted = now
        let token = generation
        task = Task { [weak self] in
            await operation()
            guard let self, self.generation == token else { return }
            self.task = nil
            if let next = self.pending {
                self.pending = nil
                self.request(force: true, operation: next)
            }
        }
    }

    func cancel() {
        generation = UUID()
        task?.cancel(); task = nil; pending = nil; lastStarted = nil
    }

    func waitUntilIdle() async {
        while let task { await task.value }
    }
}
