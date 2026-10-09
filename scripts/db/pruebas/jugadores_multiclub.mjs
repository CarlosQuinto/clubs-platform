// Pruebas de jugadores en varios clubes (0010_jugadores_multiclub.sql): players es la persona y club_players su
// pertenencia a cada club. Un jugador representa a un solo club por torneo no terminado.
// Todos los clubes demo comparten el Apertura activo, así que se crea un club de prueba sin torneos para fichar
// a un jugador de Bahía; el DT de Halcones recibe además el rol DT en ese club. La BD es efímera: se muta libremente.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const HALCONES = "dummy-club-halcones";
const BAHIA = "dummy-club-bahia";
const MULTI = "prueba-club-multi";
const DT_UID = "11111111-1111-4111-8111-111111111103";
const COMPARTIDO = "dummy-club-bahia-p01";
/** Presidente de Bahía (db/seed/10_miembros.sql); no está entre las sesiones fijas del runner. */
const PRES_BAHIA = { role: "authenticated", claims: { sub: "11111111-1111-4111-8111-111111111106", email: "presidente2@demo.local" } };

export async function run({ db, rpc, check }) {
  if (!existsSync(join(ROOT, "scripts", "demo", "demo-seed.sql"))) {
    check(true, "sin datos dummy: se omiten las pruebas de jugadores multiclub");
    return;
  }
  const count = async (sql, params = []) => (await db.query(sql, params)).rows[0].n;
  const plantilla = async (club) => {
    const slug = (await db.query("SELECT slug FROM clubs WHERE id = $1", [club])).rows[0].slug;
    const r = await rpc("anon", "club_screen", { slug });
    return r.data?.clubs?.[0]?.players_on_club ?? [];
  };
  const statsPlayers = async () => (await rpc("anon", "home_page", { today: "2026-01-01" })).data?.platformStats?.[0]?.players;

  // ---------- La migración conservó las plantillas ----------
  // club.mjs ya corrió y dio de alta jugadores de prueba: se cuentan solo los del seed demo
  check((await count(`SELECT count(*)::int AS n FROM club_players WHERE club_id = '${HALCONES}' AND player_id LIKE '${HALCONES}-%'`)) === 17
    && (await count(`SELECT count(*)::int AS n FROM club_players WHERE club_id = '${HALCONES}' AND is_coach`)) === 1,
    "0010: Halcones conserva sus 16 jugadores y su DT en club_players");
  check((await count("SELECT count(*)::int AS n FROM players WHERE id LIKE 'dummy-club-%'"))
    === (await count("SELECT count(*)::int AS n FROM club_players WHERE player_id LIKE 'dummy-club-%'")),
    "0010: cada jugador demo está en exactamente un club");
  const bahiaAntes = (await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO);
  check(bahiaAntes && Array.isArray(bahiaAntes.otherClubs_on_player) && bahiaAntes.otherClubs_on_player.length === 0,
    "club_screen: otherClubs_on_player vacío para un jugador de un solo club", bahiaAntes);

  // ---------- Club de prueba sin torneos; el DT de Halcones también es DT ahí ----------
  await db.query("INSERT INTO clubs (id, slug, name) VALUES ($1, $1, 'Club Multi Prueba')", [MULTI]);
  await db.query("INSERT INTO club_members (club_id, user_id, email, display_name, role) VALUES ($1, $2, 'dt@demo.local', 'DT Multi', 'DT')", [MULTI, DT_UID]);

  // ---------- search_players ----------
  for (const who of ["anon", "usuario", "tesorero", "prensa"]) {
    const r = await rpc(who, "search_players", { clubId: HALCONES, q: "ana maria" });
    check(r.error?.code === "42501", `search_players: ${who} no busca (42501)`, r.data ?? r.error);
  }
  const ajeno = await rpc(PRES_BAHIA, "search_players", { clubId: HALCONES, q: "ana maria" });
  check(ajeno.error?.code === "42501", "search_players: presidente de otro club -> 42501", ajeno.data ?? ajeno.error);
  const corto = await rpc("dt", "search_players", { clubId: HALCONES, q: "an" });
  check(!corto.error && corto.data?.players?.length === 0, "search_players: menos de 3 letras -> lista vacía", corto);
  const raro = await rpc("dt", "search_players", { clubId: HALCONES, q: "ana'; drop" });
  check(!raro.error && raro.data?.players?.length === 0, "search_players: caracteres fuera del nombre -> lista vacía", raro);
  const superVacio = await rpc("admin", "search_players", {});
  check(!superVacio.error && superVacio.data?.players?.length === 0, "search_players: sin variables -> lista vacía (superadmin)", superVacio);
  const ana = await rpc("admin", "save_player", { id: "prueba-multi-ana", clubId: MULTI, name: "Ana María Lopez Nuñez", shirtNumber: "9", position: "Delantero", detail: { birthDate: "1999-04-05" } });
  check(ana.data?.player?.id === "prueba-multi-ana", "save_player: alta en el club de prueba", ana);
  const sinAcentos = await rpc("dt", "search_players", { clubId: HALCONES, q: "MARIA lopez" });
  const anaHallada = sinAcentos.data?.players?.find((p) => p.id === "prueba-multi-ana");
  check(anaHallada?.name === "Ana María Lopez Nuñez" && anaHallada.birthDate === "1999-04-05" && anaHallada.inThisClub === null
    && anaHallada.clubs_on_player.length === 1 && anaHallada.clubs_on_player[0].id === MULTI && anaHallada.clubs_on_player[0].active === true,
    "search_players: ignora acentos y mayúsculas; trae nacimiento, inThisClub y sus clubes", sinAcentos.data ?? sinAcentos.error);
  const conAcentos = await rpc("dt", "search_players", { clubId: HALCONES, q: "lópez núñez" });
  check(conAcentos.data?.players?.some((p) => p.id === "prueba-multi-ana"), "search_players: también con acentos en la búsqueda", conAcentos.data ?? conAcentos.error);
  const nombreHalcon = (await db.query(`SELECT pl.name FROM club_players cp JOIN players pl ON pl.id = cp.player_id WHERE cp.club_id = $1 AND cp.active ORDER BY pl.name LIMIT 1`, [HALCONES])).rows[0].name;
  const propios = await rpc("dt", "search_players", { clubId: HALCONES, q: nombreHalcon });
  check(!propios.data?.players?.some((p) => p.clubs_on_player.some((c) => c.id === HALCONES)), "search_players: no ofrece a los que ya están vivos en el club", propios.data ?? propios.error);
  const nombreBahia = (await db.query("SELECT name FROM players WHERE id = $1", [COMPARTIDO])).rows[0].name;
  const bahiaBusq = await rpc("dt", "search_players", { clubId: MULTI, q: nombreBahia });
  check(bahiaBusq.data?.players?.find((p) => p.id === COMPARTIDO)?.clubs_on_player?.[0]?.id === BAHIA, "search_players: el DT del club de prueba encuentra al jugador de Bahía", bahiaBusq.data ?? bahiaBusq.error);

  // ---------- add_existing_player ----------
  const personasAntes = await statsPlayers();
  const sinRol =await rpc("usuario", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "10", position: "Medio" });
  check(sinRol.data?.player === null && !sinRol.data?.reason, "add_existing_player: usuario sin rol -> null", sinRol);
  const vacio = await rpc("admin", "add_existing_player", {});
  check(!vacio.error && vacio.data?.player === null, "add_existing_player: sin variables -> null, sin error", vacio);
  const dorsalMalo = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "100", position: "Medio" });
  const posMala = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "10", position: "Libero" });
  const inexistente = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: "no-existe", shirtNumber: "10", position: "Medio" });
  check(dorsalMalo.data?.player === null && posMala.data?.player === null && inexistente.data?.player === null,
    "add_existing_player: dorsal 100, posición fuera de lista o jugador inexistente -> null", { dorsalMalo: dorsalMalo.data, posMala: posMala.data, inexistente: inexistente.data });
  const conflicto = await rpc("presidente", "add_existing_player", { clubId: HALCONES, playerId: COMPARTIDO, shirtNumber: "10", position: "Medio" });
  check(conflicto.data?.player === null && typeof conflicto.data?.conflict?.clubName === "string" && typeof conflicto.data.conflict.tournamentName === "string",
    "add_existing_player: Halcones no ficha a un jugador de Bahía (comparten torneo en curso) -> conflict", conflicto);
  const fichado = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "10", position: "Medio", variant: "Volante" });
  check(fichado.data?.player?.id === COMPARTIDO && fichado.data.player.name === nombreBahia, "add_existing_player: el DT suma al jugador de Bahía al club de prueba", fichado);
  const repetido = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "11", position: "Medio" });
  check(repetido.data?.player === null && repetido.data?.reason === "ALREADY", "add_existing_player: ya está en el club -> reason ALREADY", repetido);
  check((await count("SELECT count(*)::int AS n FROM club_players WHERE player_id = $1", [COMPARTIDO])) === 2, "club_players: el jugador tiene una fila por club");
  const enMulti = (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO);
  const enBahia = (await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO);
  check(enMulti?.shirtNumber === "10" && enMulti.variant === "Volante" && enMulti.otherClubs_on_player?.[0]?.id === BAHIA
    && enBahia?.shirtNumber === bahiaAntes.shirtNumber && enBahia.otherClubs_on_player?.[0]?.id === MULTI,
    "club_screen: dorsal y variante propios de cada club; cada uno ve al otro en otherClubs_on_player", { enMulti, enBahia });
  check((await statsPlayers()) === personasAntes, "platform_stats: la persona cuenta una sola vez aunque esté en dos clubes", { antes: personasAntes, ahora: await statsPlayers() });

  // ---------- Datos compartidos: los edita cualquiera de sus clubes; el dorsal no se cruza ----------
  const editadoMulti = await rpc("dt", "save_player", { id: COMPARTIDO, clubId: MULTI, name: "Nombre Compartido", shirtNumber: "12", position: "Defensa", active: true, detail: { birthDate: "1995-02-03", imageUrl: "https://a/foto.jpg" } });
  check(editadoMulti.data?.player?.name === "Nombre Compartido", "save_player: el club de prueba edita a su jugador compartido", editadoMulti);
  const bahiaTras = (await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO);
  const multiTras = (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO);
  check(bahiaTras?.name === "Nombre Compartido" && bahiaTras.birthDate === "1995-02-03" && bahiaTras.imageUrl === "https://a/foto.jpg"
    && bahiaTras.shirtNumber === bahiaAntes.shirtNumber && bahiaTras.position === bahiaAntes.position && multiTras?.shirtNumber === "12" && multiTras.position === "Defensa",
    "nombre, nacimiento y foto se ven en Bahía; dorsal y posición siguen siendo de cada club", { bahiaTras, multiTras });
  const pisar = await rpc("presidente", "save_player", { id: COMPARTIDO, clubId: HALCONES, name: "Robado", shirtNumber: "1", position: "Portero" });
  check(pisar.data?.player === null && (await db.query("SELECT name FROM players WHERE id = $1", [COMPARTIDO])).rows[0].name === "Nombre Compartido"
    && (await count("SELECT count(*)::int AS n FROM club_players WHERE player_id = $1", [COMPARTIDO])) === 2,
    "save_player: un club donde no está no lo edita ni se lo suma", pisar);

  // ---------- Baja y eliminación solo en un club ----------
  const baja = await rpc("dt", "save_player", { id: COMPARTIDO, clubId: MULTI, name: "Nombre Compartido", shirtNumber: "12", position: "Defensa", active: false, detail: { birthDate: "1995-02-03", imageUrl: "https://a/foto.jpg" } });
  check(baja.data?.player?.id === COMPARTIDO && (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO)?.active === false
    && (await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO)?.active === true, "baja temporal en el club de prueba no toca Bahía", baja);
  const eliminar = await rpc("dt", "delete_player", { id: COMPARTIDO, clubId: MULTI });
  const multiElim = (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO);
  const bahiaElim = (await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO);
  check(eliminar.data?.deleted === 1 && typeof multiElim?.deletedAt === "string" && bahiaElim?.deletedAt === null && bahiaElim.active === true
    && bahiaElim.otherClubs_on_player.length === 0, "delete_player: sale solo del club de prueba; Bahía ya no lo lista como compartido", { multiElim, bahiaElim });
  check((await plantilla(BAHIA)).find((p) => p.id === COMPARTIDO)?.deletedAt === null, "delete_player: la fila de Bahía sigue viva");
  const restaurar = await rpc("dt", "add_existing_player", { clubId: MULTI, playerId: COMPARTIDO, shirtNumber: "13", position: "Medio" });
  check(restaurar.data?.player?.id === COMPARTIDO && (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO)?.deletedAt === null,
    "add_existing_player: restaura al eliminado del club de prueba", restaurar);

  // ---------- Un club por torneo: inscripción y reactivación ----------
  const torneo = (await db.query(`SELECT t.id FROM tournaments t JOIN tournament_clubs tc ON tc.tournament_id = t.id
    WHERE tc.club_id = $1 AND t.status <> 'FINISHED' ORDER BY (t.status = 'UPCOMING') DESC, t.id LIMIT 1`, [BAHIA])).rows[0].id;
  const inscribir = await rpc("admin", "add_tournament_club", { tournamentId: torneo, clubId: MULTI });
  check(inscribir.data?.row === null && inscribir.data?.conflicts?.some((c) => c.playerName === "Nombre Compartido")
    && (await count("SELECT count(*)::int AS n FROM tournament_clubs WHERE tournament_id = $1 AND club_id = $2", [torneo, MULTI])) === 0,
    "add_tournament_club: no inscribe al club de prueba en un torneo donde su jugador ya juega con Bahía -> conflicts", inscribir);
  await rpc("dt", "save_player", { id: COMPARTIDO, clubId: MULTI, name: "Nombre Compartido", shirtNumber: "13", position: "Medio", active: false, detail: { birthDate: "1995-02-03", imageUrl: "https://a/foto.jpg" } });
  const inscribirBaja = await rpc("admin", "add_tournament_club", { tournamentId: torneo, clubId: MULTI });
  check(inscribirBaja.data?.row?.id === torneo, "add_tournament_club: con el jugador de baja sí se inscribe", inscribirBaja);
  const reactivar = await rpc("dt", "save_player", { id: COMPARTIDO, clubId: MULTI, name: "Nombre Compartido", shirtNumber: "13", position: "Medio", active: true, detail: { birthDate: "1995-02-03", imageUrl: "https://a/foto.jpg" } });
  check(reactivar.data?.player === null && reactivar.data?.conflict?.clubName && (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO)?.active === false,
    "save_player: reactivarlo mientras ambos clubes comparten torneo -> conflict y sigue de baja", reactivar);
  const quitar = await rpc("admin", "remove_tournament_club", { tournamentId: torneo, clubId: MULTI });
  check(!quitar.error && (await count("SELECT count(*)::int AS n FROM tournament_clubs WHERE tournament_id = $1 AND club_id = $2", [torneo, MULTI])) === 0, "remove_tournament_club: el club de prueba sale del torneo", quitar);
  // Un torneo terminado no bloquea
  const terminado = (await db.query(`SELECT t.id FROM tournaments t JOIN tournament_clubs tc ON tc.tournament_id = t.id WHERE tc.club_id = $1 AND t.status = 'FINISHED' LIMIT 1`, [BAHIA])).rows[0]?.id;
  if (terminado) await db.query("INSERT INTO tournament_clubs (tournament_id, club_id) VALUES ($1, $2)", [terminado, MULTI]);
  const reactivado = await rpc("dt", "save_player", { id: COMPARTIDO, clubId: MULTI, name: "Nombre Compartido", shirtNumber: "13", position: "Medio", active: true, detail: { birthDate: "1995-02-03", imageUrl: "https://a/foto.jpg" } });
  check(reactivado.data?.player?.id === COMPARTIDO && (await plantilla(MULTI)).find((p) => p.id === COMPARTIDO)?.active === true,
    `save_player: sin torneo en curso compartido${terminado ? " (solo uno terminado)" : ""} se reactiva`, reactivado);

  // ---------- Vista de aportaciones por jugador y club ----------
  check((await count(`SELECT count(*)::int AS n FROM player_contribution_totals v
    WHERE NOT EXISTS (SELECT 1 FROM goal_contributions c JOIN financial_goals g ON g.id = c.goal_id WHERE c.player_id = v.player_id AND g.club_id = v.club_id)
      AND NOT EXISTS (SELECT 1 FROM transactions t WHERE t.player_id = v.player_id AND t.club_id = v.club_id)`)) === 0,
    "player_contribution_totals: el club de cada total sale de la meta o del movimiento");

  // ---------- Limpieza: el club de prueba se va con sus filas; el jugador sigue en Bahía ----------
  await db.query("DELETE FROM clubs WHERE id = $1", [MULTI]);
  check((await count("SELECT count(*)::int AS n FROM club_players WHERE player_id = $1", [COMPARTIDO])) === 1
    && (await count("SELECT count(*)::int AS n FROM players WHERE id = 'prueba-multi-ana'")) === 1,
    "borrar el club de prueba quita sus pertenencias y conserva a las personas");
}
