-- CreateTable
CREATE TABLE "LeagueMemberRuleAward" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "LeagueMemberRuleAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMemberRuleAward_ruleId_memberId_key" ON "LeagueMemberRuleAward"("ruleId", "memberId");

-- CreateIndex
CREATE INDEX "LeagueMemberRuleAward_ruleId_idx" ON "LeagueMemberRuleAward"("ruleId");

-- CreateIndex
CREATE INDEX "LeagueMemberRuleAward_memberId_idx" ON "LeagueMemberRuleAward"("memberId");

-- AddForeignKey
ALTER TABLE "LeagueMemberRuleAward" ADD CONSTRAINT "LeagueMemberRuleAward_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LeagueRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMemberRuleAward" ADD CONSTRAINT "LeagueMemberRuleAward_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
