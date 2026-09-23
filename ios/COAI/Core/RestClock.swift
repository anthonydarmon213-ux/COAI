import Foundation

struct RestClock {
    let end: Date

    /// Bound persisted picker values before multiplying to avoid overflow.
    static func pickerDuration(minutes: Int, seconds: Int) -> Int {
        max(0, min(minutes, 59)) * 60 + max(0, min(seconds, 59))
    }

    init(seconds: Int, now: Date = Date()) {
        end = now.addingTimeInterval(TimeInterval(max(0, min(seconds, 3600))))
    }

    init(end: Date) { self.end = end }

    func remaining(at now: Date = Date()) -> Int {
        let interval = end.timeIntervalSince(now)
        guard interval.isFinite else { return 0 }
        return Int(max(0, min(3600, ceil(interval))))
    }

    static func label(seconds: Int) -> String {
        let value = max(0, seconds)
        return String(format: "%d min %02d s", value / 60, value % 60)
    }
}

/// One reminder at a time. A late scheduling response must never resurrect
/// a timer that the person has paused, stopped or replaced in the meantime.
@MainActor
final class RestReminderQueue {
    typealias Schedule = (Date, @escaping () -> Bool) async -> String?
    private let clear: () -> Void
    private let schedule: Schedule
    private let report: (String?) -> Void
    private var revision = 0
    private var desiredEnd: Date?
    private var worker: Task<Void, Never>?

    init(clear: @escaping () -> Void, schedule: @escaping Schedule,
         report: @escaping (String?) -> Void = { _ in }) {
        self.clear = clear
        self.schedule = schedule
        self.report = report
    }

    func update(end: Date?) {
        revision += 1
        desiredEnd = end
        clear()
        report(nil)
        guard worker == nil else { return }
        worker = Task { await drain() }
    }

    func waitUntilIdle() async { await worker?.value }

    private func drain() async {
        while true {
            let current = revision
            if let end = desiredEnd {
                let message = await schedule(end, { self.revision == current })
                if revision == current { report(message) }
            }
            if revision == current { break }
            // An add already in flight may have completed after update's clear.
            clear()
        }
        worker = nil
    }
}
