import { useEffect, useRef, useState } from "react";
import { Calendar, Search } from "lucide-react";
import { PageTitle } from "../shell/ArchiveUI";
import PlatformLayout from "../shell/PlatformLayout";
import { C, FormInput, FormSelect, RADIUS } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import FixtureCard from "./FixtureCard";
import { useMatchesPage } from "./useMatchesPage";

export default function MatchesPageView() {
  const screen = useMatchesPage();
  const { isSuperAdmin } = useAuth();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (screen.loading || !screen.hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) screen.onMore();
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [screen.loading, screen.hasMore, screen.onMore, screen.matches.length]);

  return (
    <PlatformLayout>
      <PageTitle
        icon={<Calendar size={22} color="#cd9a40" />}
        subtitle="Próximos partidos de torneos vigentes."
      >
        Partidos
      </PageTitle>
      {screen.error ? (
        <p style={{ color: C.red, fontSize: "0.9rem" }}>
          {screen.error}{" "}
          <button type="button" onClick={screen.onRefresh} style={retryButton}>
            Reintentar
          </button>
        </p>
      ) : null}
      {screen.loading && screen.matches.length === 0 && screen.tournaments.length === 0 ? (
        <p style={{ color: C.gray400, fontSize: "0.9rem" }}>Cargando partidos…</p>
      ) : (
        <>
          <div className="matches-filter-bar">
            <FormSelect
              value={screen.tournamentId}
              onChange={(event) => screen.onTournamentChange(event.target.value)}
              aria-label="Torneo"
            >
              <option value="">Todos los torneos</option>
              {screen.tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.label}
                </option>
              ))}
            </FormSelect>
            <label className="matches-filter-bar__search">
              <Search size={14} color={C.gray400} />
              <FormInput
                value={screen.query}
                onChange={(event) => screen.onSearch(event.target.value)}
                maxLength={30}
                placeholder="Buscar por equipo"
                aria-label="Buscar por equipo"
              />
            </label>
          </div>
          {screen.matches.length === 0 ? (
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
              <div className="home-grid">
                {screen.matches.map((match, index) => (
                  <FixtureCard
                    key={match.id || `${match.href}-${index}`}
                    match={match}
                    admin={isSuperAdmin}
                    editing={editingId === match.id}
                    onEdit={setEditingId}
                    onSaved={screen.onRefresh}
                  />
                ))}
              </div>
              {screen.hasMore ? <div ref={sentinelRef} style={{ height: 1 }} /> : null}
            </>
          )}
        </>
      )}
    </PlatformLayout>
  );
}

const retryButton = {
  color: C.navy900,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;
