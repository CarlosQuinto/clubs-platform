import { useEffect, useMemo, useState } from "react";
import { Search, Shield, Users } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import { PageTitle, SectionRule } from "../components/platform/ArchiveUI";
import ClubDirectoryList, {
  CLUB_PAGE_SIZE,
} from "../components/platform/ClubDirectoryList";
import { StandingsTable } from "../components/platform/TournamentTables";
import StatsScopeBar from "../components/club/StatsScopeBar";
import { C, FormInput, SectionCard } from "../components/ui";
import { useAllMatches, usePlatformCatalog } from "../hooks/usePlatformCatalog";
import {
  applyScope,
  applyTournamentScope,
  computeStandings,
  rankingClubIds,
} from "../lib/stats";
import type { ClubSummary, StatsScope } from "../lib/types";

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Teams() {
  const {
    clubs,
    localities,
    seasons,
    categories,
    tournaments,
    clubsById,
    clubNames,
    loading: catalogLoading,
  } = usePlatformCatalog();
  const { matches, loading: matchesLoading } = useAllMatches();
  const [scope, setScope] = useState<StatsScope>({});
  const [scopeReady, setScopeReady] = useState(false);

  useEffect(() => {
    if (catalogLoading || scopeReady) return;
    const active = seasons.find((s) => s.active);
    setScope(active ? { seasonId: active.id } : {});
    setScopeReady(true);
  }, [catalogLoading, seasons, scopeReady]);

  const loading = catalogLoading || matchesLoading || !scopeReady;

  const scopedTournaments = useMemo(
    () => applyTournamentScope(tournaments, scope),
    [tournaments, scope],
  );
  const scopedMatches = useMemo(() => applyScope(matches, scope), [matches, scope]);

  const standings = useMemo(() => {
    const ids = rankingClubIds(scopedTournaments, scopedMatches);
    return computeStandings(scopedMatches, ids);
  }, [scopedTournaments, scopedMatches]);

  const [dirLimit, setDirLimit] = useState(CLUB_PAGE_SIZE);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDirLimit(CLUB_PAGE_SIZE);
  }, [query]);

  const directory = useMemo(() => {
    const q = fold(query);
    return clubs
      .filter((c) => c.active)
      .filter((c) => !q || fold(c.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs, query]);
  const visibleDirectory = directory.slice(0, dirLimit);

  const localityOf = (club: ClubSummary) =>
    localities.find((l) => l.id === club.localityId)?.name || club.location || `/${club.slug}`;

  return (
    <PlatformLayout>
      <PageTitle icon={<Shield size={22} color="#cd9a40" />}>
        Equipos
      </PageTitle>

      {catalogLoading ? (
        <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando equipos…</p>
      ) : (
        <>
          <SectionCard
            title="Directorio"
            icon={<Users size={16} />}
            style={{ marginBottom: "0.85rem" }}
          >
            <label className="club-dir-search">
              <Search size={14} color={C.gray400} />
              <FormInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre de equipo"
                aria-label="Buscar por nombre de equipo"
              />
            </label>
            <ClubDirectoryList
              clubs={visibleDirectory}
              localityName={localityOf}
              emptyLabel={
                query.trim()
                  ? "Ningún equipo coincide con esa búsqueda."
                  : undefined
              }
              hasMore={directory.length > dirLimit}
              onMore={() => setDirLimit((n) => n + CLUB_PAGE_SIZE)}
            />
          </SectionCard>

          <SectionRule title="Rankings generales por equipos" />

          {loading ? (
            <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando estadísticas…</p>
          ) : (
            <>
          <StatsScopeBar
            scope={scope}
            onChange={setScope}
            seasons={seasons}
            categories={categories}
          />

          <StandingsTable
            title="Ranking de equipos"
            standings={standings}
            clubsById={clubsById}
            clubNames={clubNames}
            loading={false}
            pageSize={10}
          />
            </>
          )}
        </>
      )}
    </PlatformLayout>
  );
}
