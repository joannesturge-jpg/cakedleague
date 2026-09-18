-- Merges in rather than overwrites, in case other week themes get added
-- before this runs.
UPDATE "LeagueTemplate"
SET "weekThemes" = "weekThemes" || '{"3": "Yacht Rock", "4": "Mariah Carey Night", "6": "Dedication Night", "7": "Horror Movie Night"}'::jsonb
WHERE id = 'tpl_dwts';
