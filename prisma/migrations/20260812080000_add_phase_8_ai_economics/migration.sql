-- Phase 8 — suivi des coûts IA sans stocker les prompts ni les réponses.
CREATE TABLE IF NOT EXISTS "ai_usage_events" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "feature" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "estimatedCostUsdMicros" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ai_usage_events_createdAt_idx" ON "ai_usage_events"("createdAt");
CREATE INDEX IF NOT EXISTS "ai_usage_events_userId_createdAt_idx" ON "ai_usage_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ai_usage_events_feature_createdAt_idx" ON "ai_usage_events"("feature", "createdAt");

ALTER TABLE "ai_usage_events" ENABLE ROW LEVEL SECURITY;
