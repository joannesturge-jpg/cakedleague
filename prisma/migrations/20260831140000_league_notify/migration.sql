-- AlterTable
ALTER TABLE "League" ADD COLUMN "lastPicksReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LeagueMember" ADD COLUMN "notifyPicksDue" BOOLEAN NOT NULL DEFAULT true;
