import { useEffect, useMemo, useState } from "react";
import {
  documentId,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type QuerySnapshot,
} from "firebase/firestore";
import {
  categoriesCol,
  clubsCol,
  localitiesCol,
  matchesCol,
  seasonsCol,
  tournamentRef,
  tournamentsCol,
} from "../lib/paths";
import type {
  Category,
  ClubSummary,
  Match,
  Season,
  StatsScope,
  Tournament,
} from "../lib/types";
import { isPlayed } from "../lib/stats";
import { isoDate } from "../utils/helpers";

interface Locality {
  id: string;
  name: string;
}

type CatalogSource = () => ReturnType<typeof categoriesCol>;

export type PlatformCatalogParts = {
  categories?: boolean;
  seasons?: boolean;
  tournaments?: boolean;
  clubs?: boolean;
  localities?: boolean;
  /**
   * En Competición solo hace falta saber si una temporada tiene torneos.
   * El estado guarda `id` y `seasonId`; el resto del documento se descarta.
   */
  slimTournaments?: boolean;
};

export type TournamentSeasonRef = {
  id: string;
  seasonId: string;
};

/** Ventana amplia para quedarnos con 6 próximos tras descartar jugados. */
const UPCOMING_MATCH_WINDOW = 24;

function readCategories(snap: QuerySnapshot<DocumentData>): Category[] {
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: typeof data.name === "string" ? data.name : "",
      order: typeof data.order === "number" ? data.order : 99,
    };
  });
  list.sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name),
  );
  return list;
}

function readSeasons(snap: QuerySnapshot<DocumentData>): Season[] {
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: typeof data.name === "string" ? data.name : "",
      startDate: typeof data.startDate === "string" ? data.startDate : undefined,
      endDate: typeof data.endDate === "string" ? data.endDate : undefined,
      active: data.active !== false,
    };
  });
  list.sort(
    (a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "") ||
      b.name.localeCompare(a.name),
  );
  return list;
}

