-- Existing leagues default to Pacific — matches the assumption already
-- baked into the rest of the app (draft-open times, the DWTS lock date).
ALTER TABLE "League" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles';
