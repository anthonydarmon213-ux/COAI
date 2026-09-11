import SwiftUI

struct RestTimerView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("coai.rest.endsAt") private var endsAt: Double = 0
    @State private var duration = 90

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    Image(systemName: "timer").font(.system(size: 48)).foregroundStyle(.cyan)
                    Text("Ton temps de récupération").font(.title2.bold()).multilineTextAlignment(.center)
                    Text("Choisis le repos indiqué dans ta séance.").foregroundStyle(.secondary)
                    if endsAt > 0 {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            let seconds = RestClock(end: Date(timeIntervalSince1970: endsAt)).remaining(at: context.date)
                            Text(seconds == 0 ? "Temps écoulé" : RestClock.label(seconds: seconds))
                                .font(.largeTitle.monospacedDigit().bold())
                                .accessibilityLabel(seconds == 0 ? "Temps de récupération écoulé" : "Repos restant : " + RestClock.label(seconds: seconds))
                        }
                        Button("Arrêter et réinitialiser", role: .destructive) { endsAt = 0 }
                    }
                    Picker("Durée du repos", selection: $duration) {
                        ForEach([30, 45, 60, 75, 90, 120, 150, 180], id: \.self) { value in
                            Text(RestClock.label(seconds: value)).tag(value)
                        }
                    }.pickerStyle(.wheel)
                    Button(endsAt > 0 ? "Relancer le minuteur" : "Démarrer le repos") {
                        endsAt = RestClock(seconds: duration).end.timeIntervalSince1970
                    }.buttonStyle(.borderedProminent).controlSize(.large)
                    Text("Le décompte est conservé si tu changes d’écran ou quittes l’app. Cette première version n’émet pas de notification ni de son en arrière-plan.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(24)
            }
            .navigationTitle("Récupération")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fermer") { dismiss() } } }
        }.preferredColorScheme(.dark).tint(.cyan)
    }
}
