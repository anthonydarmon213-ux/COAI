import Foundation

/// Neither StoreKit success nor a restored receipt proves COAI delivered access.
/// This acknowledgement must come from an authenticated server verifier, after
/// persisting the Apple transaction and updating the user's effective access.
struct PurchaseAcknowledgement: Equatable {
    let transactionID: String
    let accountToken: UUID
    let persisted: Bool
}

enum PurchaseDelivery {
    static func mayFinish(transactionID: String, accountToken: UUID,
                          acknowledgement: PurchaseAcknowledgement) -> Bool {
        acknowledgement.persisted && !transactionID.isEmpty &&
        acknowledgement.transactionID == transactionID &&
        acknowledgement.accountToken == accountToken
    }
}
