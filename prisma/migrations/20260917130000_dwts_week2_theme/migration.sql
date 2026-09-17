-- Merges in rather than overwrites, in case other week themes get added
-- before this runs.
UPDATE "LeagueTemplate"
SET "weekThemes" = "weekThemes" || '{"2": "Viral Hits"}'::jsonb
WHERE id = 'tpl_dwts';
