import Foundation

/// Publish purchasable products only after the entire validation succeeds.
/// Failed/cancelled refreshes leave no previously cached purchase target.
@MainActor
final class OfferCache<Value> {
    enum Failure: Error { case busy }
    private(set) var values: [String: Value] = [:]
    private(set) var isLoading = false

    func reload<Result>(_ operation: () async throws -> ([String: Value], Result)) async throws -> Result {
        guard !isLoading else { throw Failure.busy }
        isLoading = true
        values = [:]
        defer { isLoading = false }
        try Task.checkCancellation()
        let (validated, result) = try await operation()
        try Task.checkCancellation()
        values = validated
        return result
    }
}
