-- Renaming a template's contestants (e.g. replacing early placeholder
-- names like "Celebrity 11 U. & Pro 11 V." with real ones) never touched
-- old LeagueTemplateWeeklyScore/RuleAward rows entered under the old
-- names — they're plain strings, not foreign keys. Those orphaned rows
-- sat alongside real scores for the same week, and since they can't
-- match anything a member could actually pick, a high leftover
-- placeholder score could steal a real top-three spot and zero out
-- everyone's points for that week. Deleting anything that no longer
-- names a contestant currently on the template.
DELETE FROM "LeagueTemplateWeeklyScore" s
WHERE NOT EXISTS (
  SELECT 1 FROM "LeagueTemplate" t
  WHERE t.id = s."templateId" AND s."contestant" = ANY (t."contestants")
);

DELETE FROM "LeagueTemplateRuleAward" a
WHERE NOT EXISTS (
  SELECT 1 FROM "LeagueTemplate" t
  WHERE t.id = a."templateId" AND a."contestant" = ANY (t."contestants")
);
