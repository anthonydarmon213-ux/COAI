import SwiftUI

struct RestTimerView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("coai.rest.endsAt") private var endsAt: Double = 0
    @AppStorage("coai.rest.minutes") private var minutes = 1
    @AppStorage("coai.rest.seconds") private var seconds = 30
    @AppStorage("coai.rest.pausedSeconds") private var pausedSeconds = 0
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
                            if seconds > 0 {
                                Button("Mettre en pause") {
                                    pausedSeconds = RestClock(end: Date(timeIntervalSince1970: endsAt)).remaining()
                                    endsAt = 0
                                }.buttonStyle(.bordered).controlSize(.large)
                            }
                        }
                    } else if pausedSeconds > 0 {
                        Text(RestClock.label(seconds: pausedSeconds)).font(.largeTitle.monospacedDigit().bold())
                        Text("En pause").foregroundStyle(.secondary)
                        Button("Reprendre le repos") {
                            endsAt = RestClock(seconds: pausedSeconds).end.timeIntervalSince1970
                            pausedSeconds = 0
                        }.buttonStyle(.borderedProminent).controlSize(.large)
                    }
                    if endsAt > 0 || pausedSeconds > 0 {
                        Button("Arrêter et réinitialiser", role: .destructive) {
                            endsAt = 0
                            pausedSeconds = 0
                        }.frame(minHeight: 44)
                    }
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Préparer la durée du prochain repos").font(.headline)
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 10) {
                            ForEach([30, 60, 90, 120], id: \.self) { value in
                                Button(RestClock.label(seconds: value)) {
                                    minutes = value / 60
                                    seconds = value % 60
                                }.buttonStyle(.bordered).frame(minHeight: 44)
                                    .accessibilityLabel("Choisir " + RestClock.label(seconds: value))
                            }
                        }
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
                    Button(endsAt > 0 || pausedSeconds > 0 ? "Relancer avec la durée choisie" : "Démarrer le repos") {
                        endsAt = RestClock(seconds: duration).end.timeIntervalSince1970
                        pausedSeconds = 0
                    }.buttonStyle(.borderedProminent).controlSize(.large).disabled(duration == 0)
                    Text("Le décompte et la pause sont conservés si tu changes d’écran ou quittes l’app. Cette première version n’émet pas de notification ni de son en arrière-plan.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(24)
            }
            .navigationTitle("Récupération")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fermer") { dismiss() } } }
        }.preferredColorScheme(.dark).tint(.cyan)
    }
}
