// Pruebas de la ficha pública del jugador (player_profile) y de la sección Jugadores de /admin (admin_search_players,
// admin_player, admin_save_player y admin_merge_players). Crea su propia temporada, torneos, partidos y clubes con el
// prefijo prueba-perfil- y los borra al final: publico.mjs y liga.mjs cuentan totales globales.

const PRE = "prueba-perfil";
const A = `${PRE}-a`;
const B = `${PRE}-b`;
const C = `${PRE}-c`;
const SEASON = `${PRE}-temp`;
const T1 = `${PRE}-t1`;
const T2 = `${PRE}-t2`;
const P = `${PRE}-p`;
const Q = `${PRE}-q`;
const LIBRE = `${PRE}-libre`;
const [M1, M2, M3, M4, M5] = [1, 2, 3, 4, 5].map((i) => `${PRE}-m${i}`);
const AMISTOSO = `${PRE}-amistoso`;
const ENTRENO = `${PRE}-entreno`;
const META = `${PRE}-meta`;

export async function run({ db, rpc, check }) {
  const q = (sql, params = []) => db.query(sql, params);
  const one = async (sql, params = []) => (await q(sql, params)).rows[0];
  const n = async (sql, params = []) => (await one(sql, params)).n;
  const category = (await one("SELECT id FROM categories ORDER BY sort_order LIMIT 1"))?.id;
  if (!category) {
    check(true, "sin categorías: se omiten las pruebas de la ficha del jugador");
    return;
  }
  const profile = async (id, who = "anon") => rpc(who, "player_profile", { id });
  const line = (pr, t, club) => pr?.statLines?.find((l) => l.tournament.id === t && l.club.id === club);

  // ---------- Datos de prueba: temporada pasada con dos torneos y tres clubes ----------
  for (const [id, name] of [[A, "Perfil Alfa"], [B, "Perfil Beta"], [C, "Perfil Gama"]]) {
    await q("INSERT INTO clubs (id, slug, name) VALUES ($1, $1, $2)", [id, name]);
  }
  await q("INSERT INTO seasons (id, name, start_date, end_date, active) VALUES ($1, 'Perfil 2001', '2001-01-01', '2001-12-31', false)", [SEASON]);
  // Multa por amarilla en la temporada: la fusión no debe cancelar ni duplicar las multas de las tarjetas movidas
  await q("INSERT INTO league_fees (season_id, kind, enabled, amount) VALUES ($1, 'CARD_YELLOW', true, 50)", [SEASON]);
  await q(`INSERT INTO tournaments (id, name, season_id, category_id, status, start_date) VALUES
    ($1, 'Perfil Apertura', $3, $4, 'FINISHED', '2001-02-01'), ($2, 'Perfil Clausura', $3, $4, 'FINISHED', '2001-08-01')`,
    [T1, T2, SEASON, category]);
  const match = (id, t, home, away, status, hs, as, walkover = false) => q(
    `INSERT INTO matches (id, tournament_id, round_label, home_club_id, away_club_id, match_date, status, home_score, away_score, walkover)
     VALUES ($1, $2, 'J1', $3, $4, '2001-03-01', $5::match_status, $6, $7, $8)`, [id, t, home, away, status, hs, as, walkover]);
  await match(M1, T1, A, C, "PLAYED", 2, 1);
  await match(M2, T1, B, C, "PLAYED", 0, 1);
  await match(M3, T1, A, C, "SCHEDULED", null, null);
  await match(M4, T1, A, C, "PLAYED", 3, 0, true);
  await match(M5, T2, A, B, "PLAYED", 1, 0);

  // ---------- admin_save_player: permisos y validación ----------
  const nuevo = { id: P, name: "perfil  jugador", birthDate: "1990-05-10", imageUrl: "", clubId: A, shirtNumber: "9", position: "Delantero" };
  for (const who of ["usuario", "presidente", "dt"]) {
    const r = await rpc(who, "admin_save_player", nuevo);
    check(!r.error && r.data?.player === null, `admin_save_player: ${who} -> null`, r.data ?? r.error);
  }
  const anonSave = await rpc("anon", "admin_save_player", nuevo);
  check(anonSave.error?.code === "42501", "admin_save_player: anon -> 42501", anonSave.data ?? anonSave.error);
  const vacio = await rpc("admin", "admin_save_player", {});
  check(!vacio.error && vacio.data?.player === null, "admin_save_player: {} -> null sin error", vacio);
  for (const [label, vars] of [
    ["nombre de 2 letras", { name: "ab" }],
    ["nombre con dígitos", { name: "Juan 9" }],
    ["nacido antes de 1940", { birthDate: "1939-12-31" }],
    ["nacido en el futuro", { birthDate: "2999-01-01" }],
    ["fecha con otro formato", { birthDate: "10/05/1990" }],
    ["dorsal 0 con club", { shirtNumber: "0" }],
    ["posición inválida con club", { position: "Arquero" }],
    ["club que no existe", { clubId: "no-existe" }],
  ]) {
    const r = await rpc("admin", "admin_save_player", { ...nuevo, ...vars });
    check(!r.error && r.data?.player === null, `admin_save_player: ${label} -> null`, r.data ?? r.error);
  }
  check((await n("SELECT count(*)::int AS n FROM players WHERE id = $1", [P])) === 0, "admin_save_player: los rechazos no crean nada");
  const creado = await rpc("admin", "admin_save_player", nuevo);
  check(creado.data?.player?.id === P && creado.data.player.name === "Perfil Jugador"
    && (await n("SELECT count(*)::int AS n FROM club_players WHERE player_id = $1 AND club_id = $2 AND active AND shirt_number = '9'", [P, A])) === 1,
    "admin_save_player: crea al jugador en Title Case y lo suma al club elegido", creado);
  const repetido = await rpc("admin", "admin_save_player", { ...nuevo, clubId: B });
  check(!repetido.error && repetido.data?.player === null, "admin_save_player: con club, un id existente -> null (para eso está add_existing_player)", repetido);
  const enB = await rpc("admin", "add_existing_player", { clubId: B, playerId: P, shirtNumber: "10", position: "Delantero" });
  check(enB.data?.player?.id === P, "add_existing_player: el superadmin suma al jugador a otro club", enB);

  // Jugador libre: sin club, lo encuentran el buscador de /admin y el de cualquier club
  const libre = await rpc("admin", "admin_save_player", { id: LIBRE, name: "perfil libre", birthDate: "", imageUrl: "" });
  check(libre.data?.player?.id === LIBRE && (await n("SELECT count(*)::int AS n FROM club_players WHERE player_id = $1", [LIBRE])) === 0,
    "admin_save_player: sin club queda libre (ninguna fila en club_players)", libre);
  const editado = await rpc("admin", "admin_save_player", { id: LIBRE, name: "perfil libre editado", birthDate: "2000-01-02", imageUrl: "https://x/libre.jpg" });
  const libreRow = await one("SELECT name, to_char(birth_date, 'YYYY-MM-DD') AS birth, image_url FROM players WHERE id = $1", [LIBRE]);
  check(editado.data?.player?.id === LIBRE && libreRow.name === "Perfil Libre Editado" && libreRow.birth === "2000-01-02" && libreRow.image_url === "https://x/libre.jpg",
    "admin_save_player: edita nombre, nacimiento y foto", libreRow);

  // ---------- admin_search_players y admin_player ----------
  for (const who of ["anon", "usuario", "presidente", "dt"]) {
    for (const fn of ["admin_search_players", "admin_player"]) {
      const r = await rpc(who, fn, { q: "perfil", id: P });
      check(r.error?.code === "42501", `${fn}: ${who} -> 42501`, r.data ?? r.error);
    }
  }
  const ids = (r) => (r.data?.players ?? []).map((x) => x.id);
  const todos = await rpc("admin", "admin_search_players", { q: "PERFÍL" });
  check(ids(todos).includes(P) && ids(todos).includes(LIBRE), "admin_search_players: encuentra por nombre sin importar acentos ni mayúsculas", todos);
  const libres = await rpc("admin", "admin_search_players", { q: "perfil", free: true });
  check(ids(libres).includes(LIBRE) && !ids(libres).includes(P), "admin_search_players: free deja solo a los que no están en ningún club", libres);
  const pHit = todos.data?.players?.find((x) => x.id === P);
  check(pHit?.clubs_on_player?.map((c) => c.id).sort().join() === [A, B].sort().join(), "admin_search_players: trae los clubes actuales", pHit);
  const recientes = await rpc("admin", "admin_search_players", {});
  check(recientes.data?.players?.[0]?.id === LIBRE, "admin_search_players: sin texto trae primero al creado más reciente", ids(recientes).slice(0, 3));
  for (const bad of ["pe", "perfil 9", "perfil'; drop"]) {
    const r = await rpc("admin", "admin_search_players", { q: bad });
    check(!r.error && r.data?.players?.length === 0, `admin_search_players: «${bad}» -> lista vacía`, r);
  }
  const desdeClub = await rpc("admin", "search_players", { clubId: A, q: "perfil libre" });
  check(ids(desdeClub).includes(LIBRE), "search_players: un club encuentra al jugador libre", desdeClub);
  const detalle = await rpc("admin", "admin_player", { id: P });
  const fichas = detalle.data?.player?.clubPlayers_on_player ?? [];
  check(detalle.data?.player?.birthDate === "1990-05-10" && fichas.length === 2 && fichas.every((f) => f.deletedAt === null),
    "admin_player: fecha exacta y sus dos fichas de club", detalle.data);
  const nadie = await rpc("admin", "admin_player", { id: "no-existe" });
  check(!nadie.error && nadie.data?.player === null, "admin_player: id inexistente -> null", nadie);

  // ---------- Hechos de P ----------
  // m1 (T1, por A): gol de penal, asistencia, amarilla, MVP y alineación
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name, is_penalty) VALUES ($1, $2, 1, $3, 'Perfil Jugador', true)`, [M1, A, P]);
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_name, assist_id, assist_name) VALUES ($1, $2, 2, 'Otro', $3, 'Perfil Jugador')`, [M1, A, P]);
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_name) VALUES ($1, $2, 1, 'Rival')`, [M1, C]);
  await q(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color) VALUES ($1, $2, $3, 'Perfil Jugador', 'YELLOW')`, [M1, A, P]);
  await q(`INSERT INTO match_club_reports (match_id, club_id, mvp_id, lineup) VALUES ($1, $2, $3, $4)`,
    [M1, A, P, JSON.stringify({ mode: "FUT_7", formation: "2-3-1", positions: { gk: P, d1: "invitado-libre" } })]);
  // m2 (T1, por B): convocado, gol en contra (cuenta para C, el acreditado) y roja
  await q(`INSERT INTO match_attendees (match_id, club_id, player_id) VALUES ($1, $2, $3)`, [M2, B, P]);
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name, is_own_goal) VALUES ($1, $2, 1, $3, 'Perfil Jugador', true)`, [M2, C, P]);
  await q(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color) VALUES ($1, $2, $3, 'Perfil Jugador', 'RED')`, [M2, B, P]);
  // No cuentan: partido programado, walkover y amistoso
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name) VALUES ($1, $2, 1, $3, 'Perfil Jugador')`, [M3, A, P]);
  await q(`INSERT INTO match_attendees (match_id, club_id, player_id) VALUES ($1, $2, $3)`, [M4, A, P]);
  await q(`INSERT INTO club_events (id, club_id, event_type, match_type, title, event_date, event_time, mvp_id) VALUES ($1, $2, 'PARTIDO', 'AMISTOSO', 'Amistoso perfil', '2001-03-05', '10:00', $3)`, [AMISTOSO, A, P]);
  await q(`INSERT INTO club_event_goals (event_id, sort_order, scorer_id) VALUES ($1, 1, $2)`, [AMISTOSO, P]);
  // m5 (T2, por A): solo un gol; el partido cuenta por el gol aunque no esté convocado
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name) VALUES ($1, $2, 1, $3, 'Perfil Jugador')`, [M5, A, P]);

  // ---------- player_profile ----------
  const fichaAnon = await profile(P);
  const pr = fichaAnon.data?.player;
  check(!fichaAnon.error && pr?.id === P && pr.name === "Perfil Jugador", "player_profile: responde a anon", fichaAnon.error ?? fichaAnon.data);
  const edad = (await one("SELECT date_part('year', age(CURRENT_DATE, DATE '1990-05-10'))::int AS n")).n;
  const texto = JSON.stringify(fichaAnon.data);
  check(pr?.age === edad && !texto.includes("birthDate") && !texto.includes("1990-05-10"), "player_profile: trae la edad y nunca la fecha de nacimiento", { age: pr?.age, edad });
  const a1 = line(pr, T1, A);
  check(a1 && a1.matches === 1 && a1.goals === 1 && a1.assists === 1 && a1.penalties === 1 && a1.yellowCards === 1 && a1.mvps === 1
    && a1.ownGoals === 0 && a1.redCards === 0 && a1.season.id === SEASON && a1.club.slug === A,
    "player_profile: Apertura con Alfa (gol de penal, asistencia, amarilla, MVP; el walkover y el programado no cuentan)", a1);
  const b1 = line(pr, T1, B);
  check(b1 && b1.matches === 1 && b1.goals === 0 && b1.ownGoals === 1 && b1.redCards === 1,
    "player_profile: Apertura con Beta (convocado, gol en contra en su club y roja)", b1);
  check(!line(pr, T1, C), "player_profile: el gol en contra no crea una fila para el club acreditado", pr?.statLines);
  const a2 = line(pr, T2, A);
  check(a2 && a2.matches === 1 && a2.goals === 1, "player_profile: Clausura con Alfa (el partido cuenta por el gol)", a2);
  check(pr?.statLines?.map((l) => `${l.tournament.id}/${l.club.id}`).join() === [`${T2}/${A}`, `${T1}/${A}`, `${T1}/${B}`].join(),
    "player_profile: orden por torneo más reciente y luego club", pr?.statLines);
  const t = pr?.totals;
  check(t && t.matches === 3 && t.goals === 2 && t.assists === 1 && t.penalties === 1 && t.ownGoals === 1 && t.yellowCards === 1 && t.redCards === 1 && t.mvps === 1,
    "player_profile: totales (amistoso excluido)", t);
  const sc = await one("SELECT goals, assists FROM tournament_scorers WHERE tournament_id = $1 AND club_id = $2 AND player_id = $3", [T1, A, P]);
  check(sc && sc.goals === a1?.goals && sc.assists === a1?.assists, "player_profile: goles y asistencias coinciden con tournament_scorers", sc);
  check(pr?.clubs_on_player?.length === 2 && pr.clubs_on_player.every((c) => c.status === "ACTIVE"), "player_profile: sus dos clubes actuales", pr?.clubs_on_player);
  for (const [label, vars] of [["{}", {}], ["id inexistente", { id: "no-existe" }]]) {
    const r = await rpc("anon", "player_profile", vars);
    check(!r.error && r.data?.player === null, `player_profile: ${label} -> player null`, r);
  }

  // De baja, eliminado y club borrado
  const conDatos = { id: P, clubId: A, name: "Perfil Jugador", shirtNumber: "9", position: "Delantero", isCoach: false, detail: { birthDate: "1990-05-10", imageUrl: "" } };
  await rpc("admin", "save_player", { ...conDatos, active: false });
  let estados = (await profile(P)).data?.player?.clubs_on_player ?? [];
  check(estados.find((c) => c.id === A)?.status === "INACTIVE", "player_profile: de baja en un club -> INACTIVE", estados);
  await rpc("admin", "save_player", { ...conDatos, active: true });
  const quitado = await rpc("admin", "delete_player", { clubId: B, id: P });
  let ficha = (await profile(P)).data?.player;
  check(quitado.data?.deleted === 1 && ficha?.clubs_on_player?.find((c) => c.id === B)?.status === "FORMER" && line(ficha, T1, B)?.redCards === 1,
    "player_profile: eliminado de un club -> FORMER y conserva sus números ahí", ficha?.clubs_on_player);
  await q("UPDATE clubs SET deleted_at = now() WHERE id = $1", [B]);
  ficha = (await profile(P)).data?.player;
  check(!ficha?.clubs_on_player?.some((c) => c.id === B) && line(ficha, T1, B)?.club?.slug === null && line(ficha, T1, B)?.matches === 1,
    "player_profile: un club borrado sale de la lista pero sus números quedan (sin enlace)", ficha);
  await q("UPDATE clubs SET deleted_at = NULL WHERE id = $1", [B]);

  // ---------- admin_merge_players ----------
  // Q es la misma persona cargada dos veces: choca con P en cada regla
  await rpc("admin", "delete_player", { clubId: A, id: P });
  await rpc("admin", "admin_save_player", { id: Q, name: "perfil duplicado", birthDate: "", imageUrl: "https://x/q.jpg", clubId: A, shirtNumber: "7", position: "Medio" });
  await rpc("admin", "add_existing_player", { clubId: C, playerId: Q, shirtNumber: "8", position: "Medio" });
  await q(`INSERT INTO match_attendees (match_id, club_id, player_id) VALUES ($1, $2, $3), ($4, $5, $3)`, [M2, B, Q, M1, A]);
  await q(`INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name) VALUES ($1, $2, 3, $3, 'Perfil Duplicado')`, [M1, A, Q]);
  await q(`INSERT INTO match_cards (match_id, club_id, player_id, player_name, color) VALUES ($1, $2, $3, 'Perfil Duplicado', 'YELLOW')`, [M1, A, Q]);
  await q(`INSERT INTO match_club_reports (match_id, club_id, mvp_id, lineup) VALUES ($1, $2, $3, $4)`,
    [M5, A, Q, JSON.stringify({ mode: "FUT_7", formation: "2-3-1", positions: { d1: Q, d2: "Nombre Viejo" } })]);
  await q(`UPDATE club_events SET lineup = $2 WHERE id = $1`, [AMISTOSO, JSON.stringify({ mode: "FUT_7", formation: "2-3-1", positions: { x: Q } })]);
  await q(`INSERT INTO club_events (id, club_id, event_type, title, event_date, event_time) VALUES ($1, $2, 'ENTRENAMIENTO', 'Entreno perfil', '2001-03-06', '10:00')`, [ENTRENO, A]);
  await q(`INSERT INTO club_event_attendees (event_id, player_id, raw_label) VALUES ($1, $2, $2), ($1, $3, $3), ($4, $3, $3)`, [AMISTOSO, P, Q, ENTRENO]);
  await q(`INSERT INTO club_default_lineups (club_id, mode, formation, positions) VALUES ($1, 'FUT_7', '2-3-1', $2)`,
    [A, JSON.stringify({ mode: "FUT_7", formation: "2-3-1", positions: { y: Q } })]);
  await q(`INSERT INTO financial_goals (id, club_id, title, amount, status) VALUES ($1, $2, 'Meta perfil', 100, 'ACTIVE')`, [META, A]);
  await q(`INSERT INTO goal_contributions (goal_id, player_id, amount) VALUES ($1, $2, 10), ($1, $3, 5)`, [META, P, Q]);
  await q(`INSERT INTO transactions (id, club_id, type, description, category, amount, txn_date, player_id) VALUES ($1, $2, 'INGRESO', 'Cuota', 'Cuotas', 20, '2001-03-01', $3)`, [`${PRE}-mov`, A, Q]);

  const multas = () => one(`SELECT count(*) FILTER (WHERE status <> 'CANCELADO')::int AS vivas, count(*) FILTER (WHERE auto_cancelled)::int AS canceladas,
    string_agg(source_key, ',' ORDER BY source_key) AS claves FROM league_charges WHERE match_id = $1 AND kind = 'CARD_YELLOW'`, [M1]);
  const multasAntes = await multas();
  check(multasAntes.vivas === 2, "fusión: hay una multa por cada amarilla de m1 antes de fusionar", multasAntes);
  const pAntes = (await profile(P)).data?.player?.totals;
  const qAntes = (await profile(Q)).data?.player?.totals;

  for (const who of ["usuario", "presidente", "dt"]) {
    const r = await rpc(who, "admin_merge_players", { sourceId: Q, targetId: P });
    check(!r.error && r.data?.merged === null, `admin_merge_players: ${who} -> null`, r.data ?? r.error);
  }
  for (const [label, vars] of [["{}", {}], ["el mismo id", { sourceId: P, targetId: P }], ["un id inexistente", { sourceId: "no-existe", targetId: P }]]) {
    const r = await rpc("admin", "admin_merge_players", vars);
    check(!r.error && r.data?.merged === null, `admin_merge_players: ${label} -> null`, r.data ?? r.error);
  }
  check((await n("SELECT count(*)::int AS n FROM players WHERE id = $1", [Q])) === 1, "admin_merge_players: los rechazos no tocan nada");

  const fusion = await rpc("admin", "admin_merge_players", { sourceId: Q, targetId: P });
  const merged = fusion.data?.merged;
  check(!fusion.error && merged?.id === P && merged.name === "Perfil Jugador" && merged.orphanImageUrl === null && merged.moved?.clubs === 2,
    "admin_merge_players: fusiona y cuenta lo movido", fusion.data ?? fusion.error);
  check((await n("SELECT count(*)::int AS n FROM players WHERE id = $1", [Q])) === 0, "fusión: el origen ya no existe");
  const restos = await n(`SELECT (
      (SELECT count(*) FROM club_players WHERE player_id = $1) + (SELECT count(*) FROM match_attendees WHERE player_id = $1)
    + (SELECT count(*) FROM match_goals WHERE scorer_id = $1 OR assist_id = $1) + (SELECT count(*) FROM match_cards WHERE player_id = $1)
    + (SELECT count(*) FROM match_club_reports WHERE mvp_id = $1 OR lineup::text LIKE '%"' || $1 || '"%')
    + (SELECT count(*) FROM club_events WHERE mvp_id = $1 OR lineup::text LIKE '%"' || $1 || '"%')
    + (SELECT count(*) FROM club_default_lineups WHERE positions::text LIKE '%"' || $1 || '"%')
    + (SELECT count(*) FROM club_event_attendees WHERE player_id = $1 OR raw_label = $1)
    + (SELECT count(*) FROM goal_contributions WHERE player_id = $1) + (SELECT count(*) FROM transactions WHERE player_id = $1))::int AS n`, [Q]);
  check(restos === 0, "fusión: no queda ninguna referencia al origen", restos);
  const fichaA = await one("SELECT shirt_number, active, deleted_at FROM club_players WHERE club_id = $1 AND player_id = $2", [A, P]);
  check(fichaA?.shirt_number === "7" && fichaA.active === true && fichaA.deleted_at === null,
    "fusión: en el club compartido gana la ficha viva (la del origen)", fichaA);
  check((await n("SELECT count(*)::int AS n FROM club_players WHERE club_id = $1 AND player_id = $2", [C, P])) === 1, "fusión: el club que solo tenía el origen pasa al destino");
  check((await one("SELECT amount::float AS n FROM goal_contributions WHERE goal_id = $1 AND player_id = $2", [META, P]))?.n === 15, "fusión: los aportes a la misma meta se suman");
  check((await n("SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = $1 AND player_id = $2", [AMISTOSO, P])) === 1
    && (await n("SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = $1 AND player_id = $2 AND raw_label = $2", [ENTRENO, P])) === 1,
    "fusión: la asistencia repetida queda una sola vez y la otra se reescribe con su etiqueta");
  const lineup = (await one("SELECT lineup FROM match_club_reports WHERE match_id = $1 AND club_id = $2", [M5, A]))?.lineup;
  check(lineup?.positions?.d1 === P && lineup.positions.d2 === "Nombre Viejo" && lineup.formation === "2-3-1",
    "fusión: la alineación cambia el id y conserva lo demás", lineup);
  const tarjeta = await one("SELECT player_id, player_name FROM match_cards WHERE match_id = $1 AND player_name = 'Perfil Duplicado'", [M1]);
  check(tarjeta?.player_id === P, "fusión: la tarjeta pasa al destino y conserva el nombre guardado", tarjeta);
  check((await one("SELECT scorer_name FROM match_goals WHERE match_id = $1 AND sort_order = 3 AND club_id = $2", [M1, A]))?.scorer_name === "Perfil Jugador",
    "fusión: el nombre guardado en el gol pasa a ser el del destino");
  const multasDespues = await multas();
  check(multasDespues.vivas === 2 && multasDespues.canceladas === 0 && multasDespues.claves === multasAntes.claves,
    "fusión: las multas por tarjeta no se cancelan ni se duplican", { antes: multasAntes, despues: multasDespues });
  const persona = await one("SELECT to_char(birth_date, 'YYYY-MM-DD') AS birth, image_url FROM players WHERE id = $1", [P]);
  check(persona?.birth === "1990-05-10" && persona.image_url === "https://x/q.jpg", "fusión: gana el destino y los vacíos se completan con el origen", persona);
  const pDespues = (await profile(P)).data?.player?.totals;
  check(pDespues && pDespues.goals === pAntes.goals + qAntes.goals && pDespues.yellowCards === pAntes.yellowCards + qAntes.yellowCards
    && pDespues.mvps === pAntes.mvps + qAntes.mvps && pDespues.matches === 3,
    "fusión: la ficha suma los números de los dos (partidos sin repetir)", { pAntes, qAntes, pDespues });

  // ---------- Limpieza ----------
  await q(`DELETE FROM league_charges WHERE club_id IN ($1, $2, $3) OR season_id = $4 OR match_id LIKE '${PRE}-%'`, [A, B, C, SEASON]);
  await q("DELETE FROM seasons WHERE id = $1", [SEASON]);
  await q("DELETE FROM clubs WHERE id IN ($1, $2, $3)", [A, B, C]);
  await q(`DELETE FROM players WHERE id LIKE '${PRE}-%'`);
  check((await n(`SELECT count(*)::int AS n FROM league_charges WHERE match_id LIKE '${PRE}-%' OR club_id LIKE '${PRE}-%'`)) === 0
    && (await n(`SELECT count(*)::int AS n FROM clubs WHERE id LIKE '${PRE}-%'`)) === 0,
    "limpieza: no quedan datos de prueba");
}
