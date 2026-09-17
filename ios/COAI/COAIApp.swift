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
    @State private var showExplorer = false
    @State private var explorerDestination: String?
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
                    destination("Nutrition", icon: "fork.knife", path: "/programme/alimentation")
                    destination("Récupération", icon: "moon", path: "/programme/recuperation")
                    destination("Coach", icon: "bubble.left.and.bubble.right", path: "/coach")
                    navigationItem("Explorer", icon: "square.grid.2x2", selected: showExplorer) { showExplorer = true }
                  }
                  .padding(.horizontal, 12).padding(.vertical, 8)
                  .background(Color(red: 0.045, green: 0.065, blue: 0.075).ignoresSafeArea(edges: .bottom))
                  .overlay(alignment: .top) { Rectangle().fill(.white.opacity(0.08)).frame(height: 0.5) }
                }
            }
            .background(Color(red: 0.04, green: 0.07, blue: 0.09))
            .navigationTitle("COAI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button { browser.goBack() } label: { Image(systemName: "chevron.left") }
                        .disabled(!browser.canGoBack).accessibilityLabel("Page précédente")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { showTimer = true } label: { Image(systemName: "timer") }
                        .accessibilityLabel("Repos")
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
        .sheet(isPresented: $showExplorer, onDismiss: {
            guard let path = explorerDestination else { return }
            explorerDestination = nil
            if path == "native:timer" { showTimer = true }
            else { browser.open(path: path) }
        }) {
            COAIExplorerView { path in
                explorerDestination = path
                showExplorer = false
            }
        }
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
        let related: [String]
        switch path {
        case "/programme/entrainement": related = [path, "/programme/seance-du-jour", "/programme/exercices", "/suivi/repcount"]
        case "/programme/alimentation": related = [path, "/programme/recettes", "/suivi/alimentation"]
        default: related = [path]
        }
        let selected = !showTimer && !showExplorer && related.contains { current == $0 || current.hasPrefix($0 + "/") }
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

/// All destinations removed with the web sidebar remain reachable here.
/// This is navigation only; authentication and access rights stay on the server.
private struct COAIExplorerView: View {
    @Environment(\.dismiss) private var dismiss
    let open: (String) -> Void

    var body: some View {
        NavigationStack {
            List {
                Section("Au quotidien") {
                    entry("Aujourd’hui", "sun.max", "/dashboard")
                    entry("Mon entraînement", "dumbbell", "/programme/entrainement")
                    entry("RepCount", "chart.bar", "/suivi/repcount")
                    entry("Minuteur de repos", "timer", "native:timer")
                    entry("Nutrition", "leaf", "/programme/alimentation")
                    entry("Récupération", "moon", "/programme/recuperation")
                    entry("Mon coach", "bubble.left", "/coach")
                }
                Section("Entraînement") {
                    entry("Fiche du jour", "doc.text", "/programme/seance-du-jour")
                    entry("Bibliothèque d’exercices", "figure.strengthtraining.traditional", "/programme/exercices")
                    entry("Programmes prêts", "square.stack", "/programme/programmes-prets")
                    entry("Correction de mouvement", "figure.flexibility", "/programme/correction-mouvement")
                    entry("Historique des séances", "clock", "/suivi/seances")
                    entry("Vidéos exclusives", "play.rectangle", "/videos")
                }
                Section("Nutrition et récupération") {
                    entry("Recettes", "fork.knife", "/programme/recettes")
                    entry("Suivi des macros", "chart.pie", "/suivi/alimentation")
                    entry("Protocoles de récupération", "moon.stars", "/programme/programmes-prets?categorie=RECUPERATION")
                }
                Section("Mes progrès") {
                    entry("Progression", "chart.xyaxis.line", "/suivi/progression")
                    entry("Mes records", "trophy", "/suivi/tests-maxi")
                    entry("Poids et mensurations", "ruler", "/suivi/mesures")
                    entry("Activité quotidienne", "figure.walk", "/programme/evolution")
                }
                Section("Le club") {
                    entry("COAI Club", "person.2", "/club")
                    entry("Articles et conseils", "text.book.closed", "/conseils")
                    entry("Fonctionnalités", "sparkles", "/fonctionnalites")
                    entry("Donner mon avis", "star.bubble", "/avis")
                }
                Section {
                    entry("Mon profil", "person", "/compte/profil")
                    entry("Réglages et déconnexion", "gearshape", "/compte/parametres")
                    // The existing pilot purchase guard still handles this route.
                    entry("Abonnement", "creditcard", "/compte/abonnement")
                } header: {
                    Text("Mon compte")
                } footer: {
                    Text("Version de test iPhone")
                }
            }
            .navigationTitle("Explorer")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
        .presentationDragIndicator(.visible)
    }

    private func entry(_ title: String, _ icon: String, _ path: String) -> some View {
        Button { open(path) } label: {
            HStack(spacing: 14) {
                Image(systemName: icon).frame(width: 24).foregroundStyle(Color(red: 0.88, green: 0.78, blue: 0.54))
                Text(title).foregroundStyle(Color(white: 0.92))
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.caption).foregroundStyle(Color(white: 0.5))
            }.frame(minHeight: 44).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("explore-" + path)
    }
}
