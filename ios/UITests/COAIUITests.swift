import XCTest

final class COAIUITests: XCTestCase {
    @MainActor
    func testNativeNavigationAlignmentAndActualPageSelection() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let titles = ["Séance", "RepCount", "Repos", "Compte"]
        let tabs = titles.map { app.buttons["native-tab-" + $0] }
        XCTAssertTrue(tabs[0].waitForExistence(timeout: 15))
        for tab in tabs {
            XCTAssertTrue(tab.isHittable)
            XCTAssertGreaterThanOrEqual(tab.frame.height, 44)
            XCTAssertGreaterThanOrEqual(tab.frame.width, 44)
            XCTAssertEqual(tab.frame.minY, tabs[0].frame.minY, accuracy: 1)
            XCTAssertEqual(tab.frame.width, tabs[0].frame.width, accuracy: 1)
            XCTAssertFalse(tab.isSelected)
        }
        let session = app.webViews.buttons["Simuler la page séance"]
        XCTAssertTrue(session.waitForExistence(timeout: 10))
        session.tap()
        let selected = NSPredicate(format: "selected == true")
        expectation(for: selected, evaluatedWith: tabs[0])
        waitForExpectations(timeout: 5)
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = "Barre native alignée — séance active — données fictives"
        shot.lifetime = .keepAlways
        add(shot)
        app.webViews.buttons["Simuler la page compte"].tap()
        expectation(for: selected, evaluatedWith: tabs[3])
        waitForExpectations(timeout: 5)
        XCTAssertFalse(tabs[0].isSelected)
        app.webViews.buttons["Simuler la connexion"].tap()
        expectation(for: NSPredicate(format: "selected == false"), evaluatedWith: tabs[3])
        waitForExpectations(timeout: 5)
        tabs[2].tap()
        XCTAssertTrue(app.staticTexts["Ton temps de récupération"].waitForExistence(timeout: 5))
        app.buttons["Fermer"].tap()
        XCTAssertTrue(tabs[2].isHittable)
    }

    // Run alone on a QA simulator while the COAI host is unreachable.
    // No injected error: exercises the real WebKit navigation failure.
    @MainActor
    func testUnavailableNetworkKeepsRecoveryControlsAccessible() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let error = app.staticTexts["Page indisponible"]
        XCTAssertTrue(error.waitForExistence(timeout: 30), "Une panne ne doit pas laisser un chargement pendant une minute.")
        XCTAssertTrue(app.staticTexts["Impossible de charger COAI. Vérifie ta connexion, puis réessaie. Le minuteur reste accessible."].exists)
        XCTAssertTrue(app.buttons["Réessayer"].isHittable)
        XCTAssertGreaterThanOrEqual(app.buttons["Réessayer"].frame.height, 44)
        XCTAssertTrue(app.buttons["Repos"].isHittable)
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        screenshot.name = "Erreur réseau réelle et commandes de secours"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.buttons["Repos"].tap()
        XCTAssertTrue(app.staticTexts["Ton temps de récupération"].waitForExistence(timeout: 5))
        app.buttons["Fermer"].tap()
        XCTAssertTrue(app.buttons["Réessayer"].isHittable)
        app.buttons["Réessayer"].tap()
        XCTAssertTrue(error.waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Repos"].isHittable)
        // Network restoration and successful retry remain separate checks.
    }

    // Run alone on the dedicated alert QA device. Do not combine with the
    // refusal scenario: iOS remembers notification authorization per install.
    @MainActor
    func testRestNotificationDeliveredInBackground() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        XCTAssertTrue(app.buttons["Repos"].waitForExistence(timeout: 15))
        app.buttons["Repos"].tap()
        let stop = app.buttons["Arrêter et réinitialiser"]
        if stop.exists { stop.tap() }
        app.buttons["Choisir 0 min 30 s"].tap()
        let toggle = app.switches["M’alerter à la fin du repos"]
        reveal(toggle, in: app)
        if toggle.value as? String != "1" { toggle.tap() }
        let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let allow = system.alerts.buttons.matching(NSPredicate(format: "label IN %@", ["Autoriser", "Allow"])).firstMatch
        if allow.waitForExistence(timeout: 5) { allow.tap() }
        XCTAssertEqual(toggle.value as? String, "1", "Nécessite le simulateur dédié, avec alertes autorisées.")
        let start = app.buttons["Démarrer le repos"]
        reveal(start, in: app)
        start.tap()
        XCUIDevice.shared.press(.home)
        let alert = system.staticTexts["Repos terminé"]
        XCTAssertTrue(alert.waitForExistence(timeout: 45), "Réception réelle attendue, pas seulement programmation.")
        let visible = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: alert)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 5), .completed)
        XCTAssertTrue(system.staticTexts["Prêt pour la suite ? Retrouve ta séance dans COAI."].exists)
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        screenshot.name = "Alerte COAI reçue hors de l'app"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.activate()
        reveal(toggle, in: app)
        if toggle.value as? String == "1" { toggle.tap() }
        if stop.exists { stop.tap() }
    }

    @MainActor
    func testJSONFileSavePicker() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let export = app.webViews.buttons["Exporter les données fictives"]
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        reveal(export, in: app)
        export.tap()
        let save = app.cells["Enregistrer dans Fichiers"]
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        save.tap()
        let picker = XCUIApplication(bundleIdentifier: "com.apple.DocumentManagerUICore.SaveToFiles")
        // iOS may show Back rather than Cancel when a local folder is selected.
        let filename = picker.textFields["DOCPicker.filenameTextField"]
        let pickerOpened = filename.waitForExistence(timeout: 30)
        // Capture all system windows even when the extension cannot be queried.
        // This fixture contains no account data.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "Destination de l'export JSON fictif"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCTAssertTrue(pickerOpened)
        filename.tap()
        filename.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: "COAI-document".count))
        filename.typeText("COAI-QA-" + UUID().uuidString)
        let confirm = picker.buttons.matching(NSPredicate(format: "label IN %@", ["Enregistrer", "Save"])).firstMatch
        XCTAssertTrue(confirm.isEnabled)
        confirm.tap()
        XCTAssertTrue(filename.waitForNonExistence(timeout: 15))
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        XCTAssertTrue(export.isHittable)
    }

    @MainActor
    func testJSONExportAndMalformedRejection() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let export = app.webViews.buttons["Exporter les données fictives"]
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        reveal(export, in: app)
        export.tap()
        let file = app.otherElements["LP.CaptionBar.TopCaption"]
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        XCTAssertEqual(file.label, "COAI-document")
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Export JSON fictif dans la feuille iOS"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch.tap()
        let invalid = app.webViews.buttons["Tester le JSON invalide"]
        reveal(invalid, in: app)
        invalid.tap()
        XCTAssertTrue(app.alerts["Fichier COAI"].waitForExistence(timeout: 5))
        app.alerts.buttons["Compris"].tap()
        XCTAssertTrue(invalid.isHittable)
    }

    @MainActor
    func testNativePrivacyKeepsOptionalTrackingOff() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.buttons["Continuer avec Google"].waitForExistence(timeout: 30))
        let notice = web.staticTexts["Les outils publicitaires et de mesure d’audience facultatifs sont désactivés dans cette version iPhone."]
        XCTAssertTrue(notice.waitForExistence(timeout: 15), "Nécessite la version web déployée avec la protection iOS.")
        reveal(notice, in: app)
        XCTAssertTrue(notice.isHittable)
        XCTAssertFalse(web.buttons["Tout accepter"].exists)
        XCTAssertFalse(web.buttons["Tout refuser"].exists)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Confidentialité iOS sur la page publique COAI"
        attachment.lifetime = .keepAlways
        add(attachment)
        // UI evidence only. Network blocking is checked separately.
    }

    @MainActor
    func testSavingFictitiousImageToPhotosKeepsAppUsable() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.resetAuthorizationStatus(for: .photos)
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let link = app.webViews.buttons["Ouvrir l’image de test"]
        XCTAssertTrue(link.waitForExistence(timeout: 10))
        link.tap()
        let save = app.cells["Enregistrer l’image"]
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        save.tap()
        let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let allow = system.alerts.buttons.matching(NSPredicate(format: "label IN %@", ["Autoriser l’ajout de photos", "Autoriser", "Allow Access to Add Photos", "Allow"])).firstMatch
        XCTAssertTrue(allow.waitForExistence(timeout: 10))
        XCTAssertTrue(system.alerts.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "sans accéder aux autres photos")).firstMatch.exists)
        XCTAssertFalse(system.alerts.buttons["Autoriser l’accès complet"].exists)
        let permission = XCTAttachment(screenshot: app.screenshot())
        permission.name = "Autorisation d’ajout de la seule image fictive"
        permission.lifetime = .keepAlways
        add(permission)
        allow.tap()
        XCTAssertTrue(app.otherElements["LP.CaptionBar.TopCaption"].waitForNonExistence(timeout: 10))
        XCTAssertEqual(app.state, .runningForeground)
        XCTAssertTrue(link.isHittable)
        // Only the fixed test PNG is saved. No existing image is read or removed.
    }

    @MainActor
    func testRefusingPhotoSaveDoesNotBlockTheApp() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.resetAuthorizationStatus(for: .photos)
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let link = app.webViews.buttons["Ouvrir l’image de test"]
        XCTAssertTrue(link.waitForExistence(timeout: 10))
        link.tap()
        let save = app.cells["Enregistrer l’image"]
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        save.tap()
        let system = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let deny = system.alerts.buttons["Ne pas autoriser"]
        XCTAssertTrue(deny.waitForExistence(timeout: 10))
        deny.tap()
        XCTAssertTrue(app.otherElements["LP.CaptionBar.TopCaption"].waitForNonExistence(timeout: 10))
        XCTAssertEqual(app.state, .runningForeground)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Retour après refus de sauvegarde Photos"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCTAssertTrue(link.isHittable)
    }

    @MainActor
    func testFileDownloadOpensNativeShareAndKeepsPage() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let link = app.webViews.buttons["Ouvrir l’image de test"]
        XCTAssertTrue(link.waitForExistence(timeout: 10))
        link.tap()
        let file = app.otherElements["LP.CaptionBar.TopCaption"]
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        XCTAssertEqual(file.label, "COAI-document")
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Partage iOS d’un fichier local de test"
        attachment.lifetime = .keepAlways
        add(attachment)
        // Close the system share sheet, never choose a recipient or publish.
        let close = app.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "Fermer", "Close")).firstMatch
        XCTAssertTrue(close.exists)
        close.tap()
        XCTAssertTrue(link.waitForExistence(timeout: 5))
        app.webViews.buttons["Ouvrir le PDF de test"].tap()
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        XCTAssertTrue(app.otherElements["LP.CaptionBar.BottomCaption"].label.contains("PDF"))
        close.tap()
        let imageLink = app.webViews.buttons["Ouvrir l’image sans téléchargement"]
        reveal(imageLink, in: app)
        imageLink.tap()
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        XCTAssertTrue(app.otherElements["LP.CaptionBar.BottomCaption"].label.contains("PNG"))
        close.tap()
        reveal(app.webViews.buttons["Tester le format refusé"], in: app)
        app.webViews.buttons["Tester le format refusé"].tap()
        XCTAssertTrue(app.alerts["Fichier COAI"].waitForExistence(timeout: 5))
        app.alerts.buttons["Compris"].tap()
        XCTAssertTrue(app.webViews.buttons["Tester le format refusé"].isHittable)
    }

    @MainActor
    func testSignupFieldsAndPasswordVisibilityWithKeyboard() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.buttons["Continuer avec Google"].waitForExistence(timeout: 30))
        let signup = web.links["S'inscrire"]
        reveal(signup, in: app)
        signup.tap()
        let name = web.textFields["PRÉNOM"]
        XCTAssertTrue(name.waitForExistence(timeout: 15))
        name.tap()
        name.typeText("Test interface")
        let email = web.textFields["EMAIL"]
        reveal(email, in: app)
        email.tap()
        email.typeText("coai-ui@example.invalid")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Exemple-local-26")
        XCTAssertTrue(app.keyboards.keys.firstMatch.exists)
        XCTAssertTrue(app.buttons["Repos"].waitForNonExistence(timeout: 5))
        let show = web.switches["Afficher le mot de passe"]
        reveal(show, in: app)
        show.tap()
        XCTAssertEqual(web.textFields["MOT DE PASSE"].value as? String, "Exemple-local-26")
        web.switches["Masquer le mot de passe"].tap()
        XCTAssertTrue(password.exists)
        let submit = web.buttons["Créer mon compte gratuit →"]
        reveal(submit, in: app)
        XCTAssertTrue(submit.isEnabled)
        // Only local input. Never submit these fictional credentials to production.
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Inscription, saisie locale et bouton accessible"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

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
