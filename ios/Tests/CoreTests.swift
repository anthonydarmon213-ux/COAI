import XCTest
@testable import COAICore

final class CoreTests: XCTestCase {
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
