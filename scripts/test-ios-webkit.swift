// macOS host check: validates the actual WebKit rule compiler without loading any URL.
// Compile alongside ios/COAI/Core/NavigationPolicy.swift. No account or network request.
import Foundation
import WebKit

@main
struct WebKitRuleCheck {
    static func main() {
        let identifier = "coai-rule-check-" + UUID().uuidString
        var completed = false
        var failure: String?
        WKContentRuleListStore.default().compileContentRuleList(
            forIdentifier: identifier,
            encodedContentRuleList: NavigationPolicy.contentRules
        ) { rules, error in
            guard rules != nil, error == nil else {
                failure = error?.localizedDescription ?? "No compiled rules returned"
                completed = true
                return
            }
            // Remove only this uniquely named test artifact, never the app's rules/cache.
            WKContentRuleListStore.default().removeContentRuleList(forIdentifier: identifier) { error in
                failure = error?.localizedDescription
                completed = true
            }
        }
        let deadline = Date().addingTimeInterval(20)
        while !completed && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
        }
        guard completed else { fatalError("WebKit rule compilation timed out") }
        guard failure == nil else { fatalError("WebKit rule compilation failed: " + failure!) }
        print("PASS: actual macOS WebKit compiled the iOS pilot rules; test artifact removed. No URL loaded.")
    }
}
