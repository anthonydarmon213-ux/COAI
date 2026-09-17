import XCTest
@testable import COAICore

final class CoreTests: XCTestCase {
    @MainActor
    func testReminderStopBeforeSchedulingPreventsAdd() async {
        let entered = expectation(description: "Permission lookup started")
        var permission: CheckedContinuation<Void, Never>?
        var scheduled = false
        let queue = RestReminderQueue(clear: {}, schedule: { _, isCurrent in
            await withCheckedContinuation { permission = $0; entered.fulfill() }
            if isCurrent() { scheduled = true }
            return nil
        })
        queue.update(end: Date().addingTimeInterval(90))
        await fulfillment(of: [entered], timeout: 2)
        queue.update(end: nil)
        permission?.resume()
        await queue.waitUntilIdle()
        XCTAssertFalse(scheduled)
    }

    @MainActor
    func testReminderLateAddAfterPauseIsRemoved() async {
        let entered = expectation(description: "Add started")
        var add: CheckedContinuation<Void, Never>?
        var pending = false
        var messages: [String] = []
        let queue = RestReminderQueue(clear: { pending = false }, schedule: { _, _ in
            await withCheckedContinuation { add = $0; entered.fulfill() }
            pending = true
            return "Stale error"
        }, report: { if let message = $0 { messages.append(message) } })
        queue.update(end: Date().addingTimeInterval(90))
        await fulfillment(of: [entered], timeout: 2)
        queue.update(end: nil)
        add?.resume()
        await queue.waitUntilIdle()
        XCTAssertFalse(pending)
        XCTAssertTrue(messages.isEmpty)
    }

    @MainActor
    func testReminderRapidRestartsKeepOnlyLatestDeadline() async {
        let entered = expectation(description: "First add started")
        let first = Date(timeIntervalSince1970: 1000)
        let latest = first.addingTimeInterval(120)
        var add: CheckedContinuation<Void, Never>?
        var pending: Date?
        var calls: [Date] = []
        let queue = RestReminderQueue(clear: { pending = nil }, schedule: { end, _ in
            calls.append(end)
            if end == first {
                await withCheckedContinuation { add = $0; entered.fulfill() }
            }
            pending = end
            return nil
        })
        queue.update(end: first)
        await fulfillment(of: [entered], timeout: 2)
        queue.update(end: first.addingTimeInterval(60))
        queue.update(end: latest)
        add?.resume()
        await queue.waitUntilIdle()
        XCTAssertEqual(calls, [first, latest])
        XCTAssertEqual(pending, latest)
        queue.update(end: nil)
        await queue.waitUntilIdle()
        XCTAssertNil(pending)
    }

    @MainActor
    func testReminderReportsFailureWithoutBlockingNextTimer() async {
        var message: String?
        var fail = true
        let queue = RestReminderQueue(clear: {}, schedule: { _, _ in fail ? "Unavailable" : nil },
            report: { message = $0 })
        queue.update(end: Date())
        await queue.waitUntilIdle()
        XCTAssertEqual(message, "Unavailable")
        fail = false
        queue.update(end: Date())
        await queue.waitUntilIdle()
        XCTAssertNil(message)
    }

    func testRestPauseAndResumePreserveRemainingDuration() {
        let start = Date(timeIntervalSince1970: 1000)
        let paused = RestClock(seconds: 90, now: start).remaining(at: start.addingTimeInterval(25))
        XCTAssertEqual(paused, 65)
        let resumedAt = start.addingTimeInterval(600)
        let resumed = RestClock(seconds: paused, now: resumedAt)
        XCTAssertEqual(resumed.remaining(at: resumedAt), 65)
        XCTAssertEqual(resumed.remaining(at: resumedAt.addingTimeInterval(65)), 0)
    }

    func testRestClockRejectsInvalidPersistedDeadline() {
        let now = Date(timeIntervalSince1970: 1000)
        XCTAssertEqual(RestClock(end: Date(timeIntervalSince1970: .infinity)).remaining(at: now), 0)
        XCTAssertEqual(RestClock(end: Date(timeIntervalSince1970: .nan)).remaining(at: now), 0)
        XCTAssertEqual(RestClock(end: now.addingTimeInterval(1e10)).remaining(at: now), 3600)
    }
    func testHTTPFailuresHaveActionableMessages() {
        for status in [400, 401, 403, 404, 410, 422, 429, 500, 502, 503, 504, 599] {
            XCTAssertFalse(NavigationPolicy.responseError(status: status)?.isEmpty ?? true)
        }
        XCTAssertTrue(NavigationPolicy.responseError(status: 401)!.contains("reconnecter"))
        XCTAssertTrue(NavigationPolicy.responseError(status: 429)!.contains("Patiente"))
        XCTAssertTrue(NavigationPolicy.responseError(status: 503)!.contains("temporaire"))
        XCTAssertNotEqual(NavigationPolicy.responseError(status: 403), NavigationPolicy.responseError(status: 401))
    }

