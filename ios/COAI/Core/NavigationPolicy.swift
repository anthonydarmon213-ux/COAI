import Foundation

/// Internal iPhone pilot. Not an App Store payment-compliance certification.
enum NavigationDecision: Equatable {
    case inside, external, purchasesUnavailable, blocked
}

enum NavigationPolicy {
    static let baseURL = URL(string: "https://coai.fr")!
    static let purchasePaths = ["/pricing", "/compte/abonnement", "/api/stripe", "/checkout"]

    static func decide(_ url: URL) -> NavigationDecision {
        guard url.user == nil, url.password == nil else { return .blocked }
        let scheme = url.scheme?.lowercased()
        guard scheme == "https" else {
            return ["mailto", "tel"].contains(scheme ?? "") ? .external : .blocked
        }
        guard url.port == nil || url.port == 443 else { return .blocked }
        let host = url.host?.lowercased() ?? ""
        if host == "stripe.com" || host.hasSuffix(".stripe.com") {
            return .purchasesUnavailable
        }
        guard host == "coai.fr" || host == "www.coai.fr" else { return .external }
        let path = (url.path.removingPercentEncoding ?? url.path).lowercased()
        if purchasePaths.contains(where: { path == $0 || path.hasPrefix($0 + "/") }) {
            return .purchasesUnavailable
        }
        return .inside
    }

    // Blocks subresource/XHR checkout requests too. No interception of API responses or credentials.
    // Keep in sync with purchasePaths and test on-device before any distribution.
    static let contentRules = #"""
    [
      {"trigger":{"url-filter":"^https://(www\\.)?coai\\.fr/api/stripe[/?]","url-filter-is-case-sensitive":false},"action":{"type":"block"}},
      {"trigger":{"url-filter":"^https://(www\\.)?coai\\.fr/api/stripe$","url-filter-is-case-sensitive":false},"action":{"type":"block"}},
      {"trigger":{"url-filter":"^https://([^/]+\\.)?stripe\\.com/","url-filter-is-case-sensitive":false},"action":{"type":"block"}}
    ]
    """#
}
