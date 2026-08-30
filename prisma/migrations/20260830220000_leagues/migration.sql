-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "notifyPicksDue" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyScoring" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyInvites" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "LeagueTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "glyph" TEXT NOT NULL DEFAULT '🎬',
    "weeks" INTEGER NOT NULL DEFAULT 8,
    "scoringPerWeek" INTEGER NOT NULL DEFAULT 1,
    "dueDay" TEXT NOT NULL DEFAULT 'SUNDAY',
    "draftMode" TEXT NOT NULL DEFAULT 'SNAKE',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueTemplateRule" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "LeagueTemplateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueRule" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "LeagueRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable League
ALTER TABLE "League"
  ADD COLUMN "glyph" TEXT NOT NULL DEFAULT '🎬',
  ADD COLUMN "description" TEXT,
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "inviteCode" TEXT,
  ADD COLUMN "weeks" INTEGER,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ADD COLUMN "scoringPerWeek" INTEGER,
  ADD COLUMN "dueDay" TEXT NOT NULL DEFAULT 'SUNDAY',
  ADD COLUMN "dueTime" TEXT NOT NULL DEFAULT '20:00',
  ADD COLUMN "draftMode" TEXT NOT NULL DEFAULT 'SNAKE',
  ADD COLUMN "draftModeDescription" TEXT,
  ADD COLUMN "entryFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "entryFeeAmount" INTEGER,
  ADD COLUMN "entryFeePayMethod" TEXT,
  ADD COLUMN "entryFeeHandle" TEXT,
  ADD COLUMN "prizeEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "prizePlaces" INTEGER,
  ADD COLUMN "prizeRules" JSONB,
  ADD COLUMN "templateId" TEXT;

-- Backfill inviteCode for any pre-existing rows before enforcing NOT NULL + UNIQUE
UPDATE "League" SET "inviteCode" = "id" WHERE "inviteCode" IS NULL;
ALTER TABLE "League" ALTER COLUMN "inviteCode" SET NOT NULL;
CREATE UNIQUE INDEX "League_inviteCode_key" ON "League"("inviteCode");

-- CreateIndex
CREATE INDEX "LeagueTemplateRule_templateId_idx" ON "LeagueTemplateRule"("templateId");

-- CreateIndex
CREATE INDEX "LeagueRule_leagueId_idx" ON "LeagueRule"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "LeagueMember_leagueId_idx" ON "LeagueMember"("leagueId");

-- CreateIndex
CREATE INDEX "LeagueMember_userId_idx" ON "LeagueMember"("userId");

-- CreateIndex
CREATE INDEX "League_templateId_idx" ON "League"("templateId");

-- AddForeignKey
ALTER TABLE "LeagueTemplateRule" ADD CONSTRAINT "LeagueTemplateRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueRule" ADD CONSTRAINT "LeagueRule_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LeagueTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
