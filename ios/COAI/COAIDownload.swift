import SwiftUI
import WebKit
import UIKit

@MainActor
final class COAIDownload: NSObject, ObservableObject, WKDownloadDelegate {
    struct SharedFile: Identifiable {
        let id = UUID()
        let url: URL
    }
    @Published private(set) var isDownloading = false
    @Published var readyFile: SharedFile?
    @Published var errorMessage: String?
    private var active: WKDownload?
    private var folder: URL?
    private var file: URL?
    private var format: DownloadPolicy.Format?
    private var progressObservation: NSKeyValueObservation?
    private var deadline: Task<Void, Never>?
    private let root = FileManager.default.temporaryDirectory.appendingPathComponent("COAIExports", isDirectory: true)
    var isBusy: Bool { active != nil || folder != nil }

    override init() {
        super.init()
        // Only this app's UUID-named temporary export folders, never user files.
        if let folders = try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil) {
            for item in folders where UUID(uuidString: item.lastPathComponent) != nil {
                try? FileManager.default.removeItem(at: item)
            }
        }
    }

    func begin(_ download: WKDownload) {
        guard !isBusy else { download.cancel(nil); return }
        active = download
        isDownloading = true
        errorMessage = nil
        download.delegate = self
        progressObservation = download.progress.observe(\.completedUnitCount, options: [.new]) { [weak self, weak download] _, _ in
            Task { @MainActor in
                guard let self, let download, self.active === download else { return }
                if download.progress.completedUnitCount > DownloadPolicy.maximumBytes {
                    self.cancel(message: "Ce fichier dépasse la limite de 15 Mo.")
                }
            }
        }
        deadline = Task { @MainActor [weak self, weak download] in
            do { try await Task.sleep(nanoseconds: 60_000_000_000) } catch { return }
            guard let self, let download, self.active === download else { return }
            self.cancel(message: "Le téléchargement prend trop de temps. Vérifie ta connexion et réessaie.")
        }
    }

    func cancel(message: String? = nil) {
        let download = active
        active = nil
        deadline?.cancel()
        progressObservation?.invalidate()
        isDownloading = false
        download?.cancel(nil)
        readyFile = nil
        removeTemporaryFile()
        errorMessage = message
    }

    func finishSharing() {
        readyFile = nil
        removeTemporaryFile()
    }

    private func removeTemporaryFile() {
        if let folder { try? FileManager.default.removeItem(at: folder) }
        folder = nil
        file = nil
        format = nil
    }

    func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                  suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
        guard active === download, let url = response.url, DownloadPolicy.trustedURL(url),
              let type = DownloadPolicy.format(mime: response.mimeType, length: response.expectedContentLength),
              (response as? HTTPURLResponse).map({ (200..<300).contains($0.statusCode) }) ?? true else {
            completionHandler(nil)
            if active === download { cancel(message: "Ce fichier n’est pas un PDF ou une image COAI pris en charge (15 Mo maximum).") }
            return
        }
        do {
            let directory = root.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true,
                attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication])
            folder = directory
            // Never trust a filename supplied by HTML or HTTP (paths, identifiers, etc.).
            let destination = directory.appendingPathComponent("COAI-document.\(type.rawValue)")
            file = destination
            format = type
            completionHandler(destination)
        } catch {
            completionHandler(nil)
            cancel(message: "Impossible de préparer le fichier sur cet iPhone. Réessaie.")
        }
    }

    func download(_ download: WKDownload, willPerformHTTPRedirection response: HTTPURLResponse,
                  newRequest request: URLRequest, decisionHandler: @escaping (WKDownload.RedirectPolicy) -> Void) {
        let allowed = active === download && request.url.map(DownloadPolicy.trustedURL) == true
        decisionHandler(allowed ? .allow : .cancel)
        if !allowed, active === download { cancel(message: "Le fichier redirige vers une destination non autorisée.") }
    }

    func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
        guard active === download else { return }
        cancel(message: "Le fichier n’a pas pu être téléchargé. Ta page reste ouverte : réessaie.")
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard active === download, let file, let format else { return }
        do {
            let size = try file.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
            guard size > 0, size <= DownloadPolicy.maximumBytes else { throw CocoaError(.fileReadCorruptFile) }
            let handle = try FileHandle(forReadingFrom: file)
            defer { try? handle.close() }
            guard DownloadPolicy.validHeader(try handle.read(upToCount: 8) ?? Data(), format: format) else {
                throw CocoaError(.fileReadCorruptFile)
            }
            deadline?.cancel()
            progressObservation?.invalidate()
            active = nil
            isDownloading = false
            readyFile = SharedFile(url: file)
        } catch {
            cancel(message: "Le fichier reçu est vide, invalide ou trop volumineux. Réessaie depuis ta fiche.")
        }
    }
}

struct DownloadStatus: View {
    @ObservedObject var downloads: COAIDownload
    var body: some View {
        VStack(spacing: 0) {
            if downloads.isDownloading {
                HStack {
                    ProgressView()
                    Text("Préparation du fichier…").font(.footnote)
                    Spacer()
                    Button("Annuler") { downloads.cancel() }.frame(minHeight: 44)
                }.padding(.horizontal)
            }
        }
        .sheet(item: $downloads.readyFile, onDismiss: { downloads.finishSharing() }) { item in
            FileShareSheet(url: item.url) { downloads.readyFile = nil }
        }
        .alert("Fichier COAI", isPresented: Binding(get: { downloads.errorMessage != nil }, set: { if !$0 { downloads.errorMessage = nil } })) {
            Button("Compris") { downloads.errorMessage = nil }
        } message: { Text(downloads.errorMessage ?? "") }
    }
}

private struct FileShareSheet: UIViewControllerRepresentable {
    let url: URL
    let complete: () -> Void
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        controller.completionWithItemsHandler = { _, _, _, _ in complete() }
        return controller
    }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
