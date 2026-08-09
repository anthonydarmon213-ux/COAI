CREATE TABLE IF NOT EXISTS "diagnostic_leads" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "reponses" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "diagnostic_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "diagnostic_leads_email_idx" ON "diagnostic_leads"("email");
CREATE INDEX IF NOT EXISTS "diagnostic_leads_createdAt_idx" ON "diagnostic_leads"("createdAt");
