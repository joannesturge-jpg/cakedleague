-- Tag a specific league as a Traitors (TRTRS) league. Requested directly
-- by id — this league's tag was set at creation and wasn't carrying the
-- TRTRS value, so it wasn't showing up correctly in the admin Leagues tab.
UPDATE "League" SET "tag" = 'TRTRS' WHERE id = 'cmuea59dy000e7n05bz59r8q7';
