-- Two leagues Joanne created weren't tagged/linked to the real DWTS
-- template (tpl_dwts) — the one the admin Scoring screen actually enters
-- results against — which is why their standings stayed at 0 despite real
-- picks and real scores. Relinking them by id.
UPDATE "League"
SET "tag" = 'DWTS', "templateId" = 'tpl_dwts'
WHERE id IN ('cmthtuwy800011ljsr9p38y1e', 'cmtgick3o0001walkmw8zc5ya');
