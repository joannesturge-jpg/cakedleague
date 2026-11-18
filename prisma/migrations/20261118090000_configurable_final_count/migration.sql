ALTER TABLE "LeagueTemplate" ADD COLUMN "finalCount" INTEGER NOT NULL DEFAULT 4;

-- DWTS runs a final five this season instead of the usual final four.
UPDATE "LeagueTemplate" SET "finalCount" = 5 WHERE id = 'tpl_dwts';
