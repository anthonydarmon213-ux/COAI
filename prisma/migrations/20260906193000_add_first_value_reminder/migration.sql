-- AlterTable
ALTER TABLE "users" ADD COLUMN "firstValueReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_firstValueReminderSentAt_createdAt_idx" ON "users"("firstValueReminderSentAt", "createdAt");
