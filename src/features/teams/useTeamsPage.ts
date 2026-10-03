import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dataConnect, QueryFetchPolicy, teamsPage } from "../../infrastructure/dataconnect";
import { CLUB_PAGE_SIZE } from "../shell/ClubDirectoryList";
import { filterClubs, toTeamsPage } from "./teamsMapper";
import type { TeamsPageModel, TeamsScopeView } from "./teamsViewState";

const DESKTOP_QUERY = "(min-width: 800px)";
const DESKTOP_PAGE_SIZE = 15;
const STANDINGS_PAGE = 10;

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
  const [scope, setScope] = useState<TeamsScopeView>({ seasonId: "", categoryId: "" });
  const scopeReady = useRef(false);
  const request = useRef(0);
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

  const directory = useMemo(
    () => (model ? filterClubs(model.clubs, query) : []),
    [model, query],
  );
  const standings = useMemo(
    () => (model ? model.standingsFor(scope) : []),
    [model, scope],
  );

  return {
    loading,
    error,
    query,
    directory: directory.slice(0, dirLimit),
    directoryEmptyLabel: query.trim()
      ? "Ningún equipo coincide con esa búsqueda."
      : null,
    hasMoreDirectory: directory.length > dirLimit,
    seasons: model?.seasons ?? [],
    categories: model?.categories ?? [],
    scope,
    standings: standings.slice(0, standingsLimit),
    hasMoreStandings: standings.length > standingsLimit,
    onSearch: setQuery,
    onMoreDirectory: () => setDirLimit((count) => count + pageSize),
    onScopeChange: (next: TeamsScopeView) => {
      setScope(next);
      setStandingsLimit(STANDINGS_PAGE);
    },
    onMoreStandings: () => setStandingsLimit((count) => count + STANDINGS_PAGE),
    onRefresh: load,
  };
}
