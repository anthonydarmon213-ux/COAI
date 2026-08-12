ALTER TABLE "diagnostic_leads"
ADD COLUMN "conversionReminderSentAt" TIMESTAMP(3);

CREATE INDEX "diagnostic_leads_conversionReminderSentAt_createdAt_idx"
ON "diagnostic_leads"("conversionReminderSentAt", "createdAt");
