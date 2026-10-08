// Pruebas del bloque de competición, calendario y marcador (db/migrations/1012_fn_league.sql)
// sobre los datos dummy. La BD es efímera: las mutaciones cambian los datos libremente.
//
// Ids de scripts/demo/demo-seed.sql: torneos dummy-tour-apertura (ACTIVE, con jugados),
// dummy-tour-veteranos (ACTIVE; dummy-tour-veteranos-j04-2 está SCHEDULED hoy) y
// dummy-tour-femenil (UPCOMING, todo sin programar).

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const ADMIN_UID = "11111111-1111-4111-8111-111111111101";
const APERTURA = "dummy-tour-apertura";
const VETERANOS = "dummy-tour-veteranos";
const FEMENIL = "dummy-tour-femenil";
const LIVE_MATCH = "dummy-tour-veteranos-j04-2"; // Tiburones (local) vs Bahía (visitante), SCHEDULED hoy
const GOAL_1 = "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a01";
const GOAL_2 = "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a02";
const CARD_1 = "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a03";

function seedDate() {
  const file = join(ROOT, "scripts", "demo", "demo-seed.sql");
  if (!existsSync(file)) return null;
  const m = /fecha base (\d{4}-\d{2}-\d{2})/.exec(readFileSync(file, "utf8").slice(0, 400));
  return m ? m[1] : null;
}

