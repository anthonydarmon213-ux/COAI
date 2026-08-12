CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "kind" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_events_occurredAt_idx" ON "billing_events"("occurredAt");
CREATE INDEX "billing_events_kind_occurredAt_idx" ON "billing_events"("kind", "occurredAt");

-- Données financières internes accessibles uniquement côté serveur.
ALTER TABLE "billing_events" ENABLE ROW LEVEL SECURITY;
