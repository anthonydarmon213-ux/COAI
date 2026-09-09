import SwiftUI

// Standalone iOS 16+ prototype. No account, health data or payment integration.
@main
struct COAIPrototypeApp: App {
    var body: some Scene { WindowGroup { SessionPreview() } }
}

private struct SessionPreview: View {
    @AppStorage("coai.prototype.sets") private var savedSets = ""
    @State private var weight = ""
    @State private var reps = ""
    @State private var message = ""
    @State private var restEnds: Date?
    private let gold = Color(red: 0.88, green: 0.73, blue: 0.31)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("COAI · PROTOTYPE IPHONE")
                        .font(.caption.weight(.bold)).foregroundStyle(gold)
                    Text("Ta séance.\nTon moment.").font(.largeTitle.bold())
                    Text("Démonstration uniquement — aucun programme personnalisé ni compte connecté.")
                        .font(.subheadline).foregroundStyle(.secondary)
                    GroupBox("01 · Préparation") {
                        Text("Dans la version connectée : échauffement et mobilité prévus par ton programme.")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    GroupBox("02 · Carnet de séance") {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Développé couché à la barre").font(.headline)
                            Text("Exercice exemple · valeurs libres pour tester la saisie, pas une prescription.")
                                .font(.caption).foregroundStyle(.secondary)
                            HStack {
                                TextField("Charge (kg)", text: $weight).keyboardType(.decimalPad)
                                    .accessibilityLabel("Charge en kilogrammes")
                                TextField("Répétitions", text: $reps).keyboardType(.numberPad)
                                    .accessibilityLabel("Nombre de répétitions")
                            }.textFieldStyle(.roundedBorder)
                            Button("Enregistrer la série", action: save)
                                .buttonStyle(.borderedProminent).tint(gold).foregroundStyle(.black)
                            if !message.isEmpty { Text(message).font(.subheadline).accessibilityAddTraits(.updatesFrequently) }
                            if !savedSets.isEmpty {
                                Text(savedSets).font(.body.monospacedDigit())
                                ShareLink(item: "Ma séance COAI — démonstration\n" + savedSets) {
                                    Label("Partager ma fiche test", systemImage: "square.and.arrow.up")
                                }
                            }
                        }.frame(maxWidth: .infinity, alignment: .leading)
                    }
                    GroupBox("Récupération · minuteur de démonstration") {
                        VStack(spacing: 12) {
                            if let end = restEnds {
                                TimelineView(.periodic(from: .now, by: 1)) { context in
                                    let remaining = max(0, Int(ceil(end.timeIntervalSince(context.date))))
                                    Text(remaining == 0 ? "Temps écoulé" : "\(remaining) s")
                                        .font(.largeTitle.monospacedDigit()).foregroundStyle(.cyan)
                                }
                                Button("Arrêter") { restEnds = nil }
                            }
                            Button("Lancer 60 secondes") { restEnds = Date().addingTimeInterval(60) }
                            Text("Le temps reste calculé au retour dans l’app. Pas d’alerte sonore ou de notification en arrière-plan dans ce prototype.")
                                .font(.caption).foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity)
                    }
                    GroupBox("03 · Retour au calme") {
                        Text("Dans la version connectée : les consignes de fin de séance de ton programme.")
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    Text("Les séries test restent sur cet appareil uniquement. Elles ne sont pas envoyées à COAI.")
                        .font(.caption).foregroundStyle(.secondary)
                }.padding()
            }
            .background(Color(red: 0.04, green: 0.07, blue: 0.09))
            .navigationTitle("COAI").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Terminé") {
                        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                    }
                }
            }
        }.preferredColorScheme(.dark).tint(.cyan)
    }

    private func save() {
        guard let kg = Double(weight.replacingOccurrences(of: ",", with: ".")), kg.isFinite, kg >= 0,
              let count = Int(reps), count > 0 else {
            message = "Saisis une charge positive ou nulle et un nombre entier de répétitions supérieur à zéro."
            return
        }
        let line = "\(count) répétitions × \(kg.formatted()) kg"
        savedSets = savedSets.isEmpty ? line : savedSets + "\n" + line
        message = "Série test enregistrée sur cet iPhone."
    }
}
