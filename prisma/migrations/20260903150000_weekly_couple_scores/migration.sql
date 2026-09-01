-- CreateTable
CREATE TABLE "LeagueTemplateWeeklyScore" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "contestant" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "LeagueTemplateWeeklyScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueTemplateWeeklyScore_templateId_week_contestant_key" ON "LeagueTemplateWeeklyScore"("templateId", "week", "contestant");

-- CreateIndex
CREATE INDEX "LeagueTemplateWeeklyScore_templateId_week_idx" ON "LeagueTemplateWeeklyScore"("templateId", "week");

-- AddForeignKey
ALTER TABLE "LeagueTemplateWeeklyScore" ADD CONSTRAINT "LeagueTemplateWeeklyScore_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
