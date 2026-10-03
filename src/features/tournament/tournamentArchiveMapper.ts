import {
  FootballType,
  TournamentStatus,
  type TournamentArchiveData,
} from "../../../dataconnect/generated";
import { whatsappUrl } from "../../lib/social";
import { formatCalendarDate } from "./tournamentMapper";
import type {
  TournamentArchiveView,
  TournamentCardView,
} from "./tournamentArchiveViewState";

const TONE_COUNT = 4;

const FOOTBALL_LABEL: Record<FootballType, string> = {
  [FootballType.FUT_7]: "Fútbol 7",
  [FootballType.FUT_9]: "Fútbol 9",
  [FootballType.FUT_11]: "Fútbol 11",
};

const JOIN_TEXT =
  "Hola, me gustaría participar con mi equipo o con un equipo en el torneo";

type TournamentRow = TournamentArchiveData["tournaments"][number];

function byName(a: TournamentCardView, b: TournamentCardView) {
  return a.name.localeCompare(b.name, "es");
}

function clubCount(rows: { _count: number }[]): number {
  if (rows.length === 0) return 0;
  const count = rows[0]?._count;
  return typeof count === "number" && Number.isFinite(count) ? count : rows.length;
}

function toCard(tournament: TournamentRow, joinBase: string): TournamentCardView {
  const clubs = clubCount(tournament.tournamentClubs_on_tournament);
  const clubLabel = clubs === 1 ? "1 club" : `${clubs} clubes`;
  const begins = formatCalendarDate(tournament.startDate || tournament.season.startDate);
  const upcoming = tournament.status === TournamentStatus.UPCOMING;
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
    categoryName: tournament.category.name,
    toneIndex: (Math.max(1, tournament.category.sortOrder) - 1) % TONE_COUNT,
    meta: [tournament.season.name, FOOTBALL_LABEL[tournament.footballType], clubLabel].join(
      " · ",
    ),
    startLabel: upcoming && begins ? `Inicia ${begins}` : null,
    joinHref,
    playedMatches: clubCount(tournament.matches_on_tournament),
  };
}

export function toTournamentArchive(data: TournamentArchiveData): TournamentArchiveView {
  const joinBase = data.platformSettings?.whatsapp?.trim() || "";
  const active: TournamentCardView[] = [];
  const upcoming: TournamentCardView[] = [];
  const finished: TournamentCardView[] = [];
  const finishedSeasons: string[] = [];

  for (const tournament of data.tournaments) {
    const card = toCard(tournament, joinBase);
    if (!tournament.season.active || tournament.status === TournamentStatus.FINISHED) {
      finished.push(card);
      finishedSeasons.push(tournament.season.name);
      continue;
    }
    if (tournament.status === TournamentStatus.UPCOMING) upcoming.push(card);
    else active.push(card);
  }

  active.sort(byName);
  upcoming.sort(byName);
  const finishedOrder = finished.map((card, index) => ({
    card,
    season: finishedSeasons[index] || "",
  }));
  finishedOrder.sort(
    (a, b) => b.season.localeCompare(a.season, "es") || byName(a.card, b.card),
  );

  return {
    active,
    upcoming,
    finished: finishedOrder.map((item) => item.card),
  };
}
