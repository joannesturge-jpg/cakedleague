-- DWTS leagues were created with startDate left null (the wizard only
-- collects a startDate for custom, non-template leagues). The new weekly
-- picks-open gating anchors "week 1" to startDate, so without it every
-- week reads as always-open. Sept 9, 2026 (a Tuesday, before the actual
-- Sept 15 due date) safely anchors week 1's due date to Sept 15 without
-- guessing at the show's real premiere date. Guarded so it never
-- overwrites a startDate someone already set.
UPDATE "League"
SET "startDate" = '2026-09-09T07:00:00.000Z'
WHERE "tag" = 'DWTS' AND "startDate" IS NULL;
