import XCTest

final class COAIUITests: XCTestCase {
    /// Requires local SMTP preflight and cleanup; does not confirm email or grant access.
    @MainActor
    func testLocalSignupReachesEmailConfirmation() throws {
        try localSignup(waitForReturn: false)
    }

    @MainActor
    func testLocalEmailLinkReturnsToOriginalSession() throws {
        try localSignup(waitForReturn: true)
    }

    @MainActor
    func testLocalSignupConsentCreatesAccount() throws {
        try localSignup(waitForReturn: true, finalize: true)
    }

    @MainActor
    func testLocalNewAccountDiagnosticReachesResult() throws {
        try localSignup(waitForReturn: true, finalize: true, diagnostic: true)
    }

    @MainActor
    private func localSignup(waitForReturn: Bool, finalize: Bool = false, diagnostic: Bool = false) throws {
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
            print("COAI_EMAIL_RETURN_READY")
            let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
            let open = springboard.alerts.buttons["Ouvrir"]
            let returnReady = XCTNSPredicateExpectation(
                predicate: NSPredicate { _, _ in
                    open.exists || web.staticTexts["Finalise ton compte"].exists
                }, object: nil)
            XCTAssertEqual(XCTWaiter.wait(for: [returnReady], timeout: 90), .completed)
            if open.exists { open.tap() }
            XCTAssertTrue(web.staticTexts["Finalise ton compte"].waitForExistence(timeout: 90))
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
                    expectation(for: saveVisible, evaluatedWith: nil)
                    waitForExpectations(timeout: 10)
                    tap(web.buttons["Enregistrer et continuer"])
                    XCTAssertTrue(web.links["Choisir mon accompagnement →"].waitForExistence(timeout: 30))
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

    /// Real authenticated PDF endpoint; never publish or choose a share recipient.
    @MainActor
    func testLocalConnectedAccountDeletionPersists() throws {
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
        XCTAssertTrue(email.waitForExistence(timeout: 30))
        app.terminate()
        app.launch()
        XCTAssertTrue(app.webViews.textFields["EMAIL"].waitForExistence(timeout: 30))
        XCTAssertFalse(app.webViews.buttons["Supprimer mon compte"].exists)
    }

    @MainActor
    func testLocalConnectedAccountExportShares() throws {
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
        filename.tap()
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
