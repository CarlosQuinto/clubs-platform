import { useEffect, useMemo, useState } from "react";
import { onSnapshot, query, where } from "firebase/firestore";
import {
  categoriesCol,
  clubsCol,
  localitiesCol,
  matchesCol,
  seasonsCol,
  tournamentsCol,
} from "../lib/paths";
import type {
  Category,
  ClubSummary,
  Match,
  Season,
  Tournament,
} from "../lib/types";

interface Locality {
  id: string;
  name: string;
}

/**
 * Catálogo global de la plataforma (colecciones pequeñas, lectura pública):
 * categorías, temporadas, torneos, clubes y localidades.
 */
export function usePlatformCatalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pending = 5;
    const done = () => {
      pending--;
      if (pending <= 0) setLoading(false);
    };
    const onErr = (label: string) => (err: unknown) => {
      console.error(`Error cargando ${label}:`, err);
      done();
    };

    const unsubs = [
      onSnapshot(
        categoriesCol(),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
          list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
          setCategories(list);
          done();
        },
        onErr("categorías"),
      ),
      onSnapshot(
        seasonsCol(),
        (snap) => {
          const list = snap.docs.map(
            (d) => ({ id: d.id, active: true, ...d.data() }) as Season,
          );
          list.sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "") || b.name.localeCompare(a.name));
          setSeasons(list);
          done();
        },
        onErr("temporadas"),
      ),
      onSnapshot(
        tournamentsCol(),
        (snap) => {
          const list = snap.docs.map(
            (d) =>
              ({ id: d.id, clubIds: [], status: "upcoming", ...d.data() }) as unknown as Tournament,
          );
          list.sort((a, b) => a.name.localeCompare(b.name));
          setTournaments(list);
          done();
        },
        onErr("torneos"),
      ),
      onSnapshot(
        clubsCol(),
        (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              slug: data.slug || d.id,
              name: data.name || d.id,
              logoUrl: data.logoUrl,
              localityId: data.localityId,
              location: data.location,
              presidentPhone: data.presidentPhone || "",
              active: data.active !== false,
            } as ClubSummary;
          });
          list.sort((a, b) => a.name.localeCompare(b.name));
          setClubs(list);
          done();
        },
        onErr("clubes"),
      ),
      onSnapshot(
        localitiesCol(),
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Locality);
          list.sort((a, b) => a.name.localeCompare(b.name));
          setLocalities(list);
          done();
        },
        onErr("localidades"),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

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
  };
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
        setMatches(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const date = typeof data.date === "string" ? data.date : "";
            const inferred =
              data.status || (date ? "scheduled" : "unscheduled");
            return {
              id: d.id,
              sides: {},
              status: inferred,
              ...data,
            } as unknown as Match;
          }),
        );
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

/** Todos los partidos oficiales (calendario de la landing). */
export const useAllMatches = () => useMatchesQuery(() => query(matchesCol()), []);
