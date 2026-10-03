import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dataConnect, matchesPage, QueryFetchPolicy } from "../../infrastructure/dataconnect";
import { todayIso } from "../../domains/courts/courts";
import { filterMatches, toMatchesPage } from "./matchesMapper";
import type { MatchesPageModel } from "./matchesViewState";

const BATCH_QUERY = "(min-width: 800px)";
const BATCH_NARROW = 6;
const BATCH_WIDE = 12;

function useMatchBatchSize() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(BATCH_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(BATCH_QUERY);
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return wide ? BATCH_WIDE : BATCH_NARROW;
}

export function useMatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<MatchesPageModel | null>(null);
  const [tournamentId, setTournamentId] = useState("");
  const [query, setQuery] = useState("");
  const request = useRef(0);
  const batch = useMatchBatchSize();
  const [visibleCount, setVisibleCount] = useState(batch);
  const filterKey = `${tournamentId}\0${query}`;
  const prevFilter = useRef(filterKey);
  const prevBatch = useRef(batch);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setLoading(true);
    setError(null);
    void matchesPage(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        setModel(toMatchesPage(result.data, todayIso()));
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket !== request.current) return;
        setError("No se pudieron cargar los partidos.");
      })
      .finally(() => {
        if (ticket === request.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (prevFilter.current !== filterKey) {
      prevFilter.current = filterKey;
      prevBatch.current = batch;
      setVisibleCount(batch);
      return;
    }
    if (prevBatch.current !== batch) {
      prevBatch.current = batch;
      setVisibleCount((count) => Math.max(count, batch));
    }
  }, [filterKey, batch]);

  const filtered = useMemo(
    () => (model ? filterMatches(model.matches, tournamentId, query) : []),
    [model, tournamentId, query],
  );
  const onMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + batch, filtered.length));
  }, [batch, filtered.length]);

  return {
    loading,
    error,
    query,
    tournamentId,
    tournaments: model?.tournaments ?? [],
    matches: filtered.slice(0, visibleCount),
    hasMore: visibleCount < filtered.length,
    onSearch: setQuery,
    onTournamentChange: setTournamentId,
    onMore,
    onRefresh: load,
  };
}
