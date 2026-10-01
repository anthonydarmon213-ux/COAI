// Host WebKit integration runner. Loads only inline HTML, blob images and the
// locally transpiled production compressor. No remote requests or user photos.
import AppKit
import Foundation
import WebKit

final class CompressionCheck: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    let script: String
    var done = false
    var failure: String?
    init(script: String) { self.script = script }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript(script) { _, error in
            if let error { self.failure = error.localizedDescription; self.done = true }
        }
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let result = message.body as? [String: Any], result["ok"] as? Bool == true else {
            failure = String(describing: message.body); done = true; return
        }
        print("PASS: real macOS WebKit photo encoding, HEIC/HEIF decoding, PNG fallback, pixel dimensions and metadata removal; offline synthetic fixtures only. Not an iPhone picker test.")
        done = true
    }
}

@main
struct Runner {
    static func main() throws {
        guard CommandLine.arguments.count == 2 else { fatalError("Expected generated JavaScript file") }
        _ = NSApplication.shared
        let check = CompressionCheck(script: try String(contentsOfFile: CommandLine.arguments[1], encoding: .utf8))
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(check, name: "compressionResult")
        let view = WKWebView(frame: NSRect(x: 0, y: 0, width: 320, height: 480), configuration: configuration)
        view.navigationDelegate = check
        view.loadHTMLString("<html><head><meta http-equiv='Content-Security-Policy' content=\"default-src 'none'; img-src blob: data:; script-src 'unsafe-inline'; connect-src 'none'\"></head><body>Local photo test</body></html>", baseURL: nil)
        let deadline = Date().addingTimeInterval(30)
        while !check.done && Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
        }
        configuration.userContentController.removeScriptMessageHandler(forName: "compressionResult")
        view.stopLoading()
        guard check.done else { fatalError("WebKit photo test timed out") }
        if let failure = check.failure { fatalError(failure) }
    }
}