    func testSuccessfulResponsesAndRedirectsAreNotErrors() {
        for status in [200, 201, 204, 206, 301, 302, 303, 307, 308] {
            XCTAssertNil(NavigationPolicy.responseError(status: status))
        }
    }

    func testRetryNeverReplaysCredentialsOrAPICallbacks() {
        let signIn = URL(string: "https://coai.fr/sign-in")!
        for value in ["https://coai.fr/auth/callback?code=used", "https://coai.fr/auth",
                      "https://coai.fr/%61uth/callback?code=used", "https://coai.fr/api/action",
                      "https://coai.fr/api", "https://coai.fr/reset?token_hash=used",
                      "https://coai.fr/reset?CODE=used", "https://coai.fr/#access_token=used",
                      "https://evil.example", "https://coai.fr/pricing"] {
            let unsafe = URL(string: value)!
            XCTAssertEqual(NavigationPolicy.retryURL(current: unsafe, lastRequested: unsafe), signIn)
            XCTAssertEqual(NavigationPolicy.retryURL(current: nil, lastRequested: unsafe), signIn)
        }
    }

    func testRetryPreservesNormalSessionPage() {
        let session = URL(string: "https://coai.fr/programme/seance-du-jour?seance=0")!
        let callback = URL(string: "https://coai.fr/auth/callback?code=used")!
        XCTAssertEqual(NavigationPolicy.retryURL(current: session, lastRequested: callback), session)
        XCTAssertEqual(NavigationPolicy.retryURL(current: callback, lastRequested: session), session)
        XCTAssertEqual(NavigationPolicy.retryURL(current: nil, lastRequested: session), session)
    }

    @MainActor
    func testPurchaseFinishesOnlyAfterDelivery() async throws {
        let account = UUID()
        var events: [String] = []
        try await PurchaseDelivery.complete(transactionID: "42", accountToken: account,
            deliver: {
                events.append("persisted")
                return .init(transactionID: "42", accountToken: account, persisted: true)
            }, finish: { events.append("finished") })
        XCTAssertEqual(events, ["persisted", "finished"])
    }

    @MainActor
    func testPurchaseRemainsRetryableAfterNetworkFailure() async {
        var finished = false
        do {
            try await PurchaseDelivery.complete(transactionID: "42", accountToken: UUID(),
                deliver: { throw URLError(.notConnectedToInternet) },
                finish: { finished = true })
            XCTFail("A delivery failure must propagate")
        } catch { XCTAssertEqual((error as? URLError)?.code, .notConnectedToInternet) }
        XCTAssertFalse(finished)
    }

    @MainActor
    func testPurchaseNeverFinishesForWrongOrUnpersistedAcknowledgement() async {
        let account = UUID()
        for ack in [PurchaseAcknowledgement(transactionID: "42", accountToken: account, persisted: false),
                    .init(transactionID: "43", accountToken: account, persisted: true),
                    .init(transactionID: "42", accountToken: UUID(), persisted: true)] {
            var finished = false
            do {
                try await PurchaseDelivery.complete(transactionID: "42", accountToken: account,
                    deliver: { ack }, finish: { finished = true })
                XCTFail("Invalid acknowledgement must fail")
            } catch { XCTAssertTrue(error is PurchaseDelivery.Failure) }
            XCTAssertFalse(finished)
        }
    }

    @MainActor
    func testCancellationDuringDeliveryPreventsFinish() async {
        let account = UUID()
        var finished = false
        let task = Task { @MainActor in
            try await PurchaseDelivery.complete(transactionID: "42", accountToken: account,
                deliver: {
                    withUnsafeCurrentTask { $0?.cancel() }
                    return .init(transactionID: "42", accountToken: account, persisted: true)
                }, finish: { finished = true })
        }
        do { try await task.value; XCTFail("Cancellation must propagate") }
        catch { XCTAssertTrue(error is CancellationError) }
        XCTAssertFalse(finished)
    }

