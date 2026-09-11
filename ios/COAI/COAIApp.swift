import SwiftUI

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
    private let gold = Color(red: 0.88, green: 0.73, blue: 0.31)

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let error = browser.errorMessage {
                    VStack(spacing: 12) {
                        Image(systemName: "wifi.exclamationmark").font(.largeTitle)
                        Text(error).multilineTextAlignment(.center)
                        Button("Réessayer") { browser.retry() }.buttonStyle(.borderedProminent)
                    }.padding().frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ZStack(alignment: .top) {
                        COAIWebView(model: browser).id(browser.sessionViewID)
                        if browser.isLoading { ProgressView().padding(10).background(.ultraThinMaterial, in: Capsule()) }
                    }
                }
                HStack(spacing: 0) {
                    destination("Séance", icon: "figure.strengthtraining.traditional", path: "/programme/entrainement")
                    destination("RepCount", icon: "chart.bar", path: "/suivi/repcount")
                    Button { showTimer = true } label: {
                        Label("Repos", systemImage: "timer").labelStyle(.titleAndIcon)
                            .font(.caption).frame(maxWidth: .infinity, minHeight: 50)
                    }
                    destination("Compte", icon: "person.crop.circle", path: "/compte/parametres")
                }.padding(.horizontal, 8).background(.ultraThinMaterial)
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
                        Button("Effacer la connexion sur cet iPhone", role: .destructive) { showLocalReset = true }
                    } label: { Image(systemName: "ellipsis.circle") }
                    .accessibilityLabel("Options COAI")
                }
            }
        }
        .tint(gold)
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
        .confirmationDialog("Effacer la connexion locale ?", isPresented: $showLocalReset, titleVisibility: .visible) {
            Button("Effacer sur cet iPhone", role: .destructive) { browser.clearLocalSession() }
        } message: {
            Text("Efface les cookies et le cache de cette app. Ton compte et tes programmes restent sur COAI. Pour supprimer le compte, utilise Compte → Paramètres.")
        }
    }

    private func destination(_ title: String, icon: String, path: String) -> some View {
        Button { browser.open(path: path) } label: {
            VStack(spacing: 4) { Image(systemName: icon); Text(title) }
                .font(.caption).frame(maxWidth: .infinity, minHeight: 50)
        }.disabled(!browser.isReady)
    }
}
