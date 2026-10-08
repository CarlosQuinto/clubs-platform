-- Rentas de cancha: se cobran siempre a quien aparta (se retira «Cobrar a», court_holds.club_id) y pueden
-- apartarse con un anticipo (court_holds.deposit; NULL = se pagó todo al apartar). El resto se cobra después
-- desde el apartado o en Finanzas (1013_fn_admin.sql y 1015_fn_finance.sql).
SET ROLE postgres;

ALTER TABLE court_holds ADD COLUMN deposit numeric(12,2);
ALTER TABLE court_holds ADD CONSTRAINT court_holds_deposit_chk CHECK (deposit IS NULL OR deposit > 0);

-- Cargos de renta a nombre de un club: el vigente (el del club que tiene hoy la renta) pasa a quien apartó; los
-- demás con la misma clave (de un cambio de club) salen de la clave y quedan como historial. Así ninguno choca
-- en league_charges_source_idx cuando league_sync_hold busca el cargo sin club.
UPDATE league_charges c
SET source_key = NULL, updated_at = now()
FROM court_holds h
WHERE c.kind = 'COURT_RENTAL' AND c.source_key = 'hold:' || h.id
  AND c.club_id IS DISTINCT FROM h.club_id;

UPDATE league_charges c
SET club_id = NULL,
    payer_name = left(coalesce(nullif(split_part(h.note, ' · ', 1), ''), 'Externo'), 160),
    payer_contact = left(h.guest_email, 160),
    updated_at = now()
FROM court_holds h
WHERE c.kind = 'COURT_RENTAL' AND c.source_key = 'hold:' || h.id
  AND h.club_id IS NOT NULL AND c.club_id = h.club_id;

-- El trigger viejo lee court_holds.club_id: se quita antes de la columna y 1015_fn_finance.sql lo vuelve a crear.
-- Si un archivo 1* fallara después, apartar canchas y programar partidos seguiría funcionando.
DROP TRIGGER IF EXISTS league_court_holds_sync ON court_holds;
ALTER TABLE court_holds DROP COLUMN club_id;

RESET ROLE;
