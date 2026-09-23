import XCTest
@testable import COAICore

final class OfferCacheTests: XCTestCase {
    @MainActor
    func testPublishesOnlyAfterValidationAndClearsOnFailure() async throws {
        let cache = OfferCache<String>()
        let result = try await cache.reload {
            XCTAssertTrue(cache.isLoading)
            XCTAssertTrue(cache.values.isEmpty)
            return (["monthly": "verified"], "offer")
        }
        XCTAssertEqual(result, "offer")
        XCTAssertEqual(cache.values, ["monthly": "verified"])
        XCTAssertFalse(cache.isLoading)
        do {
            let _: String = try await cache.reload {
                XCTAssertTrue(cache.values.isEmpty)
                throw URLError(.notConnectedToInternet)
            }
            XCTFail("Expected network failure")
        } catch { XCTAssertTrue(cache.values.isEmpty) }
        XCTAssertFalse(cache.isLoading)
        let _: Bool = try await cache.reload { ([:], true) }
        XCTAssertTrue(cache.values.isEmpty)
    }

    @MainActor
    func testOverlappingLoadsCannotReplaceValidatedResults() async throws {
        let cache = OfferCache<String>()
        let _: Bool = try await cache.reload {
            do {
                let _: Bool = try await cache.reload { (["wrong": "wrong"], false) }
                XCTFail("Concurrent reload must fail")
            } catch OfferCache<String>.Failure.busy {} catch { XCTFail("Unexpected error") }
            XCTAssertTrue(cache.isLoading)
            XCTAssertTrue(cache.values.isEmpty)
            return (["annual": "validated"], true)
        }
        XCTAssertEqual(cache.values, ["annual": "validated"])
    }

    @MainActor
    func testCancellationAfterFetchDoesNotPublish() async throws {
        let cache = OfferCache<String>()
        let task = Task { @MainActor in
            try await cache.reload {
                withUnsafeCurrentTask { $0?.cancel() }
                return (["monthly": "must-not-publish"], true)
            }
        }
        do { _ = try await task.value; XCTFail("Expected cancellation") }
        catch is CancellationError {} catch { XCTFail("Unexpected error") }
        XCTAssertTrue(cache.values.isEmpty)
        XCTAssertFalse(cache.isLoading)
    }
}
