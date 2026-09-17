import SwiftUI
import UIKit

@main
struct COAIApp: App {
    var body: some Scene {
        WindowGroup { COAIRootView().preferredColorScheme(.dark) }
    }
}

struct COAIRootView: View {
    @StateObject private var browser = COAIWebModel()
    @State private var showTimer = false
    @State private var showLocalReset = false
    @State private var keyboardVisible = false
    private let gold = Color(red: 0.88, green: 0.73, blue: 0.31)

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                DownloadStatus(downloads: browser.downloads)
                if let error = browser.errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.circle").font(.largeTitle).accessibilityHidden(true)
                        Text("Page indisponible").font(.title2.bold()).accessibilityAddTraits(.isHeader)
                        Text(error).multilineTextAlignment(.center)
                        Button { browser.retry() } label: {
                            Text("Réessayer").frame(minWidth: 120, minHeight: 44)
                        }.buttonStyle(.borderedProminent).foregroundStyle(.black)
                    }.padding().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ZStack(alignment: .top) {
                        COAIWebView(model: browser).id(browser.sessionViewID)
                        if browser.isLoading { ProgressView().accessibilityLabel("Chargement de COAI").padding(10).background(.ultraThinMaterial, in: Capsule()) }
                    }
                }
                if !keyboardVisible {
                  HStack(spacing: 4) {
                    destination("Séance", icon: "dumbbell", path: "/programme/entrainement")
                    destination("RepCount", icon: "chart.bar", path: "/suivi/repcount")
                    navigationItem("Repos", icon: "timer", selected: showTimer) { showTimer = true }
                    destination("Compte", icon: "person.crop.circle", path: "/compte/parametres")
                  }
                  .padding(.horizontal, 12).padding(.vertical, 8)
                  .background(Color(red: 0.045, green: 0.065, blue: 0.075).ignoresSafeArea(edges: .bottom))
                  .overlay(alignment: .top) { Rectangle().fill(.white.opacity(0.08)).frame(height: 0.5) }
                }
            }
            .background(Color(red: 0.04, green: 0.07, blue: 0.09))
            .navigationTitle("COAI · test iPhone")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button { browser.goBack() } label: { Image(systemName: "chevron.left") }
                        .disabled(!browser.canGoBack).accessibilityLabel("Page précédente")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button { browser.retry() } label: { Label("Actualiser", systemImage: "arrow.clockwise") }
                        Button { browser.open(path: "/confidentialite") } label: { Label("Confidentialité", systemImage: "hand.raised") }
                        Button("Réinitialiser les données locales", role: .destructive) { showLocalReset = true }
                    } label: { Image(systemName: "ellipsis.circle") }
                    .accessibilityLabel("Options COAI")
                }
            }
        }
        .tint(gold)
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
            keyboardVisible = true
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
            keyboardVisible = false
        }
        .task { await browser.start() }
        .sheet(isPresented: $showTimer) { RestTimerView() }
        // Buttons resolve the WebKit callback exactly once; a binding dismissal must not
        // cancel a destructive confirmation before its button action has run.
        .alert("COAI", isPresented: Binding(get: { browser.notice != nil }, set: { _ in })) {
            if browser.confirmResponse != nil {
                Button("Confirmer", role: .destructive) { browser.resolveDialog(true) }
                Button("Annuler", role: .cancel) { browser.resolveDialog(false) }
            } else {
                Button("Compris") { browser.resolveDialog(false) }
            }
        } message: { Text(browser.notice ?? "") }
        .confirmationDialog("Ouvrir hors de COAI ?", isPresented: Binding(get: { browser.externalURL != nil }, set: { if !$0 { browser.externalURL = nil } })) {
            Button("Ouvrir le lien externe") { browser.confirmExternalLink() }
            Button("Annuler", role: .cancel) { browser.externalURL = nil }
        } message: {
            Text("Destination : \(browser.externalURL?.host ?? "application externe"). Ta session COAI n’est pas transférée à cette application.")
        }
        .alert("Effacer les données locales ?", isPresented: $showLocalReset) {
            Button("Effacer les données et me déconnecter", role: .destructive) { browser.clearLocalSession() }
            Button("Annuler", role: .cancel) {}
        } message: {
            Text("Les séances et séries non synchronisées seront perdues sur cet iPhone. Annule et enregistre ta séance avant de continuer. Cette action efface aussi la connexion et le cache. Ton compte, tes programmes et les séances déjà enregistrées sur COAI ne sont pas supprimés.")
        }
    }

    private func destination(_ title: String, icon: String, path: String) -> some View {
        let current = browser.currentURL?.path ?? ""
        let prefix = path == "/programme/entrainement" ? "/programme" : path == "/compte/parametres" ? "/compte" : path
        let selected = !showTimer && (current == prefix || current.hasPrefix(prefix + "/"))
        return navigationItem(title, icon: icon, selected: selected) { browser.open(path: path) }
            .disabled(!browser.isReady)
    }

    private func navigationItem(_ title: String, icon: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 21, weight: .medium))
                    .frame(width: 28, height: 26)
                Text(title).font(.caption2.weight(.semibold)).lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, minHeight: 56)
            .foregroundStyle(selected ? Color(red: 0.88, green: 0.78, blue: 0.54) : Color(red: 0.65, green: 0.69, blue: 0.71))
            .background(selected ? Color(red: 0.88, green: 0.78, blue: 0.54).opacity(0.10) : .clear, in: RoundedRectangle(cornerRadius: 16))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityIdentifier("native-tab-" + title)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}
