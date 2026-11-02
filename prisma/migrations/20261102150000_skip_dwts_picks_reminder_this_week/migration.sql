-- One-time skip: Joanne is emailing DWTS leagues herself this week, so
-- don't let the picks-due cron (app/api/cron/picks-due/route.ts) also
-- send its own reminder. The cron throttles on lastPicksReminderSentAt
-- (skips a league for 20 hours after it was last set), so bumping it to
-- now blocks today's/tonight's reminder without any code change or
-- permanent effect — it naturally stops blocking anything once 20 hours
-- pass, so next week's reminder goes out as normal.
UPDATE "League"
SET "lastPicksReminderSentAt" = now()
WHERE "tag" = 'DWTS' AND "deletedAt" IS NULL;
