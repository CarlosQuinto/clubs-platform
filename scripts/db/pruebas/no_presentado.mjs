// Pruebas de «no se presentó» (mark_match_no_show / clear_match_no_show en 1012_fn_league.sql y la tabla de
// posiciones de 0006_no_presentado.sql) sobre los datos dummy. La BD es efímera: se toma un partido
// programado de un torneo activo y se le pone la fecha de hoy.

export async function run({ db, rpc, check }) {
  const pick = await db.query(`
    SELECT m.id, m.tournament_id, m.home_club_id, m.away_club_id
    FROM matches m JOIN tournaments t ON t.id = m.tournament_id
    WHERE m.status = 'SCHEDULED' AND t.status = 'ACTIVE' AND m.match_date IS NOT NULL
    ORDER BY m.id LIMIT 1`);
  const match = pick.rows[0];
  if (!match) {
    check(true, "sin partidos programados: se omiten las pruebas de no presentado");
    return;
  }
  await db.query("UPDATE matches SET match_date = CURRENT_DATE WHERE id = $1", [match.id]);
  await db.query(`INSERT INTO match_goals (id, match_id, club_id, scorer_name, sort_order)
    VALUES (gen_random_uuid(), $1, $2, 'Alguien', 99)`, [match.id, match.home_club_id]);

  const standing = async (club) => (await db.query(
    "SELECT pj, g, e, p, gf, gc, pts FROM tournament_standings WHERE tournament_id = $1 AND club_id = $2",
    [match.tournament_id, club])).rows[0];
  const row = async () => (await db.query(
    "SELECT status, walkover, no_show, home_score, away_score FROM matches WHERE id = $1", [match.id])).rows[0];
  const homeBefore = await standing(match.home_club_id);
  const awayBefore = await standing(match.away_club_id);

  // Permisos y valores fuera de lista
  for (const who of ["anon", "usuario", "presidente"]) {
    const r = await rpc(who, "mark_match_no_show", { id: match.id, noShow: "HOME" });
    check(r.error || r.data?.match === null, `mark_match_no_show: ${who} no puede`, r.data ?? r.error);
  }
  for (const noShow of ["LOCAL", "", null, "home"]) {
    const r = await rpc("admin", "mark_match_no_show", { id: match.id, noShow });
    check(r.data?.match === null, `mark_match_no_show: ${JSON.stringify(noShow)} -> null`, r.data ?? r.error);
  }
  check((await row()).status === "SCHEDULED", "el partido sigue programado tras los intentos inválidos");

  // Un partido con fecha futura no se puede marcar
  await db.query("UPDATE matches SET match_date = CURRENT_DATE + 3 WHERE id = $1", [match.id]);
  const future = await rpc("admin", "mark_match_no_show", { id: match.id, noShow: "HOME" });
  check(future.data?.match === null, "mark_match_no_show: fecha futura -> null", future.data ?? future.error);
  await db.query("UPDATE matches SET match_date = CURRENT_DATE WHERE id = $1", [match.id]);

  // Falta el local: 0-3, walkover y sin goles
  const home = await rpc("admin", "mark_match_no_show", { id: match.id, noShow: "HOME" });
  check(home.data?.match?.id === match.id, "mark_match_no_show HOME", home.data ?? home.error);
  let m = await row();
  check(m.status === "PLAYED" && m.walkover === true && m.no_show === "HOME" && m.home_score === 0 && m.away_score === 3,
    "HOME -> PLAYED, W.O. 0-3", m);
  const goals = await db.query("SELECT count(*)::int AS n FROM match_goals WHERE match_id = $1", [match.id]);
  check(goals.rows[0].n === 0, "HOME borra los goles del partido", goals.rows[0]);
  const awayWin = await standing(match.away_club_id);
  check(awayWin.pts === awayBefore.pts + 3 && awayWin.g === awayBefore.g + 1, "HOME: el visitante suma 3 puntos", { awayBefore, awayWin });

  // Se cambia a «no se presentó ninguno»: derrota y 0 puntos para los dos
  const both = await rpc("admin", "mark_match_no_show", { id: match.id, noShow: "BOTH" });
  check(both.data?.match?.id === match.id, "mark_match_no_show BOTH sobre un HOME", both.data ?? both.error);
  m = await row();
  check(m.no_show === "BOTH" && m.home_score === 0 && m.away_score === 0, "BOTH -> 0-0", m);
  const homeBoth = await standing(match.home_club_id);
  const awayBoth = await standing(match.away_club_id);
  check(homeBoth.pj === homeBefore.pj + 1 && homeBoth.p === homeBefore.p + 1 && homeBoth.e === homeBefore.e && homeBoth.pts === homeBefore.pts,
    "BOTH: el local suma derrota sin puntos", { homeBefore, homeBoth });
  check(awayBoth.pj === awayBefore.pj + 1 && awayBoth.p === awayBefore.p + 1 && awayBoth.e === awayBefore.e && awayBoth.pts === awayBefore.pts,
    "BOTH: el visitante suma derrota sin puntos", { awayBefore, awayBoth });

  // Deshacer: vuelve a programado, con su fecha, sin marcador
  const noUndo = await rpc("presidente", "clear_match_no_show", { id: match.id });
  check(noUndo.error || noUndo.data?.match === null, "clear_match_no_show: presidente no puede", noUndo.data ?? noUndo.error);
  const undo = await rpc("admin", "clear_match_no_show", { id: match.id });
  check(undo.data?.match?.id === match.id, "clear_match_no_show", undo.data ?? undo.error);
  m = await row();
  check(m.status === "SCHEDULED" && m.walkover === false && m.no_show === null && m.home_score === null, "deshacer -> programado sin marcador", m);
  const homeAfter = await standing(match.home_club_id);
  check(homeAfter.pj === homeBefore.pj && homeAfter.pts === homeBefore.pts, "deshacer devuelve la tabla como estaba", { homeBefore, homeAfter });
  const again = await rpc("admin", "clear_match_no_show", { id: match.id });
  check(again.data?.match === null, "clear_match_no_show sobre un partido normal -> null", again.data);

  // El W.O. por ingreso tardío no se convierte en «no se presentó»
  await db.query("UPDATE matches SET status = 'PLAYED', walkover = true, home_score = 3, away_score = 0 WHERE id = $1", [match.id]);
  const late = await rpc("admin", "mark_match_no_show", { id: match.id, noShow: "AWAY" });
  check(late.data?.match === null, "mark_match_no_show sobre un W.O. por ingreso tardío -> null", late.data);
  // Capturar un marcador normal limpia el no_show
  await db.query("UPDATE matches SET walkover = false, no_show = 'AWAY' WHERE id = $1", [match.id]);
  const score = await rpc("admin", "save_match_score", { id: match.id, homeScore: 1, awayScore: 1, walkover: false });
  check(score.data?.match?.id === match.id && (await row()).no_show === null, "save_match_score limpia no_show", score.data ?? score.error);

  // La lectura pública expone noShow
  await rpc("admin", "mark_match_no_show", { id: match.id, noShow: "AWAY" });
  const detail = await rpc("anon", "match_detail", { id: match.id });
  const pub = detail.data?.matches?.[0] ?? detail.data?.match;
  check(pub?.noShow === "AWAY" && pub?.walkover === true, "match_detail expone noShow", pub ?? detail.error);
}
