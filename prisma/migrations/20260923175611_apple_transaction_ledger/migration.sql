-- Local preparation. Production migration requires separate approval.
BEGIN;
CREATE TABLE public.apple_transactions (
  "environment" TEXT NOT NULL CHECK ("environment" IN ('Sandbox', 'Production')),
  "transactionId" TEXT NOT NULL,
  "originalTransactionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "purchasedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "signedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "upgraded" BOOLEAN NOT NULL DEFAULT false,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT apple_transactions_pkey PRIMARY KEY ("environment", "transactionId"),
  CONSTRAINT "apple_transactions_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public.apple_purchase_accounts("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT apple_transaction_period CHECK ("expiresAt" > "purchasedAt")
);
CREATE INDEX "apple_transactions_environment_originalTransactionId_idx"
  ON public.apple_transactions ("environment", "originalTransactionId");
CREATE INDEX "apple_transactions_userId_environment_expiresAt_idx"
  ON public.apple_transactions ("userId", "environment", "expiresAt");
ALTER TABLE public.apple_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.apple_transactions FROM PUBLIC, anon, authenticated;
COMMIT;
