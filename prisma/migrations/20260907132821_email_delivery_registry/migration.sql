-- Additive; aucune donnée client existante n'est modifiée.
CREATE TABLE public.email_recipient_gates (
  "recipientKey" TEXT PRIMARY KEY,
  "nextAllowedAt" TIMESTAMP(3),
  "activeDeliveryKey" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.email_deliveries (
  "deliveryKey" TEXT PRIMARY KEY,
  "recipientKey" TEXT NOT NULL REFERENCES public.email_recipient_gates("recipientKey"),
  "kind" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'RESERVED'
    CHECK ("state" IN ('RESERVED', 'SENT', 'UNCERTAIN', 'FAILED', 'SUPPRESSED')),
  "providerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3)
);
CREATE INDEX email_deliveries_state_created_idx ON public.email_deliveries("state", "createdAt");
CREATE INDEX email_deliveries_recipient_idx ON public.email_deliveries("recipientKey");
CREATE UNIQUE INDEX email_deliveries_active_recipient_idx ON public.email_deliveries("recipientKey")
  WHERE "state" IN ('RESERVED', 'UNCERTAIN');

ALTER TABLE public.email_recipient_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_recipient_gates, public.email_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.email_recipient_gates, public.email_deliveries TO service_role;
