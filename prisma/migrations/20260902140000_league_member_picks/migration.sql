-- CreateTable
CREATE TABLE "LeagueMemberPick" (
    "id" TEXT NOT NULL,
    "contestant" TEXT NOT NULL,
    "pickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "LeagueMemberPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMemberPick_leagueId_contestant_key" ON "LeagueMemberPick"("leagueId", "contestant");

-- CreateIndex
CREATE INDEX "LeagueMemberPick_leagueId_idx" ON "LeagueMemberPick"("leagueId");

-- CreateIndex
CREATE INDEX "LeagueMemberPick_memberId_idx" ON "LeagueMemberPick"("memberId");

-- AddForeignKey
ALTER TABLE "LeagueMemberPick" ADD CONSTRAINT "LeagueMemberPick_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMemberPick" ADD CONSTRAINT "LeagueMemberPick_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
