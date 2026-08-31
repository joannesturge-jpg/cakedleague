-- AlterTable
ALTER TABLE "LeagueTemplate" ADD COLUMN "eliminatedContestants" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "LeagueTemplate" ADD COLUMN "draftOpenDay" TEXT;
ALTER TABLE "LeagueTemplate" ADD COLUMN "draftOpenTime" TEXT;

-- Tag, placeholder contestants, and draft-open windows for the two
-- built-in templates. Safe to run more than once — only touches the
-- two known seed rows.
UPDATE "LeagueTemplate" SET
  "tag" = 'GBBO',
  "contestants" = ARRAY[
    'Baker 1','Baker 2','Baker 3','Baker 4','Baker 5','Baker 6',
    'Baker 7','Baker 8','Baker 9','Baker 10','Baker 11','Baker 12'
  ],
  "draftOpenDay" = 'SATURDAY',
  "draftOpenTime" = '06:00'
WHERE id = 'tpl_gbbo';

UPDATE "LeagueTemplate" SET
  "tag" = 'DWTS',
  "contestants" = ARRAY[
    'Celebrity 1 A. & Pro 1 B.','Celebrity 2 C. & Pro 2 D.','Celebrity 3 E. & Pro 3 F.',
    'Celebrity 4 G. & Pro 4 H.','Celebrity 5 I. & Pro 5 J.','Celebrity 6 K. & Pro 6 L.',
    'Celebrity 7 M. & Pro 7 N.','Celebrity 8 O. & Pro 8 P.','Celebrity 9 Q. & Pro 9 R.',
    'Celebrity 10 S. & Pro 10 T.','Celebrity 11 U. & Pro 11 V.'
  ],
  "draftOpenDay" = 'WEDNESDAY',
  "draftOpenTime" = '09:00'
WHERE id = 'tpl_dwts';
