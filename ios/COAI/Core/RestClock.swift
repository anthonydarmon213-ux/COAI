import Foundation

struct RestClock {
    let end: Date

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
