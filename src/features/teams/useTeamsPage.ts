import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dataConnect, QueryFetchPolicy, searchClubs, teamsPage } from "../../infrastructure/dataconnect";
import { teamLabel } from "../../shared/textLimits";
import { clubSearchKey, clubsMatching, toSearchClubs, toTeamsPage } from "./teamsMapper";
import type {
  ClubCardView,
  DirectoryEmptyView,
  TeamsPageModel,
  TeamsScopeView,
} from "./teamsViewState";

const CLUB_PAGE_SIZE = 5;
const DESKTOP_QUERY = "(min-width: 800px)";
const DESKTOP_PAGE_SIZE = 15;
const STANDINGS_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_DELAY_MS = 3000;

function useDirectoryPageSize() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return wide ? DESKTOP_PAGE_SIZE : CLUB_PAGE_SIZE;
}

export function useTeamsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<TeamsPageModel | null>(null);
  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<ClubCardView[] | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [quietKey, setQuietKey] = useState<string | null>(null);
  const [scope, setScope] = useState<TeamsScopeView>({ seasonId: "", categoryId: "" });
  const scopeReady = useRef(false);
  const request = useRef(0);
  const searchCache = useRef(new Map<string, ClubCardView[]>());
  const searchAbort = useRef<AbortController | null>(null);
  const loggedSearchMiss = useRef(false);
  const term = query.trim();
  const searchKey = clubSearchKey(term);
  const searching = term.length >= 3;
  const pageSize = useDirectoryPageSize();
  const [dirLimit, setDirLimit] = useState(pageSize);
  const [standingsLimit, setStandingsLimit] = useState(STANDINGS_PAGE);
  const prevQuery = useRef(query);
  const prevPageSize = useRef(pageSize);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void teamsPage(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        const next = toTeamsPage(result.data);
        setModel(next);
        if (!scopeReady.current) {
          scopeReady.current = true;
          setScope(next.defaultScope);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudieron cargar los equipos.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!searching) {
      searchAbort.current?.abort();
      searchAbort.current = null;
      setSearchHits(null);
      return;
    }
    const cached = searchCache.current.get(searchKey);
    if (cached) {
      searchAbort.current?.abort();
      searchAbort.current = null;
      setSearchHits(cached);
      return;
    }
    const controller = new AbortController();
    searchAbort.current?.abort();
    searchAbort.current = controller;
    setSearchHits(null);
    setPendingKey(searchKey);
    const settle = () => setPendingKey((key) => (key === searchKey ? null : key));
    const timer = window.setTimeout(() => {
      void searchClubs(dataConnect, { term }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
        .then((result) => {
          if (controller.signal.aborted) return;
          const clubs = toSearchClubs(result.data.clubs);
          searchCache.current.set(searchKey, clubs);
          setSearchHits(clubs);
          settle();
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          if (!loggedSearchMiss.current) {
            loggedSearchMiss.current = true;
            console.error(err);
          }
          setSearchHits(null);
          settle();
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searching, searchKey, term]);

  // «Sin resultados» solo tras 3 s sin cambios en la búsqueda; antes se muestra «Buscando…».
  useEffect(() => {
    setQuietKey(null);
    if (!searching) return;
    const timer = window.setTimeout(() => setQuietKey(searchKey), EMPTY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searching, searchKey]);

  useEffect(() => {
    if (prevQuery.current !== query) {
      prevQuery.current = query;
      prevPageSize.current = pageSize;
      setDirLimit(pageSize);
      return;
    }
    if (prevPageSize.current !== pageSize) {
      prevPageSize.current = pageSize;
      setDirLimit((count) => Math.max(count, pageSize));
    }
  }, [query, pageSize]);

  const directory = useMemo(() => {
    if (!model) return [];
    if (!searching) return model.clubs;
    if (searchHits !== null) return searchHits;
    return clubsMatching(model.clubs, searchKey);
  }, [model, searching, searchHits, searchKey]);
  const standings = useMemo(
    () => (model ? model.standingsFor(scope) : []),
    [model, scope],
  );

  let directoryEmpty: DirectoryEmptyView = null;
  if (model && directory.length === 0) {
    if (!searching) directoryEmpty = "none";
    else if (quietKey === searchKey && pendingKey !== searchKey) directoryEmpty = "search";
    else directoryEmpty = "loading";
  }

  return {
    loading,
    error,
    query,
    directory: directory.slice(0, dirLimit),
    directoryEmpty,
    hasMoreDirectory: directory.length > dirLimit,
    hiddenClubs: model?.hiddenClubs ?? [],
    seasons: model?.seasons ?? [],
    categories: model?.categories ?? [],
    scope,
    standings: standings.slice(0, standingsLimit),
    hasMoreStandings: standings.length > standingsLimit,
    onSearch: (value: string) => setQuery(teamLabel(value)),
    onMoreDirectory: () => setDirLimit((count) => count + pageSize),
    onScopeChange: (next: TeamsScopeView) => {
      setScope(next);
      setStandingsLimit(STANDINGS_PAGE);
    },
    onMoreStandings: () => setStandingsLimit((count) => count + STANDINGS_PAGE),
    onRefresh: load,
    onCreated: () => {
      searchCache.current.clear();
      setSearchHits(null);
      load();
    },
  };
}
