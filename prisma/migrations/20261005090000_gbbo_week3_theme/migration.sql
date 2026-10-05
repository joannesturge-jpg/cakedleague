UPDATE "LeagueTemplate"
SET "weekThemes" = "weekThemes" || '{"3": "Audience Choice Week"}'::jsonb
WHERE "id" = 'tpl_gbbo';
