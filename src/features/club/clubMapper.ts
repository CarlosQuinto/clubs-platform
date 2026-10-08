import { type ClubScreenData, type MemberRole } from "../../infrastructure/dataconnect";
import type { Category, Match, MatchSide, Season, TimeWindow, Tournament } from "../../shared/types";
import type { Role } from "../../domains/auth/roles";
import { matchMvp, startedSeasons } from "../../domains/competition/stats";

export interface ClubInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  location?: string;
  localityId?: string;
  heroImages: string[];
  defaultLineups: Record<string, any>;
  logoUrl?: string;
  presidentPhone?: string;
  active?: boolean;
  /** Motivo de la desactivación; vacío mientras el club está activo. */
  disabledReason?: string;
  createdAt?: any;
}

/** Fila de una pestaña del club (jugadores, agenda, finanzas…) con la forma que pintan sus componentes. */
export interface ClubRecord {
  id: string;
  [key: string]: any;
}

const ROLE_FROM_SQL: Record<MemberRole, Role> = {
  ADMIN: "admin",
  DT: "dt",
  PRENSA: "prensa",
  TESORERO: "tesorero",
};

export interface ClubScreenModel {
  exists: boolean;
  clubInfo: ClubInfo | null;
  role: Role | null;
  players: ClubRecord[];
  events: ClubRecord[];
  transactions: ClubRecord[];
  inventory: ClubRecord[];
  gallery: ClubRecord[];
  goals: ClubRecord[];
  windows: TimeWindow[];
  seasons: Season[];
  categories: Category[];
  tournaments: Tournament[];
  matches: Match[];
  clubNames: Record<string, string>;
  seasonName: Record<string, string>;
  categoryName: Record<string, string>;
  tournamentsById: Record<string, Tournament>;
}

function eventTypeLabel(value: string) {
  return value === "ENTRENAMIENTO" ? "Entrenamiento" : "Partido";
}

function txnType(value: string) {
  return value === "INGRESO" ? "ingreso" : "gasto";
}

function goalStatus(value: string) {
  return value === "COMPLETED" ? "completed" : "active";
}

function conditionLabel(value: string) {
  if (value === "MALO") return "Malo";
  if (value === "PERDIDO") return "Perdido";
  return "Bueno";
}

function sideBucket(sides: Record<string, MatchSide>, clubId: string) {
  const current = sides[clubId] || {};
  sides[clubId] = current;
  return current;
}

function footballSides(value: string): 7 | 9 | 11 {
  if (value === "FUT_7") return 7;
  if (value === "FUT_9") return 9;
  return 11;
}

function podiumOf(rows: { place: number; club: { id: string } }[]) {
  const podium: Record<string, string> = {};
  for (const row of rows) podium[String(row.place)] = row.club.id;
  return podium;
}

