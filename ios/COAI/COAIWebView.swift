import SwiftUI
import WebKit
import AuthenticationServices

extension COAIWebModel {
    enum AppleAPIFailure: Error { case unavailable, invalidResponse }

    /// Uses the existing authenticated WebKit cookie store. No session token is
    /// extracted into JavaScript arguments, native storage, logs or URL query.
    /// Called by native purchase flow only; no script message handler is exposed.
    func deliverAppleReceipt(_ signedTransaction: String) async throws -> PurchaseAcknowledgement {
        guard !signedTransaction.isEmpty, signedTransaction.utf8.count <= 65536,
              let url = webView.url, url.scheme == "https", url.host == "coai.fr",
              url.port == nil || url.port == 443 else { throw AppleAPIFailure.unavailable }
        let generation = sessionViewID
        let view = webView
        let result = try await view.callAsyncJavaScript("""
            if (location.origin !== 'https://coai.fr') throw new Error('Unavailable');
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 25000);
            try {
                const response = await fetch('/api/ios/apple/transactions', {
                    method: 'POST', credentials: 'same-origin', mode: 'same-origin',
                    redirect: 'error', cache: 'no-store', signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ signedTransaction: receipt })
                });
                if (!response.ok) throw new Error('Purchase not confirmed');
                const text = await response.text();
                if (text.length > 16384) throw new Error('Invalid response');
                return text;
            } finally { clearTimeout(timeout); }
            """, arguments: ["receipt": signedTransaction], in: nil, contentWorld: .defaultClient)
        try Task.checkCancellation()
        guard generation == sessionViewID, view === webView,
              let text = result as? String, let data = text.data(using: .utf8) else {
            throw AppleAPIFailure.invalidResponse
        }
        // PurchaseDelivery also compares account token and transaction ID with
        // the verified StoreKit transaction before allowing finish().
        return try JSONDecoder().decode(PurchaseAcknowledgement.self, from: data)
    }
}

