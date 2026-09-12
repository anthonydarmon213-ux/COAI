import SwiftUI
import WebKit
import AuthenticationServices

@MainActor
final class COAIWebModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate, ASWebAuthenticationPresentationContextProviding {
    @Published private(set) var webView: WKWebView
    @Published private(set) var sessionViewID = UUID()
    @Published var isLoading = false
    @Published var isReady = false
    @Published var canGoBack = false
    @Published var errorMessage: String?
    @Published var notice: String?
    var confirmResponse: ((Bool) -> Void)?
    var alertResponse: (() -> Void)?
    @Published var externalURL: URL?
    private var starting = false
    private var authenticationSession: ASWebAuthenticationSession?
    private var authenticationAttempt: UUID?

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        webView.window ?? ASPresentationAnchor()
    }

    private func cancelAuthentication() {
        authenticationAttempt = nil
        authenticationSession?.cancel()
        authenticationSession = nil
    }

    private func authenticate(_ request: (authorize: URL, exchange: URL)) {
        guard authenticationSession == nil, webView.window != nil else { return }
        let attempt = UUID()
        authenticationAttempt = attempt
        let session = ASWebAuthenticationSession(url: request.authorize, callbackURLScheme: NativeOAuth.callback.scheme) { [weak self] returned, error in
            Task { @MainActor in
                guard let self, self.authenticationAttempt == attempt else { return }
                self.authenticationAttempt = nil
                self.authenticationSession = nil
                if error == nil, let returned,
                   let exchange = NativeOAuth.exchangeURL(returned, original: request.exchange) {
                    // Exchange happens in the original cookie store, using its PKCE verifier.
                    self.load(exchange)
                } else {
                    self.open(path: "/sign-in")
                    self.notice = "Connexion Google interrompue. Tu peux réessayer."
                }
            }
        }
        session.presentationContextProvider = self
        authenticationSession = session
        if !session.start() {
            cancelAuthentication()
            open(path: "/sign-in")
            notice = "La connexion Google n’a pas pu démarrer. Réessaie."
        }
    }
    private var installedRules: WKContentRuleList?
    private var lastRequestedURL = NavigationPolicy.baseURL.appendingPathComponent("programme/entrainement")

    override init() {
        webView = Self.makeWebView()
        super.init()
        attachDelegates()
    }

    private static func makeWebView() -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = .all
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = false
        view.backgroundColor = .black
        return view
    }

    private func attachDelegates() {
        webView.navigationDelegate = self
        webView.uiDelegate = self
        // No injected authentication, no native-JavaScript bridge, no TLS exceptions.
    }

    func start() async {
        guard !starting, !isReady else { return }
        starting = true
        defer { starting = false }
        do {
            let rules: WKContentRuleList = try await withCheckedThrowingContinuation { continuation in
                WKContentRuleListStore.default().compileContentRuleList(
                    forIdentifier: "coai-ios-pilot-no-purchases-v1",
                    encodedContentRuleList: NavigationPolicy.contentRules
                ) { rules, error in
                    if let rules { continuation.resume(returning: rules) }
                    else { continuation.resume(throwing: error ?? NSError(domain: "COAI", code: 1)) }
                }
            }
            webView.configuration.userContentController.add(rules)
            installedRules = rules
            isReady = true
            load(lastRequestedURL)
        } catch {
            // Fail closed: never load the site if pilot purchase blocking failed to install.
            errorMessage = "La protection de cette version de test n’a pas pu démarrer. Réessaie."
        }
    }

    func open(path: String) {
        cancelAuthentication()
        guard isReady, let url = URL(string: path, relativeTo: NavigationPolicy.baseURL)?.absoluteURL,
              NavigationPolicy.decide(url) == .inside else { return }
        load(url)
    }

    private func load(_ url: URL) {
        lastRequestedURL = url
        errorMessage = nil
        isLoading = true
        webView.load(URLRequest(url: url))
    }

    func retry() {
        cancelAuthentication()
        if !isReady { Task { await start() }; return }
        // Never replay a POST on an error/reload. Reopen only a normal page with GET.
        let current = webView.url
        if let current, NavigationPolicy.decide(current) == .inside,
           !current.path.hasPrefix("/api/"), !current.path.hasPrefix("/auth/") {
            load(current)
        } else { load(lastRequestedURL) }
    }

    func goBack() { if webView.canGoBack { webView.goBack() } }

    func confirmExternalLink() {
        guard let url = externalURL, NavigationPolicy.decide(url) == .external else { return }
        externalURL = nil
        UIApplication.shared.open(url)
    }

    func clearLocalSession() {
        cancelAuthentication()
        guard isReady else { return }
        isReady = false
        isLoading = true
        resolveDialog(false)
        webView.stopLoading()
        WKWebsiteDataStore.default().removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast) { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                // Replace the entire view, including its in-memory back/forward snapshots.
                self.webView.navigationDelegate = nil
                self.webView.uiDelegate = nil
                self.webView = Self.makeWebView()
                self.attachDelegates()
                self.canGoBack = false
                self.sessionViewID = UUID()
                if let rules = self.installedRules {
                    self.webView.configuration.userContentController.add(rules)
                    self.isReady = true
                    self.open(path: "/sign-in")
                } else {
                    self.errorMessage = "La connexion locale a été effacée. Relance l’app."
                    self.isLoading = false
                }
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard isReady else { decisionHandler(.cancel); return }
        guard let url = action.request.url else { decisionHandler(.cancel); return }
        // Media embeds are not top-level navigation. Remote payment resources are blocked by content rules.
        if action.targetFrame?.isMainFrame == false { decisionHandler(.allow); return }
        if url.host == NativeOAuth.authHost {
            decisionHandler(.cancel)
            isLoading = false
            if action.sourceFrame.isMainFrame,
               action.sourceFrame.securityOrigin.protocol == "https",
               ["coai.fr", "www.coai.fr"].contains(action.sourceFrame.securityOrigin.host),
               let request = NativeOAuth.request(url) { authenticate(request) }
            else { notice = "Ce lien de connexion n’est pas reconnu. Reviens à la connexion et réessaie." }
            return
        }
        switch NavigationPolicy.decide(url) {
        case .inside:
            if action.targetFrame == nil {
                decisionHandler(.cancel)
                webView.load(action.request)
            } else { decisionHandler(.allow) }
        case .external:
            decisionHandler(.cancel)
            isLoading = false
            externalURL = url
        case .purchasesUnavailable:
            decisionHandler(.cancel)
            isLoading = false
            notice = "Les achats et la gestion de l’abonnement ne sont pas activés dans ce pilote iPhone. Ce lien a été bloqué."
        case .blocked:
            decisionHandler(.cancel)
            isLoading = false
            notice = "Ce lien n’est pas pris en charge dans la version de test."
        }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
        errorMessage = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        canGoBack = webView.canGoBack
    }

    func resolveDialog(_ confirmed: Bool) {
        let confirm = confirmResponse
        let alert = alertResponse
        confirmResponse = nil
        alertResponse = nil
        notice = nil
        confirm?(confirmed)
        alert?()
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard frame.isMainFrame, let url = frame.request.url,
              NavigationPolicy.decide(url) == .inside, notice == nil else {
            completionHandler(false)
            return
        }
        confirmResponse = completionHandler
        notice = message
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard frame.isMainFrame, let url = frame.request.url,
              NavigationPolicy.decide(url) == .inside, notice == nil else {
            completionHandler()
            return
        }
        alertResponse = completionHandler
        notice = message
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { failed(error) }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { failed(error) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        isLoading = false
        errorMessage = "L’affichage a été interrompu. Tes données déjà enregistrées sur COAI sont conservées."
    }

    private func failed(_ error: Error) {
        isLoading = false
        guard (error as NSError).code != NSURLErrorCancelled else { return }
        errorMessage = "Impossible de charger COAI. Vérifie ta connexion, puis réessaie. Le minuteur reste accessible."
    }
}

struct COAIWebView: UIViewRepresentable {
    @ObservedObject var model: COAIWebModel
    func makeUIView(context: Context) -> WKWebView { model.webView }
    func updateUIView(_ view: WKWebView, context: Context) {}
}
