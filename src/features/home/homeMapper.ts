import {
  FootballType,
  type HomePageData,
  type LiveMatchesData,
  TournamentStatus,
} from "../../infrastructure/dataconnect";
import { safeAdHref, safeAdImageUrl } from "../../domains/platform/ads";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../../domains/clubs/clubDefaults";
import { tournamentPhase } from "../../domains/competition/tournamentPhase";
import { liveMatchPhase, liveMatchWindow } from "../../domains/matches/liveMatchPhase";
import { whatsappUrl } from "../../domains/platform/social";
import { formatFriendlyDate, formatFriendlyTime } from "../../shared/helpers";
import { matchPath } from "../../shared/paths";
import { asLiveMargin, asMatchDuration } from "../../shared/types";
import { formatCalendarDate } from "../tournament/tournamentMapper";
import type { UpcomingMatchView } from "../matches/matchesViewState";
import type {
  HomeAdView,
  HomePageModel,
  HomeTournamentCard,
  LiveMatchView,
} from "./homeViewState";

const MATCH_LIMIT = 12;
const TONE_COUNT = 4;
const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const TIME_RE = /^\d{2}:\d{2}$/;
const LIVE_SOON_MS = 2 * 60_000;
const LIVE = new Set<TournamentStatus>([TournamentStatus.ACTIVE, TournamentStatus.UPCOMING]);

const FOOTBALL_LABEL: Record<FootballType, string> = {
  [FootballType.FUT_7]: "Fútbol 7",
  [FootballType.FUT_9]: "Fútbol 9",
  [FootballType.FUT_11]: "Fútbol 11",
};

const JOIN_TEXT =
  "Hola, me gustaría participar con mi equipo o con un equipo en el torneo";

type TournamentRow = HomePageData["tournaments"][number];

function clockParts(now: Date) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { today, time };
}

function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month: MONTHS[month - 1] || "", year };
}

function clubCount(rows: { _count: number }[]): number {
  if (rows.length === 0) return 0;
  const count = rows[0]?._count;
  return typeof count === "number" && Number.isFinite(count) ? count : rows.length;
}

function phaseOf(tournament: TournamentRow, today: string) {
  return tournamentPhase(
    tournament.status,
    tournament.startDate || tournament.season.startDate,
    today,
  );
}

function toTournamentCard(
  tournament: TournamentRow,
  joinBase: string,
  today: string,
): HomeTournamentCard {
  const clubs = clubCount(tournament.tournamentClubs_on_tournament);
  const clubLabel = clubs === 1 ? "1 club" : `${clubs} clubes`;
  const begins = formatCalendarDate(tournament.startDate || tournament.season.startDate);
  const upcoming = phaseOf(tournament, today) === "upcoming";
  const joinHref =
    tournament.status === TournamentStatus.FINISHED || !joinBase
      ? null
      : whatsappUrl(
          joinBase,
          `${JOIN_TEXT} ${tournament.name}. ¿Me podría dar más información? Gracias.`,
        ) || null;
  return {
    id: tournament.id,
    href: `/torneos/${tournament.id}`,
    name: tournament.name,
    playedMatches: clubCount(tournament.matches_on_tournament),
    categoryName: tournament.category.name,
    toneIndex: (Math.max(1, tournament.category.sortOrder) - 1) % TONE_COUNT,
    meta: [tournament.season.name, FOOTBALL_LABEL[tournament.footballType], clubLabel].join(" · "),
    startLabel: upcoming && begins ? `Inicia ${begins}` : null,
    joinHref,
  };
}

function toMatch(
  match: HomePageData["matches"][number],
  today: string,
  time: string,
): UpcomingMatchView | null {
  if (!match.matchDate || !match.startTime || !TIME_RE.test(match.startTime)) return null;
  if (!LIVE.has(match.tournament.status)) return null;
  if (match.matchDate < today) return null;
  if (match.matchDate === today && match.startTime < time) return null;
  const date = dateParts(match.matchDate);
  if (!date) return null;
  const venue = match.venue.trim();
  return {
    id: match.id,
    href: matchPath(match.id),
    isoDate: match.matchDate,
    day: date.day,
    month: date.month,
    year: date.year,
    dateLabel: formatFriendlyDate(match.matchDate),
    timeLabel: formatFriendlyTime(match.startTime),
    venue: venue || null,
    homeName: match.homeClub.name,
    awayName: match.awayClub.name,
    homeLogo: match.homeClub.logoUrl?.trim() || null,
    awayLogo: match.awayClub.logoUrl?.trim() || null,
    subtitle: [match.tournament.category.name, match.tournament.name].filter(Boolean).join(" · "),
    courtId: null,
  };
}

