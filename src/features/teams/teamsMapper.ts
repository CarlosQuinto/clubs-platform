import { type TeamsPageData } from "../../infrastructure/dataconnect";
import type {
  ClubCardView,
  TeamStandingView,
  TeamsPageModel,
  TeamsScopeView,
} from "./teamsViewState";

type ClubSide = { name: string; slug: string };

const INITIALS_SKIP = new Set(["de", "del", "la", "las", "los", "el", "y"]);

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

/** Siglas del escudo cuando el club no tiene logo: «Halcones FC» → HFC. */
export function clubInitials(name: string) {
  const words = fold(name)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const main = words.filter((word) => !INITIALS_SKIP.has(word));
  const parts = main.length ? main : words;
  let initials = "";
  if (parts.length >= 3) initials = parts.slice(0, 3).map((word) => word[0]).join("");
  else if (parts.length === 2) initials = parts[0][0] + parts[1].slice(0, 2);
  else if (parts.length === 1) initials = parts[0].slice(0, 3);
  return initials.toUpperCase() || "?";
}

/** 10 dígitos → «782 123 4567»; cualquier otro largo se muestra tal cual. */
export function phoneLabel(phone: string) {
  const digits = phone.replace(/\s+/g, "");
  const local = /^[0-9]{10}$/.test(digits) ? digits : null;
  return local ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : phone;
}

export function toClubCard(club: {
  name: string;
  slug: string;
  logoUrl?: string | null;
  presidentPhone: string;
  locality: string;
}): ClubCardView {
  const phone = club.presidentPhone.trim();
  return {
    href: hrefFor(club.slug) || "/",
    name: club.name,
    initials: clubInitials(club.name),
    locality: club.locality,
    logoUrl: club.logoUrl?.trim() || null,
    phoneLabel: phone ? phoneLabel(phone) : null,
    phoneHref: phone ? `tel:${phone.replace(/\s+/g, "")}` : null,
  };
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
    const locality = textOf(record.localityName) || textOf(record.location) || (slug ? `/${slug}` : "");
    return [toClubCard({
      name,
      slug,
      logoUrl: textOf(record.logoUrl),
      presidentPhone: textOf(record.presidentPhone),
      locality,
    })];
  });
}

function emptyStanding(club: ClubSide, logoUrl: string | null): Omit<TeamStandingView, "rank"> {
  const clubName = club.name || "Club";
  return {
    clubName,
    clubHref: hrefFor(club.slug),
    clubSlug: club.slug || null,
    logoUrl,
    initials: clubInitials(clubName),
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

function standingsFor(
  data: TeamsPageData,
  logos: Map<string, string>,
  scope: TeamsScopeView,
): TeamStandingView[] {
  const rows = new Map<string, Omit<TeamStandingView, "rank">>();
  const ensure = (club: ClubSide) => {
    const key = club.slug || club.name;
    if (!key) return undefined;
    if (!rows.has(key)) rows.set(key, emptyStanding(club, logos.get(club.slug) || null));
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
  const logos = new Map<string, string>();
  for (const club of data.clubs) {
    const logo = club.logoUrl?.trim();
    if (club.slug && logo) logos.set(club.slug, logo);
  }
  return {
    clubs: data.clubs.map((club) =>
      toClubCard({
        name: club.name,
        slug: club.slug,
        logoUrl: club.logoUrl,
        presidentPhone: club.presidentPhone,
        locality: club.locality?.name?.trim() || club.location.trim() || `/${club.slug}`,
      }),
    ),
    seasons: seasons.map((season) => ({ id: season.id, name: season.name })),
    categories: categories.map((category) => ({ id: category.id, name: category.name })),
    defaultScope: {
      seasonId: activeSeason?.id || seasons[0]?.id || "",
      categoryId: categories[0]?.id || "",
    },
    standingsFor: (scope) => standingsFor(data, logos, scope),
  };
}
