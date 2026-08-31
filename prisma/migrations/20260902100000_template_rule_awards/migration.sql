-- CreateTable
CREATE TABLE "LeagueTemplateRuleAward" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "contestant" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "LeagueTemplateRuleAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueTemplateRuleAward_ruleId_week_contestant_key" ON "LeagueTemplateRuleAward"("ruleId", "week", "contestant");

-- CreateIndex
CREATE INDEX "LeagueTemplateRuleAward_templateId_week_idx" ON "LeagueTemplateRuleAward"("templateId", "week");

-- AddForeignKey
ALTER TABLE "LeagueTemplateRuleAward" ADD CONSTRAINT "LeagueTemplateRuleAward_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "LeagueTemplateRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueTemplateRuleAward" ADD CONSTRAINT "LeagueTemplateRuleAward_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
