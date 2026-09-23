-- Real Traitors cast list. "Kim DailyKriste Lewis" in the source paste
-- was two contestants (Kim Daily, Kriste Lewis) merged by a copy/paste
-- artifact — split back out below.
UPDATE "LeagueTemplate"
SET contestants = ARRAY[
  'Abbey Benjamin',
  'Abby Lee',
  'Arisa Thomas',
  'Ben McDonnell',
  'Clyde Moser',
  'Jay Vinnedge',
  'Joe Vanella',
  'Katie Fites',
  'Kim Daily',
  'Kriste Lewis',
  'Logan Smith',
  'Madeline Kostopulos',
  'Mark Zgoda',
  'Michael Foote',
  'Morgan Cook',
  'Niyyah Hayes',
  'Shane Beatty',
  'Sherry Kuehl',
  'Tomica Adams',
  'Victor Vollbrechthausen',
  'Wyatt Gillespie',
  'Xavier Scruggs'
]::TEXT[]
WHERE id = 'tpl_traitors';
