import SwiftUI

struct RestTimerView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("coai.rest.endsAt") private var endsAt: Double = 0
    @State private var minutes = 1
    @State private var seconds = 30
    private var duration: Int { minutes * 60 + seconds }

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
                    HStack {
                        Picker("Minutes", selection: $minutes) {
                            ForEach(0..<60, id: \.self) { value in
                                Text("\(value) min").tag(value)
                            }
                        }.pickerStyle(.wheel).accessibilityLabel("Minutes de repos")
                        Picker("Secondes", selection: $seconds) {
                            ForEach(0..<60, id: \.self) { value in
                                Text("\(value) s").tag(value)
                            }
                        }.pickerStyle(.wheel).accessibilityLabel("Secondes de repos")
                    }
                    if duration == 0 {
                        Text("Choisis une durée supérieure à zéro.")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    Button(endsAt > 0 ? "Relancer le minuteur" : "Démarrer le repos") {
                        endsAt = RestClock(seconds: duration).end.timeIntervalSince1970
                    }.buttonStyle(.borderedProminent).controlSize(.large).disabled(duration == 0)
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
