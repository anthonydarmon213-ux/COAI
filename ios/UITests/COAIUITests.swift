import XCTest

final class COAIUITests: XCTestCase {
    /// Local eligible profile and synthetic access, no pre-created programme.
    @MainActor
    func testLocalFirstProgrammeCreationSurvivesRelaunch() throws {
        try localFirstProgrammeCreation(unconfirmedResponse: false)
    }

    @MainActor
    func testLocalWorkoutReaderRotation() throws {
        XCUIDevice.shared.orientation = .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        try localFirstProgrammeCreation(unconfirmedResponse: false, rotateReader: true)
    }

    @MainActor
    func testLocalGuidedWorkoutSavedAfterRotation() throws {
        XCUIDevice.shared.orientation = .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        try localFirstProgrammeCreation(unconfirmedResponse: false, rotateReader: true, completeWorkout: true)
    }

    /// Start ios-programme-confirmation-proxy.cjs before this test.
    @MainActor
    func testLocalFirstProgrammeUnconfirmedResponseCanRetry() throws {
        try localFirstProgrammeCreation(unconfirmedResponse: true)
    }

    @MainActor
    func testLocalFirstProgrammeUnconfirmedResponseCanBeChecked() throws {
        try localFirstProgrammeCreation(unconfirmedResponse: true, checkInsteadOfRetry: true)
    }

