-- Phase 5B (11/08/2026) : attribution publicitaire (utm_source/medium/
-- campaign/content/term) sur users et diagnostic_leads. Additive, idempotente.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;

ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;