function readTournaments(snap: QuerySnapshot<DocumentData>): Tournament[] {
  const list = snap.docs.map((d) => tournamentFromDoc(d.id, d.data()));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function readTournamentSeasonRefs(
  snap: QuerySnapshot<DocumentData>,
): TournamentSeasonRef[] {
  return snap.docs.map((d) => {
    const seasonId = d.data().seasonId;
    return {
      id: d.id,
      seasonId: typeof seasonId === "string" ? seasonId : "",
    };
  });
}

function clubFromDoc(id: string, data: DocumentData): ClubSummary {
  return {
    id,
    slug: data.slug || id,
    name: data.name || id,
    logoUrl: data.logoUrl,
    localityId: data.localityId,
    location: data.location,
    presidentPhone: data.presidentPhone || "",
    active: data.active !== false,
  };
}

function readClubs(snap: QuerySnapshot<DocumentData>): ClubSummary[] {
  const list = snap.docs.map((d) => clubFromDoc(d.id, d.data()));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function tournamentFromDoc(id: string, data: DocumentData): Tournament {
  return {
    id,
    clubIds: [],
    status: "upcoming",
    ...data,
  } as unknown as Tournament;
}

function readLocalities(snap: QuerySnapshot<DocumentData>): Locality[] {
  const list = snap.docs.map((d) => {
    const name = d.data().name;
    return { id: d.id, name: typeof name === "string" ? name : "" };
  });
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function useCatalogSlice<T>(
  enabled: boolean,
  label: string,
  source: CatalogSource,
  read: (snap: QuerySnapshot<DocumentData>) => T[],
) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoaded(false);
      return;
    }
    const unsub = onSnapshot(
      source(),
      (snap) => {
        setItems(read(snap));
        setLoaded(true);
      },
      (err) => {
        console.error(`Error cargando ${label}:`, err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [enabled, label, source, read]);

  return { items, loading: enabled && !loaded };
}

/**
 * Catálogo global de la plataforma (colecciones pequeñas, lectura pública):
 * categorías, temporadas, torneos, clubes y localidades.
 * Sin argumentos se suscribe a las cinco. Cada parte se puede apagar.
 */
type CatalogBase = {
  categories: Category[];
  seasons: Season[];
  clubs: ClubSummary[];
  localities: Locality[];
  clubNames: Record<string, string>;
  clubsById: Record<string, ClubSummary>;
  categoryName: Record<string, string>;
  seasonName: Record<string, string>;
  loading: boolean;
  partsLoading: {
    categories: boolean;
    seasons: boolean;
    tournaments: boolean;
    clubs: boolean;
    localities: boolean;
  };
};

type CatalogFull = CatalogBase & {
  tournaments: Tournament[];
  tournamentsById: Record<string, Tournament>;
};

type CatalogSlim = CatalogBase & {
  tournaments: TournamentSeasonRef[];
  tournamentsById: Record<string, TournamentSeasonRef>;
};

export function usePlatformCatalog(
  parts: PlatformCatalogParts & { slimTournaments: true },
): CatalogSlim;
export function usePlatformCatalog(parts?: PlatformCatalogParts): CatalogFull;
export function usePlatformCatalog(parts?: PlatformCatalogParts): CatalogFull | CatalogSlim {
  const categoriesOn = parts?.categories ?? true;
  const seasonsOn = parts?.seasons ?? true;
  const tournamentsOn = parts?.tournaments ?? true;
  const clubsOn = parts?.clubs ?? true;
  const localitiesOn = parts?.localities ?? true;
  const slimTournaments = parts?.slimTournaments === true;

  const categoriesSlice = useCatalogSlice(
    categoriesOn,
    "categorías",
    categoriesCol,
    readCategories,
  );
  const seasonsSlice = useCatalogSlice(
    seasonsOn,
    "temporadas",
    seasonsCol,
    readSeasons,
  );
  const tournamentsSlice = useCatalogSlice(
    tournamentsOn && !slimTournaments,
    "torneos",
    tournamentsCol,
    readTournaments,
  );
  const tournamentRefsSlice = useCatalogSlice(
    tournamentsOn && slimTournaments,
    "torneos",
    tournamentsCol,
    readTournamentSeasonRefs,
  );
  const clubsSlice = useCatalogSlice(clubsOn, "clubes", clubsCol, readClubs);
  const localitiesSlice = useCatalogSlice(
    localitiesOn,
    "localidades",
    localitiesCol,
    readLocalities,
  );

  const categories = categoriesSlice.items;
  const seasons = seasonsSlice.items;
  const tournaments = slimTournaments
    ? tournamentRefsSlice.items
    : tournamentsSlice.items;
  const clubs = clubsSlice.items;
  const localities = localitiesSlice.items;
  const loading =
    categoriesSlice.loading ||
    seasonsSlice.loading ||
    tournamentsSlice.loading ||
    tournamentRefsSlice.loading ||
    clubsSlice.loading ||
    localitiesSlice.loading;
  const partsLoading = {
    categories: categoriesSlice.loading,
    seasons: seasonsSlice.loading,
    tournaments: slimTournaments
      ? tournamentRefsSlice.loading
      : tournamentsSlice.loading,
    clubs: clubsSlice.loading,
    localities: localitiesSlice.loading,
  };

  const clubNames = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.id, c.name])),
    [clubs],
  );
  const clubsById = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.id, c])),
    [clubs],
  );
  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const seasonName = useMemo(
    () => Object.fromEntries(seasons.map((s) => [s.id, s.name])),
    [seasons],
  );
  const tournamentsById = useMemo(
    () => Object.fromEntries(tournaments.map((t) => [t.id, t])),
    [tournaments],
  );

  return {
    categories,
    seasons,
    tournaments,
    clubs,
    localities,
    clubNames,
    clubsById,
    categoryName,
    seasonName,
    tournamentsById,
    loading,
    partsLoading,
  };
}