    @MainActor
    private func localFirstProgrammeCreation(unconfirmedResponse: Bool, checkInsteadOfRetry: Bool = false, rotateReader: Bool = false, completeWorkout: Bool = false) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        XCTAssertTrue(login.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Séance"].tap()
        let create = web.buttons["Créer mon programme complet"]
        XCTAssertTrue(create.waitForExistence(timeout: 20))
        XCTAssertFalse(web.buttons["Ajustements avancés du programme"].exists)
        revealWebControl(create, in: app)
        let before = XCTAttachment(screenshot: app.screenshot())
        before.name = "Premier programme — accès à la création"
        before.lifetime = .keepAlways; add(before)
        create.tap()
        if unconfirmedResponse {
            let error = web.staticTexts["La création n’a pas pu être confirmée. Consulte ton programme avant de réessayer."]
            XCTAssertTrue(error.waitForExistence(timeout: 25))
            XCTAssertTrue(create.isEnabled)
            XCTAssertFalse(web.links["Accéder à ma séance →"].exists)
            revealWebControl(error, in: app)
            let failure = XCTAttachment(screenshot: app.screenshot())
            failure.name = "Premier programme — confirmation perdue, reprise disponible"
            failure.lifetime = .keepAlways; add(failure)
            let recovery = checkInsteadOfRetry ? web.buttons["Vérifier mon programme"] : create
            revealWebControl(recovery, in: app); recovery.tap()
        }
        XCTAssertTrue(create.waitForNonExistence(timeout: 30))
        XCTAssertTrue(web.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "Ta première séance")).firstMatch.waitForExistence(timeout: 20))
        let start = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Démarrer la séance")).firstMatch
        XCTAssertTrue(start.waitForExistence(timeout: 15))
        revealWebControl(start, in: app); start.tap()
        XCTAssertTrue(web.buttons["Fermer"].waitForExistence(timeout: 10))
        if rotateReader {
            for orientation in [UIDeviceOrientation.landscapeLeft, .portrait] {
                XCUIDevice.shared.orientation = orientation
                let rotated = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                    let frame = web.frame
                    return orientation == .landscapeLeft ? frame.width > frame.height : frame.height > frame.width
                }, object: nil)
                XCTAssertEqual(XCTWaiter.wait(for: [rotated], timeout: 10), .completed)
                let settled = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                    let frame = app.frame
                    return orientation == .landscapeLeft ? frame.width > frame.height : frame.height > frame.width
                }, object: nil)
                XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 10), .completed)
                let shot = XCTAttachment(screenshot: app.screenshot())
                shot.name = "Lecteur séance — orientation \(orientation.rawValue)"
                shot.lifetime = .keepAlways; add(shot)
                let close = web.buttons["Fermer"]
                XCTAssertTrue(close.isHittable)
                XCTAssertTrue(web.frame.contains(close.frame), "Fermer doit rester dans la zone visible")
                let next = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "fait")).firstMatch
                XCTAssertTrue(next.exists, "La commande pour avancer doit être disponible")
                revealWebControl(next, in: app)
                let reachable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: next)
                XCTAssertEqual(XCTWaiter.wait(for: [reachable], timeout: 10), .completed)
                XCTAssertTrue(web.frame.contains(next.frame), "La commande pour avancer doit rester visible")
                if orientation == .landscapeLeft { next.tap() }
                revealWebControl(close, in: app)
                XCTAssertTrue(close.isHittable)
                let adjustment = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Ajuster")).firstMatch
                revealWebControl(adjustment, in: app); adjustment.tap()
                let explanation = web.staticTexts["Valable pour aujourd'hui seulement — ton programme n'est pas modifié."]
                XCTAssertTrue(explanation.waitForExistence(timeout: 5))
                revealWebControl(explanation, in: app)
                XCTAssertTrue(web.frame.contains(explanation.frame), "Les conditions de l'ajustement doivent rester lisibles")
                let dismiss = web.buttons.matching(NSPredicate(format: "label == %@", "Fermer")).element(boundBy: 1)
                for _ in 0..<8 {
                    if dismiss.isHittable { break }
                    let low = web.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
                    let high = web.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
                    low.press(forDuration: 0.05, thenDragTo: high)
                }
                XCTAssertTrue(dismiss.isHittable); dismiss.tap()
                XCTAssertTrue(explanation.waitForNonExistence(timeout: 5))
                let reader = web.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Séance guidée :")).firstMatch
                let advice = reader.buttons["💡 Consigne du coach"]
                XCTAssertTrue(advice.waitForExistence(timeout: 5))
                if orientation == .portrait {
                    // WebKit may call a clipped child hittable behind the fixed footer.
                    // Scroll inside the reader's content, not on the fixed actions.
                    let footer = reader.buttons["🎙️ Poser une question au coach"]
                    for _ in 0..<12 {
                        let bottom = footer.frame.minY - 24
                        if advice.frame.minY > web.frame.minY + 145 && advice.frame.maxY < bottom { break }
                        let origin = app.coordinate(withNormalizedOffset: .zero)
                        let low = origin.withOffset(CGVector(dx: web.frame.maxX - 32, dy: bottom - 8))
                        let high = origin.withOffset(CGVector(dx: web.frame.maxX - 32, dy: web.frame.minY + 155))
                        low.press(forDuration: 0.05, thenDragTo: high)
                    }
                    XCTAssertLessThan(advice.frame.maxY, footer.frame.minY - 24)
                } else { revealWebControl(advice, in: app) }
                advice.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                let understood = web.buttons["Compris"]
                XCTAssertTrue(understood.waitForExistence(timeout: 5))
                XCTAssertTrue(understood.isHittable)
                XCTAssertTrue(web.frame.contains(understood.frame))
                understood.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                XCTAssertTrue(understood.waitForNonExistence(timeout: 5))
                let afterAdvice = XCTAttachment(screenshot: app.screenshot())
                afterAdvice.name = "Après fermeture de la consigne — \(orientation.rawValue)"
                afterAdvice.lifetime = .keepAlways; add(afterAdvice)
                if orientation == .portrait {
                    let repetitions = web.textFields.matching(NSPredicate(format: "label ==[c] %@", "Reps faites")).firstMatch
                    XCTAssertTrue(repetitions.waitForExistence(timeout: 5))
                    let footer = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Poser une question au coach")).firstMatch
                    for _ in 0..<12 {
                        let top = web.frame.minY + 145
                        let bottom = footer.frame.minY - 24
                        if repetitions.frame.minY > top && repetitions.frame.maxY < bottom { break }
                        let origin = app.coordinate(withNormalizedOffset: .zero)
                        let high = origin.withOffset(CGVector(dx: web.frame.maxX - 32, dy: top + 10))
                        let low = origin.withOffset(CGVector(dx: web.frame.maxX - 32, dy: bottom - 8))
                        if repetitions.frame.minY <= top {
                            high.press(forDuration: 0.05, thenDragTo: low)
                        } else {
                            low.press(forDuration: 0.05, thenDragTo: high)
                        }
                    }
                    XCTAssertGreaterThan(repetitions.frame.minY, web.frame.minY + 145)
                    XCTAssertLessThan(repetitions.frame.maxY, footer.frame.minY - 24)
                    repetitions.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
                    XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
                    let inputVisible = NSPredicate { _, _ in
                        repetitions.exists && repetitions.frame.minY >= web.frame.minY
                            && repetitions.frame.maxY < app.keyboards.firstMatch.frame.minY - 40
                    }
                    expectation(for: inputVisible, evaluatedWith: nil)
                    waitForExpectations(timeout: 5)
                    let keyboardProof = XCTAttachment(screenshot: app.screenshot())
                    keyboardProof.name = "Séance guidée — champ visible avec clavier"
                    keyboardProof.lifetime = .keepAlways; add(keyboardProof)
                    repetitions.typeText("10")
                    let done = app.toolbars.buttons["OK"]
                    XCTAssertTrue(done.waitForExistence(timeout: 5)); done.tap()
                    XCTAssertEqual(repetitions.value as? String, "10")
                }
                revealWebControl(close, in: app)
            }
        }
        let adjust = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Ajuster")).firstMatch
        XCTAssertTrue(adjust.waitForExistence(timeout: 5))
        XCTAssertTrue(adjust.isHittable)
        XCTAssertGreaterThanOrEqual(adjust.frame.height, 44)
        XCTAssertGreaterThanOrEqual(adjust.frame.minX, web.frame.minX + 8)
        XCTAssertLessThanOrEqual(adjust.frame.maxX, web.frame.maxX - 8,
                                 "Workout controls must not overflow the small iPhone screen")
        let player = XCTAttachment(screenshot: app.screenshot())
        player.name = "Premier programme — lecteur de séance ouvert"
        player.lifetime = .keepAlways; add(player)
        adjust.tap()
        XCTAssertTrue(web.staticTexts["Valable pour aujourd'hui seulement — ton programme n'est pas modifié."].waitForExistence(timeout: 5))
        if completeWorkout {
            web.buttons.matching(NSPredicate(format: "label == %@", "Fermer")).element(boundBy: 1).tap()
            for _ in 0..<40 {
                let finish = web.buttons["Terminer la séance ✓"]
                if finish.exists {
                    revealWebControl(finish, in: app); finish.tap()
                    break
                }
                let advance = web.buttons.matching(NSPredicate(format: "label IN %@", ["C'est fait ✓", "Passer le repos →"])).firstMatch
                XCTAssertTrue(advance.waitForExistence(timeout: 5))
                revealWebControl(advance, in: app); advance.tap()
            }
            XCTAssertTrue(web.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "Séance terminée")).firstMatch.waitForExistence(timeout: 20))
            XCTAssertFalse(web.buttons["Réessayer l'enregistrement"].exists)
            let heading = web.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "Séance terminée")).firstMatch
            revealWebControl(heading, in: app)
            XCTAssertTrue(web.frame.contains(heading.frame), "Le titre du bilan doit être entièrement visible")
            let topSummary = XCTAttachment(screenshot: app.screenshot())
            topSummary.name = "Séance guidée — haut du bilan"
            topSummary.lifetime = .keepAlways; add(topSummary)
            XCTAssertFalse(web.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "poids du corps")).firstMatch.exists)
            let doneWorkout = web.buttons["Terminer"]
            revealWebControl(doneWorkout, in: app)
            XCTAssertTrue(doneWorkout.isHittable)
            let saved = XCTAttachment(screenshot: app.screenshot())
            saved.name = "Séance guidée — bilan après enregistrement"
            saved.lifetime = .keepAlways; add(saved)
        }
        let session = web.links["Accéder à ma séance →"]
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["native-tab-Séance"].waitForExistence(timeout: 15))
        app.buttons["native-tab-Séance"].tap()
        XCTAssertTrue(session.waitForExistence(timeout: 30))
        XCTAssertFalse(create.exists)
        revealWebControl(session, in: app)
        XCTAssertTrue(session.isHittable)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Premier programme — séance accessible après relance"
        proof.lifetime = .keepAlways; add(proof)
        if completeWorkout {
            app.buttons["native-tab-Explorer"].tap()
            let repcount = app.buttons["explore-/suivi/repcount"]
            reveal(repcount, in: app); repcount.tap()
            XCTAssertTrue(web.staticTexts["Note ta série."].waitForExistence(timeout: 20))
            let history = web.buttons["Reprendre une séance passée"]
            XCTAssertTrue(history.waitForExistence(timeout: 15))
            revealWebControl(history, in: app); history.tap()
            let exercises = web.staticTexts.matching(NSPredicate(format: "label CONTAINS %@ AND label CONTAINS %@", "Squat barre", "Crunch")).firstMatch
            XCTAssertTrue(exercises.waitForExistence(timeout: 10))
            revealWebControl(exercises, in: app)
            let historyProof = XCTAttachment(screenshot: app.screenshot())
            historyProof.name = "Séance guidée — historique après relance"
            historyProof.lifetime = .keepAlways; add(historyProof)
        }
    }

    @MainActor
    func testLocalJournalPreservesTimedExerciseMetric() throws {
        try localJournal(waitForLoginDestination: true)
    }

    @MainActor
    func testLocalJournalImmediatelyAfterLogin() throws {
        try localJournal(waitForLoginDestination: false)
    }

    @MainActor
    func testLocalJournalMalformedHistoryRemainsReadable() throws {
        try localJournal(waitForLoginDestination: true, expectIncomplete: true)
    }

    @MainActor
    private func localJournal(waitForLoginDestination: Bool, expectIncomplete: Bool = false) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        XCTAssertTrue(login.waitForNonExistence(timeout: 30))
        if waitForLoginDestination {
            XCTAssertTrue(web.links["Accéder à ma séance →"].waitForExistence(timeout: 30),
                          "Attendre la destination de connexion avant la navigation vers le journal")
        }
        app.buttons["native-tab-Explorer"].tap()
        let journal = app.buttons["explore-/suivi/seances"]
        XCTAssertTrue(app.navigationBars["Explorer"].waitForExistence(timeout: 5))
        for _ in 0..<20 {
            if journal.exists && journal.isHittable { break }
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let high = origin.withOffset(CGVector(dx: app.frame.midX, dy: 250))
            let low = origin.withOffset(CGVector(dx: app.frame.midX, dy: 370))
            if journal.exists && journal.frame.minY < 150 {
                high.press(forDuration: 0.05, thenDragTo: low)
            } else {
                low.press(forDuration: 0.05, thenDragTo: high)
            }
        }
        XCTAssertTrue(journal.isHittable); journal.tap()
        let history = web.links["Voir mon historique"]
        XCTAssertTrue(history.waitForExistence(timeout: 20))
        revealWebControl(history, in: app); history.tap()
        if expectIncomplete {
            let warning = web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Certains détails de cette séance sont incomplets")).firstMatch
            XCTAssertTrue(warning.waitForExistence(timeout: 10))
            revealWebControl(warning, in: app)
            let proof = XCTAttachment(screenshot: app.screenshot())
            proof.name = "Journal — données anciennes incomplètes signalées"
            proof.lifetime = .keepAlways; add(proof)
        }
        for label in ["45 s de maintien", "10 × 20 kg"] {
            let metric = web.staticTexts[label]
            XCTAssertTrue(metric.waitForExistence(timeout: 10))
            revealWebControl(metric, in: app)
            XCTAssertTrue(web.frame.contains(metric.frame))
        }
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Journal — maintien et répétitions distincts"
        capture.lifetime = .keepAlways; add(capture)
    }

    /// Real local login, two exercises, durable draft, one persisted workout.
    @MainActor
    func testLocalRepCountDraftAndSavedWorkoutSurviveRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        XCTAssertTrue(login.waitForNonExistence(timeout: 30))
        func openRepCount() {
            XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 10))
            app.buttons["native-tab-Explorer"].tap()
            let target = app.buttons["explore-/suivi/repcount"]
            reveal(target, in: app); target.tap()
            XCTAssertTrue(web.staticTexts["Note ta série."].waitForExistence(timeout: 20))
        }
        openRepCount()
        let exercise = web.textFields.matching(NSPredicate(format: "label ==[c] %@", "Exercice")).firstMatch
        XCTAssertTrue(exercise.waitForExistence(timeout: 10))
        func chooseExercise(_ name: String) {
            revealWebControl(exercise, in: app); exercise.tap()
            let suggestion = app.buttons[name]
            XCTAssertTrue(suggestion.waitForExistence(timeout: 5))
            for _ in 0..<12 {
                if suggestion.isHittable { break }
                // UIKit reports the full list height, including its clipped part.
                // Scroll inside the visible popover, not through the keyboard.
                let list = app.collectionViews.firstMatch
                let origin = list.coordinate(withNormalizedOffset: .zero)
                let high = origin.withOffset(CGVector(dx: 100, dy: 70))
                let low = origin.withOffset(CGVector(dx: 100, dy: 170))
                if suggestion.exists && suggestion.frame.midY < list.frame.minY + 70 {
                    high.press(forDuration: 0.05, thenDragTo: low)
                } else {
                    low.press(forDuration: 0.05, thenDragTo: high)
                }
            }
            XCTAssertTrue(suggestion.isHittable); suggestion.tap()
            let done = app.toolbars.buttons["OK"]
            if done.waitForExistence(timeout: 3) { done.tap() }
            XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
            XCTAssertEqual(exercise.value as? String, name)
        }
        chooseExercise("Développé couché (barre)")
        let validate = web.buttons["Valider la série"]
        revealWebControl(validate, in: app); validate.tap()
        let duplicate = web.buttons["Valider une série identique à la dernière"]
        revealWebControl(duplicate, in: app); duplicate.tap()
        let next = web.buttons["Ajouter un autre exercice →"]
        revealWebControl(next, in: app); next.tap()
        XCTAssertTrue(exercise.isEnabled)
        chooseExercise("Développé couché haltères")
        let charge = web.textFields["CHARGE"]
        revealWebControl(charge, in: app); charge.tap(); charge.typeText("12,5")
        let chargeDone = app.toolbars.buttons["OK"]
        XCTAssertTrue(chargeDone.waitForExistence(timeout: 3)); chargeDone.tap()
        XCTAssertEqual(charge.value as? String, "12.5")
        revealWebControl(validate, in: app); validate.tap()
        let notes = web.textViews["Notes de séance (facultatif)"]
        revealWebControl(notes, in: app); notes.tap(); notes.typeText("Test local RepCount : deux mouvements")
        let done = app.toolbars.buttons["OK"]
        XCTAssertTrue(done.waitForExistence(timeout: 3)); done.tap()
        // Navigate away first: do not confuse a still-alive DOM with persisted data.
        let finish = web.buttons["Terminer et enregistrer la séance"]
        revealWebControl(finish, in: app)
        app.terminate(); app.launch(); openRepCount()
        XCTAssertTrue(web.staticTexts["Développé couché (barre)"].waitForExistence(timeout: 15))
        XCTAssertEqual(exercise.value as? String, "Développé couché haltères")
        XCTAssertEqual(notes.value as? String, "Test local RepCount : deux mouvements")
        revealWebControl(finish, in: app); finish.tap()
        XCTAssertTrue(web.staticTexts["Séance enregistrée ✓"].waitForExistence(timeout: 20))
        XCTAssertFalse(finish.exists)
        app.terminate(); app.launch(); openRepCount()
        XCTAssertFalse(finish.exists)
        let history = web.buttons["Reprendre une séance passée"]
        XCTAssertTrue(history.waitForExistence(timeout: 15))
        revealWebControl(history, in: app); history.tap()
        let routine = web.buttons["Reprendre ces exercices"].firstMatch
        XCTAssertTrue(routine.waitForExistence(timeout: 15))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "RepCount local — séance retrouvée après relance"
        proof.lifetime = .keepAlways; add(proof)
    }

    /// Local Auth + local SMTP only. The recovery email is opened in Safari,
    /// a different cookie store from the app that requested it.
    @MainActor
    func testLocalPasswordRecoveryAcrossSafariAndApp() async throws {
        guard #available(iOS 16.4, *) else { throw XCTSkip("Safari URL automation requires iOS 16.4+") }
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let forgotten = web.links["Mot de passe oublié ?"]
        XCTAssertTrue(forgotten.waitForExistence(timeout: 30))
        reveal(forgotten, in: app); forgotten.tap()
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 15))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let request = web.buttons["Envoyer le lien de réinitialisation"]
        reveal(request, in: app); request.tap()
        XCTAssertTrue(web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Si un compte existe avec cette adresse")).firstMatch.waitForExistence(timeout: 20))

        // Read only the known disposable address from the local mail sink.
        let (listData, _) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:54324/api/v1/messages")!)
        let list = try XCTUnwrap(JSONSerialization.jsonObject(with: listData) as? [String: Any])
        let messages = try XCTUnwrap(list["messages"] as? [[String: Any]])
        let matching = messages.filter { item in
            (item["To"] as? [[String: Any]])?.contains { $0["Address"] as? String == "coai-ui-20260924-http@example.test" } == true
        }
        XCTAssertEqual(matching.count, 1)
        let identifier = try XCTUnwrap(matching.first?["ID"] as? String)
        XCTAssertNotNil(identifier.range(of: "^[A-Za-z0-9_-]{1,100}$", options: .regularExpression))
        let (mailData, _) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:54324/api/v1/message/" + identifier)!)
        let mail = try XCTUnwrap(JSONSerialization.jsonObject(with: mailData) as? [String: Any])
        let html = try XCTUnwrap(mail["HTML"] as? String)
        let expression = try NSRegularExpression(pattern: "href=\"([^\"]+)\"")
        let links = expression.matches(in: html, range: NSRange(html.startIndex..., in: html)).compactMap { match -> URL? in
            guard let range = Range(match.range(at: 1), in: html) else { return nil }
            return URL(string: String(html[range]).replacingOccurrences(of: "&amp;", with: "&"))
        }
        let recovery = try XCTUnwrap(links.first { $0.path == "/auth/v1/verify" })
        XCTAssertEqual(recovery.scheme, "http")
        XCTAssertTrue(["localhost", "127.0.0.1"].contains(recovery.host ?? ""))
        XCTAssertEqual(recovery.port, 54321)
        XCTAssertEqual(URLComponents(url: recovery, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "type" }?.value, "recovery")
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        safari.open(recovery)
        safari.activate()
        guard safari.wait(for: .runningForeground, timeout: 10) else {
            XCTFail("Safari must be foreground before entering the local recovery password")
            return
        }
        let browser = safari.webViews.firstMatch
        let newPassword = browser.secureTextFields["NOUVEAU MOT DE PASSE"]
        guard newPassword.waitForExistence(timeout: 30) else {
            XCTFail("The local recovery link did not show the password form")
            return
        }
        newPassword.tap()
        // iOS presents its strong-password offer outside the web view.
        // Decline only that identified system sheet for this disposable fixture;
        // keep the actual product's password-manager support enabled.
        let closePasswordOffer = safari.buttons["xmark"]
        if closePasswordOffer.waitForExistence(timeout: 3) &&
            safari.buttons["GenerateStrongPasswordButton"].exists {
            closePasswordOffer.tap()
        }
        guard safari.keyboards.firstMatch.waitForExistence(timeout: 10) else {
            XCTFail("Safari did not open the keyboard for the recovery field")
            return
        }
        newPassword.typeText("Coai-recovered-local-1001!")
        let confirmation = browser.secureTextFields["CONFIRMER LE MOT DE PASSE"]
        reveal(confirmation, in: safari); confirmation.tap(); confirmation.typeText("Coai-recovered-local-1001!")
        let save = browser.buttons["Mettre à jour le mot de passe"]
        reveal(save, in: safari); save.tap()
        guard browser.buttons["Se connecter"].waitForExistence(timeout: 30) else {
            XCTFail("Password recovery did not return to sign-in")
            return
        }
        // Do not store disposable fixture credentials in the simulator keychain.
        let later = safari.buttons["Plus tard"]
        if later.waitForExistence(timeout: 3) { later.tap() }
        let proof = XCTAttachment(screenshot: safari.screenshot())
        proof.name = "Récupération locale — mot de passe changé dans Safari"
        proof.lifetime = .keepAlways; add(proof)

        safari.open(recovery)
        let expired = browser.staticTexts["Ce lien est invalide ou a expiré. Demande un nouveau lien de réinitialisation."]
        guard expired.waitForExistence(timeout: 20) else {
            XCTFail("An already-used recovery link must not reopen the password form")
            return
        }
        XCTAssertFalse(browser.secureTextFields["NOUVEAU MOT DE PASSE"].exists)
        let anotherLink = browser.links["Demander un nouveau lien"]
        XCTAssertTrue(anotherLink.isHittable)
        anotherLink.tap()
        guard browser.buttons["Envoyer le lien de réinitialisation"].waitForExistence(timeout: 15) else {
            XCTFail("An expired recovery link must offer a usable retry route")
            return
        }

        app.terminate(); app.launch()
        XCTAssertTrue(email.waitForExistence(timeout: 20))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-recovered-local-1001!")
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        XCTAssertTrue(login.waitForNonExistence(timeout: 30))
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 10))
        app.buttons["native-tab-Explorer"].tap()
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app, upward: false); settings.tap()
        XCTAssertTrue(web.buttons["Exporter mes données"].waitForExistence(timeout: 30))
        XCTAssertFalse(web.buttons["Se connecter"].exists)
    }

    /// Physical device, existing session: no photo selection, upload or measurement save.
    @MainActor
    func testPhysicalPhotoPickerCancellationKeepsFormUsable() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let explore = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explore.waitForExistence(timeout: 15)); explore.tap()
        let measures = app.buttons["explore-/suivi/mesures"]
        reveal(measures, in: app); measures.tap()
        let web = app.webViews.firstMatch
        XCTAssertTrue(web.staticTexts["Mesures corporelles."].waitForExistence(timeout: 30))
        let weight = web.textFields.matching(NSPredicate(format: "label ==[c] %@", "Poids (kg)")).firstMatch
        XCTAssertTrue(weight.waitForExistence(timeout: 10))
        let originalWeight = weight.value as? String
        let details = web.buttons["Ajouter une analyse complète ou une photo"]
        revealWebControl(details, in: app); details.tap()
        let file = web.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "photo de progression")).firstMatch
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        revealWebControl(file, in: app); file.tap()
        let library = app.buttons["Photothèque"]
        XCTAssertTrue(library.waitForExistence(timeout: 10)); library.tap()
        // Do not inspect or attach screenshots of the personal photo library.
        let cancel = app.buttons.matching(NSPredicate(format: "label IN %@", ["Annuler", "Cancel"])).firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertTrue(cancel.waitForNonExistence(timeout: 10))
        XCTAssertEqual(weight.value as? String, originalWeight)
        XCTAssertFalse(web.staticTexts["La photo sera optimisée automatiquement avant l’envoi."].exists)
        let save = web.buttons["Ajouter la mesure"]
        revealWebControl(save, in: app)
        XCTAssertTrue(save.isEnabled && save.isHittable)
        // Deliberately do NOT submit the form.
        app.buttons["native-tab-Séance"].tap()
        XCTAssertTrue(explore.isHittable)
    }

    /// Real local Auth rejection followed by correction; disposable account only.
    @MainActor
    func testLocalIncorrectPasswordCanBeCorrectedWithoutRestart() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        let incorrect = "Wrong-local-password-only!"
        reveal(password, in: app); password.tap(); password.typeText(incorrect)
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        let error = web.staticTexts["Connexion impossible. Vérifie ton email et ton mot de passe, puis réessaie."]
        XCTAssertTrue(error.waitForExistence(timeout: 20))
        XCTAssertEqual(email.value as? String, "coai-ui-20260924-http@example.test")
        XCTAssertTrue(login.isEnabled)
        let show = web.switches["Afficher le mot de passe"]
        reveal(show, in: app); show.tap()
        let visiblePassword = web.textFields["MOT DE PASSE"]
        XCTAssertEqual(visiblePassword.value as? String, incorrect)
        reveal(visiblePassword, in: app)
        // Tap after the visible text: a centre tap can place the caret mid-password.
        visiblePassword.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        visiblePassword.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: incorrect.count))
        XCTAssertEqual(visiblePassword.value as? String, "")
        visiblePassword.typeText("Coai-local-UI-0924-only!")
        XCTAssertEqual(visiblePassword.value as? String, "Coai-local-UI-0924-only!")
        let hide = web.switches["Masquer le mot de passe"]
        reveal(hide, in: app); hide.tap()
        reveal(login, in: app); login.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Explorer"].tap()
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app, upward: false); settings.tap()
        XCTAssertTrue(web.buttons["Exporter mes données"].waitForExistence(timeout: 30))
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 15))
        app.buttons["native-tab-Explorer"].tap()
        reveal(settings, in: app, upward: false); settings.tap()
        XCTAssertTrue(app.webViews.buttons["Exporter mes données"].waitForExistence(timeout: 30))
        // Account settings also contain an EMAIL field; reject the login form instead.
        XCTAssertFalse(app.webViews.buttons["Se connecter"].exists)
    }

    /// Disposable registered local account only; never writes to production.
    @MainActor
    func testLocalMeasurementPersistsAfterRelaunch() throws {
        try runLocalMeasurementPersistence(lostResponse: false)
    }

    /// Local proxy drops the first measurement response AFTER the server saves it.
    @MainActor
    func testLocalMeasurementRetriesLostResponseWithoutDuplicate() throws {
        try runLocalMeasurementPersistence(lostResponse: true)
    }

    @MainActor
    func testLocalMeasurementRetriesUnreadableConfirmation() throws {
        try runLocalMeasurementPersistence(lostResponse: true, htmlFailure: true)
    }

    @MainActor
    func testLocalPhotoPickerCancellationPreservesMeasurement() throws {
        try runLocalMeasurementPersistence(lostResponse: false, cancelPhoto: true)
    }

    /// Requires the synthetic turquoise fixture imported into the dedicated simulator.
    @MainActor
    func testLocalProgressPhotoPersistsAfterRelaunch() throws {
        try runLocalMeasurementPersistence(lostResponse: false, selectPhoto: true)
    }

    /// Synthetic-cobalt HEIC must be seeded in the QA simulator's local Files provider.
    @MainActor
    func testLocalHEICFilePersistsAfterRelaunch() throws {
        try runLocalMeasurementPersistence(lostResponse: false, selectHEICFile: true)
    }

    @MainActor
    private func runLocalMeasurementPersistence(lostResponse: Bool, cancelPhoto: Bool = false, selectPhoto: Bool = false, htmlFailure: Bool = false, selectHEICFile: Bool = false) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let login = web.buttons["Se connecter"]
        reveal(login, in: app); login.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        func openMeasures() {
            let explore = app.buttons["native-tab-Explorer"]
            XCTAssertTrue(explore.waitForExistence(timeout: 15)); explore.tap()
            let measures = app.buttons["explore-/suivi/mesures"]
            reveal(measures, in: app); measures.tap()
            XCTAssertTrue(web.staticTexts["Mesures corporelles."].waitForExistence(timeout: 20))
        }
        openMeasures()
        let weight = web.textFields.matching(NSPredicate(format: "label ==[c] %@", "Poids (kg)")).firstMatch
        XCTAssertTrue(weight.waitForExistence(timeout: 10))
        // Short, directional drags avoid jumping past the field on an SE screen.
        for _ in 0..<12 {
            if weight.isHittable { break }
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let high = origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: 220))
            let low = origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: 380))
            if weight.frame.minY < web.frame.minY { high.press(forDuration: 0.05, thenDragTo: low) }
            else { low.press(forDuration: 0.05, thenDragTo: high) }
        }
        XCTAssertTrue(weight.isHittable)
        weight.tap(); weight.typeText("75")
        if cancelPhoto || selectPhoto || selectHEICFile {
            // SE screenshot confirms WebKit's keyboard accessory checkmark here.
            // Dismiss the keyboard as a user would before opening the photo menu.
            let keyboard = app.keyboards.firstMatch
            XCTAssertTrue(keyboard.exists)
            app.coordinate(withNormalizedOffset: .zero)
                .withOffset(CGVector(dx: app.frame.width * 0.89, dy: keyboard.frame.minY - 50)).tap()
            XCTAssertTrue(keyboard.waitForNonExistence(timeout: 5))
            let details = web.buttons["Ajouter une analyse complète ou une photo"]
            revealWebControl(details, in: app); details.tap()
            let file = web.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "photo de progression")).firstMatch
            XCTAssertTrue(file.waitForExistence(timeout: 10))
            revealWebControl(file, in: app); file.tap()
            if selectHEICFile {
                let chooseFile = app.buttons["Choisir le fichier"]
                XCTAssertTrue(chooseFile.waitForExistence(timeout: 10)); chooseFile.tap()
                let browse = app.tabBars.buttons["Explorer"]
                XCTAssertTrue(browse.waitForExistence(timeout: 10)); browse.tap()
                let localFiles = app.staticTexts["Sur mon iPhone"]
                XCTAssertTrue(localFiles.waitForExistence(timeout: 10)); localFiles.tap()
                let fixture = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "synthetic-cobalt")).firstMatch
                XCTAssertTrue(fixture.waitForExistence(timeout: 15))
                XCTAssertTrue(fixture.isEnabled && fixture.isHittable)
                fixture.tap()
                XCTAssertTrue(web.staticTexts["La photo sera optimisée automatiquement avant l’envoi."].waitForExistence(timeout: 10))
            } else {
                let library = app.buttons["Photothèque"]
                XCTAssertTrue(library.waitForExistence(timeout: 10)); library.tap()
                let cancel = app.buttons.matching(NSPredicate(format: "label IN %@", ["Annuler", "Cancel"])).firstMatch
                XCTAssertTrue(cancel.waitForExistence(timeout: 10))
                let pickerProof = XCTAttachment(screenshot: app.screenshot())
                pickerProof.name = "Sélecteur photo système"
                pickerProof.lifetime = .keepAlways; add(pickerProof)
                if selectPhoto {
                    let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
                    XCTAssertTrue(photo.waitForExistence(timeout: 10))
                    // Photos exposes the visible thumbnail as non-hittable on iOS 26.5.
                    // Use its observed frame, not a guessed screen coordinate.
                    app.coordinate(withNormalizedOffset: .zero)
                        .withOffset(CGVector(dx: photo.frame.midX, dy: photo.frame.midY)).tap()
                    let done = app.buttons["PUOneUpBarButtonItemIdentifierAssetExplorerReviewScreenDone"]
                    XCTAssertTrue(done.waitForExistence(timeout: 10)); done.tap()
                    XCTAssertTrue(done.waitForNonExistence(timeout: 10))
                } else {
                    cancel.tap()
                }
            }
            XCTAssertEqual(weight.value as? String, "75")
        }
        let save = web.buttons["Ajouter la mesure"]
        reveal(save, in: app)
        XCTAssertTrue(save.isHittable)
        let keyboardProof = XCTAttachment(screenshot: app.screenshot())
        keyboardProof.name = "Mesures — saisie et bouton sur petit écran"
        keyboardProof.lifetime = .keepAlways; add(keyboardProof)
        save.tap()
        if lostResponse {
            let message = htmlFailure
                ? "L’enregistrement n’a pas pu être confirmé. Tes valeurs sont conservées : réessaie dans un instant."
                : "Connexion interrompue. Tes valeurs sont conservées : réessaie dans un instant."
            let failure = web.staticTexts[message]
            XCTAssertTrue(failure.waitForExistence(timeout: 20))
            XCTAssertEqual(weight.value as? String, "75")
            let failedProof = XCTAttachment(screenshot: app.screenshot())
            failedProof.name = "Confirmation perdue — saisie conservée"
            failedProof.lifetime = .keepAlways; add(failedProof)
            reveal(save, in: app); save.tap()
        }
        let history = web.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "75 kg")).firstMatch
        XCTAssertTrue(history.waitForExistence(timeout: 20))
        app.terminate(); app.launch()
        openMeasures()
        XCTAssertTrue(history.waitForExistence(timeout: 20))
        reveal(history, in: app)
        let persisted = XCTAttachment(screenshot: app.screenshot())
        persisted.name = "Mesure conservée après relance"
        persisted.lifetime = .keepAlways; add(persisted)
    }

    /// Read-only live catalogue check; does not start a workout or send any data.
    @MainActor
    func testPhysicalCatalogueExcludesMismatchedRowing() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let explore = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explore.waitForExistence(timeout: 15)); explore.tap()
        let catalogue = app.buttons["explore-/programme/exercices"]
        reveal(catalogue, in: app); catalogue.tap()
        let web = app.webViews.firstMatch
        let search = web.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 30))
        reveal(search, in: app); search.tap(); search.typeText("Rowing haltère unilatéral\n")
        XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Catalogue réel — contrôle du rowing incohérent"
        proof.lifetime = .keepAlways; add(proof)
        XCTAssertTrue(web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "0 exercice correspondant.")).firstMatch.waitForExistence(timeout: 10))
        let clear = web.buttons["Effacer la recherche"]
        reveal(clear, in: app); clear.tap()
        reveal(search, in: app); search.tap(); search.typeText("Gainage planche\n")
        XCTAssertTrue(web.staticTexts["Gainage planche"].waitForExistence(timeout: 10))
        XCTAssertTrue(web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "1 exercice correspondant.")).firstMatch.exists)
        app.buttons["native-tab-Séance"].tap()
    }

    /// Requires the disposable local fixture with --pending-pillars --without-checkin.
    @MainActor
    func testLocalPendingPillarsOfferUsefulDestinations() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app); submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        for (tab, action, heading) in [
            ("Nutrition", "Explorer les recettes →", "Recettes."),
            ("Récupération", "Faire mon bilan sommeil et forme →", "Comment te sens-tu aujourd’hui ?")
        ] {
            app.buttons["native-tab-" + tab].tap()
            let link = web.links[action]
            XCTAssertTrue(link.waitForExistence(timeout: 20))
            reveal(link, in: app)
            XCTAssertTrue(link.isHittable)
            XCTAssertFalse(web.staticTexts["CONTENU_NON_RELU_TEST"].exists)
            XCTAssertFalse(web.links["Télécharger ma fiche (PDF)"].exists)
            let proof = XCTAttachment(screenshot: app.screenshot())
            proof.name = "Programme en attente — raccourci " + tab
            proof.lifetime = .keepAlways; add(proof)
            link.tap()
            XCTAssertTrue(web.staticTexts[heading].waitForExistence(timeout: 20))
        }
    }

    /// Read-only check of the existing physical-device session. No AI request or programme mutation.
    @MainActor
    func testPhysicalExistingSessionWellnessDestinations() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let web = app.webViews.firstMatch
        for (tab, heading) in [("Nutrition", "Ton alimentation."), ("Récupération", "Ta récupération.")] {
            let destination = app.buttons["native-tab-" + tab]
            XCTAssertTrue(destination.waitForExistence(timeout: 15))
            destination.tap()
            XCTAssertTrue(web.staticTexts[heading].waitForExistence(timeout: 30))
            XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
            let proof = XCTAttachment(screenshot: app.screenshot())
            proof.name = "Session réelle — " + tab
            proof.lifetime = .keepAlways
            add(proof)
        }
        app.buttons["native-tab-Explorer"].tap()
        let recipes = app.buttons["explore-/programme/recettes"]
        reveal(recipes, in: app)
        recipes.tap()
        XCTAssertTrue(web.staticTexts["Recettes."].waitForExistence(timeout: 30))
        let recipe = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Voir la recette →")).firstMatch
        reveal(recipe, in: app)
        XCTAssertTrue(recipe.isHittable)
        app.buttons["native-tab-Coach"].tap()
        let draft = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Adapter ma semaine")).firstMatch
        XCTAssertTrue(draft.waitForExistence(timeout: 30))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Session réelle — Coach sans envoi"
        proof.lifetime = .keepAlways
        add(proof)
        app.buttons["native-tab-Séance"].tap()
        XCTAssertTrue(web.staticTexts["Ton entraînement."].waitForExistence(timeout: 30))
    }

    /// Local fixture only. Never submits a message or contacts an AI provider.
    @MainActor
    func testLocalCoachConsentCanBeWithdrawnWithoutBlockingSession() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app); submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Coach"].tap()
        let draft = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Adapter ma semaine")).firstMatch
        XCTAssertTrue(draft.waitForExistence(timeout: 25))
        reveal(draft, in: app); draft.tap()
        let consent = web.switches["J’autorise le partage de ma question et de ce contexte avec Anthropic."]
        XCTAssertTrue(consent.waitForExistence(timeout: 25))
        reveal(consent, in: app)
        XCTAssertEqual(consent.value as? String, "0")
        let send = web.buttons["Envoyer"]
        XCTAssertTrue(send.exists)
        XCTAssertFalse(send.isEnabled)
        consent.tap()
        XCTAssertEqual(consent.value as? String, "1")
        XCTAssertTrue(send.isEnabled)
        consent.tap()
        XCTAssertEqual(consent.value as? String, "0")
        XCTAssertFalse(send.isEnabled)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Coach local — accord facultatif retiré sans envoi"
        proof.lifetime = .keepAlways; add(proof)
        app.buttons["native-tab-Séance"].tap()
        XCTAssertTrue(consent.waitForNonExistence(timeout: 20))
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        XCTAssertTrue(app.buttons["native-tab-Séance"].isSelected)
    }

    /// Requires local SMTP preflight and cleanup; does not confirm email or grant access.
    @MainActor
    func testLocalSignupReachesEmailConfirmation() async throws {
        try await localSignup(waitForReturn: false)
    }

    @MainActor
    func testLocalEmailLinkReturnsToOriginalSession() async throws {
        try await localSignup(waitForReturn: true)
    }

    @MainActor
    func testLocalSignupConsentCreatesAccount() async throws {
        try await localSignup(waitForReturn: true, finalize: true)
    }

    @MainActor
    func testLocalNewAccountDiagnosticReachesResult() async throws {
        try await localSignup(waitForReturn: true, finalize: true, diagnostic: true)
    }

    /// Targeted recovery probe: requires the real unsaved result and session
    /// left by the local signup scenario. Does not seed or alter web storage.
    @MainActor
    func testLocalExistingDiagnosticResultViaExplorer() throws {
        try existingDiagnosticResultViaExplorer(save: false)
    }

    @MainActor
    func testLocalExistingDiagnosticResultCanBeSaved() throws {
        try existingDiagnosticResultViaExplorer(save: true)
    }

    @MainActor
    private func existingDiagnosticResultViaExplorer(save: Bool) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let bilan = app.buttons["explore-/diagnostic"]
        XCTAssertTrue(bilan.waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(bilan.frame.height, 44)
        bilan.tap()
        let web = app.webViews.firstMatch
        let resume = web.buttons["Continuer mon diagnostic"]
        XCTAssertTrue(resume.waitForExistence(timeout: 30), "Requires the actual unsaved diagnostic fixture")
        reveal(resume, in: app)
        resume.tap()
        XCTAssertTrue(web.staticTexts["Tes réponses analysées"].waitForExistence(timeout: 15))
        XCTAssertTrue(web.buttons["Enregistrer et continuer"].exists)
        XCTAssertFalse(web.textFields["ÂGE"].exists)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Bilan réel conservé — retour par Explorer"
        proof.lifetime = .keepAlways; add(proof)
        if save {
            let shortcut = web.links["Passer à l’enregistrement de mon bilan →"]
            XCTAssertTrue(shortcut.waitForExistence(timeout: 10))
            XCTAssertTrue(shortcut.isHittable)
            shortcut.tap()
            let submit = web.buttons["Enregistrer et continuer"]
            reveal(submit, in: app)
            XCTAssertTrue(submit.isHittable)
            submit.tap()
            XCTAssertTrue(web.links["Choisir mon accompagnement →"].waitForExistence(timeout: 30))
            XCTAssertFalse(web.buttons["Commencer ma première séance"].exists)
            let saved = XCTAttachment(screenshot: app.screenshot())
            saved.name = "Bilan repris puis enregistré — compte local sans abonnement"
            saved.lifetime = .keepAlways; add(saved)
        }
    }

    @MainActor
    private func localSignup(waitForReturn: Bool, finalize: Bool = false, diagnostic: Bool = false) async throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let signup = web.links["S'inscrire"]
        XCTAssertTrue(signup.waitForExistence(timeout: 30))
        reveal(signup, in: app)
        signup.tap()
        let firstName = web.textFields["PRÉNOM"]
        XCTAssertTrue(firstName.waitForExistence(timeout: 20))
        reveal(firstName, in: app)
        firstName.tap()
        firstName.typeText("Test inscription iPhone")
        let email = web.textFields["EMAIL"]
        reveal(email, in: app)
        email.tap()
        email.typeText("coai-ui-signup-20260927@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-Signup-0927-only!")
        let submit = web.buttons["Créer mon compte gratuit →"]
        reveal(submit, in: app)
        XCTAssertTrue(submit.isHittable)
        XCTAssertGreaterThanOrEqual(submit.frame.height, 44)
        submit.tap()
        XCTAssertTrue(web.staticTexts["Ton espace est presque prêt."].waitForExistence(timeout: 30))
        XCTAssertTrue(web.staticTexts["Ton espace est presque prêt."].isHittable,
                      "Confirmation must be visible without scrolling after submission")
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Inscription locale — confirmation email"
        capture.lifetime = .keepAlways
        add(capture)
        if waitForReturn {
            guard #available(iOS 16.4, *) else {
                throw XCTSkip("Opening the actual confirmation email in Safari requires iOS 16.4")
            }
            print("COAI_EMAIL_RETURN_READY")
            // Follow the actual local email in Safari; never bypass confirmation
            // or move the originating WebKit store's PKCE verifier into Safari.
            let (listData, _) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:54324/api/v1/messages")!)
            let list = try XCTUnwrap(JSONSerialization.jsonObject(with: listData) as? [String: Any])
            let messages = try XCTUnwrap(list["messages"] as? [[String: Any]])
            let matching = messages.filter { item in
                (item["To"] as? [[String: Any]])?.contains { $0["Address"] as? String == "coai-ui-signup-20260927@example.test" } == true
            }
            XCTAssertEqual(matching.count, 1)
            let identifier = try XCTUnwrap(matching.first?["ID"] as? String)
            XCTAssertNotNil(identifier.range(of: "^[A-Za-z0-9_-]{1,100}$", options: .regularExpression))
            let (mailData, _) = try await URLSession.shared.data(from: URL(string: "http://127.0.0.1:54324/api/v1/message/" + identifier)!)
            let mail = try XCTUnwrap(JSONSerialization.jsonObject(with: mailData) as? [String: Any])
            let html = try XCTUnwrap(mail["HTML"] as? String)
            let expression = try NSRegularExpression(pattern: "href=\"([^\"]+)\"")
            let links = expression.matches(in: html, range: NSRange(html.startIndex..., in: html)).compactMap { match -> URL? in
                guard let range = Range(match.range(at: 1), in: html) else { return nil }
                return URL(string: String(html[range]).replacingOccurrences(of: "&amp;", with: "&"))
            }
            let confirmation = try XCTUnwrap(links.first { $0.path == "/auth/v1/verify" })
            XCTAssertEqual(confirmation.scheme, "http")
            XCTAssertTrue(["localhost", "127.0.0.1"].contains(confirmation.host ?? ""))
            XCTAssertEqual(confirmation.port, 54321)
            let query = URLComponents(url: confirmation, resolvingAgainstBaseURL: false)?.queryItems
            XCTAssertEqual(query?.first { $0.name == "type" }?.value, "signup")
            XCTAssertEqual(query?.first { $0.name == "redirect_to" }?.value, "http://localhost:3050/auth/ios-confirmation")
            let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
            safari.open(confirmation)
            safari.activate()
            let returnLink = safari.webViews.links["Ouvrir COAI"]
            XCTAssertTrue(returnLink.waitForExistence(timeout: 30))
            returnLink.tap()
            // Safari exposes this confirmation as a sheet on recent iOS,
            // not necessarily as an XCUIElementTypeAlert.
            let safariOpen = safari.buttons["Ouvrir"]
            if safariOpen.waitForExistence(timeout: 10) { safariOpen.tap() }
            let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
            let open = springboard.alerts.buttons["Ouvrir"]
            let returnReady = XCTNSPredicateExpectation(
                predicate: NSPredicate { _, _ in
                    open.exists || web.staticTexts["Finalise ton compte"].exists
                }, object: nil)
            guard await XCTWaiter.fulfillment(of: [returnReady], timeout: 30) == .completed else {
                XCTFail("The email confirmation did not return from Safari to COAI")
                return
            }
            if open.exists { open.tap() }
            guard web.staticTexts["Finalise ton compte"].waitForExistence(timeout: 30) else {
                XCTFail("The originating session did not reach account finalization")
                return
            }
            XCTAssertTrue(web.staticTexts["coai-ui-signup-20260927@example.test"].exists)
            XCTAssertFalse(web.buttons["Se connecter"].exists)
            let returned = XCTAttachment(screenshot: app.screenshot())
            returned.name = "Retour email local — session d’origine"
            returned.lifetime = .keepAlways
            add(returned)
            if finalize {
                let finish = web.buttons["Créer mon espace et commencer →"]
                reveal(finish, in: app)
                finish.tap()
                XCTAssertTrue(web.staticTexts["Le consentement au traitement des données de santé est requis."].waitForExistence(timeout: 5))
                let privacy = web.switches.matching(NSPredicate(format: "label BEGINSWITH %@", "J'ai lu la")).firstMatch
                let health = web.switches.matching(NSPredicate(format: "label BEGINSWITH %@", "Je certifie être apte")).firstMatch
                XCTAssertTrue(privacy.exists)
                XCTAssertTrue(health.exists)
                XCTAssertEqual(privacy.value as? String, "0")
                XCTAssertEqual(health.value as? String, "0")
                reveal(privacy, in: app)
                privacy.tap()
                reveal(finish, in: app)
                finish.tap()
                XCTAssertTrue(web.staticTexts["La certification d'aptitude sportive est requise."].waitForExistence(timeout: 5))
                reveal(health, in: app)
                health.tap()
                reveal(finish, in: app)
                finish.tap()
                XCTAssertTrue(web.otherElements["Bienvenue, Test inscription iPhone."].waitForExistence(timeout: 30))
                let diagnosticEntry = web.buttons.matching(NSPredicate(format: "label IN %@", ["Faire mon diagnostic", "Continuer mon diagnostic"])).firstMatch
                XCTAssertTrue(diagnosticEntry.waitForExistence(timeout: 10))
                XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
                let welcome = XCTAttachment(screenshot: app.screenshot())
                welcome.name = "Inscription complète — accueil réel"
                welcome.lifetime = .keepAlways
                add(welcome)
                if diagnostic {
                    func tap(_ element: XCUIElement) {
                        XCTAssertTrue(element.waitForExistence(timeout: 15))
                        if app.keyboards.firstMatch.exists {
                            reveal(element, in: app)
                        } else {
                            for _ in 0..<40 {
                                if element.isHittable { break }
                                let above = element.frame.midY < app.frame.midY
                                app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.45 : 0.65))
                                    .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.65 : 0.45)))
                            }
                            XCTAssertTrue(element.isHittable)
                        }
                        element.tap()
                    }
                    func choice(_ label: String) {
                        let element = web.switches.matching(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
                        tap(element)
                        XCTAssertEqual(element.value as? String, "1")
                    }
                    func next() { tap(web.buttons["Continuer"]) }
                    tap(diagnosticEntry)
                    let restart = web.buttons.matching(NSPredicate(format: "label ==[c] %@", "Recommencer à zéro")).firstMatch
                    if restart.waitForExistence(timeout: 2) {
                        tap(restart)
                    } else {
                        tap(web.buttons["Commencer mon bilan offert"])
                    }
                    // A real navigation interruption must expose the saved draft.
                    XCTAssertTrue(web.switches["Homme"].waitForExistence(timeout: 15))
                    let marketingHidden = XCTNSPredicateExpectation(
                        predicate: NSPredicate { _, _ in !web.buttons["EXPLORER"].exists }, object: nil)
                    XCTAssertEqual(XCTWaiter.wait(for: [marketingHidden], timeout: 5), .completed,
                                   "The loaded diagnostic must use native navigation, not duplicate the site menu")
                    app.buttons["Page précédente"].tap()
                    tap(diagnosticEntry)
                    XCTAssertTrue(restart.waitForExistence(timeout: 15))
                    XCTAssertGreaterThanOrEqual(restart.frame.height, 44)
                    tap(restart)
                    choice("Homme")
                    for (label, value) in [("ÂGE", "121"), ("TAILLE (CM)", "178"), ("POIDS (KG)", "75")] {
                        let field = web.textFields[label]
                        tap(field)
                        field.typeText(value)
                        if label == "ÂGE" {
                            XCTAssertEqual(field.value as? String, "121")
                            XCTAssertTrue(web.staticTexts["Indique un âge entier entre 1 et 120 ans."].waitForExistence(timeout: 5))
                            XCTAssertFalse(web.buttons["Continuer"].isEnabled)
                            field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 3) + "35")
                            XCTAssertEqual(field.value as? String, "35")
                        }
                    }
                    XCTAssertTrue(web.buttons["Continuer"].isEnabled)
                    next()
                    for label in ["Journée mixte : assis et debout", "Débutant", "Prendre du muscle", "Salle de sport complète", "Salle de sport", "45 minutes", "3 fois par semaine", "Repas structurés et équilibrés", "Bonne (7-8h, plutôt réparateur)"] {
                        choice(label)
                        next()
                        if label == "3 fois par semaine" { tap(web.buttons["Continuer mon bilan"]) }
                    }
                    choice("Aucune, je suis en pleine forme")
                    tap(web.buttons["Voir mon diagnostic →"])
                    tap(web.buttons["Voir mon bilan complet →"])
                    XCTAssertTrue(web.buttons["Enregistrer et continuer"].waitForExistence(timeout: 15))
                    XCTAssertTrue(web.staticTexts["Tes réponses analysées"].exists)
                    XCTAssertFalse(web.staticTexts["4 capacités physiques évaluées"].exists)
                    XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
                    // The result is not saved yet. A process relaunch must not
                    // discard all answers or silently submit them to the profile.
                    app.terminate(); app.launch()
                    // A cold launch opens Séance, not the one-time welcome page.
                    // Return through the same persistent menu available to members.
                    let explorer = app.buttons["native-tab-Explorer"]
                    guard explorer.waitForExistence(timeout: 15) else {
                        XCTFail("Native navigation missing after relaunch")
                        return
                    }
                    explorer.tap()
                    let bilan = app.buttons["explore-/diagnostic"]
                    guard bilan.waitForExistence(timeout: 10) else {
                        XCTFail("The saved diagnostic must remain reachable from Explorer")
                        return
                    }
                    bilan.tap()
                    guard web.buttons["Continuer mon diagnostic"].waitForExistence(timeout: 15) else {
                        let proof = XCTAttachment(screenshot: app.screenshot())
                        proof.name = "Reprise bilan absente après relance"
                        proof.lifetime = .keepAlways; add(proof)
                        XCTFail("Saved diagnostic missing after relaunch and explicit navigation")
                        return
                    }
                    tap(web.buttons["Continuer mon diagnostic"])
                    XCTAssertTrue(web.staticTexts["Tes réponses analysées"].waitForExistence(timeout: 15))
                    XCTAssertTrue(web.buttons["Enregistrer et continuer"].exists)
                    XCTAssertFalse(web.textFields["ÂGE"].exists, "Resume the result, not the first question")
                    let saveShortcut = web.links["Passer à l’enregistrement de mon bilan →"]
                    XCTAssertTrue(saveShortcut.waitForExistence(timeout: 10))
                    XCTAssertTrue(saveShortcut.isHittable, "Saving must be reachable without scrolling through the result")
                    // WebKit exposes the text bounds, excluding the anchor padding.
                    // Keep a visual proof and verify the actual navigation instead.
                    let shortcutProof = XCTAttachment(screenshot: app.screenshot())
                    shortcutProof.name = "Bilan — accès direct à l’enregistrement"
                    shortcutProof.lifetime = .keepAlways; add(shortcutProof)
                    tap(saveShortcut)
                    let saveVisible = NSPredicate { _, _ in
                        web.buttons["Enregistrer et continuer"].isHittable
                    }
                    let saveReady = expectation(for: saveVisible, evaluatedWith: nil)
                    await fulfillment(of: [saveReady], timeout: 10)
                    tap(web.buttons["Enregistrer et continuer"])
                    XCTAssertTrue(web.links["Choisir mon accompagnement →"].waitForExistence(timeout: 30))
                    XCTAssertFalse(web.links["Voir les accompagnements →"].exists,
                                   "Keep one offer exit after saving, not adjacent duplicate links")
                    XCTAssertTrue(web.staticTexts["Choisis ton accompagnement COAI pour accéder à ton programme."].exists)
                    XCTAssertFalse(web.links["Programme musculation IA"].exists,
                                   "Marketing footer must not distract from the diagnostic next step")
                    XCTAssertFalse(web.buttons["Commencer ma première séance"].exists,
                                   "A new unpaid account must not receive invented programme access")
                    let result = XCTAttachment(screenshot: app.screenshot())
                    result.name = "Diagnostic réel — compte neuf"
                    result.lifetime = .keepAlways
                    add(result)
                }
            }
        }
    }

    @MainActor
    func testLocalConnectedRecipesAndRecoveryDiscovery() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app); submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Explorer"].tap()
        let recipes = app.buttons["explore-/programme/recettes"]
        reveal(recipes, in: app); recipes.tap()
        let breakfast = web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Petit-déjeuner")).firstMatch
        XCTAssertTrue(breakfast.waitForExistence(timeout: 20))
        reveal(breakfast, in: app); breakfast.tap()
        let porridge = web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Porridge avoine, fruits rouges et amandes")).firstMatch
        XCTAssertTrue(porridge.waitForExistence(timeout: 10))
        let details = web.buttons["Voir la recette →"].firstMatch
        reveal(details, in: app); details.tap()
        XCTAssertTrue(web.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "Ingrédients")).firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(web.staticTexts.matching(NSPredicate(format: "label ==[c] %@", "Préparation")).firstMatch.exists)
        app.buttons["native-tab-Explorer"].tap()
        let recovery = app.buttons["explore-/programme/programmes-prets?categorie=RECUPERATION"]
        reveal(recovery, in: app); recovery.tap()
        let sleep = web.buttons["Choisir Sommeil réparateur — 14 jours"]
        XCTAssertTrue(sleep.waitForExistence(timeout: 20))
        XCTAssertTrue(sleep.isHittable, "Le premier programme doit être accessible sans défilement")
        XCTAssertLessThan(sleep.frame.minY, web.frame.maxY)
        let filters = web.buttons["Filtrer les programmes"]
        XCTAssertTrue(filters.exists)
        XCTAssertGreaterThanOrEqual(filters.frame.height, 44)
        filters.tap()
        func revealFilter(_ element: XCUIElement) {
            for _ in 0..<12 {
                if element.isHittable { return }
                let origin = web.coordinate(withNormalizedOffset: .zero)
                let high = origin.withOffset(CGVector(dx: web.frame.width * 0.9, dy: 120))
                let low = origin.withOffset(CGVector(dx: web.frame.width * 0.9, dy: 240))
                if element.frame.minY < web.frame.minY {
                    high.press(forDuration: 0.05, thenDragTo: low)
                } else {
                    low.press(forDuration: 0.05, thenDragTo: high)
                }
            }
            XCTAssertTrue(element.isHittable)
        }
        let recoveryFilter = web.switches["Récupération"]
        XCTAssertTrue(recoveryFilter.waitForExistence(timeout: 20))
        XCTAssertEqual(recoveryFilter.value as? String, "1")
        revealFilter(recoveryFilter)
        XCTAssertGreaterThanOrEqual(recoveryFilter.frame.height, 44)
        let closeFilters = web.buttons["Fermer les filtres"]
        revealFilter(closeFilters); closeFilters.tap()
        XCTAssertTrue(sleep.isHittable)
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Découverte récupération après lecture recette — local connecté"
        proof.lifetime = .keepAlways; add(proof)
        app.buttons["native-tab-Explorer"].tap()
        let club = app.buttons["explore-/club"]
        reveal(club, in: app); club.tap()
        XCTAssertTrue(web.staticTexts["Le Direct du Coach."].waitForExistence(timeout: 20))
        XCTAssertTrue(web.staticTexts["Premier rendez-vous en préparation."].exists)
        XCTAssertTrue(web.staticTexts["1 heure par mois · En groupe · Sans replay"].exists)
        let question = web.links["Préparer ma question sur WhatsApp"]
        XCTAssertTrue(question.exists)
        revealFilter(question)
        let clubProof = XCTAttachment(screenshot: app.screenshot())
        clubProof.name = "COAI Club — question préparée explicitement, sans envoi"
        clubProof.lifetime = .keepAlways; add(clubProof)
        let clubHierarchy = XCTAttachment(string: web.debugDescription)
        clubHierarchy.name = "Club accessibility hierarchy"
        clubHierarchy.lifetime = .keepAlways; add(clubHierarchy)
        // WKWebView reports the text line (20 pt) for this external link,
        // not the padded anchor. Inspect the retained screenshot for layout.
        XCTAssertTrue(question.isHittable)
        // No external contact, reservation, payment or message is triggered.
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
    }

    @MainActor
    func testLocalExerciseCatalogueRejectsMismatchedRowing() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        if email.waitForExistence(timeout: 5) {
            email.tap(); email.typeText("coai-ui-20260924-http@example.test")
            let password = web.secureTextFields["MOT DE PASSE"]
            reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
            let submit = web.buttons["Se connecter"]
            reveal(submit, in: app); submit.tap()
            XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        }
        app.buttons["native-tab-Explorer"].tap()
        let catalogue = app.buttons["explore-/programme/exercices"]
        reveal(catalogue, in: app); catalogue.tap()
        let search = web.searchFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 20))
        let filters = web.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Filtres")).firstMatch
        XCTAssertTrue(filters.exists)
        XCTAssertGreaterThanOrEqual(filters.frame.height, 44)
        XCTAssertFalse(web.switches["Dos"].exists, "Filtres repliés au départ")
        reveal(search, in: app); search.tap(); search.typeText("Rowing haltère unilatéral\n")
        XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
        let empty = web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Aucun exercice trouvé.")).firstMatch
        XCTAssertTrue(empty.waitForExistence(timeout: 10))
        XCTAssertTrue(empty.isHittable, "Le résultat vide doit être visible après la recherche")
        XCTAssertLessThanOrEqual(empty.frame.maxY, web.frame.maxY)
        // WebKit may expose the search field value as static text too.
        // Assert the actual result count rather than absence of typed text.
        XCTAssertTrue(web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "0 exercice correspondant.")).firstMatch.exists)
        let excluded = XCTAttachment(screenshot: app.screenshot())
        excluded.name = "Catalogue — rowing exclu, zéro résultat"
        excluded.lifetime = .keepAlways; add(excluded)
        let clear = web.buttons["Effacer la recherche"]
        reveal(clear, in: app); clear.tap()
        reveal(search, in: app); search.tap(); search.typeText("Gainage planche\n")
        XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
        XCTAssertTrue(web.staticTexts["Gainage planche"].waitForExistence(timeout: 10))
        XCTAssertTrue(web.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "1 exercice correspondant.")).firstMatch.exists)
        XCTAssertFalse(empty.exists)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Catalogue — recherche après exclusion du mauvais rowing"
        proof.lifetime = .keepAlways; add(proof)
        reveal(clear, in: app); clear.tap()
        reveal(filters, in: app); filters.tap()
        let back = web.switches["Dos"]
        XCTAssertTrue(back.waitForExistence(timeout: 5))
        reveal(back, in: app); back.tap()
        XCTAssertEqual(back.value as? String, "1")
        XCTAssertTrue(web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "1 actif")).firstMatch.exists)
        reveal(filters, in: app); filters.tap()
        XCTAssertFalse(back.exists)
        let reset = web.buttons["Tout réinitialiser"]
        reveal(reset, in: app); reset.tap()
        XCTAssertFalse(web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "1 actif")).firstMatch.exists)
    }

    @MainActor
    func testLocalProfileProgrammeLinkFitsSmallScreen() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        // This read-only layout test may reuse the disposable local session.
        if email.waitForExistence(timeout: 5) {
            email.tap(); email.typeText("coai-ui-20260924-http@example.test")
            let password = web.secureTextFields["MOT DE PASSE"]
            reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
            let submit = web.buttons["Se connecter"]
            reveal(submit, in: app); submit.tap()
            XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        }
        app.buttons["native-tab-Explorer"].tap()
        let profile = app.buttons["explore-/compte/profil"]
        reveal(profile, in: app); profile.tap()
        let explanation = web.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "lorsqu’elle a été effectuée")).firstMatch
        XCTAssertTrue(explanation.waitForExistence(timeout: 20))
        let programme = web.links.matching(NSPredicate(format: "label CONTAINS[c] %@", "Voir mon programme")).firstMatch
        reveal(programme, in: app)
        XCTAssertTrue(programme.isHittable)
        XCTAssertGreaterThanOrEqual(programme.frame.minX, web.frame.minX)
        XCTAssertLessThanOrEqual(programme.frame.maxX, web.frame.maxX + 1)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Profil — accès programme sur petit écran"
        proof.lifetime = .keepAlways; add(proof)
        programme.tap()
        XCTAssertFalse(app.staticTexts["Page indisponible"].waitForExistence(timeout: 3))
    }

    /// Real local programmes containing interrupted list entries, not injected HTML.
    @MainActor
    func testLocalIncompletePillarsPreserveAvailableContent() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap(); email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app); password.tap(); password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app); submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        for (tab, retainedText) in [("Nutrition", "Conseil nutrition conservé"), ("Récupération", "Conseil récupération conservé")] {
            app.buttons["native-tab-" + tab].tap()
            XCTAssertTrue(web.staticTexts[retainedText].waitForExistence(timeout: 20))
            let warning = web.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Certaines informations sont incomplètes")).firstMatch
            XCTAssertTrue(warning.exists)
            XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
            if tab == "Nutrition" {
                // WebKit exposes both the summary and its text as buttons.
                let principles = web.buttons.matching(identifier: "🥗 Principes de la semaine").firstMatch
                XCTAssertTrue(principles.waitForExistence(timeout: 10))
                func revealOverview(_ element: XCUIElement) {
                    for _ in 0..<24 {
                        if element.isHittable { return }
                        let upper = web.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.35))
                        let lower = web.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.60))
                        if element.frame.minY < web.frame.minY {
                            upper.press(forDuration: 0.05, thenDragTo: lower)
                        } else {
                            lower.press(forDuration: 0.05, thenDragTo: upper)
                        }
                    }
                    XCTAssertTrue(element.isHittable)
                }
                revealOverview(principles); principles.tap()
                let advice = web.staticTexts["Principes nutrition sauvegardés dans le programme local."]
                XCTAssertTrue(advice.waitForExistence(timeout: 10))
                revealOverview(advice)
                XCTAssertTrue(advice.isHittable)
                let proof = XCTAttachment(screenshot: app.screenshot())
                proof.name = "Nutrition — principes accessibles avec les repas"
                proof.lifetime = .keepAlways; add(proof)
            }
        }
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["native-tab-Récupération"].waitForExistence(timeout: 10))
        app.buttons["native-tab-Récupération"].tap()
        XCTAssertTrue(web.staticTexts["Conseil récupération conservé"].waitForExistence(timeout: 20))
        let otherDay = web.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Consulter la récupération de ")).firstMatch
        XCTAssertTrue(otherDay.waitForExistence(timeout: 10))
        let dayName = otherDay.label.replacingOccurrences(of: "Consulter la récupération de ", with: "")
        reveal(otherDay, in: app); otherDay.tap()
        let dayAdvice = web.staticTexts["Conseil sommeil conservé pour " + dayName]
        XCTAssertTrue(dayAdvice.waitForExistence(timeout: 10))
        reveal(dayAdvice, in: app)
        XCTAssertTrue(dayAdvice.isHittable)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Récupération — autre jour consultable après relance"
        proof.lifetime = .keepAlways; add(proof)
    }

    /// Disposable loopback account only, never a personal or production account.
    @MainActor
    func testLocalConnectedAccountDeletionPersists() throws {
        try runLocalAccountDeletion(unresolvedPhoto: false)
    }

    /// Requires seed-native-unresolved-photo.cjs --seed before launch.
    @MainActor
    func testLocalUnresolvedPhotoDeletionKeepsAccountUsable() throws {
        try runLocalAccountDeletion(unresolvedPhoto: true)
    }

    @MainActor
    private func runLocalAccountDeletion(unresolvedPhoto: Bool) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        // Destructive actions are limited to this explicitly marked loopback app
        // and the disposable account seeded by the local test harness.
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap()
        email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app)
        submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Explorer"].tap()
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app, upward: false)
        settings.tap()
        let delete = web.buttons["Supprimer mon compte"]
        XCTAssertTrue(delete.waitForExistence(timeout: 30))
        reveal(delete, in: app)
        delete.tap()
        let confirmation = app.alerts["COAI"]
        XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
        XCTAssertTrue(confirmation.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "facturation continuera")).firstMatch.exists)
        confirmation.buttons["Annuler"].tap()
        XCTAssertTrue(delete.isEnabled)
        // Cancellation must preserve the connected profile, not just dismiss UI.
        let export = web.buttons["Exporter mes données"]
        for _ in 0..<15 {
            if export.isHittable { break }
            let above = export.frame.midY < web.frame.midY
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.35 : 0.65))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.55 : 0.45)))
        }
        XCTAssertTrue(export.isHittable)
        export.tap()
        XCTAssertTrue(app.otherElements["LP.CaptionBar.TopCaption"].waitForExistence(timeout: 20))
        app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch.tap()
        reveal(delete, in: app)
        delete.tap()
        XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Confirmation de suppression du compte jetable — avertissement Apple"
        proof.lifetime = .keepAlways
        add(proof)
        confirmation.buttons["Confirmer"].tap()
        if unresolvedPhoto {
            let failure = web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "La suppression de tes photos reste à confirmer.")).firstMatch
            XCTAssertTrue(failure.waitForExistence(timeout: 30))
            revealWebControl(failure, in: app)
            XCTAssertTrue(failure.isHittable)
            XCTAssertFalse(web.buttons["Se connecter"].exists)
            XCTAssertTrue(delete.isEnabled)
            let failureProof = XCTAttachment(screenshot: app.screenshot())
            failureProof.name = "Suppression non confirmée — compte conservé, message lisible"
            failureProof.lifetime = .keepAlways; add(failureProof)
            // Retry the actual failed request. No mocked response or forced settlement.
            reveal(delete, in: app); delete.tap()
            XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
            confirmation.buttons["Confirmer"].tap()
            XCTAssertTrue(failure.waitForExistence(timeout: 30))
            XCTAssertTrue(delete.isEnabled)
            app.terminate(); app.launch()
            XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 10))
            app.buttons["native-tab-Explorer"].tap()
            let reopenedSettings = app.buttons["explore-/compte/parametres"]
            reveal(reopenedSettings, in: app, upward: false); reopenedSettings.tap()
            XCTAssertTrue(delete.waitForExistence(timeout: 30))
            XCTAssertFalse(web.buttons["Se connecter"].exists)
            revealWebControl(export, in: app); export.tap()
            XCTAssertTrue(app.otherElements["LP.CaptionBar.TopCaption"].waitForExistence(timeout: 20))
            app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch.tap()
            return
        }
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.webViews.textFields["EMAIL"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.webViews.buttons["Supprimer mon compte"].exists)
    }

    @MainActor
    func testLocalConnectedAccountExportShares() throws {
        try runLocalAccountExport(invalidFirstResponse: false)
    }

    /// Requires ios-export-failure-proxy.cjs and the disposable local account.
    @MainActor
    func testLocalInvalidAccountExportCanBeRetried() throws {
        try runLocalAccountExport(invalidFirstResponse: true)
    }

    @MainActor
    private func runLocalAccountExport(invalidFirstResponse: Bool) throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap()
        email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app)
        submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Explorer"].tap()
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app, upward: false)
        settings.tap()
        let export = web.buttons["Exporter mes données"]
        XCTAssertTrue(export.waitForExistence(timeout: 30))
        reveal(export, in: app)
        export.tap()
        if invalidFirstResponse {
            let failure = web.staticTexts["L’export n’a pas abouti. Aucun fichier de données n’a pu être confirmé. Réessaie."]
            XCTAssertTrue(failure.waitForExistence(timeout: 15))
            XCTAssertFalse(app.cells["Enregistrer dans Fichiers"].exists)
            XCTAssertFalse(app.otherElements["LP.CaptionBar.TopCaption"].exists)
            XCTAssertTrue(export.isEnabled)
            reveal(export, in: app)
            export.tap()
        }
        let file = app.otherElements["LP.CaptionBar.TopCaption"]
        XCTAssertTrue(file.waitForExistence(timeout: 30))
        XCTAssertTrue(file.label.lowercased().contains("coai"))
        XCTAssertTrue(app.cells["Enregistrer dans Fichiers"].exists)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "Export du compte jetable local — partage iOS sans destinataire"
        proof.lifetime = .keepAlways
        add(proof)
        app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch.tap()
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        XCTAssertTrue(export.isEnabled)
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        // A second export after dismissal must still work and can be saved
        // locally. Never select a recipient or a cloud destination in this test.
        export.tap()
        let save = app.cells["Enregistrer dans Fichiers"]
        XCTAssertTrue(save.waitForExistence(timeout: 15))
        save.tap()
        let picker = XCUIApplication(bundleIdentifier: "com.apple.DocumentManagerUICore.SaveToFiles")
        let filename = picker.textFields["DOCPicker.filenameTextField"]
        XCTAssertTrue(filename.waitForExistence(timeout: 30))
        XCTAssertTrue(picker.staticTexts["Sur mon iPhone"].exists, "Never save the fixture to a cloud destination")
        filename.tap()
        // The Files sheet can still be settling after the first tap on SE.
        // Wait for the keyboard before sending text to the external process.
        if !picker.keyboards.firstMatch.waitForExistence(timeout: 5) {
            filename.tap()
        }
        XCTAssertTrue(picker.keyboards.firstMatch.waitForExistence(timeout: 5))
        filename.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: "COAI-document".count))
        let savedName = "COAI-connected-export-" + UUID().uuidString
        filename.typeText(savedName)
        let destination = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        destination.name = "Destination locale JSON — " + savedName
        destination.lifetime = .keepAlways
        add(destination)
        let confirm = picker.buttons.matching(NSPredicate(format: "label IN %@", ["Enregistrer", "Save"])).firstMatch
        XCTAssertTrue(confirm.isEnabled)
        confirm.tap()
        XCTAssertTrue(filename.waitForNonExistence(timeout: 15))
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        XCTAssertTrue(export.isHittable)
    }

    @MainActor
    func testPhysicalExistingSessionProgrammePDFShares() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR"]
        app.launch()
        let sessionTab = app.buttons["native-tab-Séance"]
        XCTAssertTrue(sessionTab.waitForExistence(timeout: 15))
        sessionTab.tap()
        let download = app.webViews.firstMatch.links["Télécharger ma fiche (PDF)"]
        // Requires an existing signed-in session. Never creates an account or submits credentials.
        XCTAssertTrue(download.waitForExistence(timeout: 30))
        reveal(download, in: app)
        download.tap()
        let caption = app.otherElements["LP.CaptionBar.BottomCaption"]
        XCTAssertTrue(caption.waitForExistence(timeout: 30))
        XCTAssertTrue(caption.label.contains("PDF"))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "PDF session existante — ouverture du partage uniquement"
        proof.lifetime = .keepAlways
        add(proof)
        let close = app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch
        XCTAssertTrue(close.exists)
        close.tap()
        XCTAssertTrue(download.waitForExistence(timeout: 10))
        XCTAssertTrue(sessionTab.exists)
    }

    @MainActor
    func testLocalConnectedProgrammePDFShares() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap()
        email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app)
        submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        app.buttons["native-tab-Séance"].tap()
        let download = web.links["Télécharger ma fiche (PDF)"]
        XCTAssertTrue(download.waitForExistence(timeout: 30))
        reveal(download, in: app)
        download.tap()
        let caption = app.otherElements["LP.CaptionBar.BottomCaption"]
        XCTAssertTrue(caption.waitForExistence(timeout: 30))
        XCTAssertTrue(caption.label.contains("PDF"))
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "PDF connecté local — partage iOS sans publication"
        proof.lifetime = .keepAlways
        add(proof)
        let close = app.buttons.matching(NSPredicate(format: "label == %@ OR label == %@", "Fermer", "Close")).firstMatch
        XCTAssertTrue(close.exists)
        close.tap()
        XCTAssertTrue(download.waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["native-tab-Séance"].exists)
    }

    /// Real loopback authentication and workout persistence, with a disposable account.
    @MainActor
    func testLocalConnectedDailyWorkoutPersists() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap()
        email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app)
        submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        func shortReveal(_ element: XCUIElement) {
            for _ in 0..<25 {
                if element.isHittable { break }
                let above = element.frame.midY < app.frame.midY
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.45 : 0.65))
                    .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: above ? 0.65 : 0.45)))
            }
            XCTAssertTrue(element.isHittable)
        }
        app.buttons["native-tab-Explorer"].tap()
        app.buttons["explore-/dashboard"].tap()
        // Fixture must be created with --without-checkin: answers travel through the real UI/API.
        let energy = web.switches["Normale"].firstMatch
        XCTAssertTrue(energy.waitForExistence(timeout: 20))
        for label in ["Normale", "Bon", "Non", "40 min", "Salle de sport complète"] {
            let choice = web.switches[label].firstMatch
            shortReveal(choice)
            if choice.value as? String != "1" { choice.tap() }
            XCTAssertEqual(choice.value as? String, "1")
        }
        let preview = web.buttons["Voir les ajustements →"]
        shortReveal(preview)
        preview.tap()
        let confirm = web.buttons["Confirmer ma séance du jour"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 15))
        shortReveal(confirm)
        confirm.tap()
        let start = web.buttons["Commencer ma séance"]
        XCTAssertTrue(start.waitForExistence(timeout: 20))
        shortReveal(start)
        start.tap()
        let finish = web.buttons["Terminer ma séance"]
        shortReveal(finish)
        finish.tap()
        let rating = web.switches["Bien dosée"]
        XCTAssertTrue(rating.waitForExistence(timeout: 15))
        shortReveal(rating)
        rating.tap()
        let noPain = web.switches["Non"]
        shortReveal(noPain)
        noPain.tap()
        let save = web.buttons["Enregistrer mon ressenti"]
        shortReveal(save)
        save.tap()
        XCTAssertTrue(web.staticTexts["Séance accomplie."].waitForExistence(timeout: 15))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 15))
        app.buttons["native-tab-Explorer"].tap()
        app.buttons["explore-/dashboard"].tap()
        XCTAssertTrue(web.staticTexts["Séance accomplie."].waitForExistence(timeout: 30))
        XCTAssertFalse(web.buttons["Commencer ma séance"].exists)
    }

    /// Requires the isolated loopback server and disposable local fixture.
    /// Real password login/cookies; no HTML fixture or injected authentication.
    @MainActor
    func testLocalConnectedLoginSurvivesRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        // Fail before entering even disposable credentials if the local mode is absent.
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        let web = app.webViews.firstMatch
        let email = web.textFields["EMAIL"]
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        email.tap()
        email.typeText("coai-ui-20260924-http@example.test")
        let password = web.secureTextFields["MOT DE PASSE"]
        reveal(password, in: app)
        password.tap()
        password.typeText("Coai-local-UI-0924-only!")
        let submit = web.buttons["Se connecter"]
        reveal(submit, in: app)
        submit.tap()
        XCTAssertTrue(email.waitForNonExistence(timeout: 30))
        for (tab, heading) in [("Nutrition", "Ton alimentation."), ("Récupération", "Ta récupération.")] {
            let destination = app.buttons["native-tab-" + tab]
            XCTAssertTrue(destination.waitForExistence(timeout: 10))
            destination.tap()
            XCTAssertTrue(web.staticTexts[heading].waitForExistence(timeout: 20))
            XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
            let screen = XCTAttachment(screenshot: app.screenshot())
            screen.name = "Onglet connecté local — " + tab
            screen.lifetime = .keepAlways
            add(screen)
        }
        app.buttons["native-tab-Explorer"].tap()
        let recipes = app.buttons["explore-/programme/recettes"]
        reveal(recipes, in: app)
        recipes.tap()
        XCTAssertTrue(web.staticTexts["Recettes."].waitForExistence(timeout: 20))
        let recipe = web.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Voir la recette →")).firstMatch
        for _ in 0..<15 {
            if recipe.isHittable { break }
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.7))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.45)))
        }
        XCTAssertTrue(recipe.isHittable)
        recipe.tap()
        XCTAssertTrue(web.staticTexts["150 g de blanc de poulet"].waitForExistence(timeout: 5))
        recipe.tap()
        XCTAssertTrue(web.staticTexts["150 g de blanc de poulet"].waitForNonExistence(timeout: 5))
        let vegan = web.switches["Vegan"]
        for _ in 0..<20 {
            if vegan.isHittable { break }
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.45))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.65)))
        }
        XCTAssertTrue(vegan.isHittable)
        vegan.tap()
        let reset = web.buttons["Réinitialiser les filtres"]
        for _ in 0..<15 {
            if reset.isHittable { break }
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.65))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.45)))
        }
        XCTAssertTrue(reset.isHittable)
        reset.tap()
        XCTAssertTrue(reset.waitForNonExistence(timeout: 5))
        XCTAssertEqual(vegan.value as? String, "0")
        XCTAssertTrue(web.staticTexts["Poulet, boulgour et courgettes rôties"].exists)
        XCTAssertTrue(web.staticTexts["Porridge avoine, fruits rouges et amandes"].exists)
        XCTAssertTrue(web.staticTexts["Saumon, quinoa et brocolis"].exists)
        app.buttons["native-tab-Explorer"].tap()
        let settings = app.buttons["explore-/compte/parametres"]
        XCTAssertTrue(settings.waitForExistence(timeout: 5))
        reveal(settings, in: app, upward: false)
        settings.tap()
        XCTAssertTrue(web.buttons["Se déconnecter"].firstMatch.waitForExistence(timeout: 20))
        let editableName = web.textFields["PRÉNOM"]
        XCTAssertEqual(editableName.value as? String, "Test local")
        editableName.tap()
        editableName.typeText(" vérifié")
        let savedName = editableName.value as? String
        XCTAssertTrue(savedName?.contains("vérifié") == true)
        let saveIdentity = web.buttons["Enregistrer"].firstMatch
        let typingCapture = XCTAttachment(screenshot: app.screenshot())
        typingCapture.name = "Saisie identité avant sauvegarde"
        typingCapture.lifetime = .keepAlways
        add(typingCapture)
        reveal(saveIdentity, in: app)
        saveIdentity.tap()
        XCTAssertTrue(web.staticTexts["Identité enregistrée."].waitForExistence(timeout: 15))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["native-tab-Explorer"].waitForExistence(timeout: 15))
        app.buttons["native-tab-Explorer"].tap()
        XCTAssertTrue(settings.waitForExistence(timeout: 5))
        settings.tap()
        let signOut = web.buttons["Se déconnecter"].firstMatch
        XCTAssertTrue(signOut.waitForExistence(timeout: 20))
        let birthDate = web.descendants(matching: .any).matching(NSPredicate(
            format: "label == %@ AND elementType != %d", "DATE DE NAISSANCE", XCUIElement.ElementType.staticText.rawValue
        )).firstMatch
        XCTAssertTrue(birthDate.exists)
        XCTAssertNotEqual(birthDate.elementType, .staticText, "Mesurer le champ, pas son libellé.")
        XCTAssertGreaterThanOrEqual(birthDate.frame.height, 44)
        let firstName = web.textFields["PRÉNOM"]
        XCTAssertEqual(firstName.value as? String, savedName?.trimmingCharacters(in: .whitespaces), "La modification doit venir du serveur après relance.")
        XCTAssertLessThanOrEqual(birthDate.frame.maxX, firstName.frame.maxX + 2,
                                 "Le champ date ne doit pas dépasser la largeur des autres champs.")
        let connected = XCTAttachment(screenshot: app.screenshot())
        connected.name = "Compte local connecté après fermeture et relance"
        connected.lifetime = .keepAlways
        add(connected)
        reveal(signOut, in: app)
        signOut.tap()
        XCTAssertTrue(email.waitForExistence(timeout: 20))
        app.terminate()
        app.launch()
        XCTAssertTrue(email.waitForExistence(timeout: 20))
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Connexion locale réelle puis déconnexion conservée après relance"
        capture.lifetime = .keepAlways
        add(capture)
    }

    /// Exercises the real persistent WKWebsiteDataStore, not the daily screen or API.
    @MainActor
    func testWebDraftSurvivesRelaunchAndClearsAfterSessionEnd() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let clear = app.buttons["Effacer le brouillon fictif"]
        XCTAssertTrue(clear.waitForExistence(timeout: 15))
        reveal(clear, in: app)
        clear.tap()
        XCTAssertTrue(app.staticTexts["Aucun brouillon fictif"].exists)
        let save = app.buttons["Enregistrer le brouillon fictif"]
        reveal(save, in: app)
        save.tap()
        XCTAssertTrue(app.staticTexts["Brouillon fictif conservé"].exists)
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["Brouillon fictif conservé"].waitForExistence(timeout: 15))
        let end = app.buttons["Simuler une déconnexion confirmée"]
        reveal(end, in: app)
        end.tap()
        XCTAssertTrue(end.waitForNonExistence(timeout: 15))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.staticTexts["Aucun brouillon fictif"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.staticTexts["Brouillon fictif conservé"].exists)
    }

    @MainActor
    func testConfirmedWebSessionEndClearsWeeklyReminder() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let reminder = app.buttons["weekly-reminder-open"]
        reveal(reminder, in: app)
        reminder.tap()
        let save = app.buttons["weekly-reminder-save"]
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        reveal(save, in: app)
        save.tap()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.alerts.firstMatch.waitForExistence(timeout: 3) {
            let allow = springboard.alerts.buttons.matching(NSPredicate(format: "label == 'Autoriser' OR label == 'Allow'")).firstMatch
            XCTAssertTrue(allow.exists)
            allow.tap()
        }
        let reminderEnabled = app.buttons["weekly-reminder-disable"].waitForExistence(timeout: 10)
        if !reminderEnabled {
            let state = XCTAttachment(string: app.debugDescription)
            state.name = "Échec activation rappel — état interface"
            state.lifetime = .keepAlways
            add(state)
            let capture = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
            capture.name = "Échec activation rappel"
            capture.lifetime = .keepAlways
            add(capture)
        }
        XCTAssertTrue(reminderEnabled)
        app.terminate()
        app.launch()
        let invalid = app.buttons["Signal de fin invalide"]
        XCTAssertTrue(invalid.waitForExistence(timeout: 15))
        invalid.tap()
        let end = app.buttons["Simuler une déconnexion confirmée"]
        XCTAssertTrue(end.exists)
        end.tap()
        XCTAssertTrue(end.waitForNonExistence(timeout: 15), "Native cleanup replaces the old WebView")
        app.terminate()
        app.launch()
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        reveal(reminder, in: app)
        reminder.tap()
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Aucun rappel programmé"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["weekly-reminder-disable"].exists)
    }
    /// Run on the QA simulator where notification permission was explicitly denied.
    @MainActor
    func testWeeklyReminderWithPreviouslyDeniedPermission() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let reminder = app.buttons["weekly-reminder-open"]
        reveal(reminder, in: app)
        reminder.tap()
        let settings = app.buttons["Ouvrir les réglages de COAI"]
        // Form rows below the viewport are created lazily on small iPhones.
        for _ in 0..<4 {
            if settings.exists { break }
            app.swipeUp()
        }
        guard settings.waitForExistence(timeout: 5) else {
            throw XCTSkip("Ce scénario nécessite le simulateur QA dont les notifications sont refusées ; un test ignoré ne valide pas ce parcours.")
        }
        let save = app.buttons["weekly-reminder-save"]
        reveal(save, in: app, upward: false)
        save.tap()
        let message = app.staticTexts["weekly-reminder-message"]
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        XCTAssertEqual(message.label, "Notifications non autorisées. Aucun nouveau rappel n’a été programmé.")
        XCTAssertFalse(app.buttons["weekly-reminder-disable"].exists)
        XCTAssertFalse(app.staticTexts["Rappel enregistré sur cet iPhone."].exists)
        XCTAssertTrue(save.isEnabled)
        XCTAssertFalse(XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch.exists)
    }

    @MainActor
    func testWeeklyReminderSmallScreenLargeText() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        XCUIDevice.shared.orientation = .portrait
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let reminder = app.buttons["weekly-reminder-open"]
        reveal(reminder, in: app)
        reminder.tap()
        let save = app.buttons["weekly-reminder-save"]
        XCTAssertTrue(app.navigationBars["Mon rappel"].waitForExistence(timeout: 5))
        let intro = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        intro.name = "Rappel petit écran XXXL — introduction"
        intro.lifetime = .keepAlways
        add(intro)
        reveal(save, in: app)
        XCTAssertTrue(save.isHittable)
        XCTAssertGreaterThanOrEqual(save.frame.height, 44)
        XCTAssertGreaterThanOrEqual(save.frame.minX, 0)
        XCTAssertLessThanOrEqual(save.frame.maxX, app.frame.maxX)
        XCTAssertFalse(XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch.exists)
        let controls = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        controls.name = "Rappel petit écran XXXL — réglages"
        controls.lifetime = .keepAlways
        add(controls)
    }

    @MainActor
    func testWeeklyReminderChangedDaySurvivesRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        func openReminder() {
            let explorer = app.buttons["native-tab-Explorer"]
            XCTAssertTrue(explorer.waitForExistence(timeout: 15))
            explorer.tap()
            let reminder = app.buttons["weekly-reminder-open"]
            reveal(reminder, in: app)
            reminder.tap()
            XCTAssertTrue(app.buttons["weekly-reminder-save"].waitForExistence(timeout: 5))
        }
        openReminder()
        let save = app.buttons["weekly-reminder-save"]
        reveal(save, in: app)
        save.tap()
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.alerts.firstMatch.waitForExistence(timeout: 3) {
            let allow = springboard.alerts.buttons.matching(NSPredicate(format: "label IN %@", ["Autoriser", "Allow"])).firstMatch
            XCTAssertTrue(allow.exists)
            allow.tap()
        }
        XCTAssertTrue(app.buttons["weekly-reminder-disable"].waitForExistence(timeout: 10))
        let status = app.staticTexts["weekly-reminder-status"]
        let previous = status.label
        let chosenDay = previous.contains("mardi") ? "Jeudi" : "Mardi"
        let dayPicker = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Jour'")).firstMatch
        reveal(dayPicker, in: app)
        dayPicker.tap()
        app.buttons[chosenDay].tap()
        reveal(save, in: app)
        save.tap()
        let expected = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label CONTAINS %@", chosenDay.lowercased()), object: status)
        XCTAssertEqual(XCTWaiter.wait(for: [expected], timeout: 5), .completed)
        let changed = status.label
        XCTAssertNotEqual(changed, previous)
        app.terminate()
        app.launch()
        openReminder()
        let persisted = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label == %@", changed), object: status)
        XCTAssertEqual(XCTWaiter.wait(for: [persisted], timeout: 5), .completed)
        let disable = app.buttons["weekly-reminder-disable"]
        reveal(disable, in: app)
        disable.tap()
        XCTAssertTrue(app.staticTexts["Aucun rappel programmé"].waitForExistence(timeout: 5))
    }

    @MainActor
    func testWeeklyReminderIsOptInAndCanBeDisabled() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let reminder = app.buttons["weekly-reminder-open"]
        reveal(reminder, in: app)
        reminder.tap()
        let save = app.buttons["weekly-reminder-save"]
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        XCTAssertFalse(springboard.alerts.firstMatch.exists, "Opening settings must not request permission")
        reveal(save, in: app)
        save.tap()
        if springboard.alerts.firstMatch.waitForExistence(timeout: 3) {
            let allow = springboard.alerts.buttons.matching(NSPredicate(format: "label == 'Autoriser' OR label == 'Allow'")).firstMatch
            XCTAssertTrue(allow.exists)
            allow.tap()
        }
        let disable = app.buttons["weekly-reminder-disable"]
        XCTAssertTrue(disable.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Rappel enregistré sur cet iPhone."].exists)
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        screenshot.name = "Rappel hebdomadaire activé"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        reveal(disable, in: app)
        disable.tap()
        XCTAssertTrue(app.staticTexts["Aucun rappel programmé"].waitForExistence(timeout: 5))
        XCTAssertFalse(disable.exists)
        // Re-enable, then verify reset clears the OS schedule across relaunch.
        save.tap()
        XCTAssertTrue(disable.waitForExistence(timeout: 10))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Options COAI"].waitForExistence(timeout: 15))
        app.buttons["Options COAI"].tap()
        app.buttons["Réinitialiser les données locales"].tap()
        let confirmation = app.alerts.buttons["Effacer les données et me déconnecter"]
        XCTAssertTrue(confirmation.waitForExistence(timeout: 5))
        confirmation.tap()
        XCTAssertFalse(app.alerts.firstMatch.waitForExistence(timeout: 1))
        app.terminate()
        app.launch()
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        reveal(reminder, in: app)
        reminder.tap()
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Aucun rappel programmé"].exists)
        XCTAssertFalse(disable.exists)
    }

    @MainActor
    func testWebOfferLinkOpensNativeSubscription() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let link = app.links["Voir l’abonnement iOS"]
        XCTAssertTrue(link.waitForExistence(timeout: 15))
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(link.waitForExistence(timeout: 10))
        link.tap()
        XCTAssertTrue(app.staticTexts["apple-status"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.alerts.firstMatch.exists)
        app.buttons["Fermer"].tap()
        XCTAssertTrue(link.waitForExistence(timeout: 5))
    }

    @MainActor
    func testUnavailableSubscriptionCanOpenAccount() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let link = app.links["Voir l’abonnement iOS"]
        XCTAssertTrue(link.waitForExistence(timeout: 15))
        link.tap()
        let account = app.buttons["apple-open-account"]
        XCTAssertTrue(account.waitForExistence(timeout: 30))
        let retry = app.buttons["Réessayer"]
        reveal(retry, in: app)
        XCTAssertTrue(retry.isHittable)
        XCTAssertGreaterThanOrEqual(retry.frame.height, 44)
        for title in ["Restaurer mes achats Apple", "Gérer ou résilier dans Apple"] {
            let control = app.buttons[title]
            reveal(control, in: app)
            XCTAssertGreaterThanOrEqual(control.frame.height, 44, title)
        }
        reveal(account, in: app)
        XCTAssertTrue(account.isHittable)
        XCTAssertGreaterThanOrEqual(account.frame.height, 44)
        account.tap()
        XCTAssertTrue(account.waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.webViews.buttons["Continuer avec Google"].waitForExistence(timeout: 30))
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Compte accessible depuis offre indisponible"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        // Anonymous public navigation only. No credentials or purchase submitted.
    }

    @MainActor
    func testSubscriptionSmallScreenLargeText() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        XCUIDevice.shared.orientation = .portrait
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        explorer.tap()
        let subscription = app.buttons["explore-native:subscription"]
        reveal(subscription, in: app)
        subscription.tap()
        XCTAssertTrue(app.staticTexts["apple-status"].waitForExistence(timeout: 30))
        for title in ["Réessayer", "Conditions", "Confidentialité"] {
            let button = app.buttons[title]
            reveal(button, in: app)
            XCTAssertTrue(button.isHittable, title)
            XCTAssertGreaterThanOrEqual(button.frame.height, 44, title)
            XCTAssertGreaterThanOrEqual(button.frame.minX, 0, title)
            XCTAssertLessThanOrEqual(button.frame.maxX, app.frame.maxX, title)
        }
        XCTAssertGreaterThanOrEqual(app.buttons["Confidentialité"].frame.minY,
                                    app.buttons["Conditions"].frame.maxY,
                                    "Les liens doivent être empilés en taille d’accessibilité.")
        let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        screenshot.name = "Abonnement petit écran texte XXXL"
        screenshot.lifetime = .keepAlways
        add(screenshot)
        let close = app.buttons["Fermer"]
        XCTAssertTrue(close.isHittable)
        close.tap()
        XCTAssertTrue(explorer.waitForExistence(timeout: 5))
    }

    @MainActor
    func testSimulatorSafariRotationControl() throws {
        // Diagnostic control only: no URL, credentials or purchases submitted.
        // A failure here is not evidence that COAI itself prevents rotation.
        continueAfterFailure = false
        XCUIApplication().terminate()
        let safari = XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
        XCUIDevice.shared.orientation = .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        safari.activate()
        XCTAssertTrue(safari.windows.firstMatch.waitForExistence(timeout: 15))
        XCUIDevice.shared.orientation = .landscapeLeft
        let rotated = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            let frame = safari.windows.firstMatch.frame
            return frame.width > frame.height
        }, object: nil)
        let result = XCTWaiter.wait(for: [rotated], timeout: 10)
        let proof = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        proof.name = "Contrôle rotation indépendant — Safari"
        proof.lifetime = .keepAlways; add(proof)
        XCTAssertEqual(result, .completed, "Safari must rotate before attributing the simulator failure to COAI")
    }

    @MainActor
    func testNativeNavigationWithLargeTextAndRotation() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        XCUIDevice.shared.orientation = .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        app.launch()
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.waitForExistence(timeout: 15))
        for orientation in [UIDeviceOrientation.portrait, .landscapeLeft, .portrait] {
            XCUIDevice.shared.orientation = orientation
            let rotated = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
                let frame = app.webViews.firstMatch.frame
                return orientation == .landscapeLeft ? frame.width > frame.height : frame.height > frame.width
            }, object: nil)
            XCTAssertEqual(XCTWaiter.wait(for: [rotated], timeout: 10), .completed)
            XCTAssertTrue(explorer.waitForExistence(timeout: 5))
            let tabs = ["Séance", "Nutrition", "Récupération", "Coach", "Explorer"].map { app.buttons["native-tab-" + $0] }
            for (index, tab) in tabs.enumerated() {
                XCTAssertTrue(tab.isHittable)
                XCTAssertGreaterThanOrEqual(tab.frame.width, 44)
                XCTAssertGreaterThanOrEqual(tab.frame.height, 44)
                XCTAssertTrue(app.frame.contains(tab.frame), "La navigation doit rester dans l’écran.")
                if index > 0 { XCTAssertLessThanOrEqual(tabs[index - 1].frame.maxX, tab.frame.minX + 1) }
            }
            let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
            shot.name = "Navigation grand texte — orientation \(orientation.rawValue)"
            shot.lifetime = .keepAlways
            add(shot)
        }
        explorer.tap()
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app)
        XCTAssertTrue(settings.isHittable)
        app.buttons["Fermer"].tap()
        XCTAssertTrue(explorer.isHittable)
    }

    @MainActor
    func testNativeExplorerReplacesWebSidebarWithoutHidingContent() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        XCTAssertTrue(app.webViews.staticTexts["Test local de fichier"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.webViews.buttons["Ancienne navigation web"].exists)
        XCTAssertFalse(app.webViews.buttons["Navigation piliers dupliquée"].exists)
        XCTAssertTrue(app.webViews.buttons["Navigation contenu conservée"].exists)
        XCTAssertTrue(app.buttons["native-tab-Séance"].isHittable)
        let explorer = app.buttons["native-tab-Explorer"]
        XCTAssertTrue(explorer.isHittable)
        explorer.tap()
        for path in ["/dashboard", "/programme/entrainement", "/suivi/repcount", "/programme/alimentation", "/programme/recuperation", "/coach"] {
            let destination = app.buttons["explore-" + path]
            reveal(destination, in: app)
            XCTAssertTrue(destination.isHittable)
        }
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = "Explorer natif — rubriques principales"
        shot.lifetime = .keepAlways
        add(shot)
        let settings = app.buttons["explore-/compte/parametres"]
        reveal(settings, in: app, upward: false)
        XCTAssertTrue(settings.isHittable, "La déconnexion reste accessible dans Réglages.")
        app.buttons["Fermer"].tap()
        XCTAssertTrue(app.webViews.staticTexts["Test local de fichier"].exists)
        XCTAssertTrue(app.buttons["Repos"].isHittable)
        explorer.tap()
        let subscription = app.buttons["explore-native:subscription"]
        reveal(subscription, in: app)
        subscription.tap()
        XCTAssertTrue(app.staticTexts["COAI ESSENTIEL"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["apple-status"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.buttons["Choisir cette formule"].exists)
        XCTAssertFalse(app.buttons["Commencer mon essai"].exists)
        let restore = app.buttons["Restaurer mes achats Apple"]
        reveal(restore, in: app)
        XCTAssertFalse(restore.isEnabled)
        let subscriptionShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        subscriptionShot.name = "Abonnement natif — indisponibilité sans achat"
        subscriptionShot.lifetime = .keepAlways
        add(subscriptionShot)
        app.buttons["Fermer"].tap()
        XCTAssertTrue(app.buttons["Repos"].isHittable)
    }

    @MainActor
    func testNativeNavigationAlignmentAndActualPageSelection() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        let titles = ["Séance", "Nutrition", "Récupération", "Coach", "Explorer"]
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
        for (label, index) in [("Simuler les recettes", 1), ("Simuler la récupération", 2), ("Simuler le coach", 3)] {
            app.webViews.buttons[label].tap()
            expectation(for: selected, evaluatedWith: tabs[index])
            waitForExpectations(timeout: 5)
            for other in tabs.indices where other != index { XCTAssertFalse(tabs[other].isSelected) }
        }
        app.webViews.buttons["Simuler la connexion"].tap()
        expectation(for: NSPredicate(format: "selected == false"), evaluatedWith: tabs[3])
        waitForExpectations(timeout: 5)
        tabs[4].tap()
        XCTAssertTrue(app.navigationBars["Explorer"].waitForExistence(timeout: 5))
        let timerDestination = app.buttons["explore-native:timer"]
        reveal(timerDestination, in: app)
        let list = app.collectionViews.firstMatch
        if timerDestination.frame.minY < app.navigationBars["Explorer"].frame.maxY {
            list.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
                .press(forDuration: 0.1, thenDragTo: list.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.6)))
        }
        XCTAssertGreaterThanOrEqual(timerDestination.frame.minY, app.navigationBars["Explorer"].frame.maxY)
        timerDestination.tap()
        XCTAssertTrue(app.staticTexts["Ton temps de récupération"].waitForExistence(timeout: 5))
        app.buttons["Fermer"].tap()
        XCTAssertTrue(tabs[2].isHittable)
    }

    // Requires ios-page-failure-proxy.cjs and real local Next on port 3051.
    @MainActor
    func testLocalHTTPServerFailureRetriesRealLogin() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Page indisponible"].waitForExistence(timeout: 30))
        XCTAssertTrue(app.staticTexts["COAI rencontre un problème temporaire. Réessaie dans un instant. Le minuteur reste accessible."].exists)
        XCTAssertFalse(app.webViews.staticTexts["LOCAL_SYNTHETIC_503"].exists)
        XCTAssertTrue(app.buttons["Réessayer"].isHittable)
        app.buttons["Repos"].tap()
        XCTAssertTrue(app.staticTexts["Ton temps de récupération"].waitForExistence(timeout: 5))
        app.buttons["Fermer"].tap()
        app.buttons["Réessayer"].tap()
        XCTAssertTrue(app.webViews.textFields["EMAIL"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        XCTAssertTrue(app.webViews.buttons["Continuer avec Google"].exists)
        let proof = XCTAttachment(screenshot: app.screenshot())
        proof.name = "HTTP 503 — connexion réelle après reprise sans relance"
        proof.lifetime = .keepAlways
        add(proof)
    }

    // Start with loopback stopped, then restore it while this bounded test retries.
    // No injected network state, authentication, or replacement HTML.
    @MainActor
    func testLocalNetworkRestorationLoadsLoginWithoutRelaunch() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Page indisponible"].waitForExistence(timeout: 30))
        let email = app.webViews.textFields["EMAIL"]
        XCTAssertFalse(email.exists)
        for _ in 0..<30 {
            let retry = app.buttons["Réessayer"]
            if retry.isHittable { retry.tap() }
            if email.waitForExistence(timeout: 3) { break }
        }
        XCTAssertTrue(email.exists, "La restauration du serveur doit permettre de reprendre sans relancer l'app.")
        XCTAssertFalse(app.staticTexts["Page indisponible"].exists)
        XCTAssertTrue(app.webViews.buttons["Continuer avec Google"].exists)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Retour réseau local — connexion rechargée sans relance"
        capture.lifetime = .keepAlways
        add(capture)
    }

    // Run alone on a QA simulator with the loopback server stopped.
    // Never alter the user's network or production host to induce failure.
    // No injected error: exercises the real WebKit navigation failure.
    @MainActor
    func testUnavailableNetworkKeepsRecoveryControlsAccessible() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAILocalIntegration"]
        app.launch()
        XCTAssertTrue(app.navigationBars["COAI · test local"].waitForExistence(timeout: 10))
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
        // Loopback refusal can finish before XCTest observes the loading frame.
        // Do not require a transient disappearance; the second failure must be usable.
        XCTAssertTrue(error.waitForExistence(timeout: 30))
        XCTAssertTrue(app.buttons["Réessayer"].isHittable)
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
        // A rejected file must release the download slot, including after
        // backgrounding the app. Never share to a recipient in this test.
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(export.waitForExistence(timeout: 10))
        reveal(export, in: app)
        export.tap()
        XCTAssertTrue(file.waitForExistence(timeout: 10))
        XCTAssertEqual(file.label, "COAI-document")
        app.buttons.matching(NSPredicate(format: "label IN %@", ["Fermer", "Close"])).firstMatch.tap()
        XCTAssertTrue(export.waitForExistence(timeout: 5))
        XCTAssertTrue(export.isHittable)
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
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIAnonymousUITest"]
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
        for title in ["Séance", "Nutrition", "Récupération", "Coach", "Explorer"] {
            XCTAssertTrue(app.buttons["native-tab-" + title].waitForNonExistence(timeout: 5))
        }
        XCTAssertLessThanOrEqual(password.frame.maxY, app.keyboards.firstMatch.frame.minY)
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
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIAnonymousUITest"]
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
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIAnonymousUITest"]
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
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIAnonymousUITest"]
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
        // Repos is now in the top toolbar, not the bottom navigation.
        // Check every actual bottom tab rather than the obsolete timer label.
        for title in ["Séance", "Nutrition", "Récupération", "Coach", "Explorer"] {
            XCTAssertTrue(app.buttons["native-tab-" + title].waitForNonExistence(timeout: 5))
        }
        XCTAssertTrue(email.isHittable)
        XCTAssertLessThanOrEqual(email.frame.maxY, app.keyboards.firstMatch.frame.minY,
                                 "Le clavier ne doit pas recouvrir le champ email.")
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
    func testRestPresetsHaveEqualColumns() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture"]
        app.launch()
        XCTAssertTrue(app.buttons["Repos"].waitForExistence(timeout: 15))
        app.buttons["Repos"].tap()
        let buttons = ["0 min 30 s", "1 min 00 s", "1 min 30 s", "2 min 00 s"].map { app.buttons["Choisir " + $0] }
        XCTAssertTrue(buttons[0].waitForExistence(timeout: 5))
        for button in buttons {
            reveal(button, in: app)
            XCTAssertGreaterThanOrEqual(button.frame.height, 44)
            XCTAssertEqual(button.frame.width, buttons[0].frame.width, accuracy: 1)
        }
        XCTAssertEqual(buttons[0].frame.minY, buttons[1].frame.minY, accuracy: 1)
        XCTAssertEqual(buttons[2].frame.minY, buttons[3].frame.minY, accuracy: 1)
        XCTAssertEqual(buttons[0].frame.height, buttons[1].frame.height, accuracy: 1)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Durées de repos en deux colonnes"
        capture.lifetime = .keepAlways
        add(capture)
    }

    @MainActor
    func testRestPresetsStackWithAccessibilityText() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(fr)", "-AppleLocale", "fr_FR", "-COAIDownloadFixture",
                               "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        app.launch()
        XCTAssertTrue(app.buttons["Repos"].waitForExistence(timeout: 15))
        app.buttons["Repos"].tap()
        let buttons = ["0 min 30 s", "1 min 00 s", "1 min 30 s", "2 min 00 s"].map { app.buttons["Choisir " + $0] }
        for button in buttons {
            reveal(button, in: app)
            XCTAssertGreaterThanOrEqual(button.frame.height, 44)
            XCTAssertGreaterThanOrEqual(button.frame.minX, 0)
            XCTAssertLessThanOrEqual(button.frame.maxX, app.frame.maxX)
        }
        XCTAssertEqual(buttons[0].frame.minX, buttons[1].frame.minX, accuracy: 1)
        XCTAssertGreaterThanOrEqual(buttons[1].frame.minY, buttons[0].frame.maxY)
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Durées de repos texte XXXL"
        capture.lifetime = .keepAlways
        add(capture)
    }

    @MainActor
    private func revealWebControl(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<15 {
            if element.isHittable { return }
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let webFrame = app.webViews.firstMatch.frame
            let visibleBottom = min(380, webFrame.maxY - 20)
            let bottom = app.keyboards.firstMatch.exists ? min(visibleBottom, app.keyboards.firstMatch.frame.minY - 110) : visibleBottom
            let top = max(webFrame.minY + 20, bottom - 140)
            let high = origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: top))
            let low = origin.withOffset(CGVector(dx: app.frame.width * 0.9, dy: bottom))
            if element.frame.minY < app.webViews.firstMatch.frame.minY + 20 {
                high.press(forDuration: 0.05, thenDragTo: low)
            } else {
                low.press(forDuration: 0.05, thenDragTo: high)
            }
        }
        XCTAssertTrue(element.isHittable)
    }

    @MainActor
    private func reveal(_ element: XCUIElement, in app: XCUIApplication, upward: Bool = true) {
        for _ in 0..<5 {
            if element.isHittable { return }
            if app.keyboards.firstMatch.exists {
                // Keep the gesture above the keyboard instead of swiping its keys.
                let top = app.frame.minY + 160
                // The keyboard frame excludes prediction/accessory rows on iOS.
                let bottom = app.keyboards.firstMatch.frame.minY - 140
                let origin = app.coordinate(withNormalizedOffset: .zero)
                let high = origin.withOffset(CGVector(dx: app.frame.width * 0.85, dy: top))
                let low = origin.withOffset(CGVector(dx: app.frame.width * 0.85, dy: bottom))
                if upward { low.press(forDuration: 0.05, thenDragTo: high) }
                else { high.press(forDuration: 0.05, thenDragTo: low) }
            } else if upward { app.swipeUp() } else { app.swipeDown() }
        }
        XCTAssertTrue(element.isHittable)
    }
}
