import Foundation

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
