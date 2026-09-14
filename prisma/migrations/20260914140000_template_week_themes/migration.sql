ALTER TABLE "LeagueTemplate" ADD COLUMN "weekThemes" JSONB NOT NULL DEFAULT '{}';

-- Seed what's known so far.
UPDATE "LeagueTemplate" SET "weekThemes" = '{"1": "Cake Week"}' WHERE "id" = 'tpl_gbbo';
