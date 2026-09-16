import Foundation

/// Local UX deadline, not a change to Supabase's token/state expiry policy.
struct OAuthAttempt: Equatable {
    static let duration: TimeInterval = 9 * 60
    let id = UUID()
    let deadline: Date

    init(now: Date = Date()) { deadline = now.addingTimeInterval(Self.duration) }
    func expired(at now: Date = Date()) -> Bool { now >= deadline }
}

/// Only the COAI Supabase Google PKCE flow may enter the system auth browser.
/// The verifier remains in WKWebView cookies; native code never reads session tokens.
enum NativeOAuth {
    static let authHost = "fczkfddfgooocqqkqsqw.supabase.co"
    static let callback = URL(string: "fr.coai.mobile://auth/callback")!

    static func request(_ url: URL) -> (authorize: URL, exchange: URL)? {
        guard url.scheme == "https", url.host == authHost, url.user == nil,
              url.password == nil, url.port == nil, url.path == "/auth/v1/authorize",
              url.fragment == nil, var parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        let items = parts.queryItems ?? []
        func one(_ key: String) -> String? {
            let values = items.filter { $0.name == key }
            return values.count == 1 ? values[0].value : nil
        }
        guard one("provider") == "google", one("code_challenge_method")?.lowercased() == "s256",
              let challenge = one("code_challenge"), challenge.count == 43,
              challenge.range(of: "^[A-Za-z0-9_-]+$", options: .regularExpression) != nil,
              let redirect = one("redirect_to"), let exchange = URL(string: redirect),
              NavigationPolicy.decide(exchange) == .inside, exchange.path == "/auth/callback",
              exchange.fragment == nil else { return nil }
        parts.queryItems = items.filter { $0.name != "redirect_to" } +
            [URLQueryItem(name: "redirect_to", value: callback.absoluteString)]
        guard let authorize = parts.url else { return nil }
        return (authorize, exchange)
    }

    static func exchangeURL(_ returned: URL, original: URL) -> URL? {
        guard returned.scheme == callback.scheme, returned.host == callback.host,
              returned.path == callback.path, returned.port == nil, returned.user == nil,
              returned.password == nil, returned.fragment == nil,
              NavigationPolicy.decide(original) == .inside, original.path == "/auth/callback",
              let parts = URLComponents(url: returned, resolvingAgainstBaseURL: false),
              var destination = URLComponents(url: original, resolvingAgainstBaseURL: false) else { return nil }
        let items = parts.queryItems ?? []
        guard items.count == 1, items[0].name == "code", let code = items[0].value,
              !code.isEmpty, code.count <= 2048 else { return nil }
        destination.queryItems = (destination.queryItems ?? []).filter { $0.name == "redirect_to" } +
            [URLQueryItem(name: "code", value: code)]
        destination.fragment = nil
        return destination.url
    }
}

/// Internal iPhone pilot. Not an App Store payment-compliance certification.
enum NavigationDecision: Equatable {
    case inside, external, purchasesUnavailable, blocked
}

enum NavigationPolicy {
    static let baseURL = URL(string: "https://coai.fr")!
    static let purchasePaths = ["/pricing", "/compte/abonnement", "/api/stripe", "/checkout"]

    static func responseError(status: Int) -> String? {
        switch status {
        case 401:
            return "Ta connexion n’est plus valide. Ouvre Compte pour te reconnecter. Le minuteur reste accessible."
        case 403:
            return "Cette page n’est pas accessible avec ton compte. Reviens à Séance ou Compte."
        case 404, 410:
            return "Cette page n’est plus disponible. Retrouve ton programme dans Séance."
        case 429:
            return "COAI reçoit trop de demandes. Patiente un peu avant de réessayer. Le minuteur reste accessible."
        case 500...599:
            return "COAI rencontre un problème temporaire. Réessaie dans un instant. Le minuteur reste accessible."
        case 400...499:
            return "Cette page n’a pas pu s’ouvrir. Réessaie ou reviens à Séance."
        default: return nil
        }
    }

    /// A retry must never replay an authentication callback or an API operation.
    /// These URLs can contain single-use credentials even when requested by GET.
    static func retryURL(current: URL?, lastRequested: URL) -> URL {
        func safe(_ url: URL) -> Bool {
            guard decide(url) == .inside else { return false }
            let path = (url.path.removingPercentEncoding ?? url.path).lowercased()
            guard !["/auth", "/api"].contains(where: { path == $0 || path.hasPrefix($0 + "/") }),
                  url.fragment == nil else { return false }
            let keys = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
            return !keys.contains { ["code", "token", "token_hash", "access_token", "refresh_token"].contains($0.name.lowercased()) }
        }
        if let current, safe(current) { return current }
        if safe(lastRequested) { return lastRequested }
        return baseURL.appendingPathComponent("sign-in")
    }

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
