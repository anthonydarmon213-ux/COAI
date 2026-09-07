-- Foreign-key indexes required for scalable joins and cascading deletes.
CREATE INDEX IF NOT EXISTS "users_parraineParId_idx" ON "users"("parraineParId");
CREATE INDEX IF NOT EXISTS "coach_notes_authorId_idx" ON "coach_notes"("authorId");
CREATE INDEX IF NOT EXISTS "avis_userId_idx" ON "avis"("userId");
CREATE INDEX IF NOT EXISTS "mesures_userId_idx" ON "mesures"("userId");
CREATE INDEX IF NOT EXISTS "tests_maxi_userId_idx" ON "tests_maxi"("userId");
CREATE INDEX IF NOT EXISTS "whatsapp_events_userId_idx" ON "whatsapp_events"("userId");
