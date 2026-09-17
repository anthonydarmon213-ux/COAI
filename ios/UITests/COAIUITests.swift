import XCTest

final class COAIUITests: XCTestCase {
    @MainActor
    func testNotificationRefusalDoesNotBlockRestTimer() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        XCTAssertTrue(app.buttons["Repos"].waitForExistence(timeout: 20))
        app.buttons["Repos"].tap()
        let toggle = app.switches["M’alerter à la fin du repos"]
        reveal(toggle, in: app)
        XCTAssertEqual(toggle.value as? String, "0", "Ce scénario nécessite des alertes désactivées.")
        toggle.tap()
        let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let deny = system.alerts.buttons.matching(NSPredicate(format: "label IN %@", ["Refuser", "Ne pas autoriser", "Don’t Allow", "Don't Allow"])).firstMatch
        // On subsequent runs iOS remembers the refusal and does not prompt again.
        if deny.waitForExistence(timeout: 5) { deny.tap() }
        XCTAssertTrue(app.buttons["Ouvrir les réglages de COAI"].waitForExistence(timeout: 10))
        XCTAssertEqual(toggle.value as? String, "0")
        app.buttons["Fermer"].tap()
        app.buttons["Repos"].tap()
        let stop = app.buttons["Arrêter et réinitialiser"]
        if stop.exists { stop.tap() }
        let start = app.buttons["Démarrer le repos"]
        reveal(start, in: app)
        start.tap()
        let pause = app.buttons["Mettre en pause"]
        reveal(pause, in: app, upward: false)
        XCTAssertTrue(pause.isEnabled)
        stop.tap()
    }

    @MainActor
    func testRegistrationAndPasswordRecoveryPagesAreReachable() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.buttons["Continuer avec Google"].waitForExistence(timeout: 30))
        let forgot = web.links["Mot de passe oublié ?"]
        reveal(forgot, in: app)
        forgot.tap()
        XCTAssertTrue(web.staticTexts["Mot de passe oublié"].waitForExistence(timeout: 15))
        XCTAssertTrue(web.textFields.firstMatch.exists)
        let back = app.buttons["Page précédente"]
        let enabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == true"), object: back)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed)
        back.tap()
        XCTAssertTrue(web.buttons["Continuer avec Google"].waitForExistence(timeout: 15))
        let returned = XCTAttachment(screenshot: app.screenshot())
        returned.name = "Retour depuis récupération"
        returned.lifetime = .keepAlways
        add(returned)
        let signup = web.links["S'inscrire"]
        reveal(signup, in: app)
        signup.tap()
        XCTAssertTrue(web.staticTexts["Créer mon compte gratuit"].waitForExistence(timeout: 15))
        XCTAssertTrue(web.buttons["Continuer avec Google"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Inscription accessible depuis la connexion"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        // Read-only navigation: no signup or password-reset request submitted.
    }

    @MainActor
    func testDecliningGoogleSystemPromptReturnsToUsableLogin() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let google = app.webViews.firstMatch.buttons["Continuer avec Google"]
        XCTAssertTrue(google.waitForExistence(timeout: 30))
        google.tap()
        let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let cancel = system.alerts.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "Annuler", "Cancel")).firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10))
        cancel.tap()
        XCTAssertTrue(google.waitForExistence(timeout: 15))
        XCTAssertTrue(google.isEnabled)
        XCTAssertFalse(app.alerts.firstMatch.exists)
        XCTAssertTrue(app.buttons["Repos"].isHittable)
    }

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