function toAds(rows: HomePageData["adPlacements"], today: string): HomeAdView[] {
  return rows
    .flatMap((row) => {
      const ad = row.ad;
      if (!ad || ad.status !== "EN_CURSO" || !ad.imageUrl) return [];
      if (ad.startsOn.slice(0, 10) > today || today > ad.endsOn.slice(0, 10)) return [];
      const imageUrl = safeAdImageUrl(ad.imageUrl);
      if (!imageUrl) return [];
      return [
        {
          brand: ad.brand,
          imageUrl,
          href: safeAdHref(ad.href) || null,
          order: ad.sortOrder,
        },
      ];
    })
    .sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand, "es"))
    .map(({ brand, imageUrl, href }) => ({ brand, imageUrl, href }));
}

export function toHomePage(data: HomePageData, now: Date): HomePageModel {
  const { today, time } = clockParts(now);
  const settings = data.platformSettings;
  const images = data.platformHeroImages.map((image) => image.url.trim()).filter(Boolean);
  const joinBase = settings?.whatsapp?.trim() || "";
  const active: HomeTournamentCard[] = [];
  const upcoming: HomeTournamentCard[] = [];
  for (const tournament of data.tournaments) {
    const card = toTournamentCard(tournament, joinBase, today);
    const phase = phaseOf(tournament, today);
    if (phase === "upcoming") upcoming.push(card);
    else if (phase === "active") active.push(card);
  }
  const byName = (a: HomeTournamentCard, b: HomeTournamentCard) => a.name.localeCompare(b.name, "es");
  active.sort(byName);
  upcoming.sort(byName);

  const matches = data.matches
    .flatMap((match) => {
      const card = toMatch(match, today, time);
      return card ? [card] : [];
    })
    .slice(0, MATCH_LIMIT);

  return {
    hero: {
      images: images.length > 0 ? images : [...DEFAULT_PLATFORM_HERO_IMAGES],
      headline: settings?.headline.trim() || PLATFORM_HEADLINE,
      tagline: settings?.tagline.trim() || PLATFORM_DESCRIPTION,
      courtsEnabled: settings?.courtsEnabled === true,
    },
    ads: toAds(data.adPlacements, today),
    matches,
    activeTournaments: active,
    upcomingTournaments: upcoming,
  };
}

type LiveRow = LiveMatchesData["matches"][number];

function liveWindow(match: LiveRow) {
  if (!match.matchDate || !match.startTime) return null;
  return liveMatchWindow(
    match.matchDate,
    match.startTime,
    asMatchDuration(match.tournament.durationMinutes),
    asLiveMargin(match.tournament.liveMarginMinutes),
  );
}

/** Hay que seguir consultando: algún partido está en vivo o empieza en un par de minutos. */
export function hasLiveWindow(data: LiveMatchesData, now: Date): boolean {
  const at = now.getTime();
  return data.matches.some((match) => {
    if (match.status === "PLAYED") return false;
    const window = liveWindow(match);
    return window != null && window.start - LIVE_SOON_MS <= at && at < window.end;
  });
}

function score(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function toLiveMatches(data: LiveMatchesData, now: Date): LiveMatchView[] {
  const rows = data.matches.flatMap((match) => {
    if (!match.matchDate || !match.startTime || !TIME_RE.test(match.startTime)) return [];
    let phase = liveMatchPhase(
      match.matchDate,
      match.startTime,
      asMatchDuration(match.tournament.durationMinutes),
      asLiveMargin(match.tournament.liveMarginMinutes),
      now,
    );
    if (phase !== "live" && phase !== "finished") return [];
    // Finalizado por el superadmin antes de la hora de fin: ya es resultado, no «en vivo».
    if (match.status === "PLAYED") phase = "finished";
    const penaltiesHome = score(match.penaltiesHome);
    const penaltiesAway = score(match.penaltiesAway);
    const venue = match.venue.trim();
    const view: LiveMatchView = {
      id: match.id,
      href: matchPath(match.id),
      phase,
      pending: phase === "finished" && match.status !== "PLAYED",
      homeName: match.homeClub.name,
      awayName: match.awayClub.name,
      homeLogo: match.homeClub.logoUrl?.trim() || null,
      awayLogo: match.awayClub.logoUrl?.trim() || null,
      homeScore: score(match.homeScore),
      awayScore: score(match.awayScore),
      penaltiesLabel:
        penaltiesHome != null && penaltiesAway != null
          ? `${penaltiesHome}–${penaltiesAway} pen.`
          : null,
      walkover: match.walkover,
      subtitle: [match.tournament.category.name, match.tournament.name].filter(Boolean).join(" · "),
      timeLabel: formatFriendlyTime(match.startTime),
      venue: venue || null,
    };
    return [{ view, start: `${match.matchDate}T${match.startTime}` }];
  });
  // En vivo primero, por hora de inicio; luego los terminados, el más reciente arriba.
  rows.sort((a, b) => {
    if (a.view.phase !== b.view.phase) return a.view.phase === "live" ? -1 : 1;
    return a.view.phase === "live" ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start);
  });
  return rows.map((row) => row.view);
}
