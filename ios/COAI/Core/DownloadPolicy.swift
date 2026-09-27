import Foundation

/// No arbitrary websites, payment routes, credentials or executable formats.
enum DownloadPolicy {
    static let maximumBytes: Int64 = 15 * 1024 * 1024

    static func isNavigationHandoff(_ error: NSError, downloadActive: Bool) -> Bool {
        // WebKit's frame-load policy interruption after accepting a download,
        // not a network failure. Never suppress unrelated domains or failures.
        downloadActive && error.domain == "WebKitErrorDomain" && error.code == 102
    }

    static func trustedURL(_ url: URL) -> Bool {
        #if DEBUG && targetEnvironment(simulator)
        // Same fixed loopback as the connected test app, never compiled into
        // physical-device or Release builds. All MIME/size/header checks remain.
        if NavigationPolicy.localIntegrationTest, url.scheme == "http",
           url.host == "localhost", url.port == 3050 {
            return NavigationPolicy.decide(url) == .inside
        }
        #endif
        if url.scheme?.lowercased() == "blob" {
            guard let origin = URL(string: String(url.absoluteString.dropFirst(5))) else { return false }
            return origin.scheme == "https" && NavigationPolicy.decide(origin) == .inside
        }
        return url.scheme == "https" && NavigationPolicy.decide(url) == .inside
    }

    static func permits(url: URL, source: URL?, mainFrame: Bool, method: String?, downloadAttribute: Bool, linkActivated: Bool) -> Bool {
        guard mainFrame, let source, source.scheme == "https", NavigationPolicy.decide(source) == .inside,
              (method ?? "GET") == "GET", trustedURL(url) else { return false }
        return downloadAttribute || (url.scheme == "blob" && linkActivated)
    }

    enum Format: String { case pdf, png, jpg, json }

    static func format(mime: String?, length: Int64) -> Format? {
        guard length <= maximumBytes, length != 0 else { return nil }
        switch mime?.lowercased() {
        case "application/pdf": return .pdf
        case "image/png": return .png
        case "image/jpeg": return .jpg
        case "application/json": return .json
        default: return nil
        }
    }

    static func validHeader(_ data: Data, format: Format) -> Bool {
        switch format {
        case .pdf: return data.starts(with: Array("%PDF-".utf8))
        case .png: return data.starts(with: [137, 80, 78, 71, 13, 10, 26, 10])
        case .jpg: return data.starts(with: [255, 216, 255])
        case .json: return false // JSON requires validation of the complete document.
        }
    }

    static func validJSONDocument(_ data: Data) -> Bool {
        guard !data.isEmpty, data.count <= maximumBytes,
              let value = try? JSONSerialization.jsonObject(with: data) else { return false }
        // Account exports are objects, never executable text or a lone scalar.
        return value is [String: Any]
    }
}
