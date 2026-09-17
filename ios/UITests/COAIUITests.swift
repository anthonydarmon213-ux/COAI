import XCTest

final class COAIUITests: XCTestCase {
    @MainActor
    func testPublicLoginLoadsInsideAppAndKeyboardHidesBottomBar() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.buttons["Continuer avec Google"].waitForExistence(timeout: 30))
        let email = web.textFields.firstMatch
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        email.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        // First-use iOS keyboard tips can cover the keys on a fresh simulator.
        let keyboardTip = app.buttons["Continue"]
        if keyboardTip.exists { keyboardTip.tap() }
        XCTAssertTrue(app.keyboards.keys.firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Repos"].waitForNonExistence(timeout: 5))
        XCTAssertTrue(email.isHittable)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Connexion publique avec clavier iPhone"
        attachment.lifetime = .keepAlways
        add(attachment)
        // No credentials entered and no form submitted to production.
    }

    @MainActor
    func testRestTimerSurvivesDismissalAndRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let rest = app.buttons["Repos"]
        XCTAssertTrue(rest.waitForExistence(timeout: 20))
        rest.tap()
        XCTAssertTrue(app.staticTexts["Ton temps de récupération"].waitForExistence(timeout: 5))

        let stop = app.buttons["Arrêter et réinitialiser"]
        if stop.exists { stop.tap() }
        app.buttons["Choisir 2 min 00 s"].tap()
        let start = app.buttons["Démarrer le repos"]
        reveal(start, in: app)
        start.tap()
        let pause = app.buttons["Mettre en pause"]
        reveal(pause, in: app, upward: false)
        XCTAssertTrue(pause.waitForExistence(timeout: 5))
        pause.tap()
        XCTAssertTrue(app.staticTexts["En pause"].exists)
        app.buttons["Fermer"].tap()
        rest.tap()
        XCTAssertTrue(app.staticTexts["En pause"].waitForExistence(timeout: 5))

        // Real process restart, no mocked persistence or hidden test-only route.
        app.terminate()
        app.launch()
        XCTAssertTrue(rest.waitForExistence(timeout: 20))
        rest.tap()
        XCTAssertTrue(app.staticTexts["En pause"].waitForExistence(timeout: 5))
        app.buttons["Reprendre le repos"].tap()
        XCTAssertTrue(pause.waitForExistence(timeout: 5))
        stop.tap()
        XCTAssertFalse(app.staticTexts["En pause"].exists)
        XCTAssertFalse(pause.exists)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Repos après reprise et arrêt"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    @MainActor
    private func reveal(_ element: XCUIElement, in app: XCUIApplication, upward: Bool = true) {
        for _ in 0..<5 {
            if element.isHittable { return }
            if upward { app.swipeUp() } else { app.swipeDown() }
        }
        XCTAssertTrue(element.isHittable)
    }
}
