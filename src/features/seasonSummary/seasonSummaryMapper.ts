import type { SeasonSummaryData, SeasonSummaryMatch, SeasonSummaryPlayerAward } from "../../infrastructure/dataconnect";
import { matchPath, playerPath } from "../../shared/paths";
import { formatCalendarDate, toPodium } from "../tournament/tournamentMapper";
import type {
  AwardEntryView,
  AwardGroupView,
  RecordView,
  SeasonChampionView,
  SeasonStatView,
  SeasonSummaryView,
} from "./seasonSummaryViewState";

type Season = NonNullable<SeasonSummaryData["season"]>;

const decimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("es-MX");

function plural(n: number, one: string, many: string) {
  return `${integer.format(n)} ${n === 1 ? one : many}`;
}

function clean(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function toChampions(season: Season): SeasonChampionView[] {
  return season.tournaments.map((t) => {
    const detail = [t.category?.name, t.prize.trim() ? `Premio: ${t.prize.trim()}` : null].filter(Boolean).join(" · ");
    return {
      id: t.id,
      name: t.name,
      href: `/torneos/${encodeURIComponent(t.id)}`,
      detail,
      hasPodium: t.podium.length > 0,
      slots: toPodium(t.podium),
    };
  });
}

function toStats(totals: Season["totals"]): SeasonStatView[] {
  const scored = totals.matches - totals.walkovers;
  const stats: SeasonStatView[] = [
    { key: "tournaments", label: totals.tournaments === 1 ? "Torneo" : "Torneos", value: integer.format(totals.tournaments) },
    { key: "clubs", label: totals.clubs === 1 ? "Club" : "Clubes", value: integer.format(totals.clubs) },
    { key: "matches", label: "Partidos jugados", value: integer.format(totals.matches) },
    { key: "goals", label: "Goles", value: integer.format(totals.goals) },
    { key: "average", label: "Goles por partido", value: scored > 0 ? decimal.format(totals.goals / scored) : "—" },
    { key: "yellow", label: "Amarillas", value: integer.format(totals.yellowCards) },
    { key: "red", label: "Rojas", value: integer.format(totals.redCards) },
  ];
  if (totals.shootouts > 0) {
    stats.push({ key: "shootouts", label: "Tandas de penales", value: integer.format(totals.shootouts) });
  }
  if (totals.walkovers > 0) {
    stats.push({ key: "walkovers", label: totals.walkovers === 1 ? "Walkover" : "Walkovers", value: integer.format(totals.walkovers) });
  }
  return stats;
}

function playerEntry(award: SeasonSummaryPlayerAward, index: number, one: string, many: string): AwardEntryView {
  return {
    key: `${award.club?.id ?? ""}:${award.player?.id ?? award.playerName}:${index}`,
    name: award.playerName || "Jugador",
    href: award.player?.id ? playerPath(award.player.id) : null,
    imageUrl: clean(award.player?.imageUrl),
    clubName: award.club?.name ?? null,
    clubLogo: clean(award.club?.logoUrl),
    value: integer.format(award.value),
    unit: award.value === 1 ? one : many,
    detail: null,
  };
}

function toAwards(awards: Season["awards"]): AwardGroupView[] {
  const groups: AwardGroupView[] = [
    {
      key: "scorers",
      title: "Goleador",
      subtitle: "Más goles en la temporada",
      entries: awards.scorers.map((a, i) => playerEntry(a, i, "gol", "goles")),
    },
    {
      key: "assists",
      title: "Asistidor",
      subtitle: "Más pases de gol",
      entries: awards.assists.map((a, i) => playerEntry(a, i, "asist.", "asist.")),
    },
    {
      key: "mvps",
      title: "Jugador más valioso",
      subtitle: "Más veces elegido MVP",
      entries: awards.mvps.map((a, i) => playerEntry(a, i, "MVP", "MVP")),
    },
    {
      key: "keepers",
      title: "Arquero menos goleado",
      subtitle: "Goles recibidos por partido (mín. 3)",
      entries: awards.keepers.map((k, i) => ({
        key: `${k.club?.id ?? ""}:${k.player.id}:${i}`,
        name: k.playerName || "Arquero",
        href: playerPath(k.player.id),
        imageUrl: clean(k.player.imageUrl),
        clubName: k.club?.name ?? null,
        clubLogo: clean(k.club?.logoUrl),
        value: decimal.format(k.conceded / k.matches),
        unit: "por partido",
        detail: `${plural(k.matches, "partido", "partidos")} · ${plural(k.saves, "atajada", "atajadas")}`,
      })),
    },
  ];
  return groups.filter((group) => group.entries.length > 0);
}

function matchRecord(key: string, label: string, match: SeasonSummaryMatch | null | undefined): RecordView | null {
  if (!match) return null;
  const date = formatCalendarDate(match.matchDate);
  return {
    key,
    label,
    headline: `${match.homeClub.name} ${match.homeScore}–${match.awayScore} ${match.awayClub.name}`,
    detail: [match.tournament.name, date].filter(Boolean).join(" · "),
    href: matchPath(match.id),
    logos: [clean(match.homeClub.logoUrl), clean(match.awayClub.logoUrl)],
  };
}

function clubHref(slug: string) {
  const s = slug.trim();
  return s ? `/${s}` : null;
}

function toRecords(records: Season["records"]): RecordView[] {
  const list: (RecordView | null)[] = [
    matchRecord("biggestWin", "Mayor goleada", records.biggestWin),
    matchRecord("highestScoring", "Partido con más goles", records.highestScoring),
  ];
  const { topAttack, bestDefense, fairPlay, mostCards } = records;
  if (topAttack) {
    list.push({
      key: "topAttack",
      label: "Mejor ataque",
      headline: topAttack.club.name,
      detail: `${plural(topAttack.goals, "gol", "goles")} en ${plural(topAttack.matches, "partido", "partidos")}`,
      href: clubHref(topAttack.club.slug),
      logos: [clean(topAttack.club.logoUrl)],
    });
  }
  if (bestDefense) {
    list.push({
      key: "bestDefense",
      label: "Valla menos vencida",
      headline: bestDefense.club.name,
      detail: `${plural(bestDefense.conceded, "gol recibido", "goles recibidos")} en ${plural(bestDefense.matches, "partido", "partidos")}`,
      href: clubHref(bestDefense.club.slug),
      logos: [clean(bestDefense.club.logoUrl)],
    });
  }
  if (fairPlay) {
    list.push({
      key: "fairPlay",
      label: "Juego limpio",
      headline: fairPlay.club.name,
      detail: `${plural(fairPlay.yellow, "amarilla", "amarillas")} y ${plural(fairPlay.red, "roja", "rojas")} en ${plural(fairPlay.matches, "partido", "partidos")}`,
      href: clubHref(fairPlay.club.slug),
      logos: [clean(fairPlay.club.logoUrl)],
    });
  }
  if (mostCards) {
    list.push({
      key: "mostCards",
      label: "Más tarjetas",
      headline: mostCards.club.name,
      detail: `${plural(mostCards.yellow, "amarilla", "amarillas")} y ${plural(mostCards.red, "roja", "rojas")}`,
      href: clubHref(mostCards.club.slug),
      logos: [clean(mostCards.club.logoUrl)],
    });
  }
  return list.filter((r): r is RecordView => r !== null);
}

export function toSeasonSummary(season: Season): SeasonSummaryView {
  const start = formatCalendarDate(season.startDate);
  const end = formatCalendarDate(season.endDate);
  return {
    title: `Temporada ${season.name}`,
    rangeLabel: start && end ? `${start} – ${end}` : start || end,
    shareText: `Resumen de la temporada ${season.name}`,
    champions: toChampions(season),
    stats: toStats(season.totals),
    awards: toAwards(season.awards),
    records: toRecords(season.records),
  };
}
