// Compile with the two ios/COAI/Core sources. Does not require UIKit or XCTest.
import Foundation

@main
struct IOSCoreChecks {
    static func main() throws {
        var checks = 0
        func check(_ value: Bool, _ label: String) {
            guard value else { fatalError("FAILED: " + label) }
            checks += 1
        }
        let routes = ["/sign-in", "/programme/entrainement", "/suivi/repcount", "/compte/parametres", "/auth/callback?code=test"]
        for path in routes {
            check(NavigationPolicy.decide(URL(string: "https://coai.fr" + path)!) == .inside, path)
        }
        for value in ["https://coai.fr.evil.example/a", "https://example.com", "https://evilcoai.fr"] {
            check(NavigationPolicy.decide(URL(string: value)!) == .external, "external host")
        }
        for value in ["http://coai.fr", "javascript:alert(1)", "file:///tmp/a", "https://user:pass@coai.fr", "https://coai.fr:444/a"] {
            check(NavigationPolicy.decide(URL(string: value)!) == .blocked, "unsafe scheme or authority")
        }
        for value in ["https://coai.fr/pricing", "https://coai.fr/compte/abonnement?plan=STANDARD", "https://coai.fr/api/stripe/checkout", "https://coai.fr/%70ricing", "https://checkout.stripe.com/c/pay/test"] {
            check(NavigationPolicy.decide(URL(string: value)!) == .purchasesUnavailable, "payment navigation")
        }
        let rules = try JSONSerialization.jsonObject(with: Data(NavigationPolicy.contentRules.utf8)) as! [[String: Any]]
        let expressions = try rules.map { rule in
            let trigger = rule["trigger"] as! [String: Any]
            return try NSRegularExpression(pattern: trigger["url-filter"] as! String, options: [.caseInsensitive])
        }
        func blockedResource(_ value: String) -> Bool {
            expressions.contains { $0.firstMatch(in: value, range: NSRange(value.startIndex..., in: value)) != nil }
        }
        for value in ["https://coai.fr/api/stripe", "https://coai.fr/api/stripe?test=1", "https://coai.fr/api/stripe/checkout", "https://www.coai.fr/api/stripe/checkout-programme", "https://coai.fr/api/stripe/portal", "https://checkout.stripe.com/c/pay/test", "https://js.stripe.com/v3/"] {
            check(blockedResource(value), "payment resource regex")
        }
        for value in ["https://coai.fr/api/striped-shirt", "https://coai.fr/api/programmes", "https://coai.fr/api/compte/delete", "https://coai.fr/videos/crunch.mp4"] {
            check(!blockedResource(value), "non-payment resources remain accessible")
        }
        let now = Date(timeIntervalSince1970: 1000)
        let clock = RestClock(seconds: 90, now: now)
        check(clock.remaining(at: now) == 90, "initial countdown")
        check(clock.remaining(at: now.addingTimeInterval(60)) == 30, "background elapsed")
        check(clock.remaining(at: now.addingTimeInterval(95)) == 0, "expired countdown")
        check(RestClock(end: clock.end).remaining(at: now.addingTimeInterval(80)) == 10, "restored countdown")
        check(RestClock.label(seconds: 75) == "1 min 15 s", "minutes formatting")
        check(RestClock.label(seconds: 30) == "0 min 30 s", "short rest")
        check(RestClock.label(seconds: -1) == "0 min 00 s", "negative formatting")
        check(RestClock(seconds: -5, now: now).remaining(at: now) == 0, "negative duration")
        check(RestClock(seconds: 9999, now: now).remaining(at: now) == 3600, "upper duration bound")
        print("PASS: \(checks) iOS core checks. UIKit/WebKit execution NOT covered.")
    }
}
