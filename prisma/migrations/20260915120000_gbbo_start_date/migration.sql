-- The Bake Off public league's picks-due date was resolving to the
-- nearest Thursday from whenever someone looks (e.g. Sep 17), but the US
-- premiere isn't until Sep 25 and the real first due date is the Thursday
-- after episode 2 (Oct 1). Setting startDate lets nextDueDate() skip any
-- Thursday before the season actually starts. Also corrects dueTime,
-- which had been set to 8:00 PM instead of the intended 11:00 PM.
UPDATE "League"
SET "startDate" = '2026-09-25T07:00:00.000Z', "dueTime" = '23:00'
WHERE "tag" = 'GBBO';
