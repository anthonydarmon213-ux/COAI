DO $$ BEGIN
  CREATE TYPE "DailyChargeMentale" AS ENUM ('LEGERE', 'NORMALE', 'CHARGEE', 'SATUREE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "daily_sessions" ADD COLUMN "chargeMentale" "DailyChargeMentale";
