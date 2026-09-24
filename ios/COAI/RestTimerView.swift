import SwiftUI
import UserNotifications

/// One device-local reminder, no server delivery or personal/health data.
struct WeeklyReminderView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.openURL) private var openURL
    @State private var weekday = 2
    @State private var time = Calendar.current.date(from: DateComponents(hour: 18, minute: 0)) ?? Date()
    @State private var scheduled: String?
    @State private var message: String?
    @State private var busy = false
    @State private var denied = false
    @State private var revision = 0
    private let center = UNUserNotificationCenter.current()
    private let identifier = "coai.wellness.weekly"
    private let days = [(2, "Lundi"), (3, "Mardi"), (4, "Mercredi"), (5, "Jeudi"), (6, "Vendredi"), (7, "Samedi"), (1, "Dimanche")]

    var body: some View {
        Form {
            Section {
                Text("Un rendez-vous avec toi")
                    .font(.title2.bold())
                Text("Un rappel par semaine pour retrouver COAI et préparer ta prochaine séance. Facultatif, uniquement sur cet iPhone.")
                    .foregroundStyle(.secondary)
                Text(scheduled ?? "Aucun rappel programmé")
                    .accessibilityIdentifier("weekly-reminder-status")
            }
            Section("Choisir mon moment") {
                Picker("Jour", selection: $weekday) {
                    ForEach(days, id: \.0) { value in Text(value.1).tag(value.0) }
                }
                DatePicker("Heure", selection: $time, displayedComponents: .hourAndMinute)
                Button(scheduled == nil ? "Activer mon rappel" : "Enregistrer ce nouvel horaire") {
                    Task { await save() }
                }.frame(minHeight: 44).accessibilityIdentifier("weekly-reminder-save")
                if scheduled != nil {
                    Button("Désactiver le rappel", role: .destructive) {
                        revision += 1
                        center.removePendingNotificationRequests(withIdentifiers: [identifier])
                        center.removeDeliveredNotifications(withIdentifiers: [identifier])
                        scheduled = nil; message = "Rappel désactivé sur cet iPhone."
                    }.frame(minHeight: 44).accessibilityIdentifier("weekly-reminder-disable")
                }
            }.disabled(busy)
            if busy { ProgressView("Enregistrement…") }
            if let message { Section { Text(message).accessibilityIdentifier("weekly-reminder-message") } }
            if denied {
                Button("Ouvrir les réglages de COAI") {
                    if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                }.frame(minHeight: 44)
            }
            Section {
                Text("L’autorisation iPhone est demandée seulement si tu actives le rappel. Les modes Concentration et les réglages de notifications peuvent retarder ou masquer l’alerte. Aucun bilan personnel n’apparaît sur l’écran verrouillé.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Mon rappel")
        .navigationBarTitleDisplayMode(.inline)
        .tint(Color(red: 0.88, green: 0.78, blue: 0.54))
        .interactiveDismissDisabled(busy)
        .navigationBarBackButtonHidden(busy)
        .task { await refresh() }
        .onChange(of: scenePhase) { phase in
            if phase == .active && !busy { Task { await refresh() } }
        }
    }

    @MainActor private func refresh() async {
        let current = revision
        let settings = await center.notificationSettings()
        let requests = await center.pendingNotificationRequests()
        guard !busy, revision == current else { return }
        let wasDenied = denied
        denied = settings.authorizationStatus == .denied
        if let trigger = requests.first(where: { $0.identifier == identifier })?.trigger as? UNCalendarNotificationTrigger,
           let day = trigger.dateComponents.weekday, let hour = trigger.dateComponents.hour,
           let minute = trigger.dateComponents.minute,
           let plan = WeeklyReminderPlan(weekday: day, hour: hour, minute: minute) {
            weekday = plan.weekday
            time = Calendar.current.date(from: DateComponents(hour: hour, minute: minute)) ?? time
            scheduled = "Chaque \(days.first(where: { $0.0 == day })?.1.lowercased() ?? "semaine") à \(String(format: "%02d:%02d", hour, minute))"
        } else { scheduled = nil }
        if denied { message = "Les notifications sont désactivées dans les Réglages. Tu peux utiliser COAI sans rappel." }
        else if wasDenied { message = nil }
    }

    @MainActor private func save() async {
        guard !busy else { return }
        revision += 1
        busy = true; message = nil
        defer { busy = false }
        do {
            var settings = await center.notificationSettings()
            if settings.authorizationStatus == .notDetermined {
                _ = try await center.requestAuthorization(options: [.alert, .sound])
                settings = await center.notificationSettings()
            }
            guard settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional else {
                denied = true
                message = "Notifications non autorisées. Aucun nouveau rappel n’a été programmé."
                return
            }
            denied = false
            let values = Calendar.current.dateComponents([.hour, .minute], from: time)
            guard let plan = WeeklyReminderPlan(weekday: weekday, hour: values.hour ?? -1, minute: values.minute ?? -1) else {
                message = "Choisis un jour et une heure valides."; return
            }
            let content = UNMutableNotificationContent()
            content.title = "Ton rendez-vous COAI"
            content.body = "Un moment pour toi. Retrouve COAI quand tu es disponible."
            if settings.soundSetting == .enabled { content.sound = .default }
            let trigger = UNCalendarNotificationTrigger(dateMatching: plan.components, repeats: true)
            guard trigger.nextTriggerDate() != nil else { message = "Cet horaire n’a pas pu être programmé."; return }
            try await center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
            // Reusing one identifier replaces the previous schedule instead of accumulating reminders.
            scheduled = "Chaque \(days.first(where: { $0.0 == weekday })?.1.lowercased() ?? "semaine") à \(String(format: "%02d:%02d", plan.hour, plan.minute))"
            message = "Rappel enregistré sur cet iPhone."
        } catch {
            message = "Le nouvel horaire n’a pas pu être confirmé. Vérifie le rappel affiché et réessaie."
        }
    }
}

@MainActor
final class RestReminderService: ObservableObject {
    static let shared = RestReminderService()
    private static let identifier = "coai.rest.finished"
    private let center = UNUserNotificationCenter.current()
    @Published private var permissionMessage: String?
    @Published private var schedulingMessage: String?
    var message: String? { permissionMessage ?? schedulingMessage }
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
    }, report: { [weak self] in self?.schedulingMessage = $0 })

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
            permissionMessage = allowed ? nil : "Tu peux autoriser les alertes dans les Réglages de l’iPhone. Le minuteur fonctionne aussi sans notification."
            return allowed
        } catch {
            permissionMessage = "Impossible d’activer les alertes pour le moment. Tu peux continuer sans notification."
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
    private var duration: Int { RestClock.pickerDuration(minutes: minutes, seconds: seconds) }

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