const CLUB_IN_LIMIT = 30;

function chunkIds(ids: string[], size: number) {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));
  return chunks;
}

/** Un torneo por id. `missing` es true cuando el documento no existe. */
export function useTournament(id: string | null) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [forId, setForId] = useState(id);

  if (forId !== id) {
    setForId(id);
    setTournament(null);
    setLoaded(false);
    setMissing(false);
  }

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      tournamentRef(id),
      (snap) => {
        if (!snap.exists()) {
          setTournament(null);
          setMissing(true);
        } else {
          setTournament(tournamentFromDoc(snap.id, snap.data()));
          setMissing(false);
        }
        setLoaded(true);
      },
      (err) => {
        console.error("Error cargando torneo:", err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [id]);

  return { tournament, missing, loading: Boolean(id) && !loaded };
}

/** Clubes participantes. Sin ids no abre listener. `in` admite 30 por consulta. */
export function useClubsByIds(ids: string[]) {
  const key = [...new Set(ids.filter(Boolean))].sort().join("\0");
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [forKey, setForKey] = useState(key);

  if (forKey !== key) {
    setForKey(key);
    setClubs([]);
    setLoaded(false);
  }

  useEffect(() => {
    const list = key ? key.split("\0") : [];
    if (list.length === 0) {
      setClubs([]);
      setLoaded(true);
      return;
    }
    const chunks = chunkIds(list, CLUB_IN_LIMIT);
    const parts: ClubSummary[][] = chunks.map(() => []);
    const seen = chunks.map(() => false);
    const publish = () => {
      setClubs(parts.flat().sort((a, b) => a.name.localeCompare(b.name)));
      if (seen.every(Boolean)) setLoaded(true);
    };
    const unsubs = chunks.map((chunk, index) =>
      onSnapshot(
        query(clubsCol(), where(documentId(), "in", chunk)),
        (snap) => {
          parts[index] = snap.docs.map((d) => clubFromDoc(d.id, d.data()));
          seen[index] = true;
          publish();
        },
        (err) => {
          console.error("Error cargando clubes:", err);
          seen[index] = true;
          publish();
        },
      ),
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [key]);

  const clubNames = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.id, c.name])),
    [clubs],
  );
  const clubsById = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.id, c])),
    [clubs],
  );

  return { clubs, clubNames, clubsById, loading: key.length > 0 && !loaded };
}

function mapMatchDoc(d: { id: string; data: () => unknown }): Match {
  const data = d.data() as Record<string, unknown>;
  const date = typeof data.date === "string" ? data.date : "";
  const inferred = data.status || (date ? "scheduled" : "unscheduled");
  return {
    id: d.id,
    sides: {},
    status: inferred,
    ...data,
  } as unknown as Match;
}

function useMatchesQuery(build: () => ReturnType<typeof query> | null, deps: unknown[]) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = build();
    if (!q) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMatches(snap.docs.map(mapMatchDoc));
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando partidos:", err);
        setLoading(false);
      },
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { matches, loading };
}

/** Temporada marcada activa, o la de inicio más reciente. */
export function defaultSeasonId(seasons: Season[]): string | undefined {
  const active = seasons.find((season) => season.active);
  if (active) return active.id;
  const latest = [...seasons].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  )[0];
  return latest?.id;
}

/** Primera categoría: la de menor orden. */
export function firstCategoryId(categories: Category[]): string | undefined {
  const first = [...categories].sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name),
  )[0];
  return first?.id;
}

function scopeFilters(scope: StatsScope): QueryConstraint[] {
  const filters: QueryConstraint[] = [];
  if (scope.seasonId) filters.push(where("seasonId", "==", scope.seasonId));
  if (scope.categoryId) filters.push(where("categoryId", "==", scope.categoryId));
  return filters;
}

