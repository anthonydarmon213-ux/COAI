import SwiftUI
import UserNotifications

@MainActor
final class RestReminderService: ObservableObject {
    static let shared = RestReminderService()
    private static let identifier = "coai.rest.finished"
    private let center = UNUserNotificationCenter.current()
    @Published var message: String?
    @Published var requestingPermission = false
    private lazy var queue = RestReminderQueue(clear: { [weak self] in
        self?.center.removePendingNotificationRequests(withIdentifiers: [Self.identifier])
        self?.center.removeDeliveredNotifications(withIdentifiers: [Self.identifier])
    }, schedule: { [weak self] end, isCurrent in
        guard let self else { return nil }
        let settings = await self.center.notificationSettings()
        guard isCurrent() else { return nil }
        guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else {
            return "Les alertes sont désactivées dans les Réglages de l’iPhone. Le minuteur reste disponible."
        }
        let interval = end.timeIntervalSinceNow
        guard interval.isFinite, interval > 0, interval <= 3600 else { return nil }
        let content = UNMutableNotificationContent()
        content.title = "Repos terminé"
        content.body = "Prêt pour la suite ? Retrouve ta séance dans COAI."
        if settings.soundSetting == .enabled { content.sound = .default }
        let request = UNNotificationRequest(identifier: Self.identifier, content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: max(1, interval), repeats: false))
        do {
            try await self.center.add(request)
            return nil
        } catch {
            return "L’alerte n’a pas pu être programmée. Le minuteur continue dans l’app."
        }
    }, report: { [weak self] in self?.message = $0 })

    func update(enabled: Bool, endsAt: Double) {
        queue.update(end: enabled && endsAt.isFinite && endsAt > Date().timeIntervalSince1970
            ? Date(timeIntervalSince1970: endsAt) : nil)
    }

    // Only called by the explicit switch, never on launch or timer start.
    func requestPermission() async -> Bool {
        guard !requestingPermission else { return false }
        requestingPermission = true
        defer { requestingPermission = false }
        do {
            let allowed = try await center.requestAuthorization(options: [.alert, .sound])
            message = allowed ? nil : "Tu peux autoriser les alertes dans les Réglages de l’iPhone. Le minuteur fonctionne aussi sans notification."
            return allowed
        } catch {
            message = "Impossible d’activer les alertes pour le moment. Tu peux continuer sans notification."
            return false
        }
    }
}

struct RestTimerView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.openURL) private var openURL
    @ObservedObject private var reminders = RestReminderService.shared
    @AppStorage("coai.rest.endsAt") private var endsAt: Double = 0
    @AppStorage("coai.rest.minutes") private var minutes = 1
    @AppStorage("coai.rest.seconds") private var seconds = 30
    @AppStorage("coai.rest.pausedSeconds") private var pausedSeconds = 0
    @AppStorage("coai.rest.notify") private var notify = false
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
                    Toggle("M’alerter à la fin du repos", isOn: Binding(get: { notify }, set: { enabled in
                        if enabled {
                            Task {
                                if await reminders.requestPermission() { notify = true }
                            }
                        } else { notify = false }
                    })).disabled(reminders.requestingPermission).frame(minHeight: 44)
                    if reminders.requestingPermission { ProgressView("Autorisation des alertes…") }
                    if let message = reminders.message {
                        Text(message).font(.footnote).foregroundStyle(.secondary)
                        Button("Ouvrir les réglages de COAI") {
                            if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                        }.frame(minHeight: 44)
                    }
                    Text("Le décompte et la pause sont conservés si tu changes d’écran ou quittes l’app. L’alerte facultative s’affiche hors de l’app, selon les réglages de notifications et le mode Concentration de l’iPhone.")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(24)
            }
            .navigationTitle("Récupération")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fermer") { dismiss() } } }
        }.preferredColorScheme(.dark).tint(.cyan)
            .onAppear { synchronizeReminder() }
            .onChange(of: endsAt) { _ in synchronizeReminder() }
            .onChange(of: notify) { _ in synchronizeReminder() }
            .onChange(of: scenePhase) { phase in
                if phase == .active { synchronizeReminder() }
            }
    }

    private func synchronizeReminder() { reminders.update(enabled: notify, endsAt: endsAt) }
}
