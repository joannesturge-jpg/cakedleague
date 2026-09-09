-- Existing sessions stay valid (everyone starts at version 0, matching the
-- default new tokens are signed with) — only a future password reset bumps
-- this and invalidates sessions issued before it.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
