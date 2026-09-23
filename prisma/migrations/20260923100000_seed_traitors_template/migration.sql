-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "traitorContestants" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- New Traitors template, live immediately (not "coming soon"). No cast
-- list yet — contestants starts empty; add the real names (and mark who's
-- currently a Traitor) from the admin Scoring tab before real picks can
-- be made. Same WEEKLY_TOP3 shape as DWTS/Survivor: a one-time pre-season
-- "Traitors or Faithfuls win?" pick (reuses LeagueMember.winnerPick, +5),
-- then three weekly picks each with a distinct role (traitor-to-survive,
-- faithful-to-survive, predicted-to-go-home) instead of an unordered top
-- three.
INSERT INTO "LeagueTemplate"
  (id, name, subject, glyph, weeks, "scoringPerWeek", "dueDay", "draftMode", description, "isActive", "pickFormat", contestants, "createdAt")
VALUES
  (
    'tpl_traitors',
    'The Traitors',
    'The Traitors',
    '🗡️',
    12,
    1,
    'WEDNESDAY',
    'FREE_FOR_ALL',
    'Predict Traitors or Faithfuls at the start, then pick who survives, who gets murdered or banished, every week.',
    true,
    'WEEKLY_TOP3',
    ARRAY[]::TEXT[],
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

-- Rule set. Some are informational/engine-computed (shown in the league's
-- Rules panel and used for scoring math, but not a checkbox in the admin
-- Scoring grid); the rest are the actual weekly admin inputs.
INSERT INTO "LeagueTemplateRule" (id, label, points, "order", "templateId") VALUES
  ('tpl_traitors_r1', 'Traitors vs Faithfuls prediction correct', 5, 0, 'tpl_traitors'),
  ('tpl_traitors_r2', 'Selected to survive — survives the episode', 8, 1, 'tpl_traitors'),
  ('tpl_traitors_r3', 'Selected to survive — eliminated this episode', -5, 2, 'tpl_traitors'),
  ('tpl_traitors_r4', 'Earns a shield', 5, 3, 'tpl_traitors'),
  ('tpl_traitors_r5', 'Predicted player goes home', 8, 4, 'tpl_traitors'),
  ('tpl_traitors_r6', 'All three selections correct', 10, 5, 'tpl_traitors'),
  ('tpl_traitors_r7', 'First to speak at the Round Table', 3, 6, 'tpl_traitors'),
  ('tpl_traitors_r8', 'Receives 0 votes at the Round Table', 5, 7, 'tpl_traitors'),
  ('tpl_traitors_r9', 'Selected Faithful votes for a Traitor at Banishment', 5, 8, 'tpl_traitors'),
  ('tpl_traitors_r10', 'Selected Faithful votes for a Traitor — Banishment successful', 10, 9, 'tpl_traitors'),
  ('tpl_traitors_r11', 'Went home this week (banished or murdered)', 0, 10, 'tpl_traitors')
ON CONFLICT (id) DO NOTHING;
