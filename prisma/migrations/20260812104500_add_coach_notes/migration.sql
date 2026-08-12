CREATE TABLE "coach_notes" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coach_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coach_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "coach_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "coach_notes_clientId_createdAt_idx" ON "coach_notes"("clientId", "createdAt");
ALTER TABLE "coach_notes" ENABLE ROW LEVEL SECURITY;