@MainActor
final class COAIWebModel: NSObject, ObservableObject, WKNavigationDelegate, WKUIDelegate, ASWebAuthenticationPresentationContextProviding {
    @Published private(set) var webView: WKWebView
    @Published private(set) var sessionViewID = UUID()
    @Published var isLoading = false
    @Published var isReady = false
    @Published var canGoBack = false
    @Published private(set) var currentURL: URL?
    @Published var errorMessage: String?
    @Published var notice: String?
    var confirmResponse: ((Bool) -> Void)?
    var alertResponse: (() -> Void)?
    @Published var externalURL: URL?
    private var starting = false
    private var authenticationSession: ASWebAuthenticationSession?
    private var authenticationAttempt: OAuthAttempt?
    private var authenticationTimeout: Task<Void, Never>?
    private var historyObservation: NSKeyValueObservation?
    private var urlObservation: NSKeyValueObservation?
    let downloads = COAIDownload()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        webView.window ?? ASPresentationAnchor()
    }

    private func cancelAuthentication() {
        authenticationAttempt = nil
        authenticationTimeout?.cancel()
        authenticationTimeout = nil
        authenticationSession?.cancel()
        authenticationSession = nil
    }

    private func expireAuthentication(_ attempt: OAuthAttempt) {
        guard authenticationAttempt == attempt else { return }
        // Invalidate before cancelling: the old session callback must not reset a new attempt.
        cancelAuthentication()
        open(path: "/sign-in")
        notice = "Cette tentative de connexion a dépassé 9 minutes. Relance « Continuer avec Google » pour obtenir un nouveau lien sécurisé."
    }

    private func authenticate(_ request: (authorize: URL, exchange: URL)) {
        guard authenticationSession == nil, webView.window != nil else { return }
        let attempt = OAuthAttempt()
        authenticationAttempt = attempt
        let session = ASWebAuthenticationSession(url: request.authorize, callbackURLScheme: NativeOAuth.callback.scheme) { [weak self] returned, error in
            Task { @MainActor in
                guard let self, self.authenticationAttempt == attempt else { return }
                // Also check the deadline after background suspension, before exchanging a code.
                guard !attempt.expired() else { self.expireAuthentication(attempt); return }
                self.authenticationAttempt = nil
                self.authenticationTimeout?.cancel()
                self.authenticationTimeout = nil
                self.authenticationSession = nil
                if error == nil, let returned,
                   let exchange = NativeOAuth.exchangeURL(returned, original: request.exchange) {
                    // Exchange happens in the original cookie store, using its PKCE verifier.
                    self.load(exchange)
                } else {
                    self.open(path: "/sign-in")
                    // A deliberate cancellation is not an error and must not require
                    // a second confirmation. Invalid callbacks still surface an error.
                    if (error as? ASWebAuthenticationSessionError)?.code != .canceledLogin {
                        self.notice = "La connexion Google n’a pas abouti. Tu peux réessayer."
                    }
                }
            }
        }
        session.presentationContextProvider = self
        authenticationSession = session
        if !session.start() {
            cancelAuthentication()
            open(path: "/sign-in")
            notice = "La connexion Google n’a pas pu démarrer. Réessaie."
        } else {
            authenticationTimeout = Task { @MainActor [weak self] in
                do { try await Task.sleep(nanoseconds: UInt64(OAuthAttempt.duration * 1_000_000_000)) }
                catch { return }
                guard !Task.isCancelled else { return }
                self?.expireAuthentication(attempt)
            }
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
        // Non-identifying capability marker, never an authentication signal.
        configuration.applicationNameForUserAgent = "COAIiOS/1"
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = .all
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = false
        view.backgroundColor = .black
        return view
    }

    private func attachDelegates() {
        historyObservation?.invalidate()
        urlObservation?.invalidate()
        webView.navigationDelegate = self
        webView.uiDelegate = self
        // Same-document navigation changes history without a didFinish callback.
        historyObservation = webView.observe(\.canGoBack, options: [.initial, .new]) { [weak self] view, _ in
            Task { @MainActor [weak self, weak view] in
                guard let self, let view, self.webView === view else { return }
                self.canGoBack = view.canGoBack
            }
        }
        urlObservation = webView.observe(\.url, options: [.initial, .new]) { [weak self] view, _ in
            Task { @MainActor [weak self, weak view] in
                guard let self, let view, self.webView === view else { return }
                self.currentURL = view.url
            }
        }
        // No injected authentication, no native-JavaScript bridge, no TLS exceptions.
    }

    func start() async {
        guard !starting, !isReady else { return }
        starting = true
        defer { starting = false }
        do {
            let rules: WKContentRuleList = try await withCheckedThrowingContinuation { continuation in
                WKContentRuleListStore.default().compileContentRuleList(
                    forIdentifier: "coai-ios-pilot-native-navigation-v3",
                    encodedContentRuleList: NavigationPolicy.contentRules
                ) { rules, error in
                    if let rules { continuation.resume(returning: rules) }
                    else { continuation.resume(throwing: error ?? NSError(domain: "COAI", code: 1)) }
                }
            }
            webView.configuration.userContentController.add(rules)
            installedRules = rules
            isReady = true
            #if DEBUG
            // Fixed, offline UI fixture only. No arbitrary URL, account or auth bypass.
            if ProcessInfo.processInfo.arguments.contains("-COAIDownloadFixture") {
                webView.loadHTMLString(Self.downloadFixture, baseURL: NavigationPolicy.baseURL.appendingPathComponent("native-download-fixture"))
                return
            }
            #endif
            load(lastRequestedURL)
        } catch {
            // Fail closed: never load the site if pilot purchase blocking failed to install.
            errorMessage = "La protection de cette version de test n’a pas pu démarrer. Réessaie."
        }
    }

    #if DEBUG
    private static let downloadFixture: String = {
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 300, height: 200))
        let pdf = renderer.pdfData { context in
            context.beginPage()
            ("Document fictif COAI — test local" as NSString).draw(at: CGPoint(x: 20, y: 30), withAttributes: nil)
        }.base64EncodedString()
        return """
    <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{background:#101820;color:white;font:18px system-ui;padding:24px}button{display:block;padding:16px;margin:20px 0}</style>
    <aside class="coai-app-nav"><nav><button>Ancienne navigation web</button></nav></aside>
    <h1>Test local de fichier</h1><p>Aucun compte ni donnée personnelle.</p>
    <button onclick="history.pushState({}, '', '/programme/entrainement')">Simuler la page séance</button>
    <button onclick="history.pushState({}, '', '/compte/parametres')">Simuler la page compte</button>
    <button onclick="history.pushState({}, '', '/programme/recettes')">Simuler les recettes</button>
    <button onclick="history.pushState({}, '', '/programme/recuperation')">Simuler la récupération</button>
    <button onclick="history.pushState({}, '', '/coach')">Simuler le coach</button>
    <button onclick="history.pushState({}, '', '/sign-in')">Simuler la connexion</button>
    <button onclick="save('png')">Ouvrir l’image de test</button>
    <button onclick="save('pdf')">Ouvrir le PDF de test</button>
    <button onclick="save('link')">Ouvrir l’image sans téléchargement</button>
    <button onclick="save('invalid')">Tester le format refusé</button>
    <button onclick="save('json')">Exporter les données fictives</button>
    <button onclick="save('invalidjson')">Tester le JSON invalide</button>
    <script>
    function save(kind) {
      const invalid = kind === 'invalid';
      const encoded = kind === 'pdf' ? '\(pdf)' : 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCfoAAAAASUVORK5CYII=';
      const bytes = invalid ? new TextEncoder().encode('<html>Non exportable</html>') : Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      const json = kind === 'json' || kind === 'invalidjson';
      const content = json ? new TextEncoder().encode(kind === 'json' ? JSON.stringify({test:true,seances:[]}) : '{invalid') : bytes;
      const blob = new Blob([content], {type:json?'application/json':invalid?'text/html':kind==='pdf'?'application/pdf':'image/png'});
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
      if (kind === 'link') { link.target = '_blank'; } else { link.download = invalid?'../../unsafe.html':kind==='pdf'?'test.pdf':'test.png'; }
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    }
    </script>
    """
    }()
    #endif

    func open(path: String) {
        cancelAuthentication()
        guard isReady, let url = URL(string: path, relativeTo: NavigationPolicy.baseURL)?.absoluteURL else { return }
        let decision = NavigationPolicy.decide(url)
        if decision == .purchasesUnavailable {
            notice = "Les achats et la gestion de l’abonnement ne sont pas activés dans ce pilote iPhone. Ce lien a été bloqué."
            return
        }
        guard decision == .inside else { return }
        load(url)
    }

    private func load(_ url: URL) {
        lastRequestedURL = url
        errorMessage = nil
        isLoading = true
        // Native entry/retry must not leave a blank spinner for the default
        // minute when the host is unreachable. Does not replay form submissions
        // or change timeout policy for the site's API requests.
        webView.load(URLRequest(url: url, timeoutInterval: 20))
    }

    func retry() {
        cancelAuthentication()
        if !isReady { Task { await start() }; return }
        // Never replay a POST on an error/reload. Reopen only a normal page with GET.
        load(NavigationPolicy.retryURL(current: webView.url, lastRequested: lastRequestedURL))
    }

    func goBack() { if webView.canGoBack { webView.goBack() } }

    func confirmExternalLink() {
        guard let url = externalURL, NavigationPolicy.decide(url) == .external else { return }
        externalURL = nil
        UIApplication.shared.open(url)
    }

    func clearLocalSession() {
        downloads.cancel()
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
        if action.shouldPerformDownload || url.scheme == "blob" {
            let source = action.sourceFrame.securityOrigin
            let trustedFrame = action.sourceFrame.isMainFrame && source.protocol == "https"
                && ["coai.fr", "www.coai.fr"].contains(source.host) && [0, 443].contains(source.port)
            if !downloads.isBusy, trustedFrame,
               DownloadPolicy.permits(url: url, source: action.sourceFrame.request.url,
                   mainFrame: action.targetFrame?.isMainFrame != false,
                   method: action.request.httpMethod, downloadAttribute: action.shouldPerformDownload,
                   linkActivated: action.navigationType == .linkActivated) {
                decisionHandler(.download)
            } else {
                decisionHandler(.cancel)
                notice = downloads.isBusy ? "Termine ou annule le partage en cours avant d’ouvrir un autre fichier." : "Ce téléchargement n’est pas autorisé depuis cette page."
            }
            return
        }
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

    func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse,
                 decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        // A server error is not a network failure: WebKit otherwise displays
        // its HTML (sometimes empty) and calls didFinish as if loading succeeded.
        // Do not replace the page for an iframe/media response.
        if response.isForMainFrame,
           let http = response.response as? HTTPURLResponse,
           let message = NavigationPolicy.responseError(status: http.statusCode) {
            isLoading = false
            errorMessage = message
            canGoBack = webView.canGoBack
            decisionHandler(.cancel)
            return
        }
        if response.isForMainFrame {
            let disposition = (response.response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Disposition") ?? ""
            if disposition.lowercased().hasPrefix("attachment") || !response.canShowMIMEType {
                guard !downloads.isBusy, let url = response.response.url, DownloadPolicy.trustedURL(url),
                      DownloadPolicy.format(mime: response.response.mimeType, length: response.response.expectedContentLength) != nil else {
                    decisionHandler(.cancel)
                    isLoading = false
                    notice = "Ce fichier ne peut pas être ouvert ici, ou un partage est déjà en cours."
                    return
                }
                decisionHandler(.download)
                return
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
        errorMessage = nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        canGoBack = webView.canGoBack
    }

    func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
        guard self.webView === webView else { download.cancel(nil); return }
        isLoading = false
        downloads.begin(download)
    }

    func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
        guard self.webView === webView else { download.cancel(nil); return }
        isLoading = false
        downloads.begin(download)
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
