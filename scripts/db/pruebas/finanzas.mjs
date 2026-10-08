// Pruebas de las finanzas de la liga (0007_finanzas_liga.sql y 1015_fn_finance.sql) sobre los datos dummy.
// Todo se registra solo: uso de cancha (costo de la cancha × duración, sin tarifa), rentas (pagadas al apartar,
// todo o un anticipo) y
// anuncios con precio; arbitraje, tarjetas, no presentarse, inscripción y registro del club (un solo pago
// al darse de alta en la plataforma) con su tarifa.
// Al guardar una tarifa se registra lo que ya pasó en la temporada. Al final se dejan las tarifas como estaban
// y los partidos tocados como venían, para no afectar a las demás pruebas.

const HALCONES = "dummy-club-halcones";

export async function run({ db, rpc, check }) {
  const one = async (sql, params = []) => (await db.query(sql, params)).rows[0];
  const all = async (sql, params = []) => (await db.query(sql, params)).rows;
  const season = (await one("SELECT league_season_on(CURRENT_DATE) AS id")).id;
  if (!season) {
    check(true, "sin temporada vigente: se omiten las pruebas de finanzas");
    return;
  }
  const charges = (where, params = []) => all(
    `SELECT c.id, c.kind::text AS kind, c.status::text AS status, c.club_id, c.amount::float AS amount, c.source_key,
       c.tournament_id, c.season_id, c.concept, to_char(c.charged_on, 'YYYY-MM-DD') AS charged_on,
       (SELECT coalesce(sum(lp.amount), 0)::float FROM league_payments lp WHERE lp.charge_id = c.id) AS paid
     FROM league_charges c WHERE ${where} ORDER BY c.kind, c.club_id`, params);
  const fee = (kind, vars = {}) => rpc("admin", "save_league_fee", { seasonId: season, kind, enabled: true, amount: 0, ...vars });
  const today = (await one("SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS d")).d;
  const month = today.slice(0, 7);
  const snapshot = async (id) => one("SELECT id, status, walkover, no_show, home_score, away_score, match_date, court_id FROM matches WHERE id = $1", [id]);
  const restore = [];

  // ---------- Permisos ----------
  const setupPres = await rpc("presidente", "admin_finance_setup", {});
  check(setupPres.error?.code === "42501", "admin_finance_setup: presidente -> 42501", setupPres.error ?? setupPres.data);
  const setup = await rpc("admin", "admin_finance_setup", {});
  check(setup.data?.seasonId === season && Array.isArray(setup.data.fees), "admin_finance_setup: la temporada de hoy por defecto", setup.data ?? setup.error);
  for (const fn of ["admin_league_charges", "admin_league_expenses", "admin_finance_summary"]) {
    const r = await rpc("tesorero", fn, { scope: "TOTAL" });
    check(r.error?.code === "42501", `${fn}: tesorero -> 42501`, r.error ?? r.data);
  }
  for (const [fn, vars] of [
    ["save_league_fee", { seasonId: season, kind: "MATCH_REFEREE", enabled: true, amount: 1 }],
    ["set_league_charge_paid", { id: "x", paid: true }],
  ]) {
    const r = await rpc("presidente", fn, vars);
    check(r.data?.fee === null || r.data?.charge === null, `${fn}: presidente -> null`, r.data ?? r.error);
  }
  for (const fn of ["generate_season_charges", "generate_monthly_page_charges"]) {
    const gone = await one("SELECT count(*)::int AS n FROM pg_proc WHERE proname = $1", [fn]);
    check(gone.n === 0, `${fn} ya no existe`, gone);
  }

  // ---------- Uso de cancha: solo, sin tarifa ----------
  const played = await one(`
    SELECT m.id, m.home_club_id, m.away_club_id, co.hourly_rate::float AS rate, t.duration_minutes AS minutes
    FROM matches m JOIN tournaments t ON t.id = m.tournament_id JOIN courts co ON co.id = m.court_id
    WHERE m.status = 'PLAYED' AND NOT m.walkover AND t.season_id = $1 AND co.hourly_rate > 0
    ORDER BY m.id LIMIT 1`, [season]);
  let mc = await charges("c.match_id = $1 AND c.kind = 'MATCH_COURT'", [played.id]);
  const half = Math.round((played.rate * played.minutes / 60 / 2) * 100) / 100;
  check(mc.length === 2 && mc.every((c) => c.amount === half && c.status === "PENDIENTE"),
    "partido jugado: uso de cancha a medias con el costo de la cancha × duración, sin tarifa", { mc, half });
  const noReferee = await charges("c.kind = 'MATCH_REFEREE'");
  check(noReferee.length === 0, "sin tarifa de arbitraje no hay cargos de arbitraje", noReferee.length);

  // ---------- Tarifas: tipos que quedan ----------
  for (const [label, vars] of [
    ["tipo inventado", { kind: "FOO", amount: 10 }],
    ["página del club (ya no se cobra)", { kind: "CLUB_PAGE", amount: 10 }],
    ["inscripción a la temporada (ya no)", { kind: "SEASON_ENROLLMENT", amount: 10 }],
    ["fianza (ya no)", { kind: "DEPOSIT", amount: 10 }],
    ["monto con letras", { kind: "MATCH_REFEREE", amount: "abc" }],
    ["monto negativo", { kind: "MATCH_REFEREE", amount: -5 }],
    ["enabled como texto", { kind: "MATCH_REFEREE", amount: 10, enabled: "si" }],
    ["temporada inexistente", { kind: "MATCH_REFEREE", amount: 10, seasonId: "no-existe" }],
  ]) {
    const r = await fee(vars.kind, vars);
    check(r.data?.fee === null, `save_league_fee: ${label} -> null`, r.data ?? r.error);
  }

  // ---------- Lo que ya pasó: arbitraje de partidos jugados ----------
  const playedCount = (await one(`SELECT count(*)::int AS n FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE t.season_id = $1 AND m.status = 'PLAYED' AND NOT m.walkover`, [season])).n;
  let r = await fee("MATCH_REFEREE", { amount: 200, splitMode: "EACH" });
  check(r.data?.fee?.kind === "MATCH_REFEREE" && r.data.created === playedCount * 2,
    "activar arbitraje registra los partidos ya jugados (2 por partido)", { data: r.data, playedCount });
  r = await fee("MATCH_REFEREE", { amount: 200, splitMode: "EACH" });
  check(r.data?.created === 0, "guardar otra vez la tarifa no duplica", r.data);

  // ---------- Lo que ya pasó: inscripciones ----------
  const enrolled = await all(`SELECT tc.tournament_id, tc.club_id, to_char(tc.created_at, 'YYYY-MM-DD') AS day
    FROM tournament_clubs tc JOIN tournaments t ON t.id = tc.tournament_id WHERE t.season_id = $1`, [season]);
  r = await fee("TOURNAMENT_ENROLLMENT", { amount: 1000 });
  check(r.data?.created === enrolled.length, "activar inscripción registra cada inscripción existente", { data: r.data, n: enrolled.length });
  const enr = await charges("c.kind = 'TOURNAMENT_ENROLLMENT'");
  check(enr.every((c) => c.amount === 1000 && enrolled.some((e) => e.club_id === c.club_id && `tournament:${e.tournament_id}` === c.source_key && e.day === c.charged_on)),
    "la inscripción lleva el torneo, el club y la fecha de la inscripción", enr.slice(0, 3));

  // ---------- Registro del club en la plataforma: un solo pago ----------
  const clubsInSeason = (await one(`SELECT count(*)::int AS n FROM clubs
    WHERE deleted_at IS NULL AND league_season_on(created_at::date) = $1`, [season])).n;
  r = await fee("CLUB_REGISTRATION", { amount: 400 });
  let reg = await charges("c.kind = 'CLUB_REGISTRATION'");
  check(r.data?.created === clubsInSeason && reg.length === clubsInSeason && reg.every((c) => c.source_key === `club:${c.club_id}` && c.amount === 400),
    "activar el registro cobra una vez a cada club dado de alta en la temporada", { data: r.data, n: reg.length, clubsInSeason });
  r = await fee("CLUB_REGISTRATION", { amount: 500 });
  check(r.data?.created === 0 && (await charges("c.kind = 'CLUB_REGISTRATION'")).every((c) => c.amount === 400),
    "cambiar el precio no vuelve a cobrar el registro ni cambia lo ya registrado", r.data);
  await db.query(`INSERT INTO clubs (id, slug, name, created_at) VALUES ('fin-club-nuevo', 'fin-club-nuevo', 'Club Nuevo', now())`);
  reg = await charges("c.kind = 'CLUB_REGISTRATION' AND c.club_id = 'fin-club-nuevo'");
  check(reg.length === 1 && reg[0].amount === 500 && reg[0].charged_on === today && reg[0].source_key === "club:fin-club-nuevo",
    "dar de alta un club registra su pago de registro al momento", reg);
  const someTournament = (await one("SELECT id FROM tournaments WHERE season_id = $1 AND status <> 'FINISHED' ORDER BY id LIMIT 1", [season])).id;
  await db.query("INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ($1, 'fin-club-nuevo')", [someTournament]);
  check((await charges("c.kind = 'CLUB_REGISTRATION' AND c.club_id = 'fin-club-nuevo'")).length === 1, "inscribirse a un torneo no vuelve a cobrar el registro");
  await db.query("DELETE FROM tournament_clubs WHERE club_id = 'fin-club-nuevo'");
  await db.query("DELETE FROM clubs WHERE id = 'fin-club-nuevo'");
  const orphan = await charges("c.kind = 'CLUB_REGISTRATION' AND c.club_id IS NULL AND c.payer_name = 'Club Nuevo'");
  check(orphan.length === 1 && orphan[0].source_key === null, "un club borrado del todo deja su registro como historial, sin clave", orphan);
  // Inscripción nueva y baja
  const free = await one(`
    SELECT t.id AS tournament_id, c.id AS club_id FROM tournaments t CROSS JOIN clubs c
    WHERE t.season_id = $1 AND t.status <> 'FINISHED' AND c.active AND c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM tournament_clubs tc WHERE tc.tournament_id = t.id AND tc.club_id = c.id)
    ORDER BY t.id, c.id LIMIT 1`, [season]);
  await db.query("INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ($1, $2)", [free.tournament_id, free.club_id]);
  let newEnr = await charges("c.club_id = $1 AND c.source_key = $2", [free.club_id, `tournament:${free.tournament_id}`]);
  check(newEnr.length === 1 && newEnr[0].status === "PENDIENTE" && newEnr[0].charged_on === today, "inscribirse a un torneo registra el cobro al momento", newEnr);
  await db.query("DELETE FROM tournament_clubs WHERE tournament_id = $1 AND club_id = $2", [free.tournament_id, free.club_id]);
  newEnr = await charges("c.club_id = $1 AND c.source_key = $2", [free.club_id, `tournament:${free.tournament_id}`]);
  check(newEnr[0]?.status === "CANCELADO", "darse de baja cancela la inscripción pendiente", newEnr);

  // ---------- Cubierto / no cubierto ----------
  const target = (await charges("c.kind = 'TOURNAMENT_ENROLLMENT' AND c.status = 'PENDIENTE'"))[0];
  r = await rpc("admin", "set_league_charge_paid", { id: target.id, paid: true });
  let after = (await charges("c.id = $1", [target.id]))[0];
  check(r.data?.charge?.status === "PAGADO" && after.paid === 1000, "marcar como pagado abona todo el saldo", { data: r.data, after });
  r = await rpc("admin", "set_league_charge_paid", { id: target.id, paid: false });
  after = (await charges("c.id = $1", [target.id]))[0];
  check(r.data?.charge?.status === "PENDIENTE" && after.paid === 0, "marcar como no pagado borra los abonos", { data: r.data, after });
  r = await rpc("admin", "set_league_charge_paid", { id: target.id, paid: "si" });
  check(r.data?.charge === null, "set_league_charge_paid: paid como texto -> null", r.data);

  // ---------- Partido nuevo: arbitraje, cancha y tarjetas ----------
  const match = await one(`
    SELECT m.id, m.tournament_id, m.home_club_id, m.away_club_id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND t.season_id = $1
    ORDER BY m.id LIMIT 1`, [season]);
  restore.push(await snapshot(match.id));
  const court = await one("SELECT id, hourly_rate::float AS rate FROM courts WHERE hourly_rate > 0 ORDER BY id LIMIT 1");
  const minutes = (await one("SELECT duration_minutes AS m FROM tournaments WHERE id = $1", [match.tournament_id])).m;
  await db.query("UPDATE matches SET match_date = CURRENT_DATE, court_id = $2 WHERE id = $1", [match.id, court.id]);
  await rpc("admin", "save_match_score", { id: match.id, homeScore: 2, awayScore: 1, walkover: false });
  mc = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [match.id]);
  const courtHalf = Math.round((court.rate * minutes / 60 / 2) * 100) / 100;
  check(mc.filter((c) => c.kind === "MATCH_REFEREE").length === 2 && mc.filter((c) => c.kind === "MATCH_COURT").every((c) => c.amount === courtHalf)
    && mc.filter((c) => c.kind === "MATCH_COURT").length === 2, "jugar un partido registra arbitraje y uso de cancha", mc);
  await rpc("admin", "save_match_score", { id: match.id, homeScore: 3, awayScore: 1, walkover: false });
  check((await charges("c.match_id = $1", [match.id])).length === 4, "guardar otra vez el marcador no duplica");
  const homePlayer = await one("SELECT id, name FROM players WHERE club_id = $1 ORDER BY id LIMIT 1", [match.home_club_id]);
  const awayPlayer = await one("SELECT id, name FROM players WHERE club_id = $1 ORDER BY id LIMIT 1", [match.away_club_id]);
  await db.query(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute) VALUES
    ($1, $2, $3, $4, 'YELLOW', 10), ($1, $5, $6, $7, 'RED', 50)`,
    [match.id, match.home_club_id, homePlayer.id, homePlayer.name, match.away_club_id, awayPlayer.id, awayPlayer.name]);
  check((await charges("c.match_id = $1 AND c.kind IN ('CARD_YELLOW', 'CARD_RED')", [match.id])).length === 0, "sin tarifa de tarjetas no se cobran");
  r = await fee("CARD_YELLOW", { amount: 50 });
  await fee("CARD_RED", { amount: 150 });
  let cards = await charges("c.match_id = $1 AND c.kind IN ('CARD_YELLOW', 'CARD_RED')", [match.id]);
  check(cards.length === 2 && cards.some((c) => c.kind === "CARD_RED" && c.amount === 150 && c.club_id === match.away_club_id)
    && cards.every((c) => c.concept.includes(c.kind === "CARD_YELLOW" ? homePlayer.name : awayPlayer.name)),
    "activar tarjetas registra las ya capturadas, con el jugador en el concepto", cards);
  await db.query("DELETE FROM match_cards WHERE match_id = $1 AND color = 'YELLOW'", [match.id]);
  cards = await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]);
  check(cards.length === 1 && cards[0].status === "CANCELADO", "borrar la tarjeta cancela su cargo", cards);
  await db.query(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute)
    VALUES ($1, $2, $3, $4, 'YELLOW', 12)`, [match.id, match.home_club_id, homePlayer.id, homePlayer.name]);
  cards = await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]);
  check(cards.length === 1 && cards[0].status === "PENDIENTE", "volver a capturarla revive el mismo cargo", cards);
  // Apagar el uso de cancha: deja de cobrarse en partidos nuevos, lo ya cobrado se queda
  await fee("MATCH_COURT", { enabled: false });
  const other = await one(`
    SELECT m.id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND t.season_id = $1 AND m.id <> $2 ORDER BY m.id LIMIT 1`, [season, match.id]);
  restore.push(await snapshot(other.id));
  await db.query("UPDATE matches SET match_date = CURRENT_DATE, court_id = $2 WHERE id = $1", [other.id, court.id]);
  await rpc("admin", "save_match_score", { id: other.id, homeScore: 0, awayScore: 0, walkover: false });
  check((await charges("c.match_id = $1 AND c.kind = 'MATCH_COURT'", [other.id])).length === 0, "uso de cancha apagado: el partido nuevo no lo cobra");
  check((await charges("c.match_id = $1 AND c.kind = 'MATCH_COURT' AND c.status = 'PENDIENTE'", [match.id])).length === 2, "apagarlo no cancela lo ya cobrado");
  await fee("MATCH_COURT", { enabled: true, splitMode: "HALF" });

  // ---------- No se presentó ----------
  await fee("WALKOVER", { amount: 500 });
  const ns = await one(`
    SELECT m.id, m.home_club_id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND t.season_id = $1 AND m.id NOT IN ($2, $3) ORDER BY m.id LIMIT 1`,
    [season, match.id, other.id]);
  restore.push(await snapshot(ns.id));
  await db.query("UPDATE matches SET match_date = CURRENT_DATE WHERE id = $1", [ns.id]);
  await rpc("admin", "mark_match_no_show", { id: ns.id, noShow: "BOTH" });
  let wo = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id]);
  check(wo.length === 2 && wo.every((c) => c.kind === "WALKOVER" && c.amount === 500), "ninguno se presentó: multa a los dos, sin arbitraje ni cancha", wo);
  await rpc("admin", "mark_match_no_show", { id: ns.id, noShow: "HOME" });
  wo = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id]);
  check(wo.length === 1 && wo[0].club_id === ns.home_club_id, "no se presentó el local: solo el local", wo);
  await rpc("admin", "clear_match_no_show", { id: ns.id });
  check((await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id])).length === 0, "deshacer el no presentado cancela la multa");

  // ---------- Rentas: cada apartado es un cobro a quien aparta, pagado al apartar (todo o un anticipo) ----------
  const autoNote = async (holdId) => (await one("SELECT note FROM league_payments WHERE id = league_hold_payment_id($1)", [holdId]))?.note;
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
    VALUES ('fin-hold-1', $1, CURRENT_DATE + 2, '18:00', '19:30', 'MANUAL', 'Juan Perez · Cumple', 'juan@demo.local')`, [court.id]);
  let rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].status === "PAGADO" && rent[0].amount === court.rate * 1.5 && rent[0].paid === court.rate * 1.5
    && rent[0].club_id === null && rent[0].charged_on === today && (await autoNote("fin-hold-1")) === "Pagada al apartar",
    "apartar una cancha registra la renta ya pagada, sin tarifa", rent);
  const payer = await one("SELECT payer_name, payer_contact FROM league_charges WHERE source_key = 'hold:fin-hold-1'");
  check(payer.payer_name === "Juan Perez" && payer.payer_contact === "juan@demo.local", "la renta se cobra a quien aparta (nombre de la nota y correo)", payer);
  await db.query("UPDATE court_holds SET end_time = '20:00' WHERE id = 'fin-hold-1'");
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].amount === court.rate * 2 && rent[0].paid === court.rate * 2 && rent[0].status === "PAGADO",
    "alargar la renta pagada completa ajusta el monto y el pago", rent);
  r = await rpc("admin", "set_league_charge_paid", { id: rent[0].id, paid: false });
  check(r.data?.charge === null, "una renta pagada al apartar no se desmarca (no hay resto que quitar)", r.data);
  r = await rpc("admin", "delete_league_payment", { id: "auto-hold:fin-hold-1" });
  check(r.data?.deleted === null, "el pago automático de la renta no se borra a mano", r.data);
  // Anticipo: lo abonado al apartar es el anticipo y el resto queda por cobrar
  const dep = Math.floor(court.rate * 50) / 100;
  await db.query("UPDATE court_holds SET deposit = $1 WHERE id = 'fin-hold-1'", [dep]);
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].status === "PARCIAL" && rent[0].amount === court.rate * 2 && rent[0].paid === dep
    && (await autoNote("fin-hold-1")) === "Anticipo al apartar", "con anticipo la renta queda parcial: lo abonado es el anticipo", rent);
  await db.query("UPDATE court_holds SET end_time = '20:30' WHERE id = 'fin-hold-1'");
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent[0].amount === court.rate * 2.5 && rent[0].paid === dep && rent[0].status === "PARCIAL",
    "alargar una renta con anticipo sube el monto y conserva el anticipo", rent);
  r = await rpc("admin", "set_league_charge_paid", { id: rent[0].id, paid: false });
  check(r.data?.charge === null, "quitar un resto que no se ha cobrado -> null", r.data);
  r = await rpc("admin", "add_league_payment", { id: "fin-p-rent", chargeId: rent[0].id, amount: 1, paidOn: today, method: "EFECTIVO" });
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(r.data?.payment?.id === "fin-p-rent" && rent[0].paid === dep + 1 && rent[0].status === "PARCIAL", "se abona a mano parte del resto de una renta", r.data);
  r = await rpc("admin", "set_league_charge_paid", { id: rent[0].id, paid: true });
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  const restNote = await one("SELECT count(*)::int AS n FROM league_payments WHERE charge_id = $1 AND note = 'Resto de la renta'", [rent[0].id]);
  check(r.data?.charge?.status === "PAGADO" && rent[0].paid === rent[0].amount && restNote.n === 1, "cobrar el resto deja la renta pagada", rent);
  r = await rpc("admin", "set_league_charge_paid", { id: rent[0].id, paid: false });
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(r.data?.charge?.status === "PARCIAL" && rent[0].paid === dep && (await autoNote("fin-hold-1")) === "Anticipo al apartar",
    "quitar el cobro del resto conserva el anticipo", rent);
  // La nota del abono automático sigue a la renta: de anticipo a completa y de vuelta
  await db.query("UPDATE court_holds SET deposit = NULL WHERE id = 'fin-hold-1'");
  check((await charges("c.source_key = 'hold:fin-hold-1'"))[0].status === "PAGADO" && (await autoNote("fin-hold-1")) === "Pagada al apartar",
    "pasar a pagada completa cambia la nota del abono");
  await db.query("UPDATE court_holds SET deposit = $1 WHERE id = 'fin-hold-1'", [dep]);
  check((await autoNote("fin-hold-1")) === "Anticipo al apartar", "volver al anticipo regresa la nota del abono");
  // Cancelar una renta futura: se devuelve todo lo pagado (anticipo y resto) y el cobro se anula
  await rpc("admin", "set_league_charge_paid", { id: rent[0].id, paid: true });
  await db.query("DELETE FROM court_holds WHERE id = 'fin-hold-1'");
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].status === "CANCELADO" && rent[0].paid === 0, "cancelar la renta anula el cobro y todo lo abonado", rent);
  // Con la tarifa apagada no se registran rentas nuevas; el cobro de una que ya existía sigue a su anticipo
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email, deposit)
    VALUES ('fin-hold-antes', $1, CURRENT_DATE + 2, '10:00', '11:00', 'MANUAL', 'Pedro', '', $2)`, [court.id, dep]);
  await fee("COURT_RENTAL", { enabled: false });
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
    VALUES ('fin-hold-off', $1, CURRENT_DATE + 2, '08:00', '09:00', 'MANUAL', 'Pedro', '')`, [court.id]);
  check((await charges("c.source_key = 'hold:fin-hold-off'")).length === 0, "renta apagada en tarifas: no se registra");
  await db.query("UPDATE court_holds SET deposit = NULL WHERE id = 'fin-hold-antes'");
  rent = await charges("c.source_key = 'hold:fin-hold-antes'");
  check(rent.length === 1 && rent[0].status === "PAGADO" && rent[0].paid === court.rate && rent[0].amount === court.rate,
    "tarifa apagada: pasar a pagada completa una renta que ya tenía cobro actualiza su abono", rent);
  await db.query("UPDATE court_holds SET deposit = $1, end_time = '12:00' WHERE id = 'fin-hold-antes'", [dep]);
  rent = await charges("c.source_key = 'hold:fin-hold-antes'");
  check(rent[0].status === "PARCIAL" && rent[0].paid === dep && rent[0].amount === court.rate,
    "tarifa apagada: volver al anticipo lo sigue, sin recotizar", rent);
  await db.query("DELETE FROM court_holds WHERE id IN ('fin-hold-off', 'fin-hold-antes')");
  await fee("COURT_RENTAL", { enabled: true });

  // ---------- Publicidad ----------
  const ad = await one("SELECT id, price, starts_on FROM ads ORDER BY id LIMIT 1");
  if (ad) {
    await db.query("UPDATE ads SET price = 1500, advertiser_name = 'Refaccionaria Lopez', starts_on = CURRENT_DATE WHERE id = $1", [ad.id]);
    let adc = await charges("c.source_key = $1", [`ad:${ad.id}`]);
    check(adc.length === 1 && adc[0].amount === 1500 && adc[0].club_id === null && adc[0].status === "PENDIENTE", "anuncio con precio: cobro al anunciante, sin tarifa", adc);
    await db.query("UPDATE ads SET price = 0 WHERE id = $1", [ad.id]);
    adc = await charges("c.source_key = $1", [`ad:${ad.id}`]);
    check(adc[0]?.status === "CANCELADO", "anuncio sin precio: el cobro se cancela", adc);
    await db.query("UPDATE ads SET price = $2, advertiser_name = '', starts_on = $3 WHERE id = $1", [ad.id, ad.price, ad.starts_on]);
  }

  // ---------- Otro cobro (manual) ----------
  const base = { kind: "OTHER", concept: "Balon extraviado", amount: 350, chargedOn: today };
  for (const [label, vars] of [
    ["tipo que nace solo", { ...base, id: "fin-x0", clubId: HALCONES, kind: "MATCH_REFEREE" }],
    ["tipo quitado", { ...base, id: "fin-x1", clubId: HALCONES, kind: "PROTEST" }],
    ["concepto con HTML", { ...base, id: "fin-x2", clubId: HALCONES, concept: "<script>alert(1)</script>" }],
    ["concepto con ;--", { ...base, id: "fin-x3", clubId: HALCONES, concept: "x'; DROP TABLE clubs;--" }],
    ["monto cero", { ...base, id: "fin-x4", clubId: HALCONES, amount: 0 }],
    ["club y externo a la vez", { ...base, id: "fin-x5", clubId: HALCONES, payerName: "Alguien Mas" }],
    ["club inexistente", { ...base, id: "fin-x6", clubId: "no-existe" }],
    ["sin deudor", { ...base, id: "fin-x7" }],
    ["fecha inválida", { ...base, id: "fin-x8", clubId: HALCONES, chargedOn: "2026-02-31" }],
  ]) {
    r = await rpc("admin", "create_league_charge", vars);
    check(r.data?.charge === null, `create_league_charge: ${label} -> null`, r.data ?? r.error);
  }
  r = await rpc("admin", "create_league_charge", { ...base, id: "fin-m1", clubId: HALCONES, tournamentId: match.tournament_id });
  check(r.data?.charge?.id === "fin-m1", "otro cobro a un club con torneo", r.data ?? r.error);
  r = await rpc("admin", "create_league_charge", { ...base, id: "fin-m2", payerName: "Refresquera del Valle", payerContact: "ventas@valle.mx", concept: "Patrocinio anual", amount: 5000 });
  check(r.data?.charge?.id === "fin-m2", "otro cobro a un externo", r.data ?? r.error);

  // ---------- Abonos parciales (siguen disponibles) ----------
  const pay = (id, chargeId, amount, paidOn, method = "EFECTIVO") => rpc("admin", "add_league_payment", { id, chargeId, amount, paidOn, method });
  r = await pay("fin-p1", "fin-m1", 100, today);
  check(r.data?.charge?.status === "PARCIAL", "abono parcial -> PARCIAL", r.data ?? r.error);
  r = await pay("fin-p2", "fin-m1", 300, today);
  check(r.data?.payment === null, "abono mayor que el saldo -> null", r.data);
  r = await pay("fin-p3", "fin-m1", 250, today, "TRANSFERENCIA");
  check(r.data?.charge?.status === "PAGADO", "abono del resto -> PAGADO", r.data ?? r.error);
  const lastMonth = (await one("SELECT to_char(CURRENT_DATE - 40, 'YYYY-MM-DD') AS d")).d;
  r = await pay("fin-p4", "fin-m2", 2000, lastMonth, "TRANSFERENCIA");
  check(r.data?.charge?.status === "PARCIAL", "abono con fecha del mes pasado", r.data ?? r.error);

  // ---------- Condonar y cancelar ----------
  const yellow = (await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]))[0];
  r = await rpc("admin", "set_league_charge_status", { id: yellow.id, action: "CONDONAR", note: "Primera falta" });
  check(r.data?.charge?.status === "CONDONADO", "condonar una multa", r.data ?? r.error);
  r = await rpc("admin", "set_league_charge_paid", { id: yellow.id, paid: true });
  check(r.data?.charge === null, "un cargo condonado no se marca como pagado", r.data);
  r = await rpc("admin", "set_league_charge_status", { id: "fin-m1", action: "CANCELAR" });
  check(r.data?.charge === null, "no se cancela un cargo con abonos", r.data);

  // ---------- Gastos y pérdidas ----------
  const exp = (vars) => rpc("admin", "save_league_expense", { amount: 800, spentOn: today, ...vars });
  r = await exp({ id: "fin-e1", category: "ARBITROS", description: "Arbitros jornada 5", tournamentId: match.tournament_id });
  check(r.data?.expense?.id === "fin-e1", "gasto de árbitros del torneo", r.data ?? r.error);
  r = await exp({ id: "fin-e2", category: "DEVOLUCION", description: "Devolucion de fianza", amount: 300, chargeId: "fin-m1" });
  check(r.data?.expense?.id === "fin-e2", "devolución ligada a un cargo", r.data ?? r.error);
  r = await exp({ id: "fin-e3", category: "VIAJES", description: "Gasolina" });
  check(r.data?.expense === null, "categoría inventada -> null", r.data);

  // ---------- Resumen con los registros ----------
  const sum = async (vars) => (await rpc("admin", "admin_finance_summary", vars)).data;
  const collectedAll = Number((await one("SELECT coalesce(sum(amount), 0) AS s FROM league_payments")).s);
  const condonedAll = Number((await one(`SELECT coalesce(sum(c.amount - cp.paid), 0) AS s FROM league_charges c
    JOIN league_charge_paid cp ON cp.id = c.id WHERE c.status = 'CONDONADO'`)).s);
  const total = await sum({ scope: "TOTAL" });
  check(total?.summary?.collected === collectedAll && total.summary.expenses === 800 && total.summary.refunds === 300
    && total.summary.condoned === condonedAll && total.summary.result === collectedAll - 1100, "resumen total: cobrado, gastos, pérdidas y resultado", total?.summary);
  check(Array.isArray(total.charges) && total.charges.length > 0
    && total.charges.some((c) => c.kind === "TOURNAMENT_ENROLLMENT" && c.club?.name)
    && total.charges.some((c) => c.kind === "COURT_RENTAL" && c.status === "PAGADO")
    && total.charges.every((c) => c.status !== "CANCELADO"),
    "el resumen trae cada registro (inscripciones, rentas…) sin los cancelados", total.charges?.length);
  check(total.debtors.some((d) => d.club.id === HALCONES && d.pending > 0), "resumen: clubes con adeudo", total.debtors);
  const [y, m] = month.split("-").map(Number);
  const thisMonth = await sum({ scope: "MONTH", year: y, month: m });
  const monthPayments = Number((await one(`SELECT coalesce(sum(amount), 0) AS s FROM league_payments
    WHERE to_char(paid_on, 'YYYY-MM') = $1`, [month])).s);
  check(thisMonth.summary.collected === monthPayments && thisMonth.charges.every((c) => c.chargedOn.startsWith(month)),
    "resumen del mes: cobrado y registros solo de ese mes", { s: thisMonth.summary, monthPayments });
  const tour = await sum({ scope: "TOURNAMENT", tournamentId: match.tournament_id });
  check(tour.charges.every((c) => c.tournament?.id === match.tournament_id) && tour.summary.expenses === 800,
    "resumen del torneo: solo sus registros y gastos", tour.summary);
  for (const bad of [{ scope: "SEMANA" }, { scope: "YEAR", year: "abc" }, { scope: "MONTH", year: 2026, month: 13 }]) {
    const b = await sum(bad);
    check(b?.summary === null, `resumen con ${JSON.stringify(bad)} -> null`, b);
  }

  // ---------- Listas y cuenta del club ----------
  const list = await rpc("admin", "admin_league_charges", { clubId: HALCONES, status: "PAGADO" });
  check(list.data?.charges?.some((c) => c.id === "fin-m1" && c.payments.length === 2), "admin_league_charges con filtros y abonos", list.data ?? list.error);
  const account = await rpc("tesorero", "club_league_account", { clubId: HALCONES });
  check(account.data?.account?.charges?.length > 0 && account.data.account.charges.every((c) => c.club.id === HALCONES),
    "club_league_account: el tesorero ve la cuenta de su club", account.data ?? account.error);
  check((await rpc("tesorero", "club_league_account", { clubId: "dummy-club-bahia" })).data?.account === null, "club_league_account: otro club -> null");
  check((await rpc("dt", "club_league_account", { clubId: HALCONES })).data?.account === null, "club_league_account: el DT no la ve");

  // ---------- Formularios de Publicidad y Canchas (1013_fn_admin.sql) ----------
  const adBase = {
    id: "fin-ad-1", brand: "Tienda Lopez", imageUrl: "https://example.com/banner.png", href: "",
    startsOn: today, endsOn: (await one("SELECT to_char(CURRENT_DATE + 30, 'YYYY-MM-DD') AS d")).d,
    status: "EN_CURSO", sortOrder: 99,
  };
  for (const [label, extra] of [
    ["precio con letras", { price: "abc" }],
    ["anunciante con HTML", { price: 900, advertiserName: "<b>Tienda</b>" }],
    ["contacto con script", { price: 900, advertiserContact: "<script>" }],
  ]) {
    const bad = await rpc("admin", "save_ad", { ...adBase, ...extra });
    check(bad.data?.ad === null, `save_ad: ${label} -> null`, bad.data ?? bad.error);
  }
  r = await rpc("admin", "save_ad", { ...adBase, price: 900, advertiserName: "Tienda Lopez SA", advertiserContact: "555 123 4567" });
  check(r.data?.ad?.id === "fin-ad-1" && (await charges("c.source_key = 'ad:fin-ad-1'"))[0]?.amount === 900, "save_ad con precio registra el cobro", r.data ?? r.error);
  await rpc("admin", "save_ad", { ...adBase, brand: "Tienda Lopez Dos" });
  const kept = await one("SELECT price::float AS price, advertiser_name FROM ads WHERE id = 'fin-ad-1'");
  check(kept.price === 900 && kept.advertiser_name === "Tienda Lopez SA", "save_ad sin precio conserva el que tenía", kept);

  const slotMin = Number((await one("SELECT court_slot_minutes AS s FROM platform_settings WHERE id = 'config'")).s);
  const win = await one(`SELECT start_time FROM court_open_windows
    WHERE weekday = extract(isodow FROM CURRENT_DATE + 3) ORDER BY start_time LIMIT 1`);
  if (win && slotMin) {
    const holdDay = (await one("SELECT to_char(CURRENT_DATE + 3, 'YYYY-MM-DD') AS d")).d;
    const [hh, mm] = win.start_time.split(":").map(Number);
    const end = hh * 60 + mm + slotMin;
    const endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
    const holdVars = { id: "fin-hold-2", courtId: court.id, holdDate: holdDay, startTime: win.start_time, endTime,
      note: "Juan Perez", guestEmail: "juan@demo.local", fresh: true };
    const price = Math.round(court.rate * 100 * slotMin / 60) / 100;
    const deposit = Math.floor(price * 50) / 100;
    const depositNow = async () => {
      const row = await one("SELECT deposit::float AS d FROM court_holds WHERE id = 'fin-hold-2'");
      return row ? row.d : undefined;
    };
    const hold = await rpc("admin", "save_court_hold", { ...holdVars, deposit });
    const saved = hold.data?.hold;
    check(saved?.id === "fin-hold-2" && saved.rental?.amount === price && saved.rental.paid === deposit && saved.rental.status === "PARCIAL"
      && saved.rental.restPaid === 0, "save_court_hold con anticipo responde el cobro ya calculado", hold.data ?? hold.error);
    for (const bad of [0, -5, "abc"]) {
      const badEdit = await rpc("admin", "save_court_hold", { ...holdVars, fresh: false, note: "Juan Perez · Otra", deposit: bad });
      check(badEdit.data?.hold === null && (await depositNow()) === deposit, `save_court_hold: anticipo ${bad} al editar -> null y no cambia`, badEdit.data ?? badEdit.error);
    }
    await rpc("admin", "save_court_hold", { ...holdVars, note: "Juan Perez · Final", fresh: false });
    check((await depositNow()) === deposit, "editar la renta sin la clave conserva el anticipo");
    const courtsAdmin = await rpc("admin", "admin_courts", {});
    const listed = courtsAdmin.data?.courtHolds?.find((h) => h.id === "fin-hold-2");
    check(courtsAdmin.data && !("clubs" in courtsAdmin.data) && listed?.deposit === deposit && !("clubId" in listed)
      && listed.rental?.chargeId === saved.rental.chargeId && listed.rental.paid === deposit && listed.rental.status === "PARCIAL",
      "admin_courts: cada renta trae su anticipo y su cobro, sin clubes", listed ?? courtsAdmin.error);
    // Con el resto cobrado la renta no cambia de fecha ni de horario (sí de nota)
    await rpc("admin", "set_league_charge_paid", { id: saved.rental.chargeId, paid: true });
    const otherDay = (await one("SELECT to_char(CURRENT_DATE + 10, 'YYYY-MM-DD') AS d")).d;
    const moved = await rpc("admin", "save_court_hold", { ...holdVars, holdDate: otherDay, fresh: false });
    const stillDay = (await one("SELECT to_char(hold_date, 'YYYY-MM-DD') AS d FROM court_holds WHERE id = 'fin-hold-2'")).d;
    check(moved.data?.hold === null && stillDay === holdDay, "con el resto cobrado la renta no cambia de fecha", moved.data ?? moved.error);
    const renamed = await rpc("admin", "save_court_hold", { ...holdVars, note: "Juan Perez · Final Dos", fresh: false });
    check(renamed.data?.hold?.rental?.status === "PAGADO" && renamed.data.hold.rental.restPaid > 0, "con el resto cobrado sí cambia la nota", renamed.data ?? renamed.error);
    await rpc("admin", "set_league_charge_paid", { id: saved.rental.chargeId, paid: false });
    const full = await rpc("admin", "save_court_hold", { ...holdVars, fresh: false, deposit: null });
    check(full.data?.hold?.rental?.status === "PAGADO" && full.data.hold.rental.paid === price && (await depositNow()) === null,
      "anticipo null: la renta queda pagada completa", full.data ?? full.error);
    // Cambiar el costo de la cancha y luego corregir el anticipo no vuelve a cotizar la renta
    for (const factor of [3, 0.5]) {
      await db.query("UPDATE courts SET hourly_rate = $2 WHERE id = $1", [court.id, court.rate * factor]);
      const fix = await rpc("admin", "save_court_hold", { ...holdVars, fresh: false, deposit });
      check(fix.data?.hold?.rental?.amount === price && fix.data.hold.rental.paid === deposit && fix.data.hold.rental.status === "PARCIAL",
        `costo de la cancha × ${factor} y corregir el anticipo: el precio cotizado no cambia`, fix.data ?? fix.error);
    }
    await db.query("UPDATE courts SET hourly_rate = $2 WHERE id = $1", [court.id, court.rate]);
    // Eliminar con «la liga se lo queda»: el cobro queda como historial por lo pagado, ya sin la renta
    const keep = await rpc("admin", "delete_manual_court_hold", { id: "fin-hold-2", keepPaid: true });
    const keptRow = (await charges("c.id = $1", [saved.rental.chargeId]))[0];
    const autoLeft = await one("SELECT count(*)::int AS n FROM league_payments WHERE charge_id = $1 AND id LIKE 'auto-hold:%'", [saved.rental.chargeId]);
    const keptListed = (await rpc("admin", "admin_league_charges", { kind: "COURT_RENTAL" })).data?.charges?.find((c) => c.id === saved.rental.chargeId);
    check(keep.data?.hold?.id === "fin-hold-2" && keptRow.status === "PAGADO" && keptRow.amount === deposit && keptRow.paid === deposit
      && keptRow.source_key === null && keptRow.concept.endsWith(" · cancelada") && autoLeft.n === 0 && keptListed?.automatic === false,
      "eliminar con «la liga se lo queda»: el cobro queda pagado por lo abonado, sin clave", { keptRow, keptListed });
    const badKeep = await rpc("admin", "delete_manual_court_hold", { id: "fin-hold-x", keepPaid: "si" });
    check(badKeep.data?.hold === null, "delete_manual_court_hold: keepPaid que no es booleano -> null", badKeep.data);
  } else {
    check(true, "sin horario de canchas: se omite la prueba de save_court_hold");
  }

  // ---------- Hallazgos de la revisión ----------
  // Borrar un jugador no vuelve a cobrar sus tarjetas (la clave va por el nombre guardado en la tarjeta)
  const carded = await one(`
    SELECT mc.match_id, mc.player_id FROM match_cards mc
    JOIN matches m ON m.id = mc.match_id JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'PLAYED' AND NOT m.walkover AND t.season_id = $1 AND mc.player_id IS NOT NULL AND mc.player_name <> ''
      AND mc.color = 'YELLOW' AND m.id NOT IN ($2, $3, $4)
    ORDER BY mc.match_id, mc.id LIMIT 1`, [season, match.id, other.id, ns.id]);
  if (carded) {
    const paidCard = (await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW' AND c.status = 'PENDIENTE'", [carded.match_id]))[0];
    await rpc("admin", "set_league_charge_paid", { id: paidCard.id, paid: true });
    const before = (await charges("c.match_id = $1 AND c.kind IN ('CARD_YELLOW', 'CARD_RED') AND c.status <> 'CANCELADO'", [carded.match_id])).length;
    await db.query("DELETE FROM players WHERE id = $1", [carded.player_id]);
    await rpc("admin", "save_league_fee", { seasonId: season, kind: "CARD_YELLOW", enabled: true, amount: 50 });
    const afterCards = await charges("c.match_id = $1 AND c.kind IN ('CARD_YELLOW', 'CARD_RED') AND c.status <> 'CANCELADO'", [carded.match_id]);
    check(afterCards.length === before && afterCards.some((c) => c.id === paidCard.id && c.status === "PAGADO"),
      "borrar un jugador no duplica la multa de su tarjeta ya pagada", { before, after: afterCards.length });
  }

  // A medias exacto: con centavos impares el visitante paga el resto
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "MATCH_REFEREE", enabled: true, amount: 100.01, splitMode: "HALF" });
  const halves = (await all("SELECT e_amount::float AS a FROM league_match_expected($1) WHERE e_kind = 'MATCH_REFEREE'", [played.id])).map((x) => x.a);
  check(halves.length === 2 && Math.round((halves[0] + halves[1]) * 100) === 10001 && halves.includes(50.01) && halves.includes(50),
    "arbitraje a medias con centavos impares: suma exacta", halves);
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "MATCH_REFEREE", enabled: true, amount: 200, splitMode: "EACH" });

  // Una renta se cotiza al apartarla: cambiar el costo de la cancha y volver a sincronizar no la cambia
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
    VALUES ('fin-hold-fija', $1, CURRENT_DATE + 2, '06:00', '07:00', 'MANUAL', 'Halcones', '')`, [court.id]);
  await db.query("UPDATE courts SET hourly_rate = hourly_rate * 3 WHERE id = $1", [court.id]);
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "CARD_RED", enabled: true, amount: 150 });
  rent = await charges("c.source_key = 'hold:fin-hold-fija'");
  check(rent.length === 1 && rent[0].amount === court.rate && rent[0].paid === court.rate,
    "subir el costo de la cancha no vuelve a cotizar las rentas ya apartadas", rent);
  await db.query("UPDATE court_holds SET end_time = '08:00' WHERE id = 'fin-hold-fija'");
  rent = await charges("c.source_key = 'hold:fin-hold-fija'");
  check(rent[0].amount === court.rate * 3 * 2 && rent[0].paid === rent[0].amount, "cambiar el horario sí la vuelve a cotizar (con el costo de hoy)", rent);
  await db.query("UPDATE courts SET hourly_rate = $2 WHERE id = $1", [court.id, court.rate]);
  await db.query("DELETE FROM court_holds WHERE id = 'fin-hold-fija'");

  // Una renta que ya pasó se queda en las finanzas aunque se borre (p. ej. al borrar la cancha)
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
    VALUES ('fin-hold-pasada', $1, CURRENT_DATE - 3, '06:00', '07:00', 'MANUAL', 'Halcones', '')`, [court.id]);
  r = await rpc("admin", "delete_manual_court_hold", { id: "fin-hold-pasada" });
  rent = await charges("c.source_key = 'hold:fin-hold-pasada'");
  check(r.data?.hold?.id === "fin-hold-pasada" && rent.length === 1 && rent[0].status === "PAGADO" && rent[0].paid === court.rate,
    "borrar sin decidir una renta que ya pasó conserva el cobro y su pago", rent);

  // Cancelar con decisión no depende de la fecha: una renta de hoy en la noche ya es «ayer» en UTC
  const quarter = Math.floor(court.rate * 25) / 100;
  for (const [day, label] of [["CURRENT_DATE", "hoy"], ["CURRENT_DATE - 1", "ayer en UTC"]]) {
    for (const keepPaid of [true, false]) {
      const id = `fin-hold-${keepPaid ? "queda" : "devuelve"}-${label.length}`;
      await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email, deposit)
        VALUES ($2, $1, ${day}, '04:00', '05:00', 'MANUAL', 'Pedro', '', $3)`, [court.id, id, quarter]);
      const before = (await charges("c.source_key = $1", [`hold:${id}`]))[0];
      await rpc("admin", "set_league_charge_paid", { id: before.id, paid: true });
      const gone = await rpc("admin", "delete_manual_court_hold", { id, keepPaid });
      const after = (await charges("c.id = $1", [before.id]))[0];
      check(gone.data?.hold?.id === id && (keepPaid
        ? after.status === "PAGADO" && after.paid === court.rate && after.amount === court.rate && after.source_key === null
        : after.status === "CANCELADO" && after.paid === 0),
        `renta de ${label} con anticipo y resto: ${keepPaid ? "la liga se lo queda" : "se le devolvió"}`, after);
    }
  }

  // Un id de renta de 128 caracteres no rompe el abono automático
  const longId = "h".repeat(128);
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email)
    VALUES ($2, $1, CURRENT_DATE + 2, '05:00', '06:00', 'MANUAL', 'Pedro', '')`, [court.id, longId]);
  rent = await charges("c.source_key = $1", [`hold:${longId}`]);
  check(rent.length === 1 && rent[0].status === "PAGADO", "renta con id de 128 caracteres: pagada sin error", rent);
  await db.query("DELETE FROM court_holds WHERE id = $1", [longId]);
  r = await rpc("admin", "add_league_payment", { id: "auto-hold:x", chargeId: "fin-m2", amount: 1, paidOn: today, method: "EFECTIVO" });
  check(r.data?.payment === null, "nadie usa el prefijo de los abonos automáticos", r.data);

  // ---------- Se deja todo como estaba ----------
  await db.query("DELETE FROM league_fees WHERE true");
  for (const row of restore) {
    await db.query("DELETE FROM match_cards WHERE match_id = $1", [row.id]);
    await db.query(`UPDATE matches SET status = $2, walkover = $3, no_show = $4, home_score = $5, away_score = $6, match_date = $7, court_id = $8
      WHERE id = $1`, [row.id, row.status, row.walkover, row.no_show, row.home_score, row.away_score, row.match_date, row.court_id]);
  }
}
