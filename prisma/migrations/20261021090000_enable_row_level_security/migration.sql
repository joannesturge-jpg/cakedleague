-- Supabase flagged every table in the public schema as publicly
-- readable/writable, because Supabase automatically exposes every
-- public-schema table over its REST API (PostgREST) unless Row-Level
-- Security is turned on for it. This app never uses that REST API — it
-- talks to Postgres directly through Prisma, as the table-owning role,
-- which bypasses RLS entirely — so enabling RLS with no policies closes
-- the public REST hole without changing how the app itself behaves.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotifySignup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueTemplateRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueTemplateRuleAward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueTemplateWeeklyScore" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueTemplateWeeklyResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "League" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMemberRuleAward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMemberAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMemberPick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMemberWeeklyPick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeagueMemberCategoryPick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SuppressedEmail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
