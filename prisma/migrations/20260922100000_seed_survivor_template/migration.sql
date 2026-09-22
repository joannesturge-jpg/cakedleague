-- New Survivor template — kept inactive ("coming soon") so it can't be
-- picked in the create-league wizard yet, but shows up in the public
-- /leagues "coming soon" notify list once that page stops filtering to
-- isActive-only templates.
--
-- Shape: same as DWTS (WEEKLY_TOP3) — a one-time pre-season top-four pick
-- (reuses LeagueMember.finalFourPicks) due before episode two, then a
-- weekly top-three "who to root for" pick each week. The actual scoring
-- engine for Survivor's rule set (immunity wins, idols, tribal votes,
-- etc.) isn't wired up yet — that's separate follow-up work for when
-- this goes live. Season length (13 weeks) is a placeholder to confirm
-- before launch.
INSERT INTO "LeagueTemplate"
  (id, name, subject, glyph, weeks, "scoringPerWeek", "dueDay", "draftMode", description, "isActive", "pickFormat", contestants, "createdAt")
VALUES
  (
    'tpl_survivor',
    'Survivor',
    'Survivor',
    '🔥',
    13,
    1,
    'WEDNESDAY',
    'FREE_FOR_ALL',
    'Lock your top four before the merge, then pick three castaways to root for every week.',
    false,
    'WEEKLY_TOP3',
    ARRAY[
      'Aaliyah Puglia',
      'Alexis Levine',
      'An "Thien An" Nguyen',
      'Ana Sani',
      'Angelica "Jelly" Loblack',
      'Brady Booker',
      'Carter Krull',
      'Cristian Chavez',
      'Danny "Kilby" Kilby',
      'Devin Way',
      'Eric Macksoud',
      'Jenna Doore',
      'Kristin Flickinger',
      'Lewis Kelly',
      'Linnea Capobianco',
      'Maggie Nestor',
      'Mike Pinsky',
      'Ori Jean-Charles',
      'Patt Cannaday',
      'Rob Antonson',
      'Sharonda Cox'
    ]::TEXT[],
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO "LeagueTemplateRule" (id, label, points, "order", "templateId") VALUES
  ('tpl_survivor_r1', 'Wins individual immunity', 5, 0, 'tpl_survivor'),
  ('tpl_survivor_r2', 'Finds a hidden immunity idol', 8, 1, 'tpl_survivor'),
  ('tpl_survivor_r3', 'Correctly plays an idol to negate votes', 5, 2, 'tpl_survivor'),
  ('tpl_survivor_r4', 'Plays an idol or advantage and it''s wasted (no votes negated)', -2, 3, 'tpl_survivor'),
  ('tpl_survivor_r5', 'Wins a reward or immunity via a fire-making or duel-style challenge', 4, 4, 'tpl_survivor'),
  ('tpl_survivor_r6', 'Survives the episode (not voted out)', 2, 5, 'tpl_survivor'),
  ('tpl_survivor_r7', 'Eliminated by tribal council vote', -3, 6, 'tpl_survivor'),
  ('tpl_survivor_r8', 'Medically evacuated or quits', -5, 7, 'tpl_survivor')
ON CONFLICT (id) DO NOTHING;
