CREATE TABLE "programme_purchases" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "programmePrincipal" TEXT NOT NULL,
  "programmeOffert" TEXT NOT NULL,
  "stripeCheckoutSessionId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT,
  "amountTotal" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'eur',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "programme_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "programme_purchases_stripeCheckoutSessionId_key"
  ON "programme_purchases"("stripeCheckoutSessionId");

CREATE UNIQUE INDEX "programme_purchases_stripePaymentIntentId_key"
  ON "programme_purchases"("stripePaymentIntentId");

CREATE INDEX "programme_purchases_userId_createdAt_idx"
  ON "programme_purchases"("userId", "createdAt");

ALTER TABLE "programme_purchases"
  ADD CONSTRAINT "programme_purchases_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
