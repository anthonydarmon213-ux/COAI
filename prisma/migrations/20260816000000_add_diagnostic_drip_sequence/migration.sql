-- Additive : nouvelles colonnes nullables, aucune donnée existante impactée.
ALTER TABLE "diagnostic_leads" ADD COLUMN "drip3SentAt" TIMESTAMP(3);
ALTER TABLE "diagnostic_leads" ADD COLUMN "drip5SentAt" TIMESTAMP(3);
ALTER TABLE "diagnostic_leads" ADD COLUMN "drip7SentAt" TIMESTAMP(3);
ALTER TABLE "diagnostic_leads" ADD COLUMN "optedOutAt" TIMESTAMP(3);

CREATE INDEX "diagnostic_leads_drip3SentAt_createdAt_idx" ON "diagnostic_leads"("drip3SentAt", "createdAt");
CREATE INDEX "diagnostic_leads_drip5SentAt_createdAt_idx" ON "diagnostic_leads"("drip5SentAt", "createdAt");
CREATE INDEX "diagnostic_leads_drip7SentAt_createdAt_idx" ON "diagnostic_leads"("drip7SentAt", "createdAt");
