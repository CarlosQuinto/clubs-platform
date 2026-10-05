import { type TeamsPageData } from "../../infrastructure/dataconnect";
import type { StandingRowView } from "../tournament/tournamentViewState";
import type {
  ClubCardView,
  TeamsPageModel,
  TeamsScopeView,
} from "./teamsViewState";

type ClubSide = { name: string; slug: string };

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hrefFor(slug: string) {
  const clean = slug.trim();
  return clean ? `/${clean}` : null;
}

function inScope(
  scope: TeamsScopeView,
  seasonId: string,
  categoryId: string,
) {
  if (scope.seasonId && seasonId !== scope.seasonId) return false;
  if (scope.categoryId && categoryId !== scope.categoryId) return false;
  return true;
}

export function clubSearchKey(value: string) {
  return fold(value);
}

export function clubsMatching(clubs: ClubCardView[], key: string) {
  if (!key) return clubs;
  return clubs.filter((club) => fold(club.name).includes(key));
}

function textOf(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function toSearchClubs(rows: unknown[] | null | undefined): ClubCardView[] {
  if (!rows) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    const name = textOf(record.name);
    const slug = textOf(record.slug);
    if (!name) return [];
    const phone = textOf(record.presidentPhone);
    const locality = textOf(record.localityName) || textOf(record.location) || (slug ? `/${slug}` : "");
    return [{
      href: hrefFor(slug) || "/",
      name,
      locality,
      logoUrl: textOf(record.logoUrl) || null,
      phoneLabel: phone ? `Presidente: ${phone}` : null,
      phoneHref: phone ? `tel:${phone.replace(/\s+/g, "")}` : null,
    }];
  });
}

function emptyStanding(club: ClubSide): Omit<StandingRowView, "rank"> {
  return {
    clubName: club.name || "Club",
    clubHref: hrefFor(club.slug),
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function standingsFor(data: TeamsPageData, scope: TeamsScopeView): StandingRowView[] {
  const rows = new Map<string, Omit<StandingRowView, "rank">>();
  const ensure = (club: ClubSide) => {
    const key = club.slug || club.name;
    if (!key) return undefined;
    if (!rows.has(key)) rows.set(key, emptyStanding(club));
    return rows.get(key);
  };

  for (const tournament of data.tournaments) {
    if (!inScope(scope, tournament.season.id, tournament.category.id)) continue;
    for (const entry of tournament.tournamentClubs_on_tournament) {
      ensure(entry.club);
    }
  }

  for (const match of data.matches) {
    if (!inScope(scope, match.tournament.season.id, match.tournament.category.id)) continue;
    if (typeof match.homeScore !== "number" || typeof match.awayScore !== "number") continue;
    const home = ensure(match.homeClub);
    const away = ensure(match.awayClub);
    if (!home || !away) continue;
    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    if (match.homeScore > match.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  return [...rows.values()]
    .map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.clubName.localeCompare(b.clubName, "es"),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function toTeamsPage(data: TeamsPageData): TeamsPageModel {
  const seasons = [...data.seasons].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  );
  const categories = [...data.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
  );
  const activeSeason = data.seasons.find((season) => season.active);
  return {
    clubs: data.clubs.map((club) => {
      const phone = club.presidentPhone.trim();
      const locality = club.locality?.name?.trim() || club.location.trim() || `/${club.slug}`;
      return {
        href: hrefFor(club.slug) || "/",
        name: club.name,
        locality,
        logoUrl: club.logoUrl?.trim() || null,
        phoneLabel: phone ? `Presidente: ${phone}` : null,
        phoneHref: phone ? `tel:${phone.replace(/\s+/g, "")}` : null,
      };
    }),
    seasons: seasons.map((season) => ({ id: season.id, name: season.name })),
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
    defaultScope: {
      seasonId: activeSeason?.id || seasons[0]?.id || "",
      categoryId: categories[0]?.id || "",
    },
    standingsFor: (scope) => standingsFor(data, scope),
  };
}
