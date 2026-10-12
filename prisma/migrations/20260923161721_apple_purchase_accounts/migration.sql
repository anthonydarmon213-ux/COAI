-- Preparation only: production deployment requires separate approval.
-- No price, plan, entitlement or Stripe record is changed here.
BEGIN;
CREATE TABLE public.apple_purchase_accounts (
  "userId" TEXT NOT NULL,
  "accountToken" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT apple_purchase_accounts_pkey PRIMARY KEY ("userId"),
  CONSTRAINT apple_purchase_accounts_userId_fkey FOREIGN KEY ("userId")
    REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "apple_purchase_accounts_accountToken_key"
  ON public.apple_purchase_accounts ("accountToken");
ALTER TABLE public.apple_purchase_accounts ENABLE ROW LEVEL SECURITY;
-- Account tokens are server-assigned, never browser-editable. There are no
-- Data API policies: a future authenticated server route must supply them.
REVOKE ALL ON TABLE public.apple_purchase_accounts FROM PUBLIC, anon, authenticated;
COMMIT;
