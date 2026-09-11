import XCTest
@testable import COAICore

final class CoreTests: XCTestCase {
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
