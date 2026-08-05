-- Téléphone/WhatsApp facultatif et preuve du consentement à être contacté.
ALTER TABLE "founder_waitlist_entries"
ADD COLUMN "phone" TEXT,
ADD COLUMN "contactConsentAt" TIMESTAMP(3);
