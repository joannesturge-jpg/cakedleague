-- Only changes the default applied to new rows going forward — existing
-- LeagueMember rows keep whatever notifyPicksDue value they already have.
ALTER TABLE "LeagueMember" ALTER COLUMN "notifyPicksDue" SET DEFAULT false;
