CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
ALTER TABLE "subscriptions"
ADD COLUMN "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY';
