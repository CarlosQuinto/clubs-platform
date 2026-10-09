import { FootballType, type TournamentArchiveData, TournamentStatus } from "../../infrastructure/dataconnect";
import { tournamentPhase } from "../../domains/competition/tournamentPhase";
import { todayIso } from "../../domains/platform/ads";
import { whatsappUrl } from "../../domains/platform/social";
import { formatCalendarDate } from "./tournamentMapper";
import type { TournamentPhase } from "./tournamentStatus";
import type {
  TournamentArchiveView,
  TournamentTileView,
} from "./tournamentArchiveViewState";

const FOOTBALL_LABEL: Record<FootballType, string> = {
  [FootballType.FUT_7]: "Fútbol 7",
  [FootballType.FUT_9]: "Fútbol 9",
  [FootballType.FUT_11]: "Fútbol 11",
};

const JOIN_TEXT =
  "Hola, me gustaría participar con mi equipo o con un equipo en el torneo";

type TournamentRow = TournamentArchiveData["tournaments"][number];

function byName(a: TournamentTileView, b: TournamentTileView) {
  return a.name.localeCompare(b.name, "es");
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

function toCard(
  tournament: TournamentRow,
  joinBase: string,
  phase: TournamentPhase,
): TournamentTileView {
  const clubs = clubCount(tournament.tournamentClubs_on_tournament);
  const begins = formatCalendarDate(tournament.startDate || tournament.season.startDate);
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
    meta: [tournament.season.name, FOOTBALL_LABEL[tournament.footballType]]
      .filter((part) => part.trim())
      .join(" · "),
    startLabel: begins ? (phase === "upcoming" ? "Inicia" : "Inició") : null,
    startDate: begins || null,
    clubsLabel: clubs === 1 ? "1 equipo" : `${clubs} equipos`,
    prize: (tournament.prize ?? "").trim(),
    joinHref,
  };
}

export function toTournamentArchive(
  data: TournamentArchiveData,
  today = todayIso(),
): TournamentArchiveView {
  const joinBase = data.platformSettings?.whatsapp?.trim() || "";
  const active: TournamentTileView[] = [];
  const upcoming: TournamentTileView[] = [];
  const finished: TournamentTileView[] = [];
  const finishedSeasons: string[] = [];

  for (const tournament of data.tournaments) {
    const phase = phaseOf(tournament, today);
    if (!tournament.season.active || phase === "finished") {
      finished.push(toCard(tournament, joinBase, "finished"));
      finishedSeasons.push(tournament.season.name);
      continue;
    }
    if (phase === "upcoming") upcoming.push(toCard(tournament, joinBase, "upcoming"));
    else active.push(toCard(tournament, joinBase, "active"));
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
