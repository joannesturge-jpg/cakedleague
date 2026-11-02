-- Catch-up scoring for Bake Off weeks 4-6 (Joanne had already entered
-- weeks 1-3 herself), sourced from real air-date news coverage. Technical
-- last-place is left null for all three weeks where sourcing wasn't solid
-- enough to be confident in a specific name.
INSERT INTO "LeagueTemplateWeeklyResult"
  (id, week, "actualStarBaker", "actualTechnicalWinner", "actualVotedOff", "actualTechnicalLoser", handshakes, "templateId")
VALUES
  ('tpl_gbbo_wr4', 4, 'Tom', 'Gabe', 'Molly', NULL, '{}'::jsonb, 'tpl_gbbo'),
  ('tpl_gbbo_wr5', 5, 'Connie', 'Gary', 'Yannis', NULL, '{"Connie": 1}'::jsonb, 'tpl_gbbo'),
  ('tpl_gbbo_wr6', 6, 'Tom', 'Moyin', 'Clara', NULL, '{"Tom": 1}'::jsonb, 'tpl_gbbo')
ON CONFLICT ("templateId", "week") DO UPDATE SET
  "actualStarBaker" = EXCLUDED."actualStarBaker",
  "actualTechnicalWinner" = EXCLUDED."actualTechnicalWinner",
  "actualVotedOff" = EXCLUDED."actualVotedOff",
  "actualTechnicalLoser" = EXCLUDED."actualTechnicalLoser",
  handshakes = EXCLUDED.handshakes;

-- Nikki also left (withdrew for personal reasons) during week 4, alongside
-- Molly's elimination — not a "voted off" result, but she's no longer in
-- the competition, so she's marked eliminated too.
UPDATE "LeagueTemplate"
SET "eliminatedContestants" = (
  SELECT array_agg(DISTINCT c) FROM unnest("eliminatedContestants" || ARRAY['Molly', 'Nikki', 'Yannis', 'Clara']) AS c
),
"eliminatedAtWeek" = "eliminatedAtWeek" || '{"Molly": 4, "Nikki": 4, "Yannis": 5, "Clara": 6}'::jsonb
WHERE id = 'tpl_gbbo';