    func testPurchaseRequiresPersistedMatchingServerAcknowledgement() {
        let account = UUID()
        XCTAssertTrue(PurchaseDelivery.mayFinish(transactionID: "42", accountToken: account,
            acknowledgement: .init(transactionID: "42", accountToken: account, persisted: true)))
        for ack in [PurchaseAcknowledgement(transactionID: "42", accountToken: account, persisted: false),
                    .init(transactionID: "43", accountToken: account, persisted: true),
                    .init(transactionID: "42", accountToken: UUID(), persisted: true)] {
            XCTAssertFalse(PurchaseDelivery.mayFinish(transactionID: "42", accountToken: account, acknowledgement: ack))
        }
        XCTAssertFalse(PurchaseDelivery.mayFinish(transactionID: "", accountToken: account,
            acknowledgement: .init(transactionID: "", accountToken: account, persisted: true)))
    }
    func testOAuthAttemptDeadlineAndIsolation() {
        let start = Date(timeIntervalSince1970: 1000)
        let attempt = OAuthAttempt(now: start)
        XCTAssertFalse(attempt.expired(at: start))
        XCTAssertFalse(attempt.expired(at: start.addingTimeInterval(539.999)))
        XCTAssertTrue(attempt.expired(at: start.addingTimeInterval(540)))
        XCTAssertTrue(attempt.expired(at: start.addingTimeInterval(3600)))
        XCTAssertNotEqual(attempt, OAuthAttempt(now: start))
        let next = OAuthAttempt(now: start.addingTimeInterval(540))
        XCTAssertFalse(next.expired(at: start.addingTimeInterval(540)))
    }
    func testNativeGooglePKCE() {
        var parts = URLComponents(string: "https://fczkfddfgooocqqkqsqw.supabase.co/auth/v1/authorize")!
        parts.queryItems = [URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "code_challenge_method", value: "s256"),
            URLQueryItem(name: "code_challenge", value: String(repeating: "a", count: 43)),
            URLQueryItem(name: "redirect_to", value: "https://coai.fr/auth/callback?redirect_to=%2Fsuivi%2Frepcount")]
        let request = NativeOAuth.request(parts.url!)!
        XCTAssertTrue(request.authorize.absoluteString.contains("fr.coai.mobile"))
        let result = NativeOAuth.exchangeURL(URL(string: "fr.coai.mobile://auth/callback?code=one-use-code")!, original: request.exchange)!
        XCTAssertEqual(URLComponents(url: result, resolvingAgainstBaseURL: false)?.queryItems?.first?.value, "/suivi/repcount")
        for invalid in ["fr.coai.mobile://evil/callback?code=a", "fr.coai.mobile://auth/callback?code=a&code=b", "fr.coai.mobile://auth/callback#access_token=x", "fr.coai.mobile://auth/callback?error=denied", "https://coai.fr/auth/callback?code=a"] {
            XCTAssertNil(NativeOAuth.exchangeURL(URL(string: invalid)!, original: request.exchange))
        }
        parts.host = "evil.example"
        XCTAssertNil(NativeOAuth.request(parts.url!))
        parts.host = NativeOAuth.authHost
        parts.queryItems?.append(URLQueryItem(name: "provider", value: "google"))
        XCTAssertNil(NativeOAuth.request(parts.url!))
        parts.queryItems = [URLQueryItem(name: "provider", value: "google")]
        XCTAssertNil(NativeOAuth.request(parts.url!))
    }
    func testCOAIRoutes() {
        for path in ["/login", "/programme/entrainement", "/suivi/repcount", "/compte/parametres", "/auth/callback?code=test"] {
            XCTAssertEqual(NavigationPolicy.decide(URL(string: "https://coai.fr" + path)!), .inside)
        }
    }

    func testNoUntrustedContentInsideAuthenticatedView() {
        for value in ["https://coai.fr.evil.example/a", "https://example.com", "https://evilcoai.fr"] {
            XCTAssertEqual(NavigationPolicy.decide(URL(string: value)!), .external)
        }
        for value in ["http://coai.fr", "javascript:alert(1)", "file:///tmp/a", "https://user:pass@coai.fr", "https://coai.fr:444/a"] {
            XCTAssertEqual(NavigationPolicy.decide(URL(string: value)!), .blocked)
        }
    }

    func testPurchasesBlockedInPilot() {
        for value in ["https://coai.fr/pricing", "https://coai.fr/compte/abonnement?plan=STANDARD", "https://coai.fr/api/stripe/checkout", "https://coai.fr/%70ricing", "https://checkout.stripe.com/c/pay/test"] {
            XCTAssertEqual(NavigationPolicy.decide(URL(string: value)!), .purchasesUnavailable)
        }
        XCTAssertNoThrow(try JSONSerialization.jsonObject(with: Data(NavigationPolicy.contentRules.utf8)))
    }

    func testCountdownUsesDeadlineNotForegroundTicks() {
        let now = Date(timeIntervalSince1970: 1000)
        let clock = RestClock(seconds: 90, now: now)
        XCTAssertEqual(clock.remaining(at: now), 90)
        XCTAssertEqual(clock.remaining(at: now.addingTimeInterval(60)), 30)
        XCTAssertEqual(clock.remaining(at: now.addingTimeInterval(95)), 0)
        XCTAssertEqual(RestClock(end: clock.end).remaining(at: now.addingTimeInterval(80)), 10)
    }

    func testMinutesAndBounds() {
        XCTAssertEqual(RestClock.label(seconds: 75), "1 min 15 s")
        XCTAssertEqual(RestClock.label(seconds: 30), "0 min 30 s")
        XCTAssertEqual(RestClock.label(seconds: -1), "0 min 00 s")
        let now = Date()
        XCTAssertEqual(RestClock(seconds: -5, now: now).remaining(at: now), 0)
        XCTAssertEqual(RestClock(seconds: 9999, now: now).remaining(at: now), 3600)
    }
}
