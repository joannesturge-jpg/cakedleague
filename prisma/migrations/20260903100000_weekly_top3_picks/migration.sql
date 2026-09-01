-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "pickFormat" TEXT NOT NULL DEFAULT 'ROSTER';

-- AlterTable
ALTER TABLE "LeagueMember" ADD COLUMN "winnerPick" TEXT;

-- CreateTable
CREATE TABLE "LeagueMemberWeeklyPick" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "topThree" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "songPrediction" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "LeagueMemberWeeklyPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMemberWeeklyPick_memberId_week_key" ON "LeagueMemberWeeklyPick"("memberId", "week");

-- CreateIndex
CREATE INDEX "LeagueMemberWeeklyPick_memberId_idx" ON "LeagueMemberWeeklyPick"("memberId");

-- AddForeignKey
ALTER TABLE "LeagueMemberWeeklyPick" ADD CONSTRAINT "LeagueMemberWeeklyPick_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mark the DWTS template as the weekly top-3 format.
UPDATE "LeagueTemplate" SET "pickFormat" = 'WEEKLY_TOP3' WHERE id = 'tpl_dwts';
