-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "contestants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
