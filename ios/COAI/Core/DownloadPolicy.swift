import Foundation

/// No arbitrary websites, payment routes, credentials or executable formats.
enum DownloadPolicy {
    static let maximumBytes: Int64 = 15 * 1024 * 1024

    static func trustedURL(_ url: URL) -> Bool {
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

    enum Format: String { case pdf, png, jpg }

    static func format(mime: String?, length: Int64) -> Format? {
        guard length <= maximumBytes, length != 0 else { return nil }
        switch mime?.lowercased() {
        case "application/pdf": return .pdf
        case "image/png": return .png
        case "image/jpeg": return .jpg
        default: return nil
        }
    }

    static func validHeader(_ data: Data, format: Format) -> Bool {
        switch format {
        case .pdf: return data.starts(with: Array("%PDF-".utf8))
        case .png: return data.starts(with: [137, 80, 78, 71, 13, 10, 26, 10])
        case .jpg: return data.starts(with: [255, 216, 255])
        }
    }
}
