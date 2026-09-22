-- Tags the Survivor template the same way GBBO/DWTS are tagged, so admin
-- scoring can key its Survivor-specific layout off template.tag.
UPDATE "LeagueTemplate" SET "tag" = 'SRVR' WHERE id = 'tpl_survivor';
