-- Seed the two built-in league templates from the original design
-- (Bake Off, Dancing with the Stars). Uses fixed ids so this is safe to
-- run more than once via ON CONFLICT DO NOTHING.

INSERT INTO "LeagueTemplate"
  (id, name, subject, glyph, weeks, "scoringPerWeek", "dueDay", "draftMode", description, "isActive", "createdAt")
VALUES
  (
    'tpl_gbbo',
    'The Great British Bake Off',
    'The Great British Bake Off, S16',
    '🧁',
    10,
    1,
    'TUESDAY',
    'FREE_FOR_ALL',
    'Draft bakers, score signature, technical, and showstopper.',
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'tpl_dwts',
    'Dancing with the Stars',
    'Dancing with the Stars, S35',
    '💃',
    11,
    1,
    'MONDAY',
    'FREE_FOR_ALL',
    'Lock one couple as your season winner, then pick a new top three and a song prediction every week.',
    true,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO "LeagueTemplateRule" (id, label, points, "order", "templateId") VALUES
  ('tpl_gbbo_r1', 'Star Baker', 25, 0, 'tpl_gbbo'),
  ('tpl_gbbo_r2', 'Wins the technical', 15, 1, 'tpl_gbbo'),
  ('tpl_gbbo_r3', 'Top three in technical', 6, 2, 'tpl_gbbo'),
  ('tpl_gbbo_r4', 'Hollywood handshake', 20, 3, 'tpl_gbbo'),
  ('tpl_gbbo_r5', 'Soggy bottom called out', -5, 4, 'tpl_gbbo'),
  ('tpl_gbbo_r6', 'Sent home', -20, 5, 'tpl_gbbo'),
  ('tpl_dwts_r1', 'Each correct couple in your weekly top three', 10, 0, 'tpl_dwts'),
  ('tpl_dwts_r2', 'Weekly top three in exact order', 15, 1, 'tpl_dwts'),
  ('tpl_dwts_r3', 'Weekly song prediction is correct', 10, 2, 'tpl_dwts'),
  ('tpl_dwts_r4', 'Contestant injured in practice', 5, 3, 'tpl_dwts'),
  ('tpl_dwts_r5', 'Contestant falls during a dance', -5, 4, 'tpl_dwts'),
  ('tpl_dwts_r6', 'Your season winner pick is eliminated', -10, 5, 'tpl_dwts'),
  ('tpl_dwts_r7', 'Season winner pick is correct', 20, 6, 'tpl_dwts')
ON CONFLICT (id) DO NOTHING;
