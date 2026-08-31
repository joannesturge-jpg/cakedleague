-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "tag" TEXT;

-- AlterTable
ALTER TABLE "League" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "League" ADD COLUMN "tag" TEXT;

-- AlterTable
ALTER TABLE "LeagueRule" ADD COLUMN "isCustom" BOOLEAN NOT NULL DEFAULT false;
