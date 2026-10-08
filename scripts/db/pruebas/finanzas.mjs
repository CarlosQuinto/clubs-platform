// Pruebas de las finanzas de la liga (0007_finanzas_liga.sql y 1015_fn_finance.sql) sobre los datos dummy:
// tarifas, cargos automáticos por partido, no presentado, tarjetas, inscripción, temporada, mensualidad,
// renta de cancha y anuncios; cargos manuales, abonos, condonación, gastos y el resumen por periodo.
// Al final se desactivan las tarifas para no afectar a las demás pruebas.

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
       c.tournament_id, c.season_id, c.concept
     FROM league_charges c WHERE ${where} ORDER BY c.kind, c.club_id`, params);

  // ---------- Permisos ----------
  const setupPres = await rpc("presidente", "admin_finance_setup", {});
  check(setupPres.error?.code === "42501", "admin_finance_setup: presidente -> 42501", setupPres.error ?? setupPres.data);
  const setup = await rpc("admin", "admin_finance_setup", {});
  check(setup.data?.seasonId && setup.data.seasons.length > 0 && Array.isArray(setup.data.fees), "admin_finance_setup responde", setup.data ?? setup.error);
  for (const fn of ["admin_league_charges", "admin_league_expenses", "admin_finance_summary"]) {
    const r = await rpc("tesorero", fn, { scope: "TOTAL" });
    check(r.error?.code === "42501", `${fn}: tesorero -> 42501`, r.error ?? r.data);
  }
  const feePres = await rpc("presidente", "save_league_fee", { seasonId: season, kind: "MATCH_REFEREE", enabled: true, amount: 1 });
  check(feePres.data?.fee === null, "save_league_fee: presidente -> null", feePres.data);

  // ---------- Tarifas ----------
  for (const [label, vars] of [
    ["tipo inventado", { kind: "FOO", enabled: true, amount: 10 }],
    ["monto con letras", { kind: "MATCH_REFEREE", enabled: true, amount: "abc" }],
    ["monto negativo", { kind: "MATCH_REFEREE", enabled: true, amount: -5 }],
    ["monto enorme", { kind: "MATCH_REFEREE", enabled: true, amount: 123456789 }],
    ["enabled como texto", { kind: "MATCH_REFEREE", enabled: "si", amount: 10 }],
    ["periodo inventado", { kind: "CLUB_PAGE", enabled: true, amount: 10, period: "WEEK" }],
    ["temporada inexistente", { kind: "MATCH_REFEREE", enabled: true, amount: 10, seasonId: "no-existe" }],
  ]) {
    const r = await rpc("admin", "save_league_fee", { seasonId: season, ...vars });
    check(r.data?.fee === null, `save_league_fee: ${label} -> null`, r.data ?? r.error);
  }
  const fees = [
    { kind: "MATCH_REFEREE", enabled: true, amount: 200, splitMode: "EACH" },
    { kind: "MATCH_COURT", enabled: true, amount: 100, splitMode: "HALF" },
    { kind: "WALKOVER", enabled: true, amount: 500 },
    { kind: "CARD_YELLOW", enabled: true, amount: 50 },
    { kind: "CARD_RED", enabled: true, amount: 150 },
    { kind: "TOURNAMENT_ENROLLMENT", enabled: true, amount: 1000, includesRegistration: false },
    { kind: "DEPOSIT", enabled: true, amount: 300 },
    { kind: "CLUB_REGISTRATION", enabled: true, amount: 400 },
    { kind: "SEASON_ENROLLMENT", enabled: true, amount: 250, includesRegistration: false },
    { kind: "COURT_RENTAL", enabled: true, amount: 0 },
    { kind: "AD", enabled: true, amount: 0 },
    { kind: "CLUB_PAGE", enabled: true, amount: 80, period: "MONTH", splitMode: "HALF" },
  ];
  for (const fee of fees) {
    const r = await rpc("admin", "save_league_fee", { seasonId: season, ...fee });
    check(r.data?.fee?.kind === fee.kind, `save_league_fee ${fee.kind}`, r.data ?? r.error);
  }
  const page = await one("SELECT period, split_mode FROM league_fees WHERE season_id = $1 AND kind = 'CLUB_PAGE'", [season]);
  check(page.period === "MONTH" && page.split_mode === "EACH", "CLUB_PAGE: el reparto no aplica y se normaliza", page);

  // ---------- Partido jugado: arbitraje (EACH) y cancha (HALF) ----------
  const match = await one(`
    SELECT m.id, m.tournament_id, m.home_club_id, m.away_club_id FROM matches m
    JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND t.season_id = $1
    ORDER BY m.id LIMIT 1`, [season]);
  // Las demás pruebas (liga.mjs, no_presentado.mjs) usan estos partidos: se dejan como estaban al final.
  const snapshot = async (id) => one("SELECT id, status, walkover, no_show, home_score, away_score, match_date FROM matches WHERE id = $1", [id]);
  const restore = [await snapshot(match.id)];
  await db.query("UPDATE matches SET match_date = CURRENT_DATE WHERE id = $1", [match.id]);
  const scored = await rpc("admin", "save_match_score", { id: match.id, homeScore: 2, awayScore: 1, walkover: false });
  check(scored.data?.match?.id === match.id, "save_match_score del partido de prueba", scored.data ?? scored.error);
  let mc = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [match.id]);
  const referee = mc.filter((c) => c.kind === "MATCH_REFEREE");
  const court = mc.filter((c) => c.kind === "MATCH_COURT");
  check(referee.length === 2 && referee.every((c) => c.amount === 200), "partido jugado: arbitraje de 200 a cada club", mc);
  check(court.length === 2 && court.every((c) => c.amount === 50), "partido jugado: cancha de 100 a medias", mc);
  check(mc.every((c) => c.tournament_id === match.tournament_id && c.season_id === season), "cargos del partido con torneo y temporada", mc);
  await rpc("admin", "save_match_score", { id: match.id, homeScore: 3, awayScore: 1, walkover: false });
  mc = await charges("c.match_id = $1", [match.id]);
  check(mc.length === 4, "guardar otra vez el marcador no duplica cargos", mc);

  // ---------- Tarjetas ----------
  const homePlayer = await one("SELECT id, name FROM players WHERE club_id = $1 ORDER BY id LIMIT 1", [match.home_club_id]);
  const awayPlayer = await one("SELECT id, name FROM players WHERE club_id = $1 ORDER BY id LIMIT 1", [match.away_club_id]);
  await db.query(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute) VALUES
    ($1, $2, $3, $4, 'YELLOW', 10), ($1, $5, $6, $7, 'RED', 50)`,
    [match.id, match.home_club_id, homePlayer.id, homePlayer.name, match.away_club_id, awayPlayer.id, awayPlayer.name]);
  let cards = await charges("c.match_id = $1 AND c.kind IN ('CARD_YELLOW', 'CARD_RED')", [match.id]);
  check(cards.length === 2 && cards.find((c) => c.kind === "CARD_YELLOW")?.club_id === match.home_club_id
    && cards.find((c) => c.kind === "CARD_RED")?.amount === 150, "tarjetas: amarilla al local y roja de 150 al visitante", cards);
  check(cards.every((c) => c.concept.includes(c.kind === "CARD_YELLOW" ? homePlayer.name : awayPlayer.name)), "tarjetas: el concepto lleva el jugador", cards);
  await db.query("DELETE FROM match_cards WHERE match_id = $1 AND color = 'YELLOW'", [match.id]);
  cards = await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]);
  check(cards.length === 1 && cards[0].status === "CANCELADO", "borrar la tarjeta cancela su cargo", cards);
  await db.query(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute)
    VALUES ($1, $2, $3, $4, 'YELLOW', 12)`, [match.id, match.home_club_id, homePlayer.id, homePlayer.name]);
  cards = await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]);
  check(cards.length === 1 && cards[0].status === "PENDIENTE", "volver a capturar la tarjeta revive el mismo cargo", cards);
  // Tarifa desactivada: no genera cargos nuevos, pero no cancela los existentes
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "CARD_RED", enabled: false, amount: 150 });
  await db.query(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color, minute)
    VALUES ($1, $2, $3, $4, 'RED', 80)`, [match.id, match.home_club_id, homePlayer.id, homePlayer.name]);
  cards = await charges("c.match_id = $1 AND c.kind = 'CARD_RED'", [match.id]);
  check(cards.length === 1 && cards[0].club_id === match.away_club_id && cards[0].status === "PENDIENTE",
    "tarifa desactivada: no cobra la roja nueva y conserva la anterior", cards);
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "CARD_RED", enabled: true, amount: 150 });

  // ---------- No se presentó ----------
  const ns = await one(`
    SELECT m.id, m.home_club_id, m.away_club_id FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND t.season_id = $1 AND m.id <> $2
    ORDER BY m.id LIMIT 1`, [season, match.id]);
  restore.push(await snapshot(ns.id));
  await db.query("UPDATE matches SET match_date = CURRENT_DATE WHERE id = $1", [ns.id]);
  await rpc("admin", "mark_match_no_show", { id: ns.id, noShow: "BOTH" });
  let wo = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id]);
  check(wo.length === 2 && wo.every((c) => c.kind === "WALKOVER" && c.amount === 500), "ninguno se presentó: multa a los dos y sin arbitraje", wo);
  await rpc("admin", "mark_match_no_show", { id: ns.id, noShow: "HOME" });
  wo = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id]);
  check(wo.length === 1 && wo[0].club_id === ns.home_club_id, "cambia a «no se presentó el local»: solo el local queda multado", wo);
  await rpc("admin", "clear_match_no_show", { id: ns.id });
  wo = await charges("c.match_id = $1 AND c.status = 'PENDIENTE'", [ns.id]);
  check(wo.length === 0, "deshacer el no presentado cancela la multa", wo);

  // ---------- Temporada: inscripción y registro ----------
  const gen = await rpc("admin", "generate_season_charges", { seasonId: season });
  const activeClubs = Number((await one("SELECT count(*) AS n FROM clubs WHERE active AND deleted_at IS NULL")).n);
  check(gen.data?.created === activeClubs * 2, "generate_season_charges: inscripción y registro a cada club activo", { gen: gen.data, activeClubs });
  const gen2 = await rpc("admin", "generate_season_charges", { seasonId: season });
  check(gen2.data?.created === 0, "generate_season_charges otra vez no duplica", gen2.data);
  const genBad = await rpc("presidente", "generate_season_charges", { seasonId: season });
  check(genBad.data?.created === null, "generate_season_charges: presidente -> null", genBad.data);

  // ---------- Inscripción a un torneo ----------
  const free = await one(`
    SELECT t.id AS tournament_id, c.id AS club_id FROM tournaments t CROSS JOIN clubs c
    WHERE t.season_id = $1 AND t.status <> 'FINISHED' AND c.active AND c.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM tournament_clubs tc WHERE tc.tournament_id = t.id AND tc.club_id = c.id)
    ORDER BY t.id, c.id LIMIT 1`, [season]);
  await db.query("INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ($1, $2)", [free.tournament_id, free.club_id]);
  let enr = await charges("c.club_id = $1 AND c.source_key = $2", [free.club_id, `tournament:${free.tournament_id}`]);
  check(enr.length === 2 && enr.some((c) => c.kind === "TOURNAMENT_ENROLLMENT" && c.amount === 1000) && enr.some((c) => c.kind === "DEPOSIT"),
    "inscribir un club al torneo: inscripción y fianza", enr);
  const reg = await charges("c.club_id = $1 AND c.kind = 'CLUB_REGISTRATION' AND c.source_key = $2", [free.club_id, `season:${season}`]);
  check(reg.length === 1, "el registro de la temporada no se duplica al inscribirse", reg);
  await db.query("DELETE FROM tournament_clubs WHERE tournament_id = $1 AND club_id = $2", [free.tournament_id, free.club_id]);
  enr = await charges("c.club_id = $1 AND c.source_key = $2 AND c.status = 'PENDIENTE'", [free.club_id, `tournament:${free.tournament_id}`]);
  check(enr.length === 0, "dar de baja la inscripción cancela inscripción y fianza", enr);
  // La inscripción incluye el registro: no se cobra aparte
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "TOURNAMENT_ENROLLMENT", enabled: true, amount: 1000, includesRegistration: true });
  const included = await one("SELECT league_registration_fee($1) AS fee", [season]);
  check(included.fee === null, "registro incluido en la inscripción: no hay tarifa de registro aparte", included);
  await rpc("admin", "save_league_fee", { seasonId: season, kind: "TOURNAMENT_ENROLLMENT", enabled: true, amount: 1000, includesRegistration: false });

  // ---------- Mensualidad de la página ----------
  const month = (await one("SELECT to_char(CURRENT_DATE, 'YYYY-MM') AS m")).m;
  const pageGen = await rpc("admin", "generate_monthly_page_charges", { month });
  check(pageGen.data?.created === activeClubs && pageGen.data.configured === true, "mensualidad de la página a cada club activo", pageGen.data);
  const pageGen2 = await rpc("admin", "generate_monthly_page_charges", { month });
  check(pageGen2.data?.created === 0, "la mensualidad no se duplica", pageGen2.data);
  const pageBad = await rpc("admin", "generate_monthly_page_charges", { month: "2026-13" });
  check(pageBad.data?.created === null, "mes inválido -> null", pageBad.data);

  // ---------- Renta de cancha ----------
  const courtRow = await one("SELECT id, hourly_rate::float AS rate FROM courts WHERE hourly_rate > 0 ORDER BY id LIMIT 1");
  await db.query(`INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, note, guest_email, club_id)
    VALUES ('fin-hold-1', $1, CURRENT_DATE + 2, '18:00', '19:30', 'MANUAL', 'Halcones', '', $2)`, [courtRow.id, HALCONES]);
  let rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].kind === "COURT_RENTAL" && rent[0].club_id === HALCONES && rent[0].amount === courtRow.rate * 1.5,
    "reserva de hora y media: tarifa por hora x 1.5 al club", { rent, rate: courtRow.rate });
  await db.query("UPDATE court_holds SET end_time = '20:00' WHERE id = 'fin-hold-1'");
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].amount === courtRow.rate * 2, "alargar la reserva actualiza el monto pendiente", rent);
  await db.query("DELETE FROM court_holds WHERE id = 'fin-hold-1'");
  rent = await charges("c.source_key = 'hold:fin-hold-1'");
  check(rent.length === 1 && rent[0].status === "CANCELADO", "cancelar la reserva cancela el cargo", rent);

  // ---------- Publicidad ----------
  const ad = await one("SELECT id, price, starts_on FROM ads ORDER BY id LIMIT 1");
  if (ad) {
    await db.query("UPDATE ads SET price = 1500, advertiser_name = 'Refaccionaria Lopez', starts_on = CURRENT_DATE WHERE id = $1", [ad.id]);
    let adc = await charges("c.source_key = $1", [`ad:${ad.id}`]);
    check(adc.length === 1 && adc[0].amount === 1500 && adc[0].club_id === null, "anuncio con precio: cargo al anunciante", adc);
    await db.query("UPDATE ads SET price = 0 WHERE id = $1", [ad.id]);
    adc = await charges("c.source_key = $1", [`ad:${ad.id}`]);
    check(adc[0]?.status === "CANCELADO", "anuncio sin precio: el cargo se cancela", adc);
    await db.query("UPDATE ads SET price = $2, advertiser_name = '', starts_on = $3 WHERE id = $1", [ad.id, ad.price, ad.starts_on]);
  }

  // ---------- Cargos manuales ----------
  const base = { kind: "PROTEST", concept: "Protesta jornada 5", amount: 350, chargedOn: month + "-01" };
  for (const [label, vars] of [
    ["concepto con HTML", { ...base, id: "fin-x1", clubId: HALCONES, concept: "<script>alert(1)</script>" }],
    ["concepto con ;--", { ...base, id: "fin-x2", clubId: HALCONES, concept: "x'; DROP TABLE clubs;--" }],
    ["monto cero", { ...base, id: "fin-x3", clubId: HALCONES, amount: 0 }],
    ["club y externo a la vez", { ...base, id: "fin-x4", clubId: HALCONES, payerName: "Alguien Mas" }],
    ["club inexistente", { ...base, id: "fin-x5", clubId: "no-existe" }],
    ["sin deudor", { ...base, id: "fin-x6" }],
    ["fecha inválida", { ...base, id: "fin-x7", clubId: HALCONES, chargedOn: "2026-02-31" }],
    ["vence antes del cargo", { ...base, id: "fin-x8", clubId: HALCONES, dueDate: "2000-01-01" }],
    ["tipo inventado", { ...base, id: "fin-x9", clubId: HALCONES, kind: "MULTA" }],
  ]) {
    const r = await rpc("admin", "create_league_charge", vars);
    check(r.data?.charge === null, `create_league_charge: ${label} -> null`, r.data ?? r.error);
  }
  const manualClub = await rpc("admin", "create_league_charge", { ...base, id: "fin-m1", clubId: HALCONES, tournamentId: match.tournament_id });
  check(manualClub.data?.charge?.id === "fin-m1", "cargo manual a un club con torneo", manualClub.data ?? manualClub.error);
  const manualExt = await rpc("admin", "create_league_charge", {
    kind: "SPONSORSHIP", id: "fin-m2", payerName: "Refresquera del Valle", payerContact: "ventas@valle.mx",
    concept: "Patrocinio anual", amount: 5000, chargedOn: month + "-01" });
  check(manualExt.data?.charge?.id === "fin-m2", "cargo manual a un externo", manualExt.data ?? manualExt.error);
  const extRow = await one("SELECT club_id, payer_name, tournament_id, season_id FROM league_charges WHERE id = 'fin-m2'");
  check(extRow.club_id === null && extRow.payer_name === "Refresquera del Valle" && extRow.tournament_id === null && extRow.season_id === season,
    "el externo queda sin torneo y en la temporada de la fecha", extRow);

  // ---------- Abonos ----------
  const pay = (id, chargeId, amount, paidOn, method = "EFECTIVO") => rpc("admin", "add_league_payment", { id, chargeId, amount, paidOn, method });
  const today = (await one("SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS d")).d;
  let r = await pay("fin-p1", "fin-m1", 100, today);
  check(r.data?.charge?.status === "PARCIAL", "abono parcial -> PARCIAL", r.data ?? r.error);
  r = await pay("fin-p2", "fin-m1", 300, today);
  check(r.data?.payment === null, "abono mayor que el saldo -> null", r.data);
  r = await pay("fin-p3", "fin-m1", 50, today, "BITCOIN");
  check(r.data?.payment === null, "método inventado -> null", r.data);
  r = await pay("fin-p4", "fin-m1", 50, "2099-01-01");
  check(r.data?.payment === null, "abono con fecha futura -> null", r.data);
  r = await rpc("presidente", "add_league_payment", { id: "fin-p5", chargeId: "fin-m1", amount: 10, paidOn: today, method: "EFECTIVO" });
  check(r.data?.payment === null, "add_league_payment: presidente -> null", r.data);
  r = await pay("fin-p6", "fin-m1", 250, today, "TRANSFERENCIA");
  check(r.data?.charge?.status === "PAGADO", "abono del resto -> PAGADO", r.data ?? r.error);
  r = await pay("fin-p7", "fin-m1", 1, today);
  check(r.data?.payment === null, "no se abona a un cargo pagado", r.data);
  r = await rpc("admin", "delete_league_payment", { id: "fin-p6" });
  check(r.data?.deleted === 1 && (await one("SELECT status::text AS s FROM league_charges WHERE id = 'fin-m1'")).s === "PARCIAL",
    "borrar un abono recalcula el estado", r.data);
  await pay("fin-p6b", "fin-m1", 250, today);
  // Abono del mes pasado al patrocinio
  const lastMonth = (await one("SELECT to_char(CURRENT_DATE - 40, 'YYYY-MM-DD') AS d")).d;
  r = await pay("fin-p8", "fin-m2", 2000, lastMonth, "TRANSFERENCIA");
  check(r.data?.charge?.status === "PARCIAL", "abono con fecha del mes pasado", r.data ?? r.error);

  // ---------- Condonar y cancelar ----------
  const yellow = (await charges("c.match_id = $1 AND c.kind = 'CARD_YELLOW'", [match.id]))[0];
  r = await rpc("admin", "set_league_charge_status", { id: yellow.id, action: "CONDONAR", note: "Primera falta" });
  check(r.data?.charge?.status === "CONDONADO", "condonar una multa", r.data ?? r.error);
  r = await rpc("admin", "set_league_charge_status", { id: "fin-m1", action: "CANCELAR" });
  check(r.data?.charge === null, "no se cancela un cargo con abonos", r.data);
  r = await rpc("admin", "set_league_charge_status", { id: yellow.id, action: "BORRAR" });
  check(r.data?.charge === null, "acción inventada -> null", r.data);
  r = await rpc("admin", "set_league_charge_status", { id: yellow.id, action: "CONDONAR", note: "<b>x</b>" });
  check(r.data?.charge === null, "motivo con HTML -> null", r.data);

  // ---------- Gastos y pérdidas ----------
  const exp = (vars) => rpc("admin", "save_league_expense", { amount: 800, spentOn: today, ...vars });
  r = await exp({ id: "fin-e1", category: "ARBITROS", description: "Arbitros jornada 5", tournamentId: match.tournament_id });
  check(r.data?.expense?.id === "fin-e1", "gasto de árbitros del torneo", r.data ?? r.error);
  r = await exp({ id: "fin-e2", category: "DEVOLUCION", description: "Devolucion de fianza", amount: 300, chargeId: "fin-m1" });
  check(r.data?.expense?.id === "fin-e2", "devolución ligada a un cargo", r.data ?? r.error);
  r = await exp({ id: "fin-e3", category: "VIAJES", description: "Gasolina" });
  check(r.data?.expense === null, "categoría inventada -> null", r.data);
  r = await exp({ id: "fin-e4", category: "OTRO", description: "Otro", chargeId: "fin-m1" });
  check(r.data?.expense === null, "un cargo solo se liga a una devolución", r.data);
  r = await exp({ id: "fin-e5", category: "OTRO", description: "Balones;--" });
  check(r.data?.expense === null, "descripción con símbolos -> null", r.data);

  // ---------- Resumen ----------
  const sum = async (vars) => (await rpc("admin", "admin_finance_summary", vars)).data;
  const collectedAll = Number((await one("SELECT coalesce(sum(amount), 0) AS s FROM league_payments")).s);
  const total = await sum({ scope: "TOTAL" });
  check(total?.summary && total.summary.collected === collectedAll && total.summary.expenses === 800 && total.summary.refunds === 300,
    "resumen total: cobrado, gastos y devoluciones", total?.summary);
  check(total.summary.condoned === 50 && total.summary.losses === 350, "resumen total: pérdidas = condonado + devoluciones", total.summary);
  check(total.summary.result === collectedAll - 800 - 300, "resumen total: resultado", total.summary);
  check(total.debtors.some((d) => d.club.id === HALCONES && d.pending > 0), "resumen: clubes con adeudo", total.debtors);
  check(total.series.length >= 1 && total.series.every((s) => /^\d{4}$/.test(s.key)), "resumen total: serie por año", total.series);
  check(total.byKind.some((k) => k.kind === "MATCH_REFEREE" && k.generated === 400), "resumen: desglose por tipo", total.byKind);
  const [y, m] = month.split("-").map(Number);
  const thisMonth = await sum({ scope: "MONTH", year: y, month: m });
  check(thisMonth.summary.collected === collectedAll - 2000, "resumen del mes: el abono del mes pasado no entra", thisMonth.summary);
  const oldYear = await sum({ scope: "YEAR", year: 2001 });
  check(oldYear.summary.generated === 0 && oldYear.summary.collected === 0 && oldYear.series.length === 12, "resumen de un año sin datos: ceros y 12 meses", oldYear);
  const tour = await sum({ scope: "TOURNAMENT", tournamentId: match.tournament_id });
  const tourGenerated = Number((await one("SELECT coalesce(sum(amount), 0) AS s FROM league_charges WHERE tournament_id = $1 AND status <> 'CANCELADO'", [match.tournament_id])).s);
  check(tour.summary.generated === tourGenerated && tour.summary.expenses === 800, "resumen del torneo: solo sus cargos y gastos", { s: tour.summary, tourGenerated });
  check(tour.series.some((s) => s.label.startsWith("Jornada")), "resumen del torneo: serie por jornada", tour.series);
  const seasonSum = await sum({ scope: "SEASON", seasonId: season });
  check(seasonSum.summary.generated >= tour.summary.generated && seasonSum.series.length >= 12, "resumen de la temporada", seasonSum.summary);
  for (const bad of [{ scope: "SEMANA" }, { scope: "YEAR", year: "abc" }, { scope: "MONTH", year: 2026, month: 13 }, { scope: "SEASON", seasonId: "x" }]) {
    const b = await sum(bad);
    check(b?.summary === null, `resumen con ${JSON.stringify(bad)} -> null`, b);
  }

  // ---------- Listas y cuenta del club ----------
  const list = await rpc("admin", "admin_league_charges", { clubId: HALCONES, status: "PAGADO" });
  check(list.data?.charges?.some((c) => c.id === "fin-m1" && c.payments.length === 2), "admin_league_charges con filtros y abonos", list.data ?? list.error);
  const expList = await rpc("admin", "admin_league_expenses", { seasonId: season });
  check(expList.data?.expenses?.length === 2, "admin_league_expenses", expList.data ?? expList.error);
  const account = await rpc("tesorero", "club_league_account", { clubId: HALCONES });
  check(account.data?.account?.charges?.length > 0 && account.data.account.pending > 0 && account.data.account.charges.every((c) => c.club.id === HALCONES),
    "club_league_account: el tesorero ve la cuenta de su club", account.data ?? account.error);
  const other = await rpc("tesorero", "club_league_account", { clubId: "dummy-club-bahia" });
  check(other.data?.account === null, "club_league_account: otro club -> null", other.data);
  const dt = await rpc("dt", "club_league_account", { clubId: HALCONES });
  check(dt.data?.account === null, "club_league_account: el DT no la ve", dt.data);

  // ---------- Formularios de Publicidad y Canchas (1013_fn_admin.sql) ----------
  const adBase = {
    id: "fin-ad-1", brand: "Tienda Lopez", imageUrl: "https://example.com/banner.png", href: "",
    startsOn: today, endsOn: (await one("SELECT to_char(CURRENT_DATE + 30, 'YYYY-MM-DD') AS d")).d,
    status: "EN_CURSO", sortOrder: 99,
  };
  for (const [label, extra] of [
    ["precio con letras", { price: "abc" }],
    ["precio negativo", { price: -1 }],
    ["anunciante con HTML", { price: 900, advertiserName: "<b>Tienda</b>" }],
    ["contacto con script", { price: 900, advertiserContact: "<script>" }],
  ]) {
    const bad = await rpc("admin", "save_ad", { ...adBase, ...extra });
    check(bad.data?.ad === null, `save_ad: ${label} -> null`, bad.data ?? bad.error);
  }
  r = await rpc("admin", "save_ad", { ...adBase, price: 900, advertiserName: "Tienda Lopez SA", advertiserContact: "555 123 4567" });
  check(r.data?.ad?.id === "fin-ad-1", "save_ad con precio y anunciante", r.data ?? r.error);
  let adCharge = await charges("c.source_key = 'ad:fin-ad-1'");
  check(adCharge.length === 1 && adCharge[0].amount === 900, "anuncio nuevo con precio: cargo al anunciante", adCharge);
  await rpc("admin", "save_ad", { ...adBase, brand: "Tienda Lopez Dos" });
  const kept = await one("SELECT price::float AS price, advertiser_name FROM ads WHERE id = 'fin-ad-1'");
  check(kept.price === 900 && kept.advertiser_name === "Tienda Lopez SA", "save_ad sin precio conserva el que tenía", kept);
  const adsList = await rpc("admin", "admin_ads", {});
  check(adsList.data?.ads?.some((a) => a.id === "fin-ad-1" && a.price === 900 && a.advertiserName === "Tienda Lopez SA"), "admin_ads devuelve precio y anunciante", adsList.error);

  const slotMin = Number((await one("SELECT court_slot_minutes AS s FROM platform_settings WHERE id = 'config'")).s);
  const win = await one(`SELECT start_time FROM court_open_windows
    WHERE weekday = extract(isodow FROM CURRENT_DATE + 3) ORDER BY start_time LIMIT 1`);
  if (win && slotMin) {
    const holdDay = (await one("SELECT to_char(CURRENT_DATE + 3, 'YYYY-MM-DD') AS d")).d;
    const [hh, mm] = win.start_time.split(":").map(Number);
    const end = hh * 60 + mm + slotMin;
    const endTime = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
    const holdVars = { id: "fin-hold-2", courtId: courtRow.id, holdDate: holdDay, startTime: win.start_time, endTime,
      note: "Juan Perez", guestEmail: "juan@demo.local", fresh: true };
    const badClub = await rpc("admin", "save_court_hold", { ...holdVars, clubId: "no-existe" });
    check(!badClub.data?.hold, "save_court_hold: club inexistente -> no se guarda", badClub.data ?? badClub.error);
    const hold = await rpc("admin", "save_court_hold", { ...holdVars, clubId: HALCONES });
    check(Boolean(hold.data?.hold), "save_court_hold con el club a cobrar", hold.data ?? hold.error);
    rent = await charges("c.source_key = 'hold:fin-hold-2' AND c.status = 'PENDIENTE'");
    check(rent.length === 1 && rent[0].club_id === HALCONES, "la renta se cobra al club elegido", rent);
    await rpc("admin", "save_court_hold", { ...holdVars, note: "Juan Perez · Final", fresh: false });
    const keptClub = await one("SELECT club_id FROM court_holds WHERE id = 'fin-hold-2'");
    check(keptClub.club_id === HALCONES, "editar la renta sin clubId conserva el club", keptClub);
    const courtsAdmin = await rpc("admin", "admin_courts", {});
    check(courtsAdmin.data?.clubs?.length > 0 && courtsAdmin.data.courtHolds.some((h) => h.id === "fin-hold-2" && h.clubId === HALCONES),
      "admin_courts devuelve clubes y el club de la renta", courtsAdmin.error);
    await db.query("DELETE FROM court_holds WHERE id = 'fin-hold-2'");
  } else {
    check(true, "sin horario de canchas: se omite la prueba de save_court_hold");
  }

  await db.query("UPDATE league_fees SET enabled = false WHERE true");
  for (const row of restore) {
    await db.query("DELETE FROM match_cards WHERE match_id = $1", [row.id]);
    await db.query(`UPDATE matches SET status = $2, walkover = $3, no_show = $4, home_score = $5, away_score = $6, match_date = $7
      WHERE id = $1`, [row.id, row.status, row.walkover, row.no_show, row.home_score, row.away_score, row.match_date]);
  }
}
