-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "actualFinalFour" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LeagueTemplate" ADD COLUMN "actualWinner" TEXT;

-- AlterTable
ALTER TABLE "LeagueMember" ADD COLUMN "finalFourPicks" TEXT[] DEFAULT ARRAY[]::TEXT[];
