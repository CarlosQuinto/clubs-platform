import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import {
  ArchiveSection,
  PageTitle,
  TournamentCard,
  TournamentGrid,
} from "../components/platform/ArchiveUI";
import { C } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { usePlatformCatalog, usePlayedTournamentIds } from "../hooks/usePlatformCatalog";

export default function TournamentArchive() {
  const { isSuperAdmin } = useAuth();
  const playedTournamentIds = usePlayedTournamentIds(isSuperAdmin);
  const { tournaments, seasons, seasonName, categoryName, categories, loading } =
    usePlatformCatalog({ clubs: false, localities: false });

  const closedSeasonIds = useMemo(
    () => new Set(seasons.filter((s) => !s.active).map((s) => s.id)),
    [seasons],
  );

  const { active, upcoming, finished } = useMemo(() => {
    const active: typeof tournaments = [];
    const upcoming: typeof tournaments = [];
    const finished: typeof tournaments = [];
    for (const t of tournaments) {
      if (closedSeasonIds.has(t.seasonId) || t.status === "finished") {
        finished.push(t);
        continue;
      }
      if (t.status === "upcoming") upcoming.push(t);
      else active.push(t);
    }
    const byName = (a: (typeof tournaments)[0], b: (typeof tournaments)[0]) =>
      a.name.localeCompare(b.name);
    active.sort(byName);
    upcoming.sort(byName);
    finished.sort(
      (a, b) =>
        (seasonName[b.seasonId] || "").localeCompare(seasonName[a.seasonId] || "") ||
        a.name.localeCompare(b.name),
    );
    return { active, upcoming, finished };
  }, [tournaments, closedSeasonIds, seasonName]);

  const card = (t: (typeof tournaments)[0]) => (
    <TournamentCard
      key={t.id}
      tournament={t}
      seasonName={seasonName[t.seasonId]}
      categoryName={categoryName[t.categoryId]}
      categoryOrder={
        categories.find((c) => c.id === t.categoryId)?.order ?? 1
      }
      startDate={seasons.find((s) => s.id === t.seasonId)?.startDate}
      canDelete={playedTournamentIds != null && !playedTournamentIds.has(t.id)}
    />
  );

  return (
    <PlatformLayout>
      <PageTitle
        icon={<Trophy size={22} color="#cd9a40" />}
        subtitle={
          <>
            Mira los torneos en curso y los que vienen.{" "}
            <Link
              to="/contacto"
              style={{ color: C.navy900, fontWeight: 700, textDecoration: "underline" }}
            >
              Solicita información
            </Link>
          </>
        }
      >
        Torneos
      </PageTitle>

      {loading ? (
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Cargando torneos…</p>
      ) : (
        <>
          <ArchiveSection title="En curso" count={active.length}>
            <TournamentGrid>{active.map(card)}</TournamentGrid>
          </ArchiveSection>

          <ArchiveSection title="Próximos" count={upcoming.length}>
            <TournamentGrid>{upcoming.map(card)}</TournamentGrid>
          </ArchiveSection>

          <ArchiveSection title="Finalizados" count={finished.length} collapsed>
            <TournamentGrid>{finished.map(card)}</TournamentGrid>
          </ArchiveSection>
        </>
      )}
    </PlatformLayout>
  );
}
