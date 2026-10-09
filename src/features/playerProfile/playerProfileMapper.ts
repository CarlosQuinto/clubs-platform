import type {
  PlayerProfileClub,
  PlayerProfileCounts,
  PlayerProfileData,
  PlayerProfileStatLine,
} from "../../infrastructure/dataconnect";
import { seasonSummaryPath } from "../../shared/paths";
import type {
  PlayerProfileView,
  ProfileClubView,
  ProfileRowView,
  ProfileSeasonView,
  ProfileStatView,
} from "./playerProfileViewState";

type Player = NonNullable<PlayerProfileData["player"]>;

const integer = new Intl.NumberFormat("es-MX");

function plural(n: number, one: string, many: string) {
  return `${integer.format(n)} ${n === 1 ? one : many}`;
}

function clean(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function clubHref(slug: string | null | undefined) {
  const s = slug?.trim();
  return s ? `/${s}` : null;
}

function toClub(club: PlayerProfileClub): ProfileClubView {
  const shirt = club.shirtNumber && club.shirtNumber !== "S/N" ? `#${club.shirtNumber}` : null;
  return {
    id: club.id,
    name: club.name,
    logo: clean(club.logoUrl),
    href: clubHref(club.slug),
    detail: club.isCoach ? "Cuerpo técnico" : [shirt, club.position].filter(Boolean).join(" · "),
    badge: club.status === "INACTIVE" ? "De baja" : null,
  };
}

function toStats(t: PlayerProfileCounts): ProfileStatView[] {
  const stats: ProfileStatView[] = [
    { key: "matches", label: "Partidos", value: integer.format(t.matches) },
    { key: "goals", label: "Goles", value: integer.format(t.goals) },
    { key: "assists", label: "Asistencias", value: integer.format(t.assists) },
    { key: "mvps", label: "MVP", value: integer.format(t.mvps) },
    { key: "yellow", label: "Amarillas", value: integer.format(t.yellowCards) },
    { key: "red", label: "Rojas", value: integer.format(t.redCards) },
  ];
  if (t.penalties > 0) stats.push({ key: "penalties", label: "Goles de penal", value: integer.format(t.penalties) });
  if (t.ownGoals > 0) stats.push({ key: "ownGoals", label: t.ownGoals === 1 ? "Autogol" : "Autogoles", value: integer.format(t.ownGoals) });
  return stats;
}

function toRow(line: PlayerProfileStatLine): ProfileRowView {
  const note = [
    line.penalties > 0 ? `${integer.format(line.penalties)} de penal` : null,
    line.ownGoals > 0 ? plural(line.ownGoals, "autogol", "autogoles") : null,
  ].filter(Boolean).join(" · ");
  return {
    key: `${line.tournament.id}:${line.club.id}`,
    tournamentName: line.tournament.name,
    tournamentHref: `/torneos/${encodeURIComponent(line.tournament.id)}`,
    category: clean(line.tournament.category?.name),
    clubName: line.club.name,
    clubLogo: clean(line.club.logoUrl),
    clubHref: clubHref(line.club.slug),
    matches: integer.format(line.matches),
    goals: integer.format(line.goals),
    assists: integer.format(line.assists),
    mvps: integer.format(line.mvps),
    yellow: integer.format(line.yellowCards),
    red: integer.format(line.redCards),
    note: note || null,
  };
}

/** Agrupa las filas por temporada conservando el orden del servidor (la más reciente primero). */
function toSeasons(lines: PlayerProfileStatLine[]): ProfileSeasonView[] {
  const groups = new Map<string, { line: PlayerProfileStatLine; lines: PlayerProfileStatLine[] }>();
  for (const line of lines) {
    const group = groups.get(line.season.id);
    if (group) group.lines.push(line);
    else groups.set(line.season.id, { line, lines: [line] });
  }
  return [...groups.values()].map(({ line, lines: rows }) => {
    const sum = (pick: (l: PlayerProfileStatLine) => number) => rows.reduce((total, l) => total + pick(l), 0);
    const summary = [
      plural(sum((l) => l.matches), "partido", "partidos"),
      plural(sum((l) => l.goals), "gol", "goles"),
      plural(sum((l) => l.assists), "asistencia", "asistencias"),
    ].join(" · ");
    return {
      id: line.season.id,
      name: line.season.name,
      href: line.season.active ? null : seasonSummaryPath(line.season.id),
      summary,
      rows: rows.map(toRow),
    };
  });
}

export function toPlayerProfile(player: Player): PlayerProfileView {
  const clubs = player.clubs_on_player.map((club) => ({ club, view: toClub(club) }));
  const position = player.clubs_on_player.find((c) => c.status === "ACTIVE" && !c.isCoach)?.position ?? null;
  const subtitle = [player.age != null ? `${player.age} años` : null, position].filter(Boolean).join(" · ");
  return {
    id: player.id,
    name: player.name,
    imageUrl: clean(player.imageUrl),
    subtitle: subtitle || "Jugador",
    shareText: `${player.name} · Ficha del jugador`,
    currentClubs: clubs.filter((c) => c.club.status !== "FORMER").map((c) => c.view),
    formerClubs: clubs.filter((c) => c.club.status === "FORMER").map((c) => c.view),
    stats: toStats(player.totals),
    seasons: toSeasons(player.statLines),
  };
}
