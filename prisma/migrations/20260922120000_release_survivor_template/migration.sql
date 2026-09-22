-- Flip Survivor from "coming soon" to live — the scoring engine, the
-- top-four/weekly-pick UI, and the simplified admin scoring layout are
-- all wired up now, so it can go in the create-league wizard.
UPDATE "LeagueTemplate" SET "isActive" = true WHERE id = 'tpl_survivor';
