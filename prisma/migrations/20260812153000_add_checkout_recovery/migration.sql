ALTER TABLE "users"
ADD COLUMN "checkoutStartedAt" TIMESTAMP(3),
ADD COLUMN "checkoutPlan" "SubscriptionPlan",
ADD COLUMN "checkoutBillingInterval" "BillingInterval",
ADD COLUMN "checkoutReminderSentAt" TIMESTAMP(3);

CREATE INDEX "users_checkoutStartedAt_checkoutReminderSentAt_idx"
ON "users"("checkoutStartedAt", "checkoutReminderSentAt");
