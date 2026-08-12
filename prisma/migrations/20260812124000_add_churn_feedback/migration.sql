CREATE TABLE "churn_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "churn_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "churn_feedback_userId_key" ON "churn_feedback"("userId");
CREATE INDEX "churn_feedback_reason_createdAt_idx" ON "churn_feedback"("reason", "createdAt");
ALTER TABLE "churn_feedback" ADD CONSTRAINT "churn_feedback_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Accès exclusivement via les routes serveur authentifiées.
ALTER TABLE "churn_feedback" ENABLE ROW LEVEL SECURITY;
