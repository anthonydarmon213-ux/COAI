ALTER TABLE "subscriptions"
ADD COLUMN "paymentFailedAt" TIMESTAMP(3),
ADD COLUMN "paymentRecoveryReminderSentAt" TIMESTAMP(3);

CREATE INDEX "subscriptions_status_paymentFailedAt_idx"
ON "subscriptions"("status", "paymentFailedAt");
