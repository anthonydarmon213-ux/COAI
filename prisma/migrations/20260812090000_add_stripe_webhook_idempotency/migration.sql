CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stripe_webhook_events_processedAt_idx"
ON "stripe_webhook_events"("processedAt");

-- Table exclusivement utilisée côté serveur via Prisma.
ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;
