-- Contestants eliminated before eliminatedAtWeek existed (previous
-- migration) have no recorded week, so they were still being excluded
-- from every week's other scoring selections, including the week they
-- actually went out. Backfill their week from the admin's own "Actual
-- voted off" answer key, which already records per-week who left —
-- the most reliable source we have, and more deliberate than whichever
-- week happened to be selected when the elimination toggle was clicked.
UPDATE "LeagueTemplate" t
SET "eliminatedAtWeek" = t."eliminatedAtWeek" || COALESCE((
  SELECT jsonb_object_agg(r."actualVotedOff", r."week")
  FROM "LeagueTemplateWeeklyResult" r
  WHERE r."templateId" = t.id
    AND r."actualVotedOff" IS NOT NULL
    AND r."actualVotedOff" = ANY(t."eliminatedContestants")
), '{}'::jsonb)
WHERE EXISTS (
  SELECT 1 FROM "LeagueTemplateWeeklyResult" r
  WHERE r."templateId" = t.id AND r."actualVotedOff" IS NOT NULL
);
