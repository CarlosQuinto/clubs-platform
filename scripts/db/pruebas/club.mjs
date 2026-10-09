// Pruebas del bloque del club (db/migrations/1011_fn_club.sql) sobre los datos dummy.
// Sesiones: presidente (ADMIN), dt, tesorero y prensa son de dummy-club-halcones; admin es superadmin;
// usuario no tiene rol. La BD es efímera: se muta libremente.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const HALCONES = "dummy-club-halcones";
const BAHIA = "dummy-club-bahia";
const P01 = "dummy-club-halcones-p01";
const P03 = "dummy-club-halcones-p03";
const EVENTO = "dummy-club-halcones-amistoso-1";
const ENTRENO = "dummy-club-halcones-ent-1";
const META = "dummy-club-halcones-meta-uniformes";
const PARTIDO = "dummy-tour-apertura-j01-1"; // Halcones vs Leones
const PARTIDO_AJENO = "dummy-tour-apertura-j01-2"; // Unión vs Bahía
const ALBUM = "📸 Galería General";
const FOTO1 = "dummy-club-halcones-album-general-1";
const FOTO2 = "dummy-club-halcones-album-general-2";

export async function run({ db, rpc, check }) {
  if (!existsSync(join(ROOT, "scripts", "demo", "demo-seed.sql"))) {
    check(true, "sin datos dummy: se omiten las pruebas del club");
    return;
  }
  const count = async (sql) => (await db.query(sql)).rows[0].n;
  // Fechas relativas a hoy: los eventos no admiten fechas pasadas
  const enDias = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

  // ---------- Sesión ----------
  const anon = await rpc("anon", "save_player", { id: "x", clubId: HALCONES, name: "x", shirtNumber: "1", position: "Portero" });
  check(anon.error?.code === "42501", "anónimo no puede escribir (42501)", anon);
  const vacio = await rpc("admin", "save_player", {});
  check(!vacio.error && vacio.data?.player === null, "variables obligatorias ausentes -> null, sin error", vacio);

  // ---------- Plantilla ----------
  const nuevo = await rpc("dt", "save_player", {
    id: "prueba-p-1", clubId: HALCONES, name: "Nuevo Jugador", shirtNumber: "99", position: "Delantero",
    detail: { variant: "", birthDate: "2000-01-01", imageUrl: "" },
  });
  check(nuevo.data?.player?.id === "prueba-p-1" && nuevo.data.player.name === "Nuevo Jugador", "save_player: DT crea jugador", nuevo);
  const editado = await rpc("presidente", "save_player", { id: "prueba-p-1", clubId: HALCONES, name: "Jugador Editado", shirtNumber: "98", position: "Medio", isCoach: false, active: true, detail: { birthDate: "" } });
  check(editado.data?.player?.name === "Jugador Editado", "save_player: presidente edita (upsert)", editado);
  check((await count(`SELECT count(*)::int AS n FROM club_players cp JOIN players pl ON pl.id = cp.player_id
    WHERE pl.id = 'prueba-p-1' AND cp.club_id = '${HALCONES}' AND cp.shirt_number = '98' AND pl.birth_date IS NULL`)) === 1, "save_player: cambios persistidos");
  const prensaJugador = await rpc("prensa", "save_player", { id: "prueba-p-2", clubId: HALCONES, name: "No", shirtNumber: "1", position: "Portero" });
  check(prensaJugador.data?.player === null, "save_player: prensa no puede", prensaJugador);
  const otroClub = await rpc("presidente", "save_player", { id: "prueba-p-3", clubId: BAHIA, name: "No", shirtNumber: "1", position: "Portero" });
  check(otroClub.data?.player === null, "save_player: presidente de Halcones no escribe en Bahía", otroClub);
  const superJugador = await rpc("admin", "save_player", { id: "prueba-p-4", clubId: BAHIA, name: "Super", shirtNumber: "1", position: "Portero" });
  check(superJugador.data?.player?.id === "prueba-p-4", "save_player: superadmin escribe en cualquier club", superJugador);
  const borrarAjeno = await rpc("usuario", "delete_player", { id: "prueba-p-1", clubId: HALCONES });
  check(borrarAjeno.data?.deleted === null, "delete_player: usuario sin rol -> null", borrarAjeno);
  const borrar = await rpc("dt", "delete_player", { id: "prueba-p-1", clubId: HALCONES });
  check(borrar.data?.deleted === 1, "delete_player: DT borra", borrar);
  check((await count(`SELECT count(*)::int AS n FROM club_players WHERE player_id = 'prueba-p-1' AND deleted_at IS NOT NULL AND NOT active`)) === 1,
    "delete_player: borrado lógico (la fila queda con deleted_at e inactiva)");
  const borrarOtraVez = await rpc("dt", "delete_player", { id: "prueba-p-1", clubId: HALCONES });
  check(borrarOtraVez.data?.deleted === null, "delete_player: eliminar dos veces -> null", borrarOtraVez);
  const revivir = await rpc("dt", "save_player", { id: "prueba-p-1", clubId: HALCONES, name: "Revivido", shirtNumber: "7", position: "Medio", active: true, detail: {} });
  check(revivir.data?.player === null && (await count(`SELECT count(*)::int AS n FROM club_players cp JOIN players pl ON pl.id = cp.player_id
    WHERE pl.id = 'prueba-p-1' AND pl.name = 'Jugador Editado' AND cp.deleted_at IS NOT NULL`)) === 1,
    "save_player: no revive ni sobrescribe a un eliminado", revivir);
  const borrarBahia = await rpc("presidente", "delete_player", { id: "prueba-p-4", clubId: BAHIA });
  check(borrarBahia.data?.deleted === null, "delete_player: otro club -> null", borrarBahia);

  // ---------- Agenda: eventos ----------
  const evento = await rpc("dt", "save_club_event", {
    id: "prueba-ev-1", clubId: HALCONES, eventType: "PARTIDO", matchType: "AMISTOSO", title: "Amistoso de prueba",
    eventDate: enDias(25), eventTime: "18:00", detail: { location: "Campo Prueba", routine: [] },
  });
  check(evento.data?.event?.id === "prueba-ev-1" && evento.data.event.title === "Amistoso de prueba", "save_club_event: DT crea", evento);
  check((await count(`SELECT count(*)::int AS n FROM club_events WHERE id = 'prueba-ev-1' AND location = 'Campo Prueba' AND match_type = 'AMISTOSO'`)) === 1, "save_club_event: detail.location persistido");
  const entreno = await rpc("presidente", "save_club_event", { id: "prueba-ev-1", clubId: HALCONES, eventType: "ENTRENAMIENTO", matchType: null, title: "Ahora entreno", eventDate: enDias(26), eventTime: "19:00", detail: { location: "Por definir", routine: [{ id: "1" }] } });
  check(entreno.data?.event?.title === "Ahora entreno", "save_club_event: upsert", entreno);
  const eventoTesorero = await rpc("tesorero", "save_club_event", { id: "prueba-ev-2", clubId: HALCONES, eventType: "PARTIDO", title: "No", eventDate: enDias(25), eventTime: "18:00" });
  check(eventoTesorero.data?.event === null, "save_club_event: tesorero no puede", eventoTesorero);

  const marcador = await rpc("dt", "set_club_event_score", { id: EVENTO, clubId: HALCONES, scoreOurs: 3, scoreTheirs: 1, penaltiesOurs: null, penaltiesTheirs: null });
  check(marcador.data?.event?.id === EVENTO, "set_club_event_score: DT", marcador);
  check((await count(`SELECT count(*)::int AS n FROM club_events WHERE id = '${EVENTO}' AND score_ours = 3 AND score_theirs = 1 AND penalties_ours IS NULL`)) === 1, "set_club_event_score: persistido");
  const marcadorPrensa = await rpc("prensa", "set_club_event_score", { id: EVENTO, clubId: HALCONES, scoreOurs: 0, scoreTheirs: 0 });
  check(marcadorPrensa.data?.event === null, "set_club_event_score: prensa -> null", marcadorPrensa);
  const marcadorClubFalso = await rpc("admin", "set_club_event_score", { id: EVENTO, clubId: BAHIA, scoreOurs: 0, scoreTheirs: 0 });
  check(marcadorClubFalso.data?.event === null, "set_club_event_score: clubId que no es el del evento -> null", marcadorClubFalso);

  const lineup = { mode: "Fut-11", formation: "4-3-3", positions: { gk: P01 } };
  const alineacion = await rpc("presidente", "set_club_event_lineup", { id: EVENTO, clubId: HALCONES, lineup });
  check(alineacion.data?.event?.id === EVENTO, "set_club_event_lineup", alineacion);
  check((await count(`SELECT count(*)::int AS n FROM club_events WHERE id = '${EVENTO}' AND lineup ->> 'formation' = '4-3-3'`)) === 1, "set_club_event_lineup: jsonb persistido");
  const porDefecto = await rpc("dt", "save_club_default_lineup", { clubId: HALCONES, mode: "Fut-7", lineup: { formation: "2-3-1", positions: {} } });
  check(porDefecto.data?.lineup?.club_id === HALCONES && porDefecto.data.lineup.mode === "Fut-7", "save_club_default_lineup: DT", porDefecto);
  const porDefecto2 = await rpc("dt", "save_club_default_lineup", { clubId: HALCONES, mode: "Fut-7", lineup: { formation: "3-2-1" } });
  check(porDefecto2.data?.lineup?.mode === "Fut-7" && (await count(`SELECT count(*)::int AS n FROM club_default_lineups WHERE club_id = '${HALCONES}' AND mode = 'Fut-7' AND formation = '3-2-1'`)) === 1, "save_club_default_lineup: upsert por (club, modo)");
  const porDefectoUsuario = await rpc("usuario", "save_club_default_lineup", { clubId: HALCONES, mode: "Fut-7", lineup: {} });
  check(porDefectoUsuario.data?.lineup === null, "save_club_default_lineup: sin rol -> null", porDefectoUsuario);

  const asistencia = await rpc("dt", "replace_club_event_attendees", { id: ENTRENO, clubId: HALCONES, labels: [P01, P03, "Invitado Pepe", ""] });
  check(asistencia.data?.event?.event_id === ENTRENO && asistencia.data.cleared > 0 && asistencia.data.added === 3, "replace_club_event_attendees: DT sustituye", asistencia);
  check((await count(`SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = '${ENTRENO}' AND player_id IS NOT NULL`)) === 2
    && (await count(`SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = '${ENTRENO}' AND raw_label = 'Invitado Pepe' AND player_id IS NULL`)) === 1, "replace_club_event_attendees: jugadores enlazados y etiqueta libre");
  const asistenciaBahia = await rpc("presidente", "replace_club_event_attendees", { id: ENTRENO, clubId: BAHIA, labels: [P01] });
  check(asistenciaBahia.data?.event === null && asistenciaBahia.data.cleared === null, "replace_club_event_attendees: clubId ajeno -> null y no borra", asistenciaBahia);
  check((await count(`SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = '${ENTRENO}'`)) === 3, "replace_club_event_attendees: intento denegado no tocó datos");
  const asistenciaNull = await rpc("dt", "replace_club_event_attendees", { id: ENTRENO, clubId: HALCONES, labels: null });
  check(asistenciaNull.data?.event?.event_id === ENTRENO && asistenciaNull.data.added === null, "replace_club_event_attendees: labels null vacía la lista", asistenciaNull);

  const album = await rpc("presidente", "replace_club_event_album", { id: EVENTO, clubId: HALCONES, urls: ["https://a/1.jpg", "", "https://a/2.jpg"] });
  check(album.data?.event?.event_id === EVENTO && album.data.added === 2, "replace_club_event_album", album);
  check((await count(`SELECT count(*)::int AS n FROM club_event_photos WHERE event_id = '${EVENTO}' AND position = 2 AND url = 'https://a/2.jpg'`)) === 1, "replace_club_event_album: posición por orden recibido");
  const albumPrensa = await rpc("prensa", "replace_club_event_album", { id: EVENTO, clubId: HALCONES, urls: [] });
  check(albumPrensa.data?.event === null, "replace_club_event_album: prensa -> null", albumPrensa);

  const stats = await rpc("dt", "replace_club_event_stats", {
    id: EVENTO, clubId: HALCONES,
    stats: {
      goals: [{ scorer: P03, assist: P01, isPenalty: false, isOwnGoal: false }, { scorer: "dummy-club-bahia-p01", isPenalty: true }],
      yellowCards: [P01, "dummy-club-bahia-p01"], redCards: [P03], goalkeepers: [{ id: P01, conceded: 1, saves: 4 }],
    },
  });
  check(stats.data?.event?.id === EVENTO && stats.data.added === 5, "replace_club_event_stats: DT", stats);
  check((await count(`SELECT count(*)::int AS n FROM club_event_goals WHERE event_id = '${EVENTO}' AND sort_order = 1 AND scorer_id IS NULL AND is_penalty`)) === 1, "replace_club_event_stats: goleador de otro club queda sin enlazar");
  check((await count(`SELECT count(*)::int AS n FROM club_event_cards WHERE event_id = '${EVENTO}'`)) === 2
    && (await count(`SELECT count(*)::int AS n FROM club_event_mvps WHERE event_id = '${EVENTO}' AND player_id = '${P03}'`)) === 1, "replace_club_event_stats: tarjetas solo del club y MVP automático (el goleador del club)");
  const statsAjeno = await rpc("usuario", "replace_club_event_stats", { id: EVENTO, clubId: HALCONES, stats: { goals: [] } });
  check(statsAjeno.data?.event === null && (await count(`SELECT count(*)::int AS n FROM club_event_goals WHERE event_id = '${EVENTO}'`)) === 2, "replace_club_event_stats: sin rol -> null y no borra");

  const borrarEvento = await rpc("tesorero", "delete_club_event", { id: "prueba-ev-1", clubId: HALCONES });
  check(borrarEvento.data?.deleted === null, "delete_club_event: tesorero -> null", borrarEvento);
  const borrarEvento2 = await rpc("presidente", "delete_club_event", { id: EVENTO, clubId: HALCONES });
  check(borrarEvento2.data?.deleted === 1 && (await count(`SELECT count(*)::int AS n FROM club_event_goals WHERE event_id = '${EVENTO}'`)) === 0, "delete_club_event: presidente borra con hijos", borrarEvento2);

  // ---------- Agenda: partidos oficiales ----------
  const reporte = await rpc("dt", "set_match_club_lineup", { matchId: PARTIDO, clubId: HALCONES, lineup });
  check(reporte.data?.report?.match_id === PARTIDO, "set_match_club_lineup: DT en partido propio", reporte);
  const reporteAjeno = await rpc("dt", "set_match_club_lineup", { matchId: PARTIDO_AJENO, clubId: HALCONES, lineup });
  check(reporteAjeno.data?.report === null, "set_match_club_lineup: partido en el que no juega -> null", reporteAjeno);
  const reporteSuplantado = await rpc("dt", "set_match_club_lineup", { matchId: PARTIDO, clubId: "dummy-club-leones", lineup });
  check(reporteSuplantado.data?.report === null, "set_match_club_lineup: no puede firmar por el rival", reporteSuplantado);
  const asistentes = await rpc("presidente", "replace_match_attendees", { matchId: PARTIDO, clubId: HALCONES, labels: [P01, P03, "dummy-club-leones-p01", "nadie"] });
  check(asistentes.data?.report?.match_id === PARTIDO && asistentes.data.added === 2, "replace_match_attendees: solo jugadores del club", asistentes);
  check((await count(`SELECT count(*)::int AS n FROM match_attendees WHERE match_id = '${PARTIDO}' AND club_id = '${HALCONES}'`)) === 2
    && (await count(`SELECT count(*)::int AS n FROM match_attendees WHERE match_id = '${PARTIDO}' AND club_id = 'dummy-club-leones'`)) > 0, "replace_match_attendees: no toca la lista del rival");
  const asistentesPrensa = await rpc("prensa", "replace_match_attendees", { matchId: PARTIDO, clubId: HALCONES, labels: [] });
  check(asistentesPrensa.data?.report === null, "replace_match_attendees: prensa -> null", asistentesPrensa);

  // ---------- Finanzas ----------
  const mov = await rpc("tesorero", "add_transaction", { id: "prueba-mov-1", clubId: HALCONES, type: "GASTO", description: "Balones", category: "Equipo/Balones", amount: 350.5, txnDate: "2026-10-01" });
  check(mov.data?.transaction?.id === "prueba-mov-1" && mov.data.transaction.amount === 350.5, "add_transaction: tesorero", mov);
  const movNegativo = await rpc("tesorero", "add_transaction", { id: "prueba-mov-2", clubId: HALCONES, type: "GASTO", description: "x", category: "x", amount: -1, txnDate: "2026-10-01" });
  check(movNegativo.data?.transaction === null, "add_transaction: importe negativo -> null", movNegativo);
  const movDt = await rpc("dt", "add_transaction", { id: "prueba-mov-3", clubId: HALCONES, type: "INGRESO", description: "x", category: "x", amount: 1, txnDate: "2026-10-01" });
  check(movDt.data?.transaction === null, "add_transaction: DT no puede", movDt);
  const movPrensa = await rpc("prensa", "delete_transaction", { id: "prueba-mov-1", clubId: HALCONES });
  check(movPrensa.data?.deleted === null, "delete_transaction: prensa -> null", movPrensa);
  const movBorrado = await rpc("presidente", "delete_transaction", { id: "prueba-mov-1", clubId: HALCONES });
  check(movBorrado.data?.deleted === 1, "delete_transaction: presidente", movBorrado);

  const meta = await rpc("tesorero", "save_financial_goal", { id: "prueba-meta-1", clubId: HALCONES, title: "Viaje", amount: 5000, quotaPerPlayer: 250 });
  check(meta.data?.goal?.id === "prueba-meta-1", "save_financial_goal: tesorero", meta);
  const meta2 = await rpc("presidente", "save_financial_goal", { id: "prueba-meta-1", clubId: HALCONES, title: "Viaje largo", amount: 6000, quotaPerPlayer: null });
  check(meta2.data?.goal?.id === "prueba-meta-1" && (await count(`SELECT count(*)::int AS n FROM financial_goals WHERE id = 'prueba-meta-1' AND title = 'Viaje largo' AND quota_per_player IS NULL AND status = 'ACTIVE'`)) === 1, "save_financial_goal: upsert");
  const metaNegativa = await rpc("tesorero", "save_financial_goal", { id: "prueba-meta-2", clubId: HALCONES, title: "x", amount: -5 });
  check(metaNegativa.data?.goal === null, "save_financial_goal: importe negativo -> null", metaNegativa);
  const metaDt = await rpc("dt", "save_financial_goal", { id: "prueba-meta-3", clubId: HALCONES, title: "x", amount: 5 });
  check(metaDt.data?.goal === null, "save_financial_goal: DT -> null", metaDt);
  const aporte = await rpc("tesorero", "set_goal_contribution", { goalId: META, playerId: P01, amount: 450 });
  check(aporte.data?.contribution?.goal_id === META && aporte.data.contribution.player_id === P01 && aporte.data.contribution.amount === 450, "set_goal_contribution: tesorero (upsert)", aporte);
  const aporteNuevo = await rpc("presidente", "set_goal_contribution", { goalId: META, playerId: "dummy-club-halcones-p16", amount: 0 });
  check(aporteNuevo.data?.contribution?.amount === 0, "set_goal_contribution: importe 0 permitido", aporteNuevo);
  const aporteNegativo = await rpc("tesorero", "set_goal_contribution", { goalId: META, playerId: P01, amount: -1 });
  check(aporteNegativo.data?.contribution === null, "set_goal_contribution: negativo -> null", aporteNegativo);
  const aporteAjeno = await rpc("dt", "set_goal_contribution", { goalId: META, playerId: P01, amount: 1 });
  check(aporteAjeno.data?.contribution === null, "set_goal_contribution: DT -> null", aporteAjeno);
  const aporteBahia = await rpc("presidente", "set_goal_contribution", { goalId: "dummy-club-bahia-meta-uniformes", playerId: "dummy-club-bahia-p01", amount: 1 });
  check(aporteBahia.data?.contribution === null, "set_goal_contribution: meta de otro club (club tomado de la meta) -> null", aporteBahia);
  const estado = await rpc("tesorero", "set_financial_goal_status", { id: "prueba-meta-1", clubId: HALCONES, status: "COMPLETED" });
  check(estado.data?.goal?.id === "prueba-meta-1" && (await count(`SELECT count(*)::int AS n FROM financial_goals WHERE id = 'prueba-meta-1' AND status = 'COMPLETED'`)) === 1, "set_financial_goal_status", estado);
  const estadoPrensa = await rpc("prensa", "set_financial_goal_status", { id: "prueba-meta-1", clubId: HALCONES, status: "ACTIVE" });
  check(estadoPrensa.data?.goal === null, "set_financial_goal_status: prensa -> null", estadoPrensa);
  await rpc("tesorero", "set_goal_contribution", { goalId: "prueba-meta-1", playerId: P01, amount: 10 });
  const metaBorradaDt = await rpc("dt", "delete_financial_goal", { id: "prueba-meta-1", clubId: HALCONES });
  check(metaBorradaDt.data?.deleted === null, "delete_financial_goal: DT -> null", metaBorradaDt);
  const metaBorrada = await rpc("tesorero", "delete_financial_goal", { id: "prueba-meta-1", clubId: HALCONES });
  check(metaBorrada.data?.deleted === 1 && (await count(`SELECT count(*)::int AS n FROM goal_contributions WHERE goal_id = 'prueba-meta-1'`)) === 0, "delete_financial_goal: borra meta y aportaciones", metaBorrada);

  // ---------- Inventario ----------
  const articulo = await rpc("tesorero", "save_inventory_item", { id: "prueba-inv-1", clubId: HALCONES, name: "Artículo de prueba", quantity: 20, condition: "BUENO" });
  check(articulo.data?.item?.id === "prueba-inv-1" && articulo.data.item.quantity === 20, "save_inventory_item: tesorero", articulo);
  const articuloDt = await rpc("dt", "save_inventory_item", { id: "prueba-inv-1", clubId: HALCONES, name: "Artículo de prueba", quantity: 18, condition: "BUENO" });
  check(articuloDt.data?.item?.quantity === 18, "save_inventory_item: DT actualiza", articuloDt);
  const articuloNegativo = await rpc("presidente", "save_inventory_item", { id: "prueba-inv-2", clubId: HALCONES, name: "x", quantity: -1, condition: "MALO" });
  check(articuloNegativo.data?.item === null, "save_inventory_item: cantidad negativa -> null", articuloNegativo);
  const articuloPrensa = await rpc("prensa", "save_inventory_item", { id: "prueba-inv-3", clubId: HALCONES, name: "x", quantity: 1, condition: "MALO" });
  check(articuloPrensa.data?.item === null, "save_inventory_item: prensa -> null", articuloPrensa);
  const articuloBorradoPrensa = await rpc("prensa", "delete_inventory_item", { id: "prueba-inv-1", clubId: HALCONES });
  check(articuloBorradoPrensa.data?.deleted === null, "delete_inventory_item: prensa -> null", articuloBorradoPrensa);
  const articuloBorrado = await rpc("dt", "delete_inventory_item", { id: "prueba-inv-1", clubId: HALCONES });
  check(articuloBorrado.data?.deleted === 1, "delete_inventory_item: DT", articuloBorrado);

  // ---------- Galería ----------
  const foto = await rpc("dt", "save_gallery_photo", { albumId: "prueba-album-1", clubId: HALCONES, albumName: "Álbum de prueba", photoId: "prueba-foto-1", url: "https://a/f1.jpg", caption: "Primera", takenAt: "2026-10-01T12:00:00.000Z" });
  check(foto.data?.photo?.id === "prueba-foto-1" && foto.data.album === 1, "save_gallery_photo: crea álbum y foto", foto);
  const foto2 = await rpc("presidente", "save_gallery_photo", { albumId: "otro-id-ignorado", clubId: HALCONES, albumName: "Álbum de prueba", photoId: "prueba-foto-2", url: "https://a/f2.jpg", caption: "", takenAt: "2026-10-02T12:00:00.000Z" });
  check(foto2.data?.photo?.id === "prueba-foto-2" && (await count(`SELECT count(*)::int AS n FROM gallery_photos WHERE album_id = 'prueba-album-1' AND sort_order = 1`)) === 1, "save_gallery_photo: reutiliza el álbum por nombre y ordena al final", foto2);
  const fotoPrensa = await rpc("prensa", "save_gallery_photo", { albumId: "prueba-album-2", clubId: HALCONES, albumName: "No", photoId: "prueba-foto-3", url: "https://a/x.jpg", caption: "", takenAt: "2026-10-02T12:00:00.000Z" });
  check(fotoPrensa.data?.photo === null && fotoPrensa.data.album === null, "save_gallery_photo: prensa -> null", fotoPrensa);
  const fotoBahia = await rpc("presidente", "save_gallery_photo", { albumId: "prueba-album-3", clubId: BAHIA, albumName: "No", photoId: "prueba-foto-4", url: "https://a/x.jpg", caption: "", takenAt: "2026-10-02T12:00:00.000Z" });
  check(fotoBahia.data?.photo === null && (await count(`SELECT count(*)::int AS n FROM albums WHERE id = 'prueba-album-3'`)) === 0, "save_gallery_photo: otro club -> null, sin álbum", fotoBahia);

  const antes = (await db.query(`SELECT id, sort_order FROM gallery_photos WHERE id IN ('${FOTO1}', '${FOTO2}') ORDER BY id`)).rows;
  const swap = await rpc("dt", "swap_gallery_photos", { clubId: HALCONES, firstId: FOTO1, secondId: FOTO2 });
  const despues = (await db.query(`SELECT id, sort_order FROM gallery_photos WHERE id IN ('${FOTO1}', '${FOTO2}') ORDER BY id`)).rows;
  check(swap.data?.swapped === 2 && antes[0].sort_order === despues[1].sort_order && antes[1].sort_order === despues[0].sort_order, "swap_gallery_photos: intercambia orden", { swap, antes, despues });
  const swapPrensa = await rpc("prensa", "swap_gallery_photos", { clubId: HALCONES, firstId: FOTO1, secondId: FOTO2 });
  check(swapPrensa.data?.swapped === null, "swap_gallery_photos: prensa -> null", swapPrensa);
  const swapBahia = await rpc("presidente", "swap_gallery_photos", { clubId: HALCONES, firstId: "dummy-club-bahia-album-general-1", secondId: "dummy-club-bahia-album-general-2" });
  check(swapBahia.data?.swapped === null, "swap_gallery_photos: fotos de otro club -> null", swapBahia);
  const portada = await rpc("presidente", "promote_gallery_photo", { clubId: HALCONES, photoId: FOTO2 });
  check(portada.data?.photo?.id === FOTO2 && (await count(`SELECT count(*)::int AS n FROM gallery_photos g WHERE g.id = '${FOTO2}' AND g.taken_at = (SELECT max(taken_at) FROM gallery_photos WHERE album_id = g.album_id)`)) === 1, "promote_gallery_photo: pasa a ser la más reciente", portada);
  const portadaUsuario = await rpc("usuario", "promote_gallery_photo", { clubId: HALCONES, photoId: FOTO2 });
  check(portadaUsuario.data?.photo === null, "promote_gallery_photo: sin rol -> null", portadaUsuario);
  const fotoBorradaPrensa = await rpc("prensa", "delete_gallery_photo", { clubId: HALCONES, photoId: "prueba-foto-1" });
  check(fotoBorradaPrensa.data?.deleted === null, "delete_gallery_photo: prensa -> null", fotoBorradaPrensa);
  const fotoBorrada = await rpc("dt", "delete_gallery_photo", { clubId: HALCONES, photoId: "prueba-foto-1" });
  check(fotoBorrada.data?.deleted === 1, "delete_gallery_photo: DT", fotoBorrada);
  const albumBorradoBahia = await rpc("presidente", "delete_gallery_album", { clubId: BAHIA, albumName: ALBUM });
  check(albumBorradoBahia.data?.deleted === null && (await count(`SELECT count(*)::int AS n FROM albums WHERE id = 'dummy-club-bahia-album-general'`)) === 1, "delete_gallery_album: otro club -> null", albumBorradoBahia);
  const albumBorrado = await rpc("presidente", "delete_gallery_album", { clubId: HALCONES, albumName: "Álbum de prueba" });
  check(albumBorrado.data?.deleted === 1 && (await count(`SELECT count(*)::int AS n FROM gallery_photos WHERE album_id = 'prueba-album-1'`)) === 0, "delete_gallery_album: borra álbum y fotos", albumBorrado);
  const albumInexistente = await rpc("presidente", "delete_gallery_album", { clubId: HALCONES, albumName: "No existe" });
  check(albumInexistente.data?.deleted === null, "delete_gallery_album: álbum inexistente -> null", albumInexistente);

  // ---------- Disponibilidad ----------
  const dispPrensa = await rpc("prensa", "clear_club_availability", { clubId: HALCONES });
  check(dispPrensa.data?.cleared === null && (await count(`SELECT count(*)::int AS n FROM club_availability_windows WHERE club_id = '${HALCONES}'`)) > 0, "clear_club_availability: prensa no borra", dispPrensa);
  const disp = await rpc("dt", "clear_club_availability", { clubId: HALCONES });
  check(disp.data?.cleared > 0 && (await count(`SELECT count(*)::int AS n FROM club_availability_windows WHERE club_id = '${HALCONES}'`)) === 0, "clear_club_availability: DT vacía", disp);
  const franjas = await rpc("dt", "insert_club_availability", { clubId: HALCONES, windows: [{ day: 2, start: "18:00", end: "20:00" }, { day: 9, start: "18:00", end: "20:00" }, { day: 3, start: "20:00", end: "18:00" }] });
  check(franjas.data?.window?.club_id === HALCONES && (await count(`SELECT count(*)::int AS n FROM club_availability_windows WHERE club_id = '${HALCONES}'`)) === 1, "insert_club_availability: solo franjas válidas (día 1-7, inicio < fin)", franjas);
  const franjasInvalidas = await rpc("dt", "insert_club_availability", { clubId: HALCONES, windows: [{ day: 0, start: "18:00", end: "20:00" }] });
  check(franjasInvalidas.data?.window === null, "insert_club_availability: todas inválidas -> null", franjasInvalidas);
  const franjasTesorero = await rpc("tesorero", "insert_club_availability", { clubId: HALCONES, windows: [{ day: 4, start: "18:00", end: "20:00" }] });
  check(franjasTesorero.data?.window === null, "insert_club_availability: tesorero -> null", franjasTesorero);

  // ---------- Portada y perfil ----------
  const portadaDt = await rpc("dt", "save_club_portada", { id: HALCONES, name: "Halcones FC", description: "x", location: "Guaymas, Sonora" });
  check(portadaDt.data?.club === null, "save_club_portada: DT -> null", portadaDt);
  const portadaPrensa = await rpc("prensa", "save_club_portada", { id: HALCONES, name: "Halcones FC Demo", description: "Club de prueba", location: "Guaymas, Sonora" });
  check(portadaPrensa.data?.club?.id === HALCONES && (await count(`SELECT count(*)::int AS n FROM clubs WHERE id = '${HALCONES}' AND description = 'Club de prueba' AND locality_id IS NOT NULL`)) === 1, "save_club_portada: prensa, conserva la localidad si coincide", portadaPrensa);
  const portadaOtra = await rpc("presidente", "save_club_portada", { id: HALCONES, name: "Halcones FC Demo", description: "Club de prueba", location: "Otra ciudad" });
  check(portadaOtra.data?.club?.id === HALCONES && (await count(`SELECT count(*)::int AS n FROM clubs WHERE id = '${HALCONES}' AND location = 'Otra ciudad' AND locality_id IS NULL`)) === 1, "save_club_portada: ubicación distinta desenlaza la localidad", portadaOtra);
  const heroesDt = await rpc("dt", "clear_club_heroes", { id: HALCONES });
  check(heroesDt.data?.cleared === null, "clear_club_heroes: DT -> null", heroesDt);
  const heroes = await rpc("prensa", "clear_club_heroes", { id: HALCONES });
  check(heroes.data?.cleared >= 1 && (await count(`SELECT count(*)::int AS n FROM club_hero_images WHERE club_id = '${HALCONES}'`)) === 0, "clear_club_heroes: prensa vacía", heroes);
  const heroesNuevos = await rpc("prensa", "insert_club_heroes", { id: HALCONES, urls: ["https://a/h1.jpg", "", "https://a/h2.jpg"] });
  check(heroesNuevos.data?.hero?.id === HALCONES && (await count(`SELECT count(*)::int AS n FROM club_hero_images WHERE club_id = '${HALCONES}' AND position = 2`)) === 1, "insert_club_heroes: conserva posiciones", heroesNuevos);
  const heroesVacios = await rpc("presidente", "insert_club_heroes", { id: HALCONES, urls: [] });
  check(heroesVacios.data?.hero === null, "insert_club_heroes: lista vacía -> null", heroesVacios);
  const heroesBahia = await rpc("prensa", "insert_club_heroes", { id: BAHIA, urls: ["https://a/h.jpg"] });
  check(heroesBahia.data?.hero === null, "insert_club_heroes: otro club -> null", heroesBahia);
  const perfilPrensa = await rpc("prensa", "save_club_profile", { id: HALCONES, name: "Halcones FC Demo", logoUrl: "", presidentPhone: "6221234567" });
  check(perfilPrensa.data?.club === null, "save_club_profile: prensa -> null (solo ADMIN)", perfilPrensa);
  const perfil = await rpc("presidente", "save_club_profile", { id: HALCONES, name: "Halcones FC Demo", logoUrl: "", presidentPhone: "6221234567" });
  check(perfil.data?.club?.id === HALCONES && (await count(`SELECT count(*)::int AS n FROM clubs WHERE id = '${HALCONES}' AND logo_url IS NULL AND president_phone = '6221234567'`)) === 1, "save_club_profile: presidente, logo vacío -> null", perfil);
  const perfilSuper = await rpc("admin", "save_club_profile", { id: BAHIA, name: "Deportivo Bahía Demo", logoUrl: "https://a/logo.png", presidentPhone: "6220000000" });
  check(perfilSuper.data?.club?.id === BAHIA, "save_club_profile: superadmin en cualquier club", perfilSuper);
  // El teléfono solo viaja a quien puede editarlo: presidente de ese club o superadmin
  const phoneFor = async (role) => (await rpc(role, "club_screen", { slug: "halcones-fc-demo" })).data?.clubs?.[0]?.presidentPhone;
  check((await phoneFor("presidente")) === "6221234567" && (await phoneFor("admin")) === "6221234567", "club_screen: presidente y superadmin reciben el teléfono");
  check((await phoneFor("dt")) === "" && (await phoneFor("anon")) === "", "club_screen: DT y anónimo reciben el teléfono vacío");

  // ---------- Validaciones de texto (las mismas reglas que textLimits.ts) ----------
  const jugadorBase = { id: "prueba-val-p", clubId: HALCONES, name: "  ana   maría lópez ", shirtNumber: "7", position: "Medio", isCoach: false, active: true, detail: { variant: "Extremo", birthDate: "2000-05-01" } };
  const jugadorOk = await rpc("dt", "save_player", jugadorBase);
  check(jugadorOk.data?.player?.name === "Ana María López", "save_player: normaliza espacios y pone Title Case", jugadorOk);
  for (const [motivo, cambio] of [
    ["etiqueta HTML en el nombre", { name: "<script>alert(1)</script>" }],
    ["comillas y ;-- en el nombre", { name: "Ana'; DROP TABLE players;--" }],
    ["nombre de 51 letras", { name: "a".repeat(51) }],
    ["dorsal 0", { shirtNumber: "0" }],
    ["dorsal 100", { shirtNumber: "100" }],
    ["dorsal no numérico", { shirtNumber: "abc" }],
    ["posición fuera de la lista", { position: "Libero" }],
    ["variante con números", { detail: { variant: "Extremo 2" } }],
    ["nacimiento futuro", { detail: { birthDate: enDias(5) } }],
    ["nacimiento antes de 1940", { detail: { birthDate: "1939-12-31" } }],
  ]) {
    const r = await rpc("dt", "save_player", { ...jugadorBase, id: "prueba-val-p2", ...cambio });
    check(r.data?.player === null, `save_player: ${motivo} -> null`, r);
  }
  const jugadorOtroClub = await rpc("admin", "save_player", { ...jugadorBase, clubId: BAHIA, name: "Robado" });
  check(jugadorOtroClub.data?.player === null && (await count(`SELECT count(*)::int AS n FROM club_players cp JOIN players pl ON pl.id = cp.player_id
    WHERE pl.id = 'prueba-val-p' AND cp.club_id = '${HALCONES}' AND pl.name = 'Ana María López'`)) === 1
    && (await count(`SELECT count(*)::int AS n FROM club_players WHERE player_id = 'prueba-val-p'`)) === 1, "save_player: el id de otro club no se pisa ni se le suma", jugadorOtroClub);

  const eventoBase = { id: "prueba-val-ev", clubId: HALCONES, eventType: "PARTIDO", matchType: "AMISTOSO", title: "Vs  Leones FC", eventDate: enDias(3), eventTime: "18:00", detail: { location: "Campo Norte", routine: [] } };
  const eventoOk = await rpc("dt", "save_club_event", eventoBase);
  check(eventoOk.data?.event?.title === "Vs Leones FC", "save_club_event: normaliza espacios", eventoOk);
  for (const [motivo, cambio] of [
    ["fecha pasada", { eventDate: enDias(-3) }],
    ["título con comillas", { title: 'Vs "Leones"' }],
    ["título de 31", { title: "a".repeat(31) }],
    ["lugar con <>", { detail: { location: "<b>Campo</b>" } }],
    ["hora inválida", { eventTime: "25:00" }],
  ]) {
    const r = await rpc("dt", "save_club_event", { ...eventoBase, id: "prueba-val-ev2", ...cambio });
    check(r.data?.event === null, `save_club_event: ${motivo} -> null`, r);
  }
  await db.query(`UPDATE club_events SET event_date = CURRENT_DATE - 10 WHERE id = 'prueba-val-ev'`);
  const pasada = (await db.query(`SELECT to_char(event_date, 'YYYY-MM-DD') AS d FROM club_events WHERE id = 'prueba-val-ev'`)).rows[0].d;
  const eventoPasado = await rpc("dt", "save_club_event", { ...eventoBase, eventDate: pasada, title: "Vs Leones" });
  check(eventoPasado.data?.event?.title === "Vs Leones", "save_club_event: editar un evento pasado sin cambiar la fecha sí se permite", eventoPasado);
  const eventoOtroClub = await rpc("admin", "save_club_event", { ...eventoBase, clubId: BAHIA, title: "Pisado" });
  check(eventoOtroClub.data?.event === null && (await count(`SELECT count(*)::int AS n FROM club_events WHERE id = 'prueba-val-ev' AND title = 'Vs Leones'`)) === 1, "save_club_event: el id de otro club no se pisa", eventoOtroClub);

  const movBase = { id: "prueba-val-mov", clubId: HALCONES, type: "INGRESO", description: "Cuota de  marzo, abril", category: "Cuotas", amount: 100, txnDate: "2026-10-01" };
  const movOk = await rpc("tesorero", "add_transaction", movBase);
  check(movOk.data?.transaction?.id === "prueba-val-mov" && (await count(`SELECT count(*)::int AS n FROM transactions WHERE id = 'prueba-val-mov' AND description = 'Cuota de marzo, abril'`)) === 1, "add_transaction: normaliza el concepto", movOk);
  for (const [motivo, cambio] of [
    ["concepto con punto", { description: "Cuota." }],
    ["dos comas seguidas", { description: "Cuota,,marzo" }],
    ["categoría de gasto en un ingreso", { category: "Canchas" }],
    ["categoría inventada", { category: "Material" }],
  ]) {
    const r = await rpc("tesorero", "add_transaction", { ...movBase, id: "prueba-val-mov2", ...cambio });
    check(r.data?.transaction === null, `add_transaction: ${motivo} -> null`, r);
  }

  const metaOk = await rpc("tesorero", "save_financial_goal", { id: "prueba-val-meta", clubId: HALCONES, title: "Uniformes 2027, torneo", amount: 5000, quotaPerPlayer: 200 });
  check(metaOk.data?.goal?.id === "prueba-val-meta", "save_financial_goal: título válido", metaOk);
  for (const [motivo, cambio] of [
    ["dos comas seguidas", { title: "Viaje,,torneo" }],
    ["signo de pesos", { title: "Meta $500" }],
    ["cuota negativa", { quotaPerPlayer: -5 }],
  ]) {
    const r = await rpc("tesorero", "save_financial_goal", { id: "prueba-val-meta2", clubId: HALCONES, title: "Viaje", amount: 100, quotaPerPlayer: null, ...cambio });
    check(r.data?.goal === null, `save_financial_goal: ${motivo} -> null`, r);
  }

  const invOk = await rpc("tesorero", "save_inventory_item", { id: "prueba-val-inv", clubId: HALCONES, name: "Balones  número 5", quantity: 3, condition: "BUENO" });
  check(invOk.data?.item?.name === "Balones número 5", "save_inventory_item: normaliza espacios", invOk);
  for (const [motivo, name] of [["nombre de 21", "a".repeat(21)], ["nombre con guion", "Conos-chicos"], ["nombre con <>", "<i>Conos</i>"]]) {
    const r = await rpc("tesorero", "save_inventory_item", { id: "prueba-val-inv2", clubId: HALCONES, name, quantity: 1, condition: "BUENO" });
    check(r.data?.item === null, `save_inventory_item: ${motivo} -> null`, r);
  }
  await db.query(`INSERT INTO inventory_items (id, club_id, name, quantity, condition) VALUES ('prueba-val-inv-viejo', '${HALCONES}', 'Petos (talla M) — viejos', 4, 'BUENO')`);
  const invViejo = await rpc("dt", "save_inventory_item", { id: "prueba-val-inv-viejo", clubId: HALCONES, name: "Petos (talla M) — viejos", quantity: 6, condition: "BUENO" });
  check(invViejo.data?.item?.quantity === 6, "save_inventory_item: un artículo de antes de la regla cambia de cantidad", invViejo);
  const invOtroClub = await rpc("admin", "save_inventory_item", { id: "prueba-val-inv", clubId: BAHIA, name: "Robado", quantity: 1, condition: "BUENO" });
  check(invOtroClub.data?.item === null && (await count(`SELECT count(*)::int AS n FROM inventory_items WHERE id = 'prueba-val-inv' AND club_id = '${HALCONES}' AND name = 'Balones número 5'`)) === 1, "save_inventory_item: el id de otro club no se pisa", invOtroClub);

  const fotoBase = { albumId: "prueba-val-album", clubId: HALCONES, albumName: "  entrenamiento   matutino 2026 ", photoId: "prueba-val-foto", url: "https://a/v.jpg", caption: "", takenAt: "2026-10-02T12:00:00.000Z" };
  const fotoOk = await rpc("dt", "save_gallery_photo", fotoBase);
  check(fotoOk.data?.photo?.id === "prueba-val-foto" && (await count(`SELECT count(*)::int AS n FROM albums WHERE club_id = '${HALCONES}' AND name = 'Entrenamiento matutino 2026'`)) === 1, "save_gallery_photo: álbum nuevo normalizado con mayúscula inicial", fotoOk);
  for (const [motivo, albumName] of [["nombre con punto", "Fiesta."], ["nombre de 31", "a".repeat(31)], ["nombre nuevo con emoji", "📷 Fotos"]]) {
    const r = await rpc("dt", "save_gallery_photo", { ...fotoBase, albumId: "prueba-val-album2", photoId: "prueba-val-foto2", albumName });
    check(r.data?.photo === null, `save_gallery_photo: ${motivo} -> null`, r);
  }
  const fotoVieja = await rpc("dt", "save_gallery_photo", { ...fotoBase, albumId: "x", photoId: "prueba-val-foto3", albumName: ALBUM });
  check(fotoVieja.data?.photo?.id === "prueba-val-foto3", "save_gallery_photo: un álbum que ya existe acepta fotos aunque su nombre sea antiguo", fotoVieja);

  const portadaBase = { id: HALCONES, name: "halcones FC", description: "Desde 1998, el orgullo del barrio!", location: "guaymas, Sonora" };
  const portadaOk = await rpc("prensa", "save_club_portada", portadaBase);
  check(portadaOk.data?.club?.id === HALCONES && (await count(`SELECT count(*)::int AS n FROM clubs WHERE id = '${HALCONES}' AND name = 'Halcones FC' AND location = 'Guaymas, Sonora'`)) === 1, "save_club_portada: mayúscula inicial en nombre y barrio", portadaOk);
  for (const [motivo, cambio] of [
    ["nombre con guion", { name: "Halcones-FC" }],
    ["nombre de 31", { name: "a".repeat(31) }],
    ["barrio con dos comas", { location: "Centro, Guaymas, Sonora" }],
    ["barrio con punto", { location: "Col. Centro" }],
    ["lema de 101", { description: "a".repeat(101) }],
    ["lema con salto de línea", { description: "Hola\nmundo" }],
  ]) {
    const r = await rpc("prensa", "save_club_portada", { ...portadaBase, ...cambio });
    check(r.data?.club === null, `save_club_portada: ${motivo} -> null`, r);
  }

  // ---------- Borrado lógico de jugadores (0008_jugadores_borrado_logico.sql) ----------
  const BAJA = "prueba-baja-1";
  const alta = await rpc("dt", "save_player", { id: BAJA, clubId: HALCONES, name: "Jugador Historico", shirtNumber: "45", position: "Medio", detail: {} });
  check(alta.data?.player?.id === BAJA, "borrado lógico: jugador nuevo", alta);
  const evBaja = await rpc("dt", "save_club_event", {
    id: "prueba-baja-ev", clubId: HALCONES, eventType: "PARTIDO", matchType: "AMISTOSO", title: "Amistoso de bajas",
    eventDate: enDias(30), eventTime: "18:00", detail: { location: "Campo Prueba", routine: [] },
  });
  check(evBaja.data?.event?.id === "prueba-baja-ev", "borrado lógico: evento de prueba", evBaja);
  const statsBaja = {
    id: "prueba-baja-ev", clubId: HALCONES,
    stats: { goals: [{ scorer: BAJA, assist: P01, isPenalty: false, isOwnGoal: false }], yellowCards: [BAJA], redCards: [],
      goalkeepers: [{ id: BAJA, conceded: 0, saves: 3 }] },
  };
  await rpc("dt", "replace_club_event_attendees", { id: "prueba-baja-ev", clubId: HALCONES, labels: [P01, BAJA] });
  await rpc("dt", "replace_club_event_stats", statsBaja);
  await rpc("dt", "replace_match_attendees", { matchId: PARTIDO, clubId: HALCONES, labels: [P01, P03, BAJA] });
  await rpc("tesorero", "save_financial_goal", { id: "prueba-baja-meta", clubId: HALCONES, title: "Meta de bajas", amount: 1000, quotaPerPlayer: 100 });
  const aporteBaja = await rpc("tesorero", "set_goal_contribution", { goalId: "prueba-baja-meta", playerId: BAJA, amount: 120 });
  check(aporteBaja.data?.contribution?.amount === 120, "borrado lógico: aportación del jugador", aporteBaja);
  const historial = async () => ({
    asistencia: await count(`SELECT count(*)::int AS n FROM club_event_attendees WHERE event_id = 'prueba-baja-ev' AND player_id = '${BAJA}'`),
    gol: await count(`SELECT count(*)::int AS n FROM club_event_goals WHERE event_id = 'prueba-baja-ev' AND scorer_id = '${BAJA}'`),
    tarjeta: await count(`SELECT count(*)::int AS n FROM club_event_cards WHERE event_id = 'prueba-baja-ev' AND player_id = '${BAJA}'`),
    portero: await count(`SELECT count(*)::int AS n FROM club_event_goalkeepers WHERE event_id = 'prueba-baja-ev' AND player_id = '${BAJA}'`),
    mvp: await count(`SELECT count(*)::int AS n FROM club_event_mvps WHERE event_id = 'prueba-baja-ev' AND player_id = '${BAJA}'`),
    partido: await count(`SELECT count(*)::int AS n FROM match_attendees WHERE match_id = '${PARTIDO}' AND player_id = '${BAJA}'`),
    aporte: await count(`SELECT count(*)::int AS n FROM goal_contributions WHERE goal_id = 'prueba-baja-meta' AND player_id = '${BAJA}' AND amount = 120`),
  });
  const histAntes = await historial();
  check(Object.values(histAntes).every((n) => n === 1), "borrado lógico: historial de prueba completo antes de eliminar", histAntes);
  const eliminar = await rpc("dt", "delete_player", { id: BAJA, clubId: HALCONES });
  check(eliminar.data?.deleted === 1, "borrado lógico: delete_player", eliminar);
  const histDespues = await historial();
  check(JSON.stringify(histDespues) === JSON.stringify(histAntes), "eliminar al jugador conserva asistencia, goles, tarjetas, portería, MVP y aportaciones", histDespues);
  await rpc("dt", "replace_club_event_attendees", { id: "prueba-baja-ev", clubId: HALCONES, labels: [P01, BAJA] });
  await rpc("dt", "replace_club_event_stats", statsBaja);
  await rpc("dt", "replace_match_attendees", { matchId: PARTIDO, clubId: HALCONES, labels: [P01, P03, BAJA] });
  const histReguardado = await historial();
  check(JSON.stringify(histReguardado) === JSON.stringify(histAntes), "volver a guardar el evento y el partido conserva al jugador eliminado", histReguardado);
  const aporteEliminado = await rpc("tesorero", "set_goal_contribution", { goalId: "prueba-baja-meta", playerId: BAJA, amount: 500 });
  check(aporteEliminado.data?.contribution === null && (await historial()).aporte === 1, "set_goal_contribution: un eliminado no recibe aportaciones nuevas", aporteEliminado);
  const aporteAjenoBaja = await rpc("tesorero", "set_goal_contribution", { goalId: "prueba-baja-meta", playerId: "dummy-club-bahia-p01", amount: 5 });
  check(aporteAjenoBaja.data?.contribution === null, "set_goal_contribution: jugador de otro club -> null", aporteAjenoBaja);
  const slug = (await db.query("SELECT slug FROM clubs WHERE id = $1", [HALCONES])).rows[0].slug;
  const pantalla = await rpc("anon", "club_screen", { slug });
  const plantilla = pantalla.data?.clubs?.[0]?.players_on_club ?? [];
  const jugEliminado = plantilla.find((p) => p.id === BAJA);
  check(typeof jugEliminado?.deletedAt === "string" && jugEliminado.active === false && plantilla.find((p) => p.id === P01)?.deletedAt === null,
    "club_screen: trae al eliminado con deletedAt (para su historial) y a los demás con null", jugEliminado ?? pantalla.error);
  let chk = null;
  try {
    await db.query(`UPDATE club_players SET active = true WHERE player_id = '${BAJA}'`);
  } catch (err) {
    chk = err.code;
  }
  check(chk === "23514", "un eliminado no puede quedar activo sin restaurarlo (CHECK)", chk);
  // Restaurar desde la búsqueda (add_existing_player, 0010): vuelve con su historial, con el dorsal nuevo
  const busqueda = await rpc("dt", "search_players", { clubId: HALCONES, q: "historico" });
  const hallado = busqueda.data?.players?.find((p) => p.id === BAJA);
  check(hallado?.inThisClub === "DELETED" && hallado.clubs_on_player.length === 0, "search_players: el eliminado del club sale marcado para restaurarlo", busqueda.data ?? busqueda.error);
  const restaurar = await rpc("dt", "add_existing_player", { clubId: HALCONES, playerId: BAJA, shirtNumber: "46", position: "Medio", variant: "" });
  check(restaurar.data?.player?.id === BAJA, "add_existing_player: restaura al eliminado", restaurar);
  const restaurado = (await rpc("anon", "club_screen", { slug })).data?.clubs?.[0]?.players_on_club?.find((p) => p.id === BAJA);
  check(restaurado?.deletedAt === null && restaurado.active === true && restaurado.shirtNumber === "46" && (await historial()).gol === 1,
    "restaurar lo devuelve con todo su historial", restaurado);
}
