import { useMemo, useState } from "react";
import { Calendar, Search } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import { PageTitle } from "../components/platform/ArchiveUI";
import MatchList, { upcomingOfficialMatches } from "../components/platform/MatchList";
import { useAllMatches, usePlatformCatalog } from "../hooks/usePlatformCatalog";
import { C, FormInput, FormSelect, RADIUS } from "../components/ui";

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
  } = usePlatformCatalog();
  const { matches, loading: matchesLoading } = useAllMatches();
  const [tournamentId, setTournamentId] = useState("");
  const [query, setQuery] = useState("");

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
            <MatchList
              matches={filtered}
              clubNames={clubNames}
              clubsById={clubsById}
              subtitleOf={(m) => {
                const tournament = tournamentsById[m.tournamentId];
                const category =
                  categoryName[tournament?.categoryId || m.categoryId] || "";
                return [category, tournament?.name].filter(Boolean).join(" · ");
              }}
            />
          )}
        </>
      )}
    </PlatformLayout>
  );
}