export function toClubScreen(data: ClubScreenData, userId: string | null): ClubScreenModel {
  const club = data.clubs[0];
  // Las temporadas futuras no se ofrecen en los filtros de la página
  const seasons: Season[] = startedSeasons(data.seasons).map((season) => ({
    id: season.id,
    name: season.name,
    active: season.active,
    startDate: season.startDate || undefined,
  }));
  const categories: Category[] = data.categories.map((category) => ({
    id: category.id,
    name: category.name,
    order: category.sortOrder,
  }));
  const tournaments: Tournament[] = data.tournaments.map((tournament) => ({
    id: tournament.id,
    name: tournament.name,
    seasonId: tournament.season.id,
    categoryId: tournament.category.id,
    clubIds: [],
    status:
      tournament.status === "FINISHED"
        ? "finished"
        : tournament.status === "UPCOMING"
          ? "upcoming"
          : "active",
    legs: tournament.legs === 1 ? 1 : 2,
    footballType: footballSides(tournament.footballType),
    durationMinutes: 90,
    podium: podiumOf(tournament.tournamentPodiums_on_tournament),
  }));
  const matches: Match[] = data.matches.map((match) => {
    const sides: Record<string, MatchSide> = {};
    for (const report of match.matchClubReports_on_match) {
      const side = sideBucket(sides, report.club.id);
      side.lineup = report.lineup;
      side.mvp = report.mvp?.id || "";
    }
    for (const row of match.matchAttendees_on_match) {
      const side = sideBucket(sides, row.club.id);
      side.attendees = [...(side.attendees || []), row.player.id];
    }
    for (const goal of match.matchGoals_on_match) {
      const side = sideBucket(sides, goal.club.id);
      side.stats = [
        ...(side.stats || []),
        {
          scorer: goal.scorer?.id || "",
          assist: goal.assist?.id || "",
          isPenalty: goal.isPenalty,
          isOwnGoal: goal.isOwnGoal,
        },
      ];
    }
    for (const card of match.matchCards_on_match) {
      const side = sideBucket(sides, card.club.id);
      const playerId = card.player?.id || "";
      if (!playerId) continue;
      if (card.color === "RED") side.redCards = [...(side.redCards || []), playerId];
      else side.yellowCards = [...(side.yellowCards || []), playerId];
    }
    // Sin MVP nombrado por el club, el de más goles y asistencias (misma regla que la ficha del partido)
    const mvpGoals = match.matchGoals_on_match.map((goal) => ({
      clubId: goal.club.id,
      scorerId: goal.scorer?.id || "",
      assistId: goal.assist?.id || "",
      isOwnGoal: goal.isOwnGoal,
    }));
    for (const clubId of [match.homeClub.id, match.awayClub.id]) {
      const side = sideBucket(sides, clubId);
      if (!side.mvp) side.mvp = matchMvp(mvpGoals, clubId);
    }
    return {
      id: match.id,
      tournamentId: match.tournament.id,
      seasonId: match.tournament.season.id,
      categoryId: match.tournament.category.id,
      round: match.roundLabel,
      homeClubId: match.homeClub.id,
      awayClubId: match.awayClub.id,
      clubIds: [match.homeClub.id, match.awayClub.id],
      status:
        match.status === "PLAYED"
          ? "played"
          : match.status === "SCHEDULED"
            ? "scheduled"
            : "unscheduled",
      date: match.matchDate || undefined,
      time: match.startTime || undefined,
      venue: match.venue,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      walkover: match.walkover,
      noShow: match.noShow ?? null,
      sides,
    };
  });
  const clubNames: Record<string, string> = {};
  for (const match of data.matches) {
    clubNames[match.homeClub.id] = match.homeClub.name;
    clubNames[match.awayClub.id] = match.awayClub.name;
  }
  if (!club) {
    return {
      exists: false,
      clubInfo: null,
      role: null,
      players: [],
      events: [],
      transactions: [],
      inventory: [],
      gallery: [],
      windows: [],
      goals: [],
      seasons,
      categories,
      tournaments,
      matches,
      clubNames,
      seasonName: Object.fromEntries(seasons.map((season) => [season.id, season.name])),
      categoryName: Object.fromEntries(categories.map((category) => [category.id, category.name])),
      tournamentsById: Object.fromEntries(tournaments.map((tournament) => [tournament.id, tournament])),
    };
  }
  clubNames[club.id] = club.name;
  const member = club.clubMembers_on_club.find((item) => item.user.id === userId);
  return {
    exists: true,
    role: member ? ROLE_FROM_SQL[member.role] : null,
    clubInfo: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      location: club.locality?.name || club.location,
      localityId: club.locality?.id,
      heroImages: club.clubHeroImages_on_club.map((image) => image.url),
      defaultLineups: Object.fromEntries(
        club.clubDefaultLineups_on_club.map((row) => [row.mode, row.positions || { formation: row.formation }]),
      ),
      logoUrl: club.logoUrl || "",
      presidentPhone: club.presidentPhone,
      active: club.active,
      disabledReason: club.disabledReason || "",
    },
    players: club.players_on_club.map((player) => ({
      ...player,
      number: player.shirtNumber,
    })),
    events: club.clubEvents_on_club.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      location: event.location,
      routine: event.routine,
      lineup: event.lineup,
      scoreOurs: event.scoreOurs,
      scoreTheirs: event.scoreTheirs,
      penaltiesOurs: event.penaltiesOurs,
      penaltiesTheirs: event.penaltiesTheirs,
      eventType: eventTypeLabel(event.eventType),
      matchType: event.matchType === "AMISTOSO" ? "Amistoso" : event.matchType || "",
      mvp: event.mvp?.id || "",
      attendees: event.clubEventAttendees_on_event.map((row) => row.player?.id || row.rawLabel),
      photoUrls: event.clubEventPhotos_on_event.map((photo) => photo.url),
      photoUrl: event.clubEventPhotos_on_event[0]?.url || null,
      stats: event.clubEventGoals_on_event.map((goal) => ({
        scorer: goal.scorer?.id || "",
        assist: goal.assist?.id || "",
        isPenalty: goal.isPenalty,
        isOwnGoal: goal.isOwnGoal,
      })),
      yellowCards: event.clubEventCards_on_event
        .filter((card) => card.color === "YELLOW" && card.player?.id)
        .map((card) => card.player!.id),
      redCards: event.clubEventCards_on_event
        .filter((card) => card.color === "RED" && card.player?.id)
        .map((card) => card.player!.id),
      goalkeepers: event.clubEventGoalkeepers_on_event.map((keeper) => ({
        id: keeper.player.id,
        conceded: keeper.conceded,
        saves: keeper.saves,
      })),
    })),
    transactions: club.transactions_on_club.map((txn) => ({
      id: txn.id,
      type: txnType(txn.type),
      description: txn.description,
      category: txn.category,
      amount: txn.amount,
      date: txn.txnDate,
      playerId: txn.player?.id,
    })),
    inventory: club.inventoryItems_on_club.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      condition: conditionLabel(item.condition),
    })),
    gallery: club.albums_on_club.flatMap((album) =>
      album.galleryPhotos_on_album.map((photo) => ({
        id: photo.id,
        albumId: album.id,
        album: album.name,
        albumName: album.name,
        url: photo.url,
        caption: photo.caption,
        order: photo.sortOrder,
        timestamp: photo.takenAt,
      })),
    ),
    goals: club.financialGoals_on_club.map((goal) => ({
      id: goal.id,
      title: goal.title,
      amount: goal.amount,
      quotaPerPlayer: goal.quotaPerPlayer,
      status: goalStatus(goal.status),
      createdAt: goal.createdAt || "",
      contributions: Object.fromEntries(
        goal.goalContributions_on_goal.map((row) => [row.player.id, row.amount]),
      ),
    })),
    windows: club.clubAvailabilityWindows_on_club.flatMap((window) => {
      if (window.weekday < 1 || window.weekday > 7 || window.startTime >= window.endTime) return [];
      return [{ day: window.weekday as TimeWindow["day"], start: window.startTime, end: window.endTime }];
    }),
    seasons,
    categories,
    tournaments,
    matches,
    clubNames,
    seasonName: Object.fromEntries(seasons.map((season) => [season.id, season.name])),
    categoryName: Object.fromEntries(categories.map((category) => [category.id, category.name])),
    tournamentsById: Object.fromEntries(tournaments.map((tournament) => [tournament.id, tournament])),
  };
}
