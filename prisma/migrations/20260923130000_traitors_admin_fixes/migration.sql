-- The Traitors template was seeded without its tag, so every isTraitors
-- check in the app (which reads template.tag === 'TRTRS') was silently
-- false — the admin scoring page and member pick form have been showing
-- the DWTS layout this whole time. This is the actual fix.
UPDATE "LeagueTemplate" SET "tag" = 'TRTRS' WHERE id = 'tpl_traitors';

-- Drop the pre-season "prediction correct" rule row — it was only ever
-- informational (the scoring engine hardcodes the +5, it doesn't read
-- this row), and it's confusing sitting in the Rules list.
DELETE FROM "LeagueTemplateRule" WHERE id = 'tpl_traitors_r1';

-- Drop "voted for a Traitor at Banishment" (both strengths) — there's no
-- admin input that could ever set these, and the commissioner doesn't
-- want to track who voted for whom.
DELETE FROM "LeagueTemplateRule" WHERE id IN ('tpl_traitors_r9', 'tpl_traitors_r10');

-- New weekly admin input: mark a contestant as playing as a Traitor.
-- Check it once (the season's starting traitors, or whenever someone
-- gets recruited) — the member pick form treats it as sticky forward
-- from that week on, not something to re-check every week.
INSERT INTO "LeagueTemplateRule" (id, label, points, "order", "templateId") VALUES
  ('tpl_traitors_r12', 'Traitor as of this week', 0, 11, 'tpl_traitors')
ON CONFLICT (id) DO NOTHING;

-- The old single "currently a traitor" toggle is replaced by the
-- per-week rule above.
ALTER TABLE "LeagueTemplate" DROP COLUMN "traitorContestants";
