import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Medal, Trophy } from "lucide-react";
import PlatformLayout from "../components/platform/PlatformLayout";
import TournamentCalendar from "../components/platform/TournamentCalendar";
import {
  ScorersTable,
  StandingsTable,
} from "../components/platform/TournamentTables";
import { useAuth } from "../context/AuthContext";
import {
  usePlatformCatalog,
  useTournamentMatches,
} from "../hooks/usePlatformCatalog";
import { syncTournamentFixtures } from "../lib/fixtures";
import { computeStandings, computeTopScorers } from "../lib/stats";
import { C, RADIUS, SectionCard } from "../components/ui";
import { footballTypeLabel } from "../lib/types";
import { formatShortDate } from "../utils/helpers";
import { useTournamentEdit } from "../components/admin/TournamentEditModal";

export default function TournamentPage() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { openEdit } = useTournamentEdit();
  const {
    tournamentsById,
    clubsById,
    clubNames,
    seasonName,
    categoryName,
    seasons,
    loading,
  } = usePlatformCatalog();
  const { matches, loading: matchesLoading } = useTournamentMatches(id || null);
  const tournament = tournamentsById[id];
  const syncing = useRef(false);

  useEffect(() => {
    if (!isSuperAdmin || !tournament || matchesLoading || syncing.current) return;
    syncing.current = true;
    void syncTournamentFixtures(tournament, matches).finally(() => {
      syncing.current = false;
    });
  }, [
    isSuperAdmin,
    matchesLoading,
    tournament,
    tournament?.id,
    tournament?.legs,
    tournament?.clubIds.join(","),
    matches,
  ]);

  if (!loading && !tournament) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Torneo no encontrado.</p>
        <Link to="/torneos" style={{ color: C.navy900, fontWeight: 700 }}>
          ← Torneos
        </Link>
      </PlatformLayout>
    );
  }

  const standings = computeStandings(matches, tournament?.clubIds || []);
  const scorers = computeTopScorers(matches);

  return (
    <PlatformLayout>
      <Link
        to="/torneos"
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: C.gray500,
          textDecoration: "none",
        }}
      >
        ← Torneos
      </Link>
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 900,
          color: C.navy900,
          margin: "0.5rem 0 0.65rem",
        }}
      >
        {tournament?.name || "Torneo"}
      </h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.4rem",
          margin: "0 0 1.15rem",
        }}
      >
        {tournament && seasonName[tournament.seasonId] && (
          <span style={metaChip}>{seasonName[tournament.seasonId]}</span>
        )}
        {tournament && categoryName[tournament.categoryId] && (
          <span style={metaChip}>{categoryName[tournament.categoryId]}</span>
        )}
        {tournament && (
          <span style={metaChip}>{footballTypeLabel(tournament.footballType)}</span>
        )}
        {tournament?.status === "upcoming" &&
          (tournament.startDate ||
            seasons.find((s) => s.id === tournament.seasonId)?.startDate) && (
            <span style={metaChip}>
              Inicia{" "}
              {formatShortDate(
                tournament.startDate ||
                  seasons.find((s) => s.id === tournament.seasonId)?.startDate ||
                  "",
              )}
            </span>
          )}
        {tournament && isSuperAdmin ? (
          <button
            type="button"
            onClick={() => openEdit(tournament.id)}
            style={{
              marginLeft: "0.15rem",
              color: C.navy900,
              fontWeight: 700,
              fontSize: "0.8rem",
              textDecoration: "none",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Editar torneo
          </button>
        ) : null}
      </div>

      {tournament?.status === "finished" && tournament.podium && (
        <SectionCard
          title="Podio"
          icon={<Trophy size={16} color={C.amber} />}
          style={{ marginBottom: "1.25rem" }}
        >
          <div
            className="tournament-podium"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr",
              gap: "0.55rem",
              alignItems: "end",
            }}
          >
            {PODIUM_SLOTS.map((slot) => {
              const clubId = tournament.podium?.[slot.pos];
              const club = clubId ? clubsById[clubId] : null;
              const Icon = slot.icon;
              return (
                <div
                  key={slot.pos}
                  style={{
                    textAlign: "center",
                    padding: `${slot.pad} 0.7rem 0.85rem`,
                    border: `1px solid ${slot.border}`,
                    background: slot.bg,
                    borderRadius: RADIUS.lg,
                    minHeight: slot.minH,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "0.35rem",
                  }}
                >
                  <Icon size={slot.iconSize} color={slot.accent} strokeWidth={2.2} />
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.62rem",
                      color: slot.accent,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {slot.label}
                  </div>
                  {club ? (
                    <Link
                      to={`/${club.slug}`}
                      style={{
                        color: C.navy900,
                        fontWeight: 800,
                        fontSize: slot.pos === "1" ? "0.95rem" : "0.82rem",
                        textDecoration: "none",
                        lineHeight: 1.25,
                      }}
                    >
                      {club.name}
                    </Link>
                  ) : (
                    <span style={{ color: C.gray400, fontWeight: 700 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <StandingsTable
        standings={standings}
        clubsById={clubsById}
        clubNames={clubNames}
        loading={matchesLoading}
      />

      <ScorersTable
        scorers={scorers}
        clubsById={clubsById}
        clubNames={clubNames}
      />

      {tournament && (
        <TournamentCalendar
          tournament={tournament}
          matches={matches}
          loading={matchesLoading}
          clubNames={clubNames}
          isAdmin={isSuperAdmin}
        />
      )}
    </PlatformLayout>
  );
}

const PODIUM_SLOTS = [
  {
    pos: "2",
    label: "Subcampeón",
    icon: Medal,
    accent: "#64748b",
    border: "#d4d4d8",
    bg: "#f8fafc",
    pad: "1.15rem",
    minH: 118,
    iconSize: 22,
  },
  {
    pos: "1",
    label: "Campeón",
    icon: Trophy,
    accent: C.amber,
    border: `${C.amber}99`,
    bg: C.amberLight,
    pad: "1.7rem",
    minH: 148,
    iconSize: 28,
  },
  {
    pos: "3",
    label: "Tercer lugar",
    icon: Medal,
    accent: "#b45309",
    border: "#fde68a",
    bg: "#fff7ed",
    pad: "0.95rem",
    minH: 104,
    iconSize: 20,
  },
] as const;

const metaChip = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: C.gray600,
  backgroundColor: C.gray100,
  border: `1px solid ${C.gray200}`,
  borderRadius: RADIUS.full,
  padding: "0.2rem 0.6rem",
} as const;
