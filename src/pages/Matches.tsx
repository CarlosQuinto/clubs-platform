import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Search } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import { PageTitle } from "../components/platform/ArchiveUI";
import MatchList, { upcomingOfficialMatches } from "../components/platform/MatchList";
import { scheduleResources } from "../components/platform/MatchScheduleForm";
import { useFutureMatches, usePlatformCatalog } from "../hooks/usePlatformCatalog";
import { useCourtHolds, useCourts } from "../hooks/useCourts";
import { useAuth } from "../context/AuthContext";
import { useMigrateClubAvailability } from "../lib/migrateClubAvailability";
import { addDays, todayIso } from "../lib/courts";
import { C, FormInput, FormSelect, RADIUS } from "../components/ui";

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

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function MatchesPage() {
  const {
    clubsById,
    clubNames,
    categoryName,
    tournaments,
    tournamentsById,
    loading: catalogLoading,
  } = usePlatformCatalog({ seasons: false, localities: false });
  const { matches, loading: matchesLoading } = useFutureMatches();
  const { isSuperAdmin, platformConfig } = useAuth();
  useMigrateClubAvailability(isSuperAdmin);
  const courtsEnabled = isSuperAdmin && platformConfig?.courtsEnabled === true;
  const { courts } = useCourts(courtsEnabled);
  const [tournamentId, setTournamentId] = useState("");
  const [query, setQuery] = useState("");
  const batch = useMatchBatchSize();
  const [visibleCount, setVisibleCount] = useState(batch);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filterKey = `${tournamentId}\0${query}`;
  const prevFilter = useRef(filterKey);
  const prevBatch = useRef(batch);

  const liveTournaments = useMemo(
    () =>
      tournaments
        .filter((t) => t.status === "active" || t.status === "upcoming")
        .sort(
          (a, b) =>
            a.name.localeCompare(b.name) ||
            (categoryName[a.categoryId] || "").localeCompare(
              categoryName[b.categoryId] || "",
            ),
        ),
    [tournaments, categoryName],
  );
  const liveTournamentIds = useMemo(
    () => new Set(liveTournaments.map((t) => t.id)),
    [liveTournaments],
  );
  const horizonEnd = useMemo(() => {
    const today = todayIso();
    let end = addDays(today, 21);
    for (const tournament of liveTournaments) {
      const start =
        tournament.startDate && tournament.startDate > today
          ? tournament.startDate
          : today;
      const candidate = addDays(start, 21);
      if (candidate > end) end = candidate;
    }
    return end;
  }, [liveTournaments]);
  const { holds, loading: holdsLoading } = useCourtHolds(
    courtsEnabled ? todayIso() : null,
    courtsEnabled ? horizonEnd : null,
  );
  const schedule = useMemo(
    () =>
      isSuperAdmin
        ? scheduleResources({
            courtsEnabled,
            courtSlotMinutes: platformConfig?.courtSlotMinutes,
            courtOpenWindows: platformConfig?.courtOpenWindows,
            courts,
            holds,
            holdsLoading,
          })
        : undefined,
    [
      isSuperAdmin,
      courtsEnabled,
      platformConfig?.courtSlotMinutes,
      platformConfig?.courtOpenWindows,
      courts,
      holds,
      holdsLoading,
    ],
  );

  const upcoming = useMemo(
    () => upcomingOfficialMatches(matches, liveTournamentIds),
    [matches, liveTournamentIds],
  );

  const filtered = useMemo(() => {
    const q = fold(query);
    return upcoming.filter((m) => {
      if (tournamentId && m.tournamentId !== tournamentId) return false;
      if (!q) return true;
      const home =
        clubNames[m.homeClubId] || clubsById[m.homeClubId]?.name || "";
      const away =
        clubNames[m.awayClubId] || clubsById[m.awayClubId]?.name || "";
      return fold(home).includes(q) || fold(away).includes(q);
    });
  }, [
    upcoming,
    tournamentId,
    query,
    clubNames,
    clubsById,
  ]);

  const loading = catalogLoading || matchesLoading;
  const visible = filtered.slice(0, visibleCount);

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

  useEffect(() => {
    if (loading || visibleCount >= filtered.length) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((count) => Math.min(count + batch, filtered.length));
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, visibleCount, filtered.length, batch]);

  return (
    <PlatformLayout>
      <PageTitle
        icon={<Calendar size={22} color="#cd9a40" />}
        subtitle="Próximos partidos de torneos vigentes."
      >
        Partidos
      </PageTitle>

      {loading ? (
        <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando partidos…</p>
      ) : (
        <>
          <div className="matches-filter-bar">
            <FormSelect
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              aria-label="Torneo"
            >
              <option value="">Todos los torneos</option>
              {liveTournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {categoryName[t.categoryId]
                    ? ` · ${categoryName[t.categoryId]}`
                    : ""}
                </option>
              ))}
            </FormSelect>
            <label className="matches-filter-bar__search">
              <Search size={14} color={C.gray400} />
              <FormInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por equipo"
                aria-label="Buscar por equipo"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: "1.5rem",
                textAlign: "center",
                color: C.gray400,
                backgroundColor: C.white,
                border: `1px dashed ${C.gray300}`,
                borderRadius: RADIUS.lg,
                fontSize: "0.85rem",
              }}
            >
              No hay partidos con esos filtros.
            </p>
          ) : (
            <>
              <MatchList
                matches={visible}
                clubNames={clubNames}
                clubsById={clubsById}
                schedule={schedule}
                tournamentOf={(m) => tournamentsById[m.tournamentId]}
                subtitleOf={(m) => {
                  const tournament = tournamentsById[m.tournamentId];
                  const category =
                    categoryName[tournament?.categoryId || m.categoryId] || "";
                  return [category, tournament?.name].filter(Boolean).join(" · ");
                }}
              />
              {visibleCount < filtered.length && (
                <div ref={sentinelRef} style={{ height: 1 }} />
              )}
            </>
          )}
        </>
      )}
    </PlatformLayout>
  );
}