export async function run({ db, rpc, check }) {
  const today = seedDate();
  if (!today) {
    check(true, "sin datos dummy: se omiten las pruebas de la liga");
    return;
  }

  // ---------- Lecturas ----------

  const anonEditor = await rpc("anon", "tournament_editor", { id: APERTURA });
  check(Boolean(anonEditor.error), "tournament_editor: anónimo no puede");
  const editor = await rpc("admin", "tournament_editor", { id: APERTURA });
  check(!editor.error, "tournament_editor responde", editor.error);
  const e = editor.data ?? {};
  const t0 = e.tournaments?.[0];
  check(e.tournaments?.length === 1 && t0.name === "Torneo Apertura" && t0.footballType === "FUT_11", "tournament_editor: ficha del torneo", t0);
  check(t0?.season?.id && /^\d{4}-\d{2}-\d{2}$/.test(t0.season.startDate) && t0.category?.name === "Primera Fuerza", "tournament_editor: temporada y categoría", t0?.season);
  check(t0?.tournamentClubs_on_tournament?.length === 8 && t0.tournamentClubs_on_tournament.every((c) => typeof c.club?.id === "string"), "tournament_editor: 8 clubes inscritos", t0?.tournamentClubs_on_tournament);
  check(e.clubs?.length === 8 && e.clubs.every((c) => c.active === true) && e.clubs[0].name <= e.clubs[1].name, "tournament_editor: clubes activos por nombre", e.clubs?.map((c) => c.name));
  check(e.matches?.length === 56 && e.matches.every((m) => m.homeClub?.id && m.awayClub?.id && typeof m.roundLabel === "string"), "tournament_editor: 56 partidos con clubes", e.matches?.length);
  check(e.matches?.some((m) => m.status === "PLAYED" && typeof m.homeScore === "number") && e.matches?.some((m) => m.status === "UNSCHEDULED" && m.matchDate === null), "tournament_editor: estados y marcadores", e.matches?.[0]);
  const noEditor = await rpc("admin", "tournament_editor", { id: "no-existe" });
  check(noEditor.data?.tournaments?.length === 0 && noEditor.data?.matches?.length === 0 && noEditor.data?.clubs?.length === 8, "tournament_editor: torneo inexistente -> listas vacías");

  const courts = await rpc("admin", "schedule_courts");
  check(courts.data?.courts?.length === 3 && courts.data.courts[0].id === "dummy-court-miramar", "schedule_courts: 3 canchas de futbol ordenadas", courts.data ?? courts.error);
  const courtsUser = await rpc("usuario", "schedule_courts");
  check(courtsUser.data?.courts?.length === 3, "schedule_courts: cualquier sesión", courtsUser.error);

  const hints = await rpc("admin", "match_slot_hints", { homeId: "dummy-club-halcones", awayId: "dummy-club-union", from: "2026-10-05", until: "2026-10-11" });
  check(!hints.error, "match_slot_hints responde", hints.error);
  const h = hints.data ?? {};
  check(typeof h.platformSettings?.courtSlotMinutes === "number", "match_slot_hints: courtSlotMinutes", h.platformSettings);
  check(Array.isArray(h.courtOpenWindows) && h.courtOpenWindows.every((w) => typeof w.weekday === "number" && w.startTime), "match_slot_hints: horarios de la liga", h.courtOpenWindows?.[0]);
  check(h.courts?.length === 3 && typeof h.courts[0].sortOrder === "number" && typeof h.courts[0].location === "string", "match_slot_hints: canchas con orden y ubicación", h.courts?.[0]);
  check(h.clubs?.length === 2 && h.clubs.every((c) => Array.isArray(c.clubAvailabilityWindows_on_club)), "match_slot_hints: dos clubes con disponibilidad", h.clubs);
  // La reserva manual «renta-1» de la semilla cae al día siguiente de la fecha base
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const manualDate = tomorrow.toISOString().slice(0, 10);
  check(h.courtHolds?.some((x) => x.match === null && x.holdDate === manualDate) && h.courtHolds?.some((x) => x.match?.id && x.court?.id), "match_slot_hints: reservas manuales y de partido", h.courtHolds?.map((x) => x.holdDate));
  check(h.matches?.some((m) => m.id === "dummy-tour-apertura-j09-1" && m.tournament?.durationMinutes === 90 && m.matchDate === "2026-10-11"), "match_slot_hints: partidos de los clubes en el rango", h.matches?.map((m) => m.id));
  check(h.matches?.every((m) => ["dummy-club-halcones", "dummy-club-union"].includes(m.homeClub.id) || ["dummy-club-halcones", "dummy-club-union"].includes(m.awayClub.id)), "match_slot_hints: solo partidos de esos clubes");

  // ---------- Ajustes del torneo ----------

  const settingsVars = { userId: ADMIN_UID, id: FEMENIL, legs: 1, footballType: "FUT_9", durationMinutes: 60, startDate: "2026-11-08", prize: "Trofeo" };
  const settingsPres = await rpc("presidente", "update_tournament_settings", settingsVars);
  check(settingsPres.data?.tournament === null, "update_tournament_settings: presidente con userId del admin -> null", settingsPres);
  const settings = await rpc("admin", "update_tournament_settings", settingsVars);
  check(settings.data?.tournament?.id === FEMENIL, "update_tournament_settings: superadmin", settings);
  const femenil = (await rpc("admin", "tournament_editor", { id: FEMENIL })).data?.tournaments?.[0];
  check(femenil?.legs === 1 && femenil.footballType === "FUT_9" && femenil.durationMinutes === 60 && femenil.startDate === "2026-11-08" && femenil.prize === "Trofeo", "update_tournament_settings: cambios guardados", femenil);
  const badDuration = await rpc("admin", "update_tournament_settings", { ...settingsVars, durationMinutes: 70 });
  check(badDuration.data?.tournament === null, "update_tournament_settings: duración fuera de 30/60/90/120 -> null", badDuration);
  const noStart = await rpc("admin", "update_tournament_settings", { ...settingsVars, startDate: null });
  check(noStart.data?.tournament === null, "update_tournament_settings: sin fecha de inicio -> null", noStart);
  const outOfSeason = await rpc("admin", "update_tournament_settings", { ...settingsVars, startDate: "2031-01-01" });
  check(outOfSeason.data?.tournament === null, "update_tournament_settings: fecha fuera de la temporada -> null", outOfSeason);
  const badPrize = await rpc("admin", "update_tournament_settings", { ...settingsVars, prize: "<script>" });
  check(badPrize.data?.tournament === null, "update_tournament_settings: premio inválido -> null", badPrize);
  const keepPrize = await rpc("admin", "update_tournament_settings", { ...settingsVars, prize: null });
  const femenil2 = (await rpc("admin", "tournament_editor", { id: FEMENIL })).data?.tournaments?.[0];
  check(keepPrize.data?.tournament?.id === FEMENIL && femenil2?.prize === "Trofeo", "update_tournament_settings: sin premio conserva el guardado", femenil2?.prize);

  // ---------- Clubes del torneo ----------

  const addPres = await rpc("presidente", "add_tournament_club", { userId: ADMIN_UID, tournamentId: FEMENIL, clubId: "dummy-club-union" });
  check(addPres.data?.row === null, "add_tournament_club: presidente -> null", addPres);
  const add = await rpc("admin", "add_tournament_club", { tournamentId: FEMENIL, clubId: "dummy-club-union" });
  check(add.data?.row?.id === FEMENIL, "add_tournament_club: superadmin", add);
  const addAgain = await rpc("admin", "add_tournament_club", { tournamentId: FEMENIL, clubId: "dummy-club-union" });
  check(addAgain.data?.row?.id === FEMENIL, "add_tournament_club: repetir no falla", addAgain);
  const femenil3 = (await rpc("admin", "tournament_editor", { id: FEMENIL })).data?.tournaments?.[0];
  check(femenil3?.tournamentClubs_on_tournament.filter((c) => c.club.id === "dummy-club-union").length === 1, "add_tournament_club: inscrito una sola vez");
  const removePres = await rpc("presidente", "remove_tournament_club", { userId: ADMIN_UID, tournamentId: FEMENIL, clubId: "dummy-club-union" });
  check(removePres.data?.row === null, "remove_tournament_club: presidente -> null", removePres);
  const remove = await rpc("admin", "remove_tournament_club", { tournamentId: FEMENIL, clubId: "dummy-club-union" });
  check(remove.data?.row?.id === FEMENIL, "remove_tournament_club: superadmin", remove);
  const removePlayed = await rpc("admin", "remove_tournament_club", { tournamentId: APERTURA, clubId: "dummy-club-halcones" });
  check(removePlayed.data?.row === null, "remove_tournament_club: club con partidos jugados -> null", removePlayed);

  // ---------- Partidos del calendario ----------

  const newMatch = { userId: ADMIN_UID, id: "prueba-match-1", tournamentId: APERTURA, roundLabel: "15", roundNumber: 15, homeClubId: "dummy-club-halcones", awayClubId: "dummy-club-bahia", walkover: false };
  const insertPres = await rpc("presidente", "insert_unplayed_match", newMatch);
  check(insertPres.data?.match === null, "insert_unplayed_match: presidente -> null", insertPres);
  const insert = await rpc("admin", "insert_unplayed_match", newMatch);
  check(insert.data?.match?.id === "prueba-match-1", "insert_unplayed_match: superadmin", insert);
  const inserted = (await rpc("admin", "tournament_editor", { id: APERTURA })).data?.matches?.find((m) => m.id === "prueba-match-1");
  check(inserted?.status === "UNSCHEDULED" && inserted.walkover === false && inserted.roundLabel === "15", "insert_unplayed_match: queda sin programar", inserted);

  const woVars = { userId: ADMIN_UID, id: "prueba-match-1", homeScore: 3, awayScore: 0, walkover: true };
  const woPres = await rpc("presidente", "mark_match_walkover", woVars);
  check(woPres.data?.match === null, "mark_match_walkover: presidente -> null", woPres);
  const wo = await rpc("admin", "mark_match_walkover", woVars);
  check(wo.data?.match?.id === "prueba-match-1", "mark_match_walkover: superadmin", wo);
  const woMatch = (await rpc("anon", "match_detail", { id: "prueba-match-1" })).data?.matches?.[0];
  check(woMatch?.status === "PLAYED" && woMatch.walkover === true && woMatch.homeScore === 3 && woMatch.awayScore === 0, "mark_match_walkover: jugado por default 3-0", woMatch);
  const delPlayed = await rpc("admin", "delete_unplayed_match", { id: "prueba-match-1" });
  check(delPlayed.data?.match === null, "delete_unplayed_match: jugado -> null", delPlayed);
  await rpc("admin", "insert_unplayed_match", { ...newMatch, id: "prueba-match-2" });
  const delPres = await rpc("presidente", "delete_unplayed_match", { userId: ADMIN_UID, id: "prueba-match-2" });
  check(delPres.data?.match === null, "delete_unplayed_match: presidente -> null", delPres);
  const del = await rpc("admin", "delete_unplayed_match", { id: "prueba-match-2" });
  check(del.data?.match?.id === "prueba-match-2", "delete_unplayed_match: superadmin", del);

  // ---------- Programación y reservas de cancha ----------

  const toSchedule = "dummy-tour-veteranos-j05-1";
  const scheduleVars = { id: toSchedule, matchDate: "2026-10-12", startTime: "18:00", venue: "Campo Miramar", courtId: "dummy-court-miramar" };
  const schedPres = await rpc("presidente", "schedule_official_match", scheduleVars);
  check(schedPres.data?.match === null, "schedule_official_match: presidente -> null", schedPres);
  const sched = await rpc("admin", "schedule_official_match", scheduleVars);
  check(sched.data?.match?.id === toSchedule, "schedule_official_match: superadmin", sched);
  const scheduled = (await rpc("anon", "match_detail", { id: toSchedule })).data?.matches?.[0];
  check(scheduled?.status === "SCHEDULED" && scheduled.matchDate === "2026-10-12" && scheduled.startTime === "18:00" && scheduled.court?.name === "Campo Miramar", "schedule_official_match: fecha, hora y cancha", scheduled);
  const schedPlayed = await rpc("admin", "schedule_official_match", { ...scheduleVars, id: "dummy-tour-veteranos-j01-1" });
  check(schedPlayed.data?.match === null, "schedule_official_match: jugado -> null", schedPlayed);

  const holdVars = { userId: ADMIN_UID, id: `match_${toSchedule}`, courtId: "dummy-court-miramar", holdDate: "2026-10-12", startTime: "18:00", endTime: "19:00", matchId: toSchedule };
  const holdPres = await rpc("presidente", "save_match_court_hold", holdVars);
  check(holdPres.data?.courtHold === null, "save_match_court_hold: presidente -> null", holdPres);
  const hold = await rpc("admin", "save_match_court_hold", holdVars);
  check(hold.data?.courtHold?.id === `match_${toSchedule}`, "save_match_court_hold: superadmin", hold);
  const holdAgain = await rpc("admin", "save_match_court_hold", { ...holdVars, endTime: "19:30" });
  check(holdAgain.data?.courtHold?.id === `match_${toSchedule}`, "save_match_court_hold: repetir actualiza", holdAgain);
  const busy = (await rpc("admin", "court_busy_on_date", { date: "2026-10-12" })).data?.courtHolds ?? [];
  check(busy.filter((x) => x.match?.id === toSchedule).length === 1 && busy.find((x) => x.match?.id === toSchedule).endTime === "19:30", "save_match_court_hold: una reserva ligada al partido", busy);
  const clearPres = await rpc("presidente", "clear_match_court_holds", { userId: ADMIN_UID, matchId: toSchedule });
  const busyAfterPres = (await rpc("admin", "court_busy_on_date", { date: "2026-10-12" })).data?.courtHolds ?? [];
  check(clearPres.data?.cleared === null && busyAfterPres.some((x) => x.match?.id === toSchedule), "clear_match_court_holds: presidente no borra nada", clearPres);
  const clear = await rpc("admin", "clear_match_court_holds", { matchId: toSchedule });
  const busyAfter = (await rpc("admin", "court_busy_on_date", { date: "2026-10-12" })).data?.courtHolds ?? [];
  check(!clear.error && !busyAfter.some((x) => x.match?.id === toSchedule), "clear_match_court_holds: superadmin borra la reserva", clear.error ?? busyAfter);

  // ---------- Hoja de marcador ----------

  const sheetMatch = "dummy-tour-apertura-j09-1"; // Halcones vs Unión, SCHEDULED
  const scoreVars = { userId: ADMIN_UID, id: sheetMatch, homeScore: 2, awayScore: 1 };
  const scorePres = await rpc("presidente", "save_match_score", scoreVars);
  check(scorePres.data?.match === null, "save_match_score: presidente -> null", scorePres);
  const score = await rpc("admin", "save_match_score", scoreVars);
  check(score.data?.match?.id === sheetMatch, "save_match_score: superadmin", score);
  const scoredMatch = (await rpc("anon", "match_detail", { id: sheetMatch })).data?.matches?.[0];
  check(scoredMatch?.status === "PLAYED" && scoredMatch.homeScore === 2 && scoredMatch.awayScore === 1 && scoredMatch.walkover === false, "save_match_score: marcador guardado y jugado", scoredMatch);

  const goalVars = { matchId: sheetMatch, clubId: "dummy-club-halcones", sortOrder: 1, scorerId: "dummy-club-halcones-p13", assistId: "", isPenalty: false, isOwnGoal: false, minute: 10 };
  const goalPres = await rpc("presidente", "insert_timed_match_goal", goalVars);
  check(goalPres.data?.goal === null, "insert_timed_match_goal: presidente -> null", goalPres);
  const goal = await rpc("admin", "insert_timed_match_goal", goalVars);
  check(typeof goal.data?.goal?.id === "string" && goal.data.goal.id.length === 36, "insert_timed_match_goal: superadmin devuelve uuid", goal);
  const cardVars = { userId: ADMIN_UID, matchId: sheetMatch, clubId: "dummy-club-union", playerId: "dummy-club-union-p01", playerName: "Portero", color: "RED", minute: 200 };
  const cardPres = await rpc("presidente", "insert_match_card", cardVars);
  check(cardPres.data?.card === null, "insert_match_card: presidente -> null", cardPres);
  const card = await rpc("admin", "insert_match_card", cardVars);
  check(typeof card.data?.card?.id === "string", "insert_match_card: superadmin", card);
  const sheet = (await rpc("admin", "match_score_sheet", { matchId: sheetMatch })).data?.matches?.[0];
  check(sheet?.matchGoals_on_match.length === 1 && sheet.matchGoals_on_match[0].minute === 10 && sheet.matchGoals_on_match[0].scorer?.id === "dummy-club-halcones-p13" && sheet.matchGoals_on_match[0].assist === null, "insert_timed_match_goal: gol con minuto y goleador", sheet?.matchGoals_on_match);
  check(sheet?.matchCards_on_match.length === 1 && sheet.matchCards_on_match[0].minute === null && sheet.matchCards_on_match[0].color === "RED", "insert_match_card: minuto fuera de 1..150 se descarta", sheet?.matchCards_on_match);
  const eventsPres = await rpc("presidente", "clear_match_events", { userId: ADMIN_UID, matchId: sheetMatch });
  const sheetAfterPres = (await rpc("admin", "match_score_sheet", { matchId: sheetMatch })).data?.matches?.[0];
  check(eventsPres.data?.goals === null && sheetAfterPres?.matchGoals_on_match.length === 1, "clear_match_events: presidente no borra nada", eventsPres);
  const events = await rpc("admin", "clear_match_events", { matchId: sheetMatch });
  const sheetAfter = (await rpc("admin", "match_score_sheet", { matchId: sheetMatch })).data?.matches?.[0];
  check(!events.error && sheetAfter?.matchGoals_on_match.length === 0 && sheetAfter.matchCards_on_match.length === 0, "clear_match_events: superadmin borra goles y tarjetas", events.error ?? sheetAfter);

  // ---------- Hoja de marcador con jugadores de baja o eliminados (0008_jugadores_borrado_logico.sql) ----------
  await db.query(`INSERT INTO players (id, club_id, name, shirt_number, position) VALUES
    ('prueba-liga-baja', 'dummy-club-union', 'Jugador Eliminado Uno', '50', 'Medio'),
    ('prueba-liga-baja2', 'dummy-club-union', 'Jugador Sin Partido', '51', 'Medio')`);
  const cardName = async () => (await db.query(
    "SELECT player_id, player_name FROM match_cards WHERE match_id = $1 AND color = 'YELLOW' ORDER BY player_name", [sheetMatch])).rows;
  const cardBase = { matchId: sheetMatch, clubId: "dummy-club-union", color: "YELLOW", minute: 20 };
  await rpc("admin", "insert_match_card", { ...cardBase, playerId: "prueba-liga-baja", playerName: "" });
  let named = await cardName();
  check(named.length === 1 && named[0].player_id === "prueba-liga-baja" && named[0].player_name === "Jugador Eliminado Uno",
    "insert_match_card: el nombre sale del jugador aunque el cliente no lo mande", named);
  await rpc("admin", "insert_match_card", { ...cardBase, playerId: "dummy-club-halcones-p13", playerName: "Nombre Manual" });
  named = await cardName();
  check(named.some((c) => c.player_id === null && c.player_name === "Nombre Manual"), "insert_match_card: jugador de otro club -> sin enlace, con el nombre recibido", named);
  await db.query("UPDATE players SET deleted_at = now(), active = false WHERE id IN ('prueba-liga-baja', 'prueba-liga-baja2')");
  const sheetDel = (await rpc("admin", "match_score_sheet", { matchId: sheetMatch })).data?.matches?.[0];
  const detailDel = (await rpc("anon", "match_detail", { id: sheetMatch })).data?.matches?.[0];
  for (const [label, roster] of [["match_score_sheet", sheetDel?.awayClub?.players_on_club], ["match_detail", detailDel?.awayClub?.players_on_club]]) {
    const ref = roster?.find((p) => p.id === "prueba-liga-baja");
    check(ref?.active === false && ref.name === "Jugador Eliminado Uno" && !roster.some((p) => p.id === "prueba-liga-baja2")
      && roster.filter((p) => p.active).length > 0,
      `${label}: incluye al eliminado que aparece en el partido (active false) y no a los demás eliminados`, roster?.length);
  }
  await rpc("admin", "clear_match_events", { matchId: sheetMatch });
  await rpc("admin", "insert_match_card", { ...cardBase, playerId: "prueba-liga-baja", playerName: "" });
  named = await cardName();
  check(named.length === 1 && named[0].player_id === "prueba-liga-baja" && named[0].player_name === "Jugador Eliminado Uno",
    "volver a guardar la hoja conserva el jugador eliminado y su nombre", named);
  await rpc("admin", "clear_match_events", { matchId: sheetMatch });

  // Activar el torneo por empezar al registrar su primer resultado
  await rpc("admin", "schedule_official_match", { id: "dummy-tour-femenil-j01-1", matchDate: "2026-11-08", startTime: "10:00", venue: "Campo Norte", courtId: "" });
  const activatePres = await rpc("presidente", "activate_tournament", { userId: ADMIN_UID, matchId: "dummy-tour-femenil-j01-1" });
  const statusAfterPres = (await rpc("anon", "tournament_archive")).data?.tournaments?.find((t) => t.id === FEMENIL)?.status;
  check(activatePres.data?.tournament === null && statusAfterPres === "UPCOMING", "activate_tournament: presidente no activa", statusAfterPres);
  const activate = await rpc("admin", "activate_tournament", { matchId: "dummy-tour-femenil-j01-1" });
  const statusAfter = (await rpc("anon", "tournament_archive")).data?.tournaments?.find((t) => t.id === FEMENIL)?.status;
  check(!activate.error && statusAfter === "ACTIVE", "activate_tournament: superadmin pasa UPCOMING -> ACTIVE", activate.error ?? statusAfter);

  // ---------- Marcador en vivo ----------

  const live0 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(live0?.status === "SCHEDULED" && live0.homeClub.id === "dummy-club-tiburones" && live0.awayClub.id === "dummy-club-bahia", "marcador en vivo: partido de hoy programado", live0);
  // Un jugador eliminado no recibe goles ni tarjetas en vivo y no sale en la plantilla del partido
  await db.query(`INSERT INTO players (id, club_id, name, position, deleted_at, active)
    VALUES ('prueba-liga-vivo', 'dummy-club-tiburones', 'Jugador Vivo Eliminado', 'Medio', now(), false)`);
  const goalDel = await rpc("admin", "add_live_match_goal", { id: "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0b", matchId: LIVE_MATCH,
    clubId: "dummy-club-tiburones", scorerId: "prueba-liga-vivo", assistId: "", isPenalty: false, isOwnGoal: false, minute: 5 });
  const cardDel = await rpc("admin", "add_live_match_card", { id: "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0c", matchId: LIVE_MATCH,
    clubId: "dummy-club-tiburones", playerId: "prueba-liga-vivo", color: "YELLOW", minute: 6 });
  const liveDel = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(goalDel.data?.match === null && cardDel.data?.match === null && liveDel?.homeScore === live0.homeScore
    && liveDel.matchCards_on_match.length === live0.matchCards_on_match.length,
    "en vivo: un eliminado no recibe goles ni tarjetas", { goalDel: goalDel.data, cardDel: cardDel.data });
  check(!liveDel?.homeClub.players_on_club.some((p) => p.id === "prueba-liga-vivo") && liveDel.homeClub.players_on_club.every((p) => p.active),
    "en vivo: la plantilla del partido no incluye al eliminado", liveDel?.homeClub.players_on_club.length);
  const liveGoal = { id: GOAL_1, matchId: LIVE_MATCH, clubId: "dummy-club-tiburones", scorerId: "dummy-club-tiburones-p16", assistId: "", isPenalty: false, isOwnGoal: false, minute: 12 };
  const liveGoalPres = await rpc("presidente", "add_live_match_goal", liveGoal);
  check(liveGoalPres.data?.match === null, "add_live_match_goal: presidente -> null", liveGoalPres);
  const g1 = await rpc("admin", "add_live_match_goal", liveGoal);
  check(g1.data?.goal === null && g1.data?.match?.id === LIVE_MATCH, "add_live_match_goal: superadmin", g1);
  const live1 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(live1?.homeScore === 1 && live1.awayScore === 0 && live1.status === "SCHEDULED", "add_live_match_goal: marcador 1-0 sin cerrar el partido", live1);
  const g1Again = await rpc("admin", "add_live_match_goal", liveGoal);
  const live1b = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(g1Again.data?.match?.id === LIVE_MATCH && live1b?.homeScore === 1, "add_live_match_goal: repetir el mismo id no duplica", live1b);
  const g2 = await rpc("admin", "add_live_match_goal", { ...liveGoal, id: GOAL_2, clubId: "dummy-club-bahia", scorerId: "dummy-club-bahia-p13", minute: 40 });
  const live2 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(g2.data?.match?.id === LIVE_MATCH && live2?.homeScore === 1 && live2.awayScore === 1, "add_live_match_goal: gol visitante 1-1", live2);
  const gWrong = await rpc("admin", "add_live_match_goal", { ...liveGoal, id: "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a09", clubId: "dummy-club-halcones" });
  check(gWrong.data?.match === null, "add_live_match_goal: club ajeno al partido -> null", gWrong);
  check(live2?.matchGoals_on_match.find((g) => g.id === GOAL_1)?.scorerName === live2?.homeClub.players_on_club.find((p) => p.id === "dummy-club-tiburones-p16")?.name, "add_live_match_goal: nombre del goleador leído de players");
  check(live2?.matchGoals_on_match.find((g) => g.id === GOAL_1)?.minute === 12, "add_live_match_goal: minuto guardado");

  const delGoalPres = await rpc("presidente", "delete_live_match_goal", { matchId: LIVE_MATCH, goalId: GOAL_2 });
  check(delGoalPres.data?.match === null, "delete_live_match_goal: presidente -> null", delGoalPres);
  const delGoal = await rpc("admin", "delete_live_match_goal", { matchId: LIVE_MATCH, goalId: GOAL_2 });
  const live3 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(delGoal.data?.removed === null && delGoal.data?.match?.id === LIVE_MATCH && live3?.homeScore === 1 && live3.awayScore === 0, "delete_live_match_goal: vuelve a 1-0", live3);

  const liveCard = { id: CARD_1, matchId: LIVE_MATCH, clubId: "dummy-club-tiburones", playerId: "dummy-club-tiburones-p01", color: "YELLOW", minute: 30 };
  const cardLivePres = await rpc("presidente", "add_live_match_card", liveCard);
  check(cardLivePres.data?.match === null, "add_live_match_card: presidente -> null", cardLivePres);
  const c1 = await rpc("admin", "add_live_match_card", liveCard);
  const live4 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(c1.data?.card === null && c1.data?.match?.id === LIVE_MATCH && live4?.matchCards_on_match.length === 1 && live4.matchCards_on_match[0].minute === 30, "add_live_match_card: superadmin", c1);
  const delCardPres = await rpc("presidente", "delete_live_match_card", { matchId: LIVE_MATCH, cardId: CARD_1 });
  check(delCardPres.data?.match === null, "delete_live_match_card: presidente -> null", delCardPres);
  const delCard = await rpc("admin", "delete_live_match_card", { matchId: LIVE_MATCH, cardId: CARD_1 });
  const live5 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(delCard.data?.match?.id === LIVE_MATCH && live5?.matchCards_on_match.length === 0, "delete_live_match_card: tarjeta borrada", delCard);

  const finishPres = await rpc("presidente", "finish_live_match", { matchId: LIVE_MATCH });
  check(finishPres.data?.match === null, "finish_live_match: presidente -> null", finishPres);
  const finish = await rpc("admin", "finish_live_match", { matchId: LIVE_MATCH });
  const live6 = (await rpc("anon", "match_detail", { id: LIVE_MATCH })).data?.matches?.[0];
  check(finish.data?.tournament === null && finish.data?.match?.id === LIVE_MATCH && live6?.status === "PLAYED" && live6.homeScore === 1 && live6.awayScore === 0, "finish_live_match: cierra con el marcador recalculado", live6);
  const finishAgain = await rpc("admin", "finish_live_match", { matchId: LIVE_MATCH });
  check(finishAgain.data?.match === null, "finish_live_match: ya jugado -> null", finishAgain);
  const goalAfter = await rpc("admin", "add_live_match_goal", { ...liveGoal, id: "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a08" });
  check(goalAfter.data?.match === null, "add_live_match_goal: partido jugado -> null", goalAfter);

  // ---------- Cierre, reapertura y desprogramación ----------
  // Torneo desechable (publico.mjs cuenta los 4 de la semilla): un jugado, dos programados con cancha y un W.O.

  const CLOSE = "prueba-tour-cierre";
  await db.exec(`
    INSERT INTO tournaments (id, name, season_id, category_id, status, legs, football_type, duration_minutes, start_date)
    SELECT '${CLOSE}', 'Torneo por cerrar', season_id, category_id, 'ACTIVE', 1, 'FUT_7', 60, '2026-12-01'
    FROM tournaments WHERE id = '${FEMENIL}';
    INSERT INTO tournament_clubs (tournament_id, club_id)
    VALUES ('${CLOSE}', 'dummy-club-halcones'), ('${CLOSE}', 'dummy-club-bahia'), ('${CLOSE}', 'dummy-club-union');
    INSERT INTO matches (id, tournament_id, round_label, round_number, home_club_id, away_club_id, match_date, start_time, venue, court_id, status, home_score, away_score, walkover)
    VALUES
      ('${CLOSE}-j01-1', '${CLOSE}', '1', 1, 'dummy-club-halcones', 'dummy-club-bahia', '2026-12-02', '10:00', 'Campo Norte', NULL, 'PLAYED', 2, 1, false),
      ('${CLOSE}-j01-2', '${CLOSE}', '1', 1, 'dummy-club-union', 'dummy-club-halcones', '2026-12-05', '10:00', 'Campo Norte', 'dummy-court-norte', 'SCHEDULED', NULL, NULL, false),
      ('${CLOSE}-j02-1', '${CLOSE}', '2', 2, 'dummy-club-bahia', 'dummy-club-union', '2026-12-20', '10:00', 'Campo Norte', 'dummy-court-norte', 'SCHEDULED', NULL, NULL, false),
      ('${CLOSE}-j03-1', '${CLOSE}', '3', 3, 'dummy-club-halcones', 'dummy-club-union', NULL, NULL, '', NULL, 'PLAYED', 3, 0, true);
    INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, match_id)
    VALUES
      ('match_${CLOSE}-j01-2', 'dummy-court-norte', '2026-12-05', '10:00', '11:00', 'MATCH', '${CLOSE}-j01-2'),
      ('match_${CLOSE}-j02-1', 'dummy-court-norte', '2026-12-20', '10:00', '11:00', 'MATCH', '${CLOSE}-j02-1');
  `);
  const closeState = async () => (await db.query(`
    SELECT
      (SELECT status::text FROM tournaments WHERE id = '${CLOSE}') AS status,
      (SELECT count(*)::int FROM matches WHERE tournament_id = '${CLOSE}' AND status = 'SCHEDULED') AS scheduled,
      (SELECT count(*)::int FROM court_holds h JOIN matches m ON m.id = h.match_id WHERE m.tournament_id = '${CLOSE}') AS holds,
      (SELECT coalesce(jsonb_agg(jsonb_build_object('place', place, 'club', club_id) ORDER BY place), '[]'::jsonb) FROM tournament_podium WHERE tournament_id = '${CLOSE}') AS podium
  `)).rows[0];

  const earlySchedule = await rpc("admin", "schedule_official_match", { id: `${CLOSE}-j02-1`, matchDate: "2026-11-30", startTime: "10:00", venue: "Campo Norte", courtId: "dummy-court-norte" });
  check(earlySchedule.data?.match === null, "schedule_official_match: antes del inicio del torneo -> null", earlySchedule);
  const onStart = await rpc("admin", "schedule_official_match", { id: `${CLOSE}-j02-1`, matchDate: "2026-12-20", startTime: "10:00", venue: "Campo Norte", courtId: "dummy-court-norte" });
  check(onStart.data?.match?.id === `${CLOSE}-j02-1`, "schedule_official_match: desde el inicio del torneo sí", onStart);

  const closeSettings = { id: CLOSE, legs: 1, footballType: "FUT_7", durationMinutes: 60, startDate: "2026-12-10", prize: null };
  const laterStart = await rpc("admin", "update_tournament_settings", closeSettings);
  let st = await closeState();
  check(laterStart.data?.tournament?.id === CLOSE && laterStart.data.unscheduled === 1 && st.scheduled === 1 && st.holds === 1, "update_tournament_settings: adelantar el inicio desprograma solo los anteriores", { laterStart: laterStart.data, st });
  const newDuration = await rpc("admin", "update_tournament_settings", { ...closeSettings, durationMinutes: 90 });
  st = await closeState();
  check(newDuration.data?.tournament?.id === CLOSE && newDuration.data.unscheduled === 1 && st.scheduled === 0 && st.holds === 0, "update_tournament_settings: cambiar la duración desprograma todo y libera las canchas", { newDuration: newDuration.data, st });
  const sameDuration = await rpc("admin", "update_tournament_settings", { ...closeSettings, durationMinutes: 90 });
  check(sameDuration.data?.tournament?.id === CLOSE && sameDuration.data.unscheduled === 0, "update_tournament_settings: sin cambios no desprograma nada", sameDuration.data);

  const resetPres = await rpc("presidente", "reset_walkover_match", { id: `${CLOSE}-j03-1` });
  check(resetPres.data?.match === null, "reset_walkover_match: presidente -> null", resetPres);
  const resetNormal = await rpc("admin", "reset_walkover_match", { id: `${CLOSE}-j01-1` });
  check(resetNormal.data?.match === null, "reset_walkover_match: partido que no es W.O. -> null", resetNormal);
  const reset = await rpc("admin", "reset_walkover_match", { id: `${CLOSE}-j03-1` });
  const resetRow = (await db.query(`SELECT status::text AS status, walkover, home_score, away_score, match_date FROM matches WHERE id = '${CLOSE}-j03-1'`)).rows[0];
  check(reset.data?.match?.id === `${CLOSE}-j03-1` && resetRow.status === "UNSCHEDULED" && resetRow.walkover === false && resetRow.home_score === null && resetRow.match_date === null, "reset_walkover_match: vuelve a por programar en 0-0", resetRow);

  const roundPlayed = await rpc("admin", "set_match_round", { id: `${CLOSE}-j01-1`, roundLabel: "2", roundNumber: 2 });
  check(roundPlayed.data?.match === null, "set_match_round: jugado -> null", roundPlayed);
  const roundOk = await rpc("admin", "set_match_round", { id: `${CLOSE}-j03-1`, roundLabel: "2", roundNumber: 2 });
  const roundRow = (await db.query(`SELECT round_label, round_number FROM matches WHERE id = '${CLOSE}-j03-1'`)).rows[0];
  check(roundOk.data?.match?.id === `${CLOSE}-j03-1` && roundRow.round_label === "2" && roundRow.round_number === 2, "set_match_round: renumera la jornada", roundRow);

  await rpc("admin", "schedule_official_match", { id: `${CLOSE}-j02-1`, matchDate: "2026-12-20", startTime: "10:00", venue: "Campo Norte", courtId: "dummy-court-norte" });
  await rpc("admin", "save_match_court_hold", { id: `match_${CLOSE}-j02-1`, courtId: "dummy-court-norte", holdDate: "2026-12-20", startTime: "10:00", endTime: "11:30", matchId: `${CLOSE}-j02-1` });
  const closePres = await rpc("presidente", "close_tournament", { id: CLOSE });
  check(closePres.data?.tournament === null, "close_tournament: presidente -> null", closePres);
  const closed = await rpc("admin", "close_tournament", { id: CLOSE });
  st = await closeState();
  check(closed.data?.tournament?.id === CLOSE && closed.data.unscheduled === 1 && st.status === "FINISHED" && st.scheduled === 0 && st.holds === 0, "close_tournament: FINISHED, pendientes desprogramados y canchas libres", { closed: closed.data, st });
  check(st.podium.length >= 2 && st.podium[0].place === 1 && st.podium[0].club === "dummy-club-halcones", "close_tournament: podio con la tabla (Halcones campeón)", st.podium);
  const screenClosed = (await rpc("anon", "tournament_screen", { id: CLOSE })).data?.tournaments?.[0];
  check(screenClosed?.status === "FINISHED" && screenClosed.season?.active === true && screenClosed.tournamentPodiums_on_tournament.length === st.podium.length, "tournament_screen: podio y temporada activa del torneo cerrado", screenClosed);
  const closeAgain = await rpc("admin", "close_tournament", { id: CLOSE });
  check(closeAgain.data?.tournament === null, "close_tournament: ya finalizado -> null", closeAgain);

  const lockedScore = await rpc("admin", "save_match_score", { id: `${CLOSE}-j02-1`, homeScore: 1, awayScore: 0, walkover: false });
  const lockedSchedule = await rpc("admin", "schedule_official_match", { id: `${CLOSE}-j02-1`, matchDate: "2026-12-21", startTime: "10:00", venue: "Campo Norte", courtId: "" });
  const lockedClub = await rpc("admin", "add_tournament_club", { tournamentId: CLOSE, clubId: "dummy-club-leones" });
  const lockedSettings = await rpc("admin", "update_tournament_settings", { ...closeSettings, durationMinutes: 90 });
  const lockedDelete = await rpc("admin", "delete_unplayed_match", { id: `${CLOSE}-j02-1` });
  check(lockedScore.data?.match === null && lockedSchedule.data?.match === null && lockedClub.data?.row === null && lockedSettings.data?.tournament === null && lockedDelete.data?.match === null, "torneo finalizado: marcador, calendario, inscripciones y ajustes bloqueados", { lockedScore: lockedScore.data, lockedSchedule: lockedSchedule.data, lockedClub: lockedClub.data });

  const reopenPres = await rpc("presidente", "reopen_tournament", { id: CLOSE });
  check(reopenPres.data?.tournament === null, "reopen_tournament: presidente -> null", reopenPres);
  const reopened = await rpc("admin", "reopen_tournament", { id: CLOSE });
  st = await closeState();
  check(reopened.data?.tournament?.id === CLOSE && st.status === "ACTIVE" && st.podium.length === 0, "reopen_tournament: vuelve a ACTIVE sin podio", { reopened: reopened.data, st });
  const unlockedScore = await rpc("admin", "save_match_score", { id: `${CLOSE}-j02-1`, homeScore: 1, awayScore: 0, walkover: false });
  check(unlockedScore.data?.match?.id === `${CLOSE}-j02-1`, "reopen_tournament: se puede volver a capturar", unlockedScore);
  await db.exec(`
    DELETE FROM court_holds WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = '${CLOSE}');
    DELETE FROM matches WHERE tournament_id = '${CLOSE}';
    DELETE FROM tournaments WHERE id = '${CLOSE}';
  `);

  // ---------- Borrar el torneo ----------
  // Se siembra uno desechable directamente (publico.mjs cuenta los 4 de la semilla).

  const SCRATCH = "prueba-tour-borrar";
  await db.exec(`
    INSERT INTO tournaments (id, name, season_id, category_id, status, legs, football_type, duration_minutes)
    SELECT '${SCRATCH}', 'Torneo de prueba', season_id, category_id, 'UPCOMING', 1, 'FUT_7', 60
    FROM tournaments WHERE id = '${FEMENIL}';
    INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ('${SCRATCH}', 'dummy-club-halcones'), ('${SCRATCH}', 'dummy-club-bahia');
    INSERT INTO matches (id, tournament_id, round_label, round_number, home_club_id, away_club_id, match_date, start_time, venue, court_id, status)
    VALUES ('${SCRATCH}-j01-1', '${SCRATCH}', '1', 1, 'dummy-club-halcones', 'dummy-club-bahia', '2026-12-05', '10:00', 'Campo Norte', 'dummy-court-norte', 'SCHEDULED');
    INSERT INTO court_holds (id, court_id, hold_date, start_time, end_time, source, match_id)
    VALUES ('match_${SCRATCH}-j01-1', 'dummy-court-norte', '2026-12-05', '10:00', '11:00', 'MATCH', '${SCRATCH}-j01-1');
  `);
  const scratchGoal = await rpc("admin", "add_live_match_goal", { id: "0a0a0a0a-0a0a-4a0a-8a0a-0a0a0a0a0a0a", matchId: `${SCRATCH}-j01-1`, clubId: "dummy-club-halcones", minute: 5 });
  check(scratchGoal.data?.match?.id === `${SCRATCH}-j01-1`, "delete_unplayed_tournament: torneo desechable con gol en vivo", scratchGoal);

  const dropPres = await rpc("presidente", "delete_unplayed_tournament", { id: SCRATCH });
  check(dropPres.data?.tournament === null && dropPres.data?.children === null, "delete_unplayed_tournament: presidente -> null", dropPres);
  const dropPlayed = await rpc("admin", "delete_unplayed_tournament", { id: APERTURA });
  check(dropPlayed.data?.tournament === null, "delete_unplayed_tournament: con jugados -> null", dropPlayed);
  const drop = await rpc("admin", "delete_unplayed_tournament", { id: SCRATCH });
  check(drop.data?.tournament?.id === SCRATCH, "delete_unplayed_tournament: superadmin", drop);
  const gone = await rpc("admin", "tournament_editor", { id: SCRATCH });
  check(gone.data?.tournaments?.length === 0 && gone.data?.matches?.length === 0, "delete_unplayed_tournament: ficha y partidos borrados", gone.data);
  const holdsGone = (await rpc("admin", "court_busy_on_date", { date: "2026-12-05" })).data?.courtHolds ?? [];
  check(!holdsGone.some((x) => x.match?.id === `${SCRATCH}-j01-1`), "delete_unplayed_tournament: reservas de cancha borradas", holdsGone);
  const archive = await rpc("anon", "tournament_archive");
  check(archive.data?.tournaments?.length === 4 && archive.data.tournaments.some((t) => t.id === FEMENIL), "delete_unplayed_tournament: los 4 torneos de la semilla siguen", archive.data?.tournaments?.length);
}
