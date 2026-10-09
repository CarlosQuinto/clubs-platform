// Pruebas del bloque público y de sesión (db/migrations/1010_fn_public.sql) sobre los datos dummy.
// Fecha base de la semilla: la de scripts/demo/demo-seed.sql (hoy al generarla).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function seedDate() {
  const file = join(ROOT, "scripts", "demo", "demo-seed.sql");
  if (!existsSync(file)) return null;
  const m = /fecha base (\d{4}-\d{2}-\d{2})/.exec(readFileSync(file, "utf8").slice(0, 400));
  return m ? m[1] : null;
}

export async function run({ db, rpc, check }) {
  const today = seedDate();
  if (!today) {
    check(true, "sin datos dummy: se omiten las pruebas de contenido");
    return;
  }

  // Portada
  const home = await rpc("anon", "home_page", { today });
  check(!home.error, "home_page responde", home.error);
  const h = home.data ?? {};
  check(Array.isArray(h.tournaments) && h.tournaments.length >= 2, "home_page: torneos vigentes", h.tournaments?.length);
  check(h.platformStats?.[0]?.clubs === 8, "home_page: platformStats.clubs = 8", h.platformStats);
  const allTournaments = (await db.query("SELECT count(*)::int AS n FROM tournaments")).rows[0].n;
  check(
    h.platformStats?.[0]?.tournaments === allTournaments && allTournaments >= h.tournaments.length,
    "home_page: platformStats.tournaments cuenta todos los torneos, también los terminados",
    { stats: h.platformStats, todos: allTournaments, vigentes: h.tournaments?.length },
  );
  check(!("courts" in (h.platformStats?.[0] ?? {})), "home_page: platformStats ya no entrega canchas", h.platformStats);
  check(h.tournaments?.[0]?.tournamentClubs_on_tournament?.[0]?._count > 0, "home_page: _count de clubes", h.tournaments?.[0]);
  check(typeof h.matches?.[0]?.matchDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(h.matches[0].matchDate), "home_page: matchDate como YYYY-MM-DD", h.matches?.[0]);
  check(h.matches?.[0]?.homeClub?.name && h.matches?.[0]?.tournament?.category?.name, "home_page: relaciones anidadas", h.matches?.[0]);

  // Equipos y búsqueda
  const teams = await rpc("anon", "teams_page");
  check(teams.data?.clubs?.length === 8 && teams.data?.matches?.length > 0, "teams_page: 8 clubes y partidos jugados", teams.error);
  check(Array.isArray(teams.data?.hiddenClubs) && teams.data.hiddenClubs.length === 0, "teams_page: hiddenClubs vacío para anónimo", teams.data?.hiddenClubs);
  check(teams.data?.clubs?.every((c) => c.presidentPhone === ""), "teams_page: el teléfono del presidente va vacío para anónimo", teams.data?.clubs?.map((c) => c.presidentPhone));
  check(teams.data?.clubs?.every((c) => typeof c.id === "string" && c.id.length > 0), "teams_page: cada club trae su id (para el menú del superadmin)", teams.data?.clubs?.[0]);
  const search = await rpc("anon", "search_clubs", { term: "halcones" });
  check(search.data?.clubs?.length === 1 && search.data.clubs[0].slug === "halcones-fc-demo", "search_clubs: acentos y mayúsculas", search.data);
  check(search.data?.clubs?.[0]?.presidentPhone === "", "search_clubs: el teléfono va vacío para anónimo", search.data?.clubs?.[0]);
  check(search.data?.clubs?.[0]?.id === "dummy-club-halcones", "search_clubs: trae el id del club", search.data?.clubs?.[0]);
  const short = await rpc("anon", "search_clubs", { term: "ha" });
  check(short.data?.clubs?.length === 0, "search_clubs: término corto no busca", short.data);

  // Torneo
  const tid = h.tournaments[0].id;
  const ts = await rpc("anon", "tournament_screen", { id: tid });
  check(ts.data?.tournaments?.length === 1 && ts.data.matches.length > 0, "tournament_screen: ficha y partidos", ts.error);
  check(ts.data?.tournamentStandings?.length > 0 && ts.data.tournamentStandings[0].standingRank === 1, "tournament_screen: tabla ordenada", ts.data?.tournamentStandings?.[0]);
  check(ts.data?.tournamentScorers?.length > 0 && ts.data.tournamentScorers[0].club?.name, "tournament_screen: goleadores", ts.data?.tournamentScorers?.[0]);
  const archive = await rpc("anon", "tournament_archive");
  check(archive.data?.tournaments?.length === 4, "tournament_archive: 4 torneos", archive.data?.tournaments?.length);

  // Partido
  const played = ts.data.matches.find((m) => m.status === "PLAYED");
  const detail = await rpc("anon", "match_detail", { id: played.id });
  const d = detail.data?.matches?.[0];
  check(d && d.homeClub.players_on_club.length > 0 && Array.isArray(d.matchGoals_on_match), "match_detail: plantillas y goles", detail.error);
  check(d?.matchGoals_on_match.every((g) => typeof g.id === "string"), "match_detail: ids uuid como texto");
  const preview = await rpc("anon", "match_preview", { tournamentId: tid, homeClubId: d.homeClub.id, awayClubId: d.awayClub.id });
  check(preview.data?.tournamentStandings?.length > 0 && preview.data.matches.length > 0, "match_preview", preview.error);
  const sheetAnon = await rpc("anon", "match_score_sheet", { matchId: played.id });
  check(Boolean(sheetAnon.error), "match_score_sheet: anónimo no puede");
  const sheet = await rpc("admin", "match_score_sheet", { matchId: played.id });
  check(sheet.data?.matches?.[0]?.homeClub?.players_on_club?.length > 0, "match_score_sheet: superadmin", sheet.error);

  // En vivo y publicidad
  const live = await rpc("anon", "live_matches", { from: today, to: today });
  check(live.data?.matches?.length > 0, "live_matches: partido de hoy", live.data);
  const ads = await rpc("anon", "live_ads", { today, placement: "HOME" });
  check(Array.isArray(ads.data?.adPlacements), "live_ads", ads.error);

  // Canchas
  const courts = await rpc("anon", "courts_page", { date: today });
  check(courts.data?.courts?.length === 4 && typeof courts.data.courts[0].hourlyRate === "number", "courts_page: 4 canchas, tarifa numérica", courts.data?.courts?.[0]);
  const busy = await rpc("presidente", "court_busy_on_date", { date: today });
  check(Array.isArray(busy.data?.courtHolds), "court_busy_on_date", busy.error);

  // Página del club: lo sensible solo con rol
  const anonClub = await rpc("anon", "club_screen", { slug: "halcones-fc-demo" });
  const ac = anonClub.data?.clubs?.[0];
  check(ac && ac.players_on_club.length > 0 && ac.clubEvents_on_club.length > 0, "club_screen: público ve jugadores y agenda", anonClub.error);
  check(ac?.transactions_on_club.length === 0 && ac?.clubMembers_on_club.length === 0, "club_screen: público no ve finanzas ni miembros");
  const reports = (anonClub.data?.matches ?? []).flatMap((m) => m.matchClubReports_on_match);
  check(reports.length > 0 && reports.every((r) => "mvp" in r) && reports.some((r) => r.mvp?.id), "club_screen: los informes traen el MVP del partido", reports.slice(0, 2));
  const presClub = await rpc("presidente", "club_screen", { slug: "halcones-fc-demo" });
  const pc = presClub.data?.clubs?.[0];
  check(pc?.transactions_on_club.length > 0 && pc?.clubMembers_on_club.some((m) => m.user.id === "11111111-1111-4111-8111-111111111102"), "club_screen: presidente ve finanzas y su rol", presClub.error);
  const otherClub = await rpc("presidente", "club_screen", { slug: "deportivo-bahia-demo" });
  check(otherClub.data?.clubs?.[0]?.transactions_on_club.length === 0, "club_screen: presidente de otro club no ve sus finanzas");
  const adminClub = await rpc("admin", "club_screen", { slug: "deportivo-bahia-demo" });
  check(adminClub.data?.clubs?.[0]?.inventoryItems_on_club.length > 0, "club_screen: superadmin ve todo");
  check(presClub.data?.matches?.length > 0 && presClub.data.seasons.length > 0, "club_screen: partidos del club y temporadas");
  const missing = await rpc("anon", "club_screen", { slug: "no-existe" });
  check(missing.data?.clubs?.length === 0, "club_screen: slug inexistente -> lista vacía");

  // Sesión
  const me = await rpc("presidente", "my_spaces");
  check(me.data?.clubMembers?.length === 1 && me.data.clubMembers[0].role === "ADMIN", "my_spaces: presidente", me.data);
  const mem = await rpc("dt", "my_memberships", { userId: "otro" });
  check(mem.data?.clubMembers?.[0]?.role === "DT", "my_memberships: ignora el userId del cliente", mem.data);
  const adminById = await rpc("admin", "platform_admin_by_id", { id: "11111111-1111-4111-8111-111111111101" });
  check(adminById.data?.platformAdmin?.email === "admin@demo.local", "platform_admin_by_id: superadmin", adminById.data);
  const spoof = await rpc("presidente", "platform_admin_by_id", { id: "11111111-1111-4111-8111-111111111101" });
  check(spoof.data?.platformAdmin == null, "platform_admin_by_id: otro usuario no ve al admin");
  const admins = await rpc("admin", "admin_admins");
  check(admins.data?.platformAdmins?.[0]?.user?.displayName === "Admin Demo", "admin_admins: superadmin ve la lista", admins.data);
  const adminsUser = await rpc("presidente", "admin_admins");
  check(adminsUser.data?.platformAdmins?.length === 1 && adminsUser.data.platformAdmins[0].email === "", "admin_admins: usuario normal solo sabe que hay alguno");
  const claim = await rpc("anon", "platform_claim_open");
  check(claim.data?.platformClaimStates?.[0]?.open === false, "platform_claim_open: ya reclamada");
  const boot = await rpc("presidente", "bootstrap_platform_admin", { userId: "x", email: "x", displayName: "x" });
  check(boot.data?.admin == null, "bootstrap_platform_admin: no se puede reclamar dos veces", boot.data);

  // Resumen de temporada: solo de temporadas cerradas (la semilla trae 2025 cerrada con el Torneo Clausura)
  const summaryActive = await rpc("anon", "season_summary", { id: "dummy-season-actual" });
  check(!summaryActive.error && summaryActive.data?.season === null, "season_summary: temporada activa -> null", summaryActive);
  const summaryMissing = await rpc("anon", "season_summary", { id: "no-existe" });
  check(summaryMissing.data?.season === null, "season_summary: temporada inexistente -> null", summaryMissing.data);
  const summary = await rpc("anon", "season_summary", { id: "dummy-season-anterior" });
  check(!summary.error, "season_summary responde", summary.error);
  const ss = summary.data?.season ?? {};
  check(ss.name === "2025" && ss.startDate === "2025-01-01" && ss.endDate === "2025-12-31", "season_summary: datos de la temporada", ss);
  const clausura = ss.tournaments?.find((t) => t.id === "dummy-tour-clausura-anterior");
  check(ss.tournaments?.length === 1 && clausura?.category?.name === "Primera Fuerza" && clausura.prize === "$20,000 MXN", "season_summary: torneos de la temporada", ss.tournaments);
  check(clausura?.podium?.map((x) => x.club?.id).join() === "dummy-club-tiburones,dummy-club-sanvicente,dummy-club-leones", "season_summary: podio en orden", clausura?.podium);
  const expected = (await db.query(`
    SELECT count(*)::int AS matches,
      coalesce(sum(home_score + away_score) FILTER (WHERE NOT walkover), 0)::int AS goals,
      (SELECT count(*)::int FROM match_cards c JOIN matches m2 ON m2.id = c.match_id
        WHERE m2.tournament_id = 'dummy-tour-clausura-anterior' AND m2.status = 'PLAYED' AND c.color = 'YELLOW') AS yellow
    FROM matches WHERE tournament_id = 'dummy-tour-clausura-anterior' AND status = 'PLAYED' AND home_score IS NOT NULL`)).rows[0];
  const tt = ss.totals ?? {};
  check(tt.tournaments === 1 && tt.clubs === 6 && tt.matches === expected.matches && tt.goals === expected.goals && tt.yellowCards === expected.yellow, "season_summary: cifras generales", { tt, expected });
  const topScorer = (await db.query(`SELECT player_id, goals FROM tournament_scorers WHERE tournament_id = 'dummy-tour-clausura-anterior' ORDER BY goals DESC, assists DESC, player_name LIMIT 1`)).rows[0];
  const aw = ss.awards ?? {};
  check(aw.scorers?.length > 0 && aw.scorers.length <= 3 && aw.scorers[0].player?.id === topScorer?.player_id && aw.scorers[0].value === topScorer?.goals && aw.scorers[0].club?.name, "season_summary: goleador de la temporada", { got: aw.scorers?.[0], topScorer });
  check(["assists", "mvps", "keepers"].every((k) => Array.isArray(aw[k]) && aw[k].length <= 3), "season_summary: premios como listas de hasta 3", aw);
  const rec = ss.records ?? {};
  check(tt.matches === 0 || (rec.biggestWin?.homeClub?.name && typeof rec.biggestWin.homeScore === "number" && rec.highestScoring?.id && rec.topAttack?.club?.id), "season_summary: récords", rec);
  check(rec.biggestWin == null || Math.abs(rec.biggestWin.homeScore - rec.biggestWin.awayScore) > 0, "season_summary: la mayor goleada no es un empate", rec.biggestWin);

  // Formularios
  const inq = await rpc("anon", "submit_inquiry", { id: "prueba-inq-1", name: "ana lopez", email: "ana@correo.com", phone: "6221234567", topic: "Torneos", message: "Quiero información de los torneos." });
  check(inq.data?.inquiry?.id === "prueba-inq-1", "submit_inquiry: válido", inq);
  const bad = await rpc("anon", "submit_inquiry", { id: "prueba-inq-2", name: "x", email: "no", phone: "1", topic: "Otro", message: "corto" });
  check(bad.data?.inquiry === null, "submit_inquiry: inválido -> null", bad);
  const app = await rpc("anon", "submit_team_application", { id: "prueba-app-1", captainName: "Luis Pérez", captainEmail: "luis@correo.com", captainPhone: "6221234567", teamName: "los pumas" });
  check(app.data?.application?.id === "prueba-app-1", "submit_team_application: válido", app);
  const appRow = await db.query("SELECT team_name FROM team_applications WHERE id = 'prueba-app-1'");
  check(appRow.rows[0]?.team_name === "Los Pumas", "submit_team_application: nombre en Title Case", appRow.rows[0]);
  const appQuotes = await rpc("anon", "submit_team_application", { id: "prueba-app-2", captainName: "Luis Pérez", captainEmail: "luis@correo.com", captainPhone: "6221234567", teamName: "Los \"Pumas\"" });
  check(appQuotes.data?.application === null, "submit_team_application: comillas (regla del club) -> null", appQuotes);
  const contact = await rpc("anon", "contact_page", {});
  check(typeof contact.data?.platformSettings?.courtsEnabled === "boolean", "contact_page: indica si el módulo de canchas está activo", contact.data);

  // Invitaciones de club: aceptar exige el correo de la sesión
  const invite = await rpc("anon", "club_invite_lookup", { clubId: "dummy-club-halcones", emailKey: "nadie@demo,local", token: "x" });
  check(invite.data?.clubInvites?.length === 0, "club_invite_lookup: sin invitación");
  const decline = await rpc("anon", "decline_club_invite", { clubId: "dummy-club-halcones", emailKey: "nadie@demo,local", token: "" });
  check(decline.data?.invite === null, "decline_club_invite: sin token no borra nada");
}
