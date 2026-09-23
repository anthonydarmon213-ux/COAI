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
        for value in ["https://coai.fr/pricing", "https://coai.fr/compte/abonnement?plan=STANDARD", "https://coai.fr/%70ricing", "https://www.coai.fr/pricing/"] {
            check(NavigationPolicy.decide(URL(string: value)!) == .subscription, "native subscription screen")
        }
        for value in ["https://coai.fr/api/stripe/checkout", "https://coai.fr/checkout", "https://coai.fr/pricing/checkout", "https://coai.fr/compte/abonnement/checkout", "https://checkout.stripe.com/c/pay/test"] {
            check(NavigationPolicy.decide(URL(string: value)!) == .purchasesUnavailable, "payment navigation")
        }
        let rules = try JSONSerialization.jsonObject(with: Data(NavigationPolicy.contentRules.utf8)) as! [[String: Any]]
        let expressions = try rules.filter { ($0["action"] as? [String: Any])?["type"] as? String == "block" }.map { rule in
            let trigger = rule["trigger"] as! [String: Any]
            return try NSRegularExpression(pattern: trigger["url-filter"] as! String, options: [.caseInsensitive])
        }
        let cosmetic = rules.filter { ($0["action"] as? [String: Any])?["type"] as? String == "css-display-none" }
        check(cosmetic.count == 1, "one scoped native navigation cosmetic rule")
        check((cosmetic[0]["action"] as? [String: Any])?["selector"] as? String == "aside.coai-app-nav", "only duplicated sidebar hidden")
        let cosmeticTrigger = cosmetic[0]["trigger"] as! [String: Any]
        let cosmeticExpression = try NSRegularExpression(pattern: cosmeticTrigger["url-filter"] as! String, options: [.caseInsensitive])
        for value in ["https://coai.fr/programme/entrainement", "https://www.coai.fr/compte/profil"] {
            check(cosmeticExpression.firstMatch(in: value, range: NSRange(value.startIndex..., in: value)) != nil, "native sidebar hidden on COAI only")
        }
        for value in ["https://other.example/", "https://coai.fr.evil.example/", "https://accounts.google.com/"] {
            check(cosmeticExpression.firstMatch(in: value, range: NSRange(value.startIndex..., in: value)) == nil, "external pages unchanged")
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
        for value in ["https://connect.facebook.net/en_US/fbevents.js", "https://www.facebook.com/tr/?id=1",
                      "https://www.googletagmanager.com/gtag/js?id=test", "https://region1.google-analytics.com/g/collect",
                      "https://stats.g.doubleclick.net/g/collect", "https://www.clarity.ms/tag/test",
                      "https://vitals.vercel-insights.com/v1/view", "https://va.vercel-scripts.com/v1/script.js",
                      "https://coai.fr/_vercel/insights/script.js", "https://www.coai.fr/_vercel/insights/view"] {
            check(blockedResource(value), "optional native tracking blocked")
        }
        for value in ["https://accounts.google.com/o/oauth2/auth", "https://fczkfddfgooocqqkqsqw.supabase.co/auth/v1/authorize",
                      "https://coai.fr/_next/static/main.js", "https://coai.fr/brand/coai-app-premium-180.png"] {
            check(!blockedResource(value), "authentication and core resources preserved")
        }
        let now = Date(timeIntervalSince1970: 1000)
        let clock = RestClock(seconds: 90, now: now)
        check(clock.remaining(at: now) == 90, "initial countdown")
        check(clock.remaining(at: now.addingTimeInterval(60)) == 30, "background elapsed")
        check(clock.remaining(at: now.addingTimeInterval(95)) == 0, "expired countdown")
        check(RestClock(end: clock.end).remaining(at: now.addingTimeInterval(80)) == 10, "restored countdown")
        check(RestClock.label(seconds: 75) == "1 min 15 s", "minutes formatting")
        check(RestClock.label(seconds: 100) == "1 min 40 s", "exact prescribed rest formatting")
        check(RestClock(seconds: 100, now: now).remaining(at: now) == 100, "exact prescribed rest is not rounded")
        check(RestClock.label(seconds: 30) == "0 min 30 s", "short rest")
        check(RestClock.label(seconds: -1) == "0 min 00 s", "negative formatting")
        check(RestClock(seconds: -5, now: now).remaining(at: now) == 0, "negative duration")
        check(RestClock(seconds: 9999, now: now).remaining(at: now) == 3600, "upper duration bound")
        print("PASS: \(checks) iOS core checks. UIKit/WebKit execution NOT covered.")
    }
}
