// Pruebas del jugador del partido (vistas match_mvps y club_event_mvps de 0013_mvp_partido.sql): uno solo por partido,
// por goles, luego asistencias, luego el más joven (sin fecha queda detrás) y al final el nombre. Crea su propia
// temporada cerrada, torneo, clubes y jugadores con el prefijo prueba-mvp- y los borra al final.

const PRE = "prueba-mvp";
const A = `${PRE}-a`;
const B = `${PRE}-b`;
const SEASON = `${PRE}-temp`;
const T = `${PRE}-t`;
const AMISTOSO = `${PRE}-amistoso`;
const [V1, V2, V3, V4, V5] = [1, 2, 3, 4, 5].map((i) => `${PRE}-v${i}`);
const M = Object.fromEntries(
  ["goles", "asistencias", "edad", "sinFecha", "nombre", "cero", "autogol", "sinJugador", "walkover"].map((k) => [k, `${PRE}-${k}`]),
);

export async function run({ db, rpc, check }) {
  const q = (sql, params = []) => db.query(sql, params);
  const one = async (sql, params = []) => (await q(sql, params)).rows[0];
  const category = (await one("SELECT id FROM categories ORDER BY sort_order LIMIT 1"))?.id;
  if (!category) {
    check(true, "sin categorías: se omiten las pruebas del MVP");
    return;
  }

  // ---------- Datos ----------
  await q("INSERT INTO clubs (id, slug, name) VALUES ($1, $1, 'Mvp Alfa'), ($2, $2, 'Mvp Beta')", [A, B]);
  await q("INSERT INTO seasons (id, name, start_date, end_date, active) VALUES ($1, 'Mvp 2002', '2002-01-01', '2002-12-31', false)", [SEASON]);
  await q("INSERT INTO tournaments (id, name, season_id, category_id, status, start_date) VALUES ($1, 'Mvp Copa', $2, $3, 'FINISHED', '2002-02-01')",
    [T, SEASON, category]);
  // V2 es el más joven; V3 y V4 no tienen fecha (Cuatro va antes que Tres por nombre)
  await q(`INSERT INTO players (id, name, birth_date) VALUES
    ($1, 'Mvp Uno', '1995-01-01'), ($2, 'Mvp Dos', '2000-01-01'), ($3, 'Mvp Tres', NULL), ($4, 'Mvp Cuatro', NULL), ($5, 'Mvp Cinco', '1990-01-01')`,
    [V1, V2, V3, V4, V5]);
  for (const [key, walkover] of Object.entries(M).map(([k, id]) => [id, k === "walkover"])) {
    await q(`INSERT INTO matches (id, tournament_id, round_label, home_club_id, away_club_id, match_date, status, home_score, away_score, walkover)
      VALUES ($1, $2, 'J1', $3, $4, '2002-03-01', 'PLAYED', 0, 0, $5)`, [key, T, A, B, walkover]);
  }
  let order = 0;
  const goal = (match, club, { scorer = null, assist = null, ownGoal = false, name = "Alguien" } = {}) => q(
    `INSERT INTO match_goals (match_id, club_id, sort_order, scorer_id, scorer_name, assist_id, assist_name, is_own_goal)
     VALUES ($1, $2, $3, $4, $5, $6, '', $7)`, [match, club, ++order, scorer, name, assist, ownGoal]);

  // goles: V1 dos goles gana a V2 con un gol y dos asistencias
  await goal(M.goles, A, { scorer: V1 });
  await goal(M.goles, A, { scorer: V1, assist: V2 });
  await goal(M.goles, A, { scorer: V2 });
  await goal(M.goles, A, { name: "Sin ficha", assist: V2 });
  // asistencias: un gol cada uno; V2 además asiste
  await goal(M.asistencias, A, { scorer: V1, assist: V2 });
  await goal(M.asistencias, A, { scorer: V2 });
  // edad: un gol cada uno; V2 es más joven (V1 juega aquí en B)
  await goal(M.edad, B, { scorer: V1 });
  await goal(M.edad, A, { scorer: V2 });
  // sin fecha: V3 sin nacimiento pierde con V5, aunque V5 sea el mayor
  await goal(M.sinFecha, A, { scorer: V3 });
  await goal(M.sinFecha, B, { scorer: V5 });
  // nombre: V3 y V4 sin fecha; gana «Mvp Cuatro»
  await goal(M.nombre, A, { scorer: V3 });
  await goal(M.nombre, B, { scorer: V4 });
  // autogol: no cuenta ni el goleador ni la asistencia
  await goal(M.autogol, B, { scorer: V1, assist: V2, ownGoal: true });
  // sin jugador: el gol solo tiene nombre escrito
  await goal(M.sinJugador, A, { name: "Solo Nombre" });
  // walkover: aunque tenga un gol cargado, no hay MVP
  await goal(M.walkover, A, { scorer: V1 });

  // ---------- Vista match_mvps ----------
  const mvp = async (id) => one("SELECT player_id, club_id, goals, assists FROM match_mvps WHERE match_id = $1", [id]);
  const goles = await mvp(M.goles);
  check(goles?.player_id === V1 && goles.club_id === A && goles.goals === 2, "MVP: gana el de más goles", goles);
  check((await mvp(M.asistencias))?.player_id === V2, "MVP: con los goles empatados gana el de más asistencias");
  const edad = await mvp(M.edad);
  check(edad?.player_id === V2 && edad.club_id === A, "MVP: con goles y asistencias empatados gana el más joven (y lleva su club)", edad);
  check((await mvp(M.sinFecha))?.player_id === V5, "MVP: el que no tiene fecha de nacimiento queda detrás");
  check((await mvp(M.nombre))?.player_id === V4, "MVP: si todo empata, decide el nombre");
  for (const [label, id] of [["un 0-0", M.cero], ["un autogol", M.autogol], ["un gol sin jugador", M.sinJugador], ["un walkover", M.walkover]]) {
    check(!(await mvp(id)), `MVP: ${label} no tiene MVP`);
  }
  check((await one(`SELECT count(*)::int AS n FROM match_mvps WHERE match_id LIKE '${PRE}-%'`)).n === 5, "MVP: uno solo por partido");

  // ---------- Funciones ----------
  const detalle = await rpc("anon", "match_detail", { id: M.goles });
  const dm = detalle.data?.matches?.[0];
  check(dm?.mvp?.id === V1 && dm.mvp.name === "Mvp Uno" && dm.mvp.club?.id === A
    && dm.matchClubReports_on_match.every((r) => !("mvp" in r)), "match_detail: un solo mvp en el partido, con nombre y club", dm?.mvp);
  const cero = await rpc("anon", "match_detail", { id: M.cero });
  check(cero.data?.matches?.[0] && cero.data.matches[0].mvp === null, "match_detail: sin goles, mvp null", cero.data?.matches?.[0]?.mvp);
  const totals = async (id) => (await rpc("anon", "player_profile", { id })).data?.player?.totals;
  const [t1, t2] = [await totals(V1), await totals(V2)];
  check(t1?.mvps === 1 && t2?.mvps === 2, "player_profile: cuenta el MVP calculado", { uno: t1?.mvps, dos: t2?.mvps });
  const resumen = await rpc("anon", "season_summary", { id: SEASON });
  const top = resumen.data?.season?.awards?.mvps?.[0];
  check(top?.player?.id === V2 && top.value === 2, "season_summary: «más MVP» sale del MVP calculado", resumen.data?.season?.awards?.mvps);

  // ---------- Amistosos ----------
  await q(`INSERT INTO club_events (id, club_id, event_type, match_type, title, event_date, event_time)
    VALUES ($1, $2, 'PARTIDO', 'AMISTOSO', 'Amistoso mvp', '2002-03-05', '10:00')`, [AMISTOSO, A]);
  await q(`INSERT INTO club_event_goals (event_id, sort_order, scorer_id, assist_id, is_own_goal) VALUES
    ($1, 1, $2, NULL, false), ($1, 2, $3, $2, true), ($1, 3, $3, $2, true)`, [AMISTOSO, V1, V2]);
  const amistoso = await one("SELECT player_id, goals, assists FROM club_event_mvps WHERE event_id = $1", [AMISTOSO]);
  check(amistoso?.player_id === V1 && amistoso.goals === 1 && amistoso.assists === 0, "MVP del amistoso: automático y sin contar autogoles", amistoso);

  // ---------- Limpieza ----------
  await q(`DELETE FROM league_charges WHERE club_id IN ($1, $2) OR season_id = $3 OR match_id LIKE '${PRE}-%'`, [A, B, SEASON]);
  await q("DELETE FROM seasons WHERE id = $1", [SEASON]);
  await q("DELETE FROM clubs WHERE id IN ($1, $2)", [A, B]);
  await q(`DELETE FROM players WHERE id LIKE '${PRE}-%'`);
  check((await one(`SELECT count(*)::int AS n FROM clubs WHERE id LIKE '${PRE}-%'`)).n === 0
    && (await one(`SELECT count(*)::int AS n FROM matches WHERE id LIKE '${PRE}-%'`)).n === 0,
    "limpieza: no quedan datos de prueba del MVP");
}
