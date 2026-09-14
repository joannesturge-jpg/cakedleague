-- WEEKLY_CATEGORIES support (Bake Off): member weekly predictions and the
-- admin-entered weekly answer key.

CREATE TABLE "LeagueMemberCategoryPick" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "starBakerPick" TEXT,
    "technicalPick" TEXT,
    "votedOffPick" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "LeagueMemberCategoryPick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeagueMemberCategoryPick_memberId_week_key" ON "LeagueMemberCategoryPick"("memberId", "week");
CREATE INDEX "LeagueMemberCategoryPick_memberId_idx" ON "LeagueMemberCategoryPick"("memberId");

ALTER TABLE "LeagueMemberCategoryPick" ADD CONSTRAINT "LeagueMemberCategoryPick_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LeagueTemplateWeeklyResult" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "actualStarBaker" TEXT,
    "actualTechnicalWinner" TEXT,
    "actualVotedOff" TEXT,
    "actualTechnicalLoser" TEXT,
    "handshakes" JSONB NOT NULL DEFAULT '{}',
    "templateId" TEXT NOT NULL,

    CONSTRAINT "LeagueTemplateWeeklyResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeagueTemplateWeeklyResult_templateId_week_key" ON "LeagueTemplateWeeklyResult"("templateId", "week");
CREATE INDEX "LeagueTemplateWeeklyResult_templateId_week_idx" ON "LeagueTemplateWeeklyResult"("templateId", "week");

ALTER TABLE "LeagueTemplateWeeklyResult" ADD CONSTRAINT "LeagueTemplateWeeklyResult_templateId_fkey"
    FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bake Off switches from roster drafting to weekly category predictions —
-- no ownership, everyone predicts from the whole cast every week. Default
-- due day moves to Thursday to match the real submission deadline.
UPDATE "LeagueTemplate" SET "pickFormat" = 'WEEKLY_CATEGORIES', "dueDay" = 'THURSDAY' WHERE "id" = 'tpl_gbbo';

-- Replace the old draft-scoring rule list (Star Baker/technical/handshake
-- toggles meant for the roster format) with the real weekly-prediction
-- scoring rules, for the Rules panel members see on their league page.
DELETE FROM "LeagueTemplateRule" WHERE "templateId" = 'tpl_gbbo';

INSERT INTO "LeagueTemplateRule" (id, label, points, "order", "templateId") VALUES
    ('tpl_gbbo_r1', 'Correct Star Baker pick', 5, 0, 'tpl_gbbo'),
    ('tpl_gbbo_r2', 'Correct technical winner pick', 3, 1, 'tpl_gbbo'),
    ('tpl_gbbo_r3', 'Correct voted off pick', 3, 2, 'tpl_gbbo'),
    ('tpl_gbbo_r4', 'All three picks correct in one week', 10, 3, 'tpl_gbbo'),
    ('tpl_gbbo_r5', 'Your Star Baker pick gets voted off', -5, 4, 'tpl_gbbo'),
    ('tpl_gbbo_r6', 'Your voted off pick was actually Star Baker', -3, 5, 'tpl_gbbo'),
    ('tpl_gbbo_r7', 'One of your picks came last in the technical', 2, 6, 'tpl_gbbo'),
    ('tpl_gbbo_r8', 'Each Hollywood handshake for one of your picks', 5, 7, 'tpl_gbbo')
ON CONFLICT (id) DO NOTHING;
