import SwiftUI
import UIKit

@MainActor
struct COAIAppleSubscriptionView: View {
    @ObservedObject var browser: COAIWebModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var service: ApplePurchaseService?
    @State private var offers: [ApplePurchaseService.Offer] = []
    @State private var purchasesEnabled = false
    @State private var busy = false
    @State private var performingTransaction = false
    @State private var message: String?
    @State private var operation: Task<Void, Never>?
    private let gold = Color(red: 0.88, green: 0.78, blue: 0.54)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("COAI ESSENTIEL").font(.caption.weight(.semibold)).tracking(3).foregroundStyle(gold)
                        Text("Un cap.\nChaque jour.").font(.largeTitle.weight(.semibold))
                        Text("Entraînement, nutrition et récupération réunis dans ton espace COAI.")
                            .foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                    }.padding(.vertical, 12)
                    if busy { ProgressView("Vérification en cours…").frame(maxWidth: .infinity).accessibilityIdentifier("apple-loading") }
                    if let message {
                        Text(message).font(.callout).fixedSize(horizontal: false, vertical: true)
                            .padding().frame(maxWidth: .infinity, alignment: .leading)
                            .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 16))
                            .accessibilityIdentifier("apple-status")
                    }
                    ForEach(offers) { offer in
                        VStack(alignment: .leading, spacing: 12) {
                            Text(offer.period == "P1M" ? "Mensuel" : "Annuel").font(.title3.weight(.semibold))
                            Text("\(offer.displayPrice) / \(offer.period == "P1M" ? "mois" : "an")").font(.title2.weight(.bold))
                            if offer.hasSevenDayTrial {
                                Text("7 jours d’essai, puis \(offer.displayPrice) par \(offer.period == "P1M" ? "mois" : "an").")
                                    .font(.callout).foregroundStyle(gold)
                            }
                            Button(offer.hasSevenDayTrial ? "Commencer mon essai" : "Choisir cette formule") {
                                guard let service, purchasesEnabled else { return }
                                run {
                                    switch try await service.purchase(productID: offer.id) {
                                    case .cancelled: return "Achat annulé. Aucun nouvel abonnement confirmé."
                                    case .pending: return "Achat en attente de validation Apple."
                                    case .delivered: return "Achat traité par COAI. Ton accès est vérifié côté serveur."
                                    }
                                }
                            }.buttonStyle(.borderedProminent).tint(gold).foregroundStyle(.black)
                                .frame(minHeight: 44).disabled(busy || !purchasesEnabled)
                        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
                            .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 22))
                            .overlay(RoundedRectangle(cornerRadius: 22).stroke(gold.opacity(0.3)))
                    }
                    if !purchasesEnabled {
                        Text("Les nouveaux abonnements Apple ne sont pas encore disponibles dans cette version. Aucun achat ne sera lancé.")
                            .font(.callout).foregroundStyle(.secondary)
                    }
                    if service == nil || offers.isEmpty {
                        Button("Réessayer") { operation = Task { await load() } }.frame(minHeight: 44).disabled(busy)
                    }
                    Button("Restaurer mes achats Apple") {
                        guard let service else { return }
                        run {
                            let count = try await service.restorePurchases()
                            return count == 0 ? "Aucun achat COAI à restaurer pour ce compte Apple." : "Restauration traitée. Les droits dépendent de la validité de tes abonnements."
                        }
                    }.frame(minHeight: 44).disabled(busy || service == nil)
                    Link("Gérer ou résilier dans Apple", destination: URL(string: "https://apps.apple.com/account/subscriptions")!)
                        .frame(minHeight: 44)
                    Text("Renouvellement automatique au tarif et à la période affichés. Tu peux gérer le renouvellement dans les réglages de ton compte Apple.")
                        .font(.footnote).foregroundStyle(.secondary)
                    let legalLayout = dynamicTypeSize.isAccessibilitySize
                        ? AnyLayout(VStackLayout(alignment: .leading, spacing: 12))
                        : AnyLayout(HStackLayout(spacing: 16))
                    legalLayout {
                        Button { browser.open(path: "/cgv"); dismiss() } label: {
                            Text("Conditions").frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        }
                        Button { browser.open(path: "/confidentialite"); dismiss() } label: {
                            Text("Confidentialité").frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        }
                    }.font(.footnote)
                }.padding(24)
            }.background(Color(red: 0.04, green: 0.065, blue: 0.075)).tint(gold)
                .navigationTitle("Abonnement").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fermer") { dismiss() }.disabled(performingTransaction) } }
                .interactiveDismissDisabled(performingTransaction)
        }.task { await load() }
            .onDisappear { operation?.cancel(); service?.stopObserving() }
    }

    private func load() async {
        guard !busy else { return }
        busy = true; message = nil; offers = []; service?.stopObserving(); service = nil; purchasesEnabled = false
        defer { busy = false }
        do {
            let prepared = try await browser.prepareApplePurchases()
            try Task.checkCancellation()
            // Restoring an existing receipt must not depend on fetching prices.
            service = prepared.service
            let loaded = try await prepared.service.loadOffers(expectedPeriods: prepared.periods)
            try Task.checkCancellation()
            service = prepared.service; offers = loaded; purchasesEnabled = prepared.purchasesEnabled
            if loaded.isEmpty { message = "Les offres Apple sont momentanément indisponibles. Tu peux réessayer plus tard." }
        } catch {
            if !Task.isCancelled { message = "Impossible de charger les offres. Vérifie ta connexion et connecte-toi à COAI, puis réessaie." }
        }
    }

    private func run(_ action: @escaping @MainActor () async throws -> String) {
        guard !busy else { return }
        busy = true; message = nil
        performingTransaction = true
        operation = Task {
            defer { busy = false; performingTransaction = false }
            do { let result = try await action(); try Task.checkCancellation(); message = result }
            catch { if !Task.isCancelled { message = "Opération non confirmée. Réessaie ou utilise Restaurer mes achats. Ne lance pas un second achat pour débloquer l’accès." } }
        }
    }
}

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
        .sheet(isPresented: $browser.showSubscription) { COAIAppleSubscriptionView(browser: browser) }
        .sheet(isPresented: $showExplorer, onDismiss: {
            guard let path = explorerDestination else { return }
            explorerDestination = nil
            if path == "native:timer" { showTimer = true }
            else if path == "native:subscription" { browser.showSubscription = true }
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
                Text(title == "Récupération" ? "Récup." : title).font(.caption2.weight(.semibold))
                    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity, minHeight: 56)
            .foregroundStyle(selected ? Color(red: 0.88, green: 0.78, blue: 0.54) : Color(red: 0.65, green: 0.69, blue: 0.71))
            .background(selected ? Color(red: 0.88, green: 0.78, blue: 0.54).opacity(0.10) : .clear, in: RoundedRectangle(cornerRadius: 16))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        // A fixed five-item navigation bar must not crowd out the page at
        // accessibility sizes. The full enlarged label remains available.
        .accessibilityShowsLargeContentViewer { Label(title, systemImage: icon) }
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
                Section("Mon compte") {
                    entry("Mon profil", "person", "/compte/profil")
                    entry("Réglages et déconnexion", "gearshape", "/compte/parametres")
                    entry("Abonnement", "creditcard", "native:subscription")
                }
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
                Text("Version de test iPhone").font(.footnote).foregroundStyle(.secondary)
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
                Image(systemName: icon).font(.system(size: 22)).frame(width: 24)
                    .foregroundStyle(Color(red: 0.88, green: 0.78, blue: 0.54)).accessibilityHidden(true)
                Text(title).fixedSize(horizontal: false, vertical: true).foregroundStyle(Color(white: 0.92))
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(Color(white: 0.5)).accessibilityHidden(true)
            }.frame(minHeight: 44).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("explore-" + path)
    }
}