/**
 * Partidos del filtro visible. `null` no abre el listener
 * (aún no sabemos la temporada o la categoría iniciales).
 */
export function useScopedMatches(scope: StatsScope | null) {
  const seasonId = scope?.seasonId ?? "";
  const categoryId = scope?.categoryId ?? "";
  const enabled = scope !== null;
  return useMatchesQuery(() => {
    if (!enabled) return null;
    const filters = scopeFilters({
      seasonId: seasonId || undefined,
      categoryId: categoryId || undefined,
    });
    return filters.length ? query(matchesCol(), ...filters) : query(matchesCol());
  }, [enabled, seasonId, categoryId]);
}

/**
 * Partidos de un club dentro del filtro. `null` en el filtro no abre el listener.
 */
export function useClubScopedMatches(clubId: string | null, scope: StatsScope | null) {
  const seasonId = scope?.seasonId ?? "";
  const categoryId = scope?.categoryId ?? "";
  const enabled = scope !== null;
  return useMatchesQuery(() => {
    if (!clubId || !enabled) return null;
    return query(
      matchesCol(),
      where("clubIds", "array-contains", clubId),
      ...scopeFilters({
        seasonId: seasonId || undefined,
        categoryId: categoryId || undefined,
      }),
    );
  }, [clubId, enabled, seasonId, categoryId]);
}

/** Partidos oficiales en los que participa un club. */
export const useClubMatches = (clubId: string | null) =>
  useMatchesQuery(
    () => (clubId ? query(matchesCol(), where("clubIds", "array-contains", clubId)) : null),
    [clubId],
  );

/** Partidos de un torneo. */
export const useTournamentMatches = (tournamentId: string | null) =>
  useMatchesQuery(
    () => (tournamentId ? query(matchesCol(), where("tournamentId", "==", tournamentId)) : null),
    [tournamentId],
  );

/** Partidos programados (pendientes de jugarse). */
export const useScheduledMatches = () =>
  useMatchesQuery(() => query(matchesCol(), where("status", "==", "scheduled")), []);

/** Todos los partidos oficiales. */
export const useAllMatches = () => useMatchesQuery(() => query(matchesCol()), []);

/** Ids de torneos con al menos un partido jugado. `null` mientras carga o si está apagado. */
export function usePlayedTournamentIds(enabled: boolean) {
  const [ids, setIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIds(null);
      return;
    }
    setIds(null);
    const unsub = onSnapshot(
      query(matchesCol(), where("status", "==", "played")),
      (snap) => {
        const next = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data();
          const match = {
            id: d.id,
            status: "played",
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            tournamentId: typeof data.tournamentId === "string" ? data.tournamentId : "",
          } as Match;
          if (isPlayed(match) && match.tournamentId) next.add(match.tournamentId);
        });
        setIds(next);
      },
      (err) => {
        console.error("Error cargando partidos jugados:", err);
        setIds(new Set());
      },
    );
    return () => unsub();
  }, [enabled]);

  return ids;
}

/** Partidos con fecha de hoy en adelante, sin historial jugado. */
export const useFutureMatches = () =>
  useMatchesQuery(
    () => query(matchesCol(), where("date", ">=", isoDate()), orderBy("date")),
    [],
  );

/**
 * Próximos partidos por fecha. Con `enabled` en falso no abre el listener.
 * Pide una ventana corta; el llamador descarta jugados y se queda con 6.
 */
export function useUpcomingMatches(enabled: boolean) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const unsub = onSnapshot(
      query(
        matchesCol(),
        where("date", ">=", isoDate()),
        orderBy("date"),
        limit(UPCOMING_MATCH_WINDOW),
      ),
      (snap) => {
        setMatches(snap.docs.map(mapMatchDoc));
        setLoaded(true);
      },
      (err) => {
        console.error("Error cargando partidos:", err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [enabled]);

  return { matches, loading: enabled && !loaded };
}
