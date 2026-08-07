CREATE TABLE IF NOT EXISTS "videos" (
  "id" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "description" TEXT,
  "youtubeId" TEXT NOT NULL,
  "categorie" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);
