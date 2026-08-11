-- Protection contre les doubles envois de l'email de résumé diagnostic
-- (Phase 5.1, 11/08/2026).
ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "resultEmailSentAt" TIMESTAMP(3);
