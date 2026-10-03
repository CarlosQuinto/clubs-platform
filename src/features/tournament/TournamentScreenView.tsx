import { Link, useParams } from "react-router-dom";
import { Medal, Pencil, Trophy } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import { ScorersTable, StandingsTable } from "./TournamentTables";
import { useTournamentEdit } from "./TournamentEditModal";
import { C, RADIUS, SectionCard } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import type { ClubSummary, ScorerRow, StandingRow } from "../../shared/types";
import TournamentCalendarPanel from "./TournamentCalendarPanel";
import { useTournamentScreen } from "./useTournamentScreen";
import type { PodiumSlotView, StandingRowView, TournamentScreenView } from "./tournamentViewState";

const PODIUM_STYLE = [
  { accent: "#64748b", border: "#d4d4d8", bg: "#f8fafc", minH: 118 },
  { accent: C.amber, border: `${C.amber}99`, bg: C.amberLight, minH: 148 },
  { accent: "#b45309", border: "#fde68a", bg: "#fff7ed", minH: 104 },
] as const;

export default function TournamentScreenView() {
  const { id = "" } = useParams();
  const { isSuperAdmin } = useAuth();
  const { openEdit } = useTournamentEdit();
  const { loading, missing, error, view, onRefresh } = useTournamentScreen(id);

  if (missing) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Torneo no encontrado.</p>
        <BackLink />
      </PlatformLayout>
    );
  }

  if (!view && loading) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Cargando torneo…</p>
      </PlatformLayout>
    );
  }

  if (!view) {
    return (
      <PlatformLayout>
        <p style={{ color: C.red }}>{error}</p>
        <button type="button" onClick={onRefresh} style={textButton}>
          Reintentar
        </button>
        <BackLink />
      </PlatformLayout>
    );
  }

  const tables = tableModels(view);

  return (
    <PlatformLayout>
      <BackLink />
      {error ? (
        <p style={{ color: C.red, margin: "0.75rem 0 0" }}>
          {error}{" "}
          <button type="button" onClick={onRefresh} style={textButton}>
            Reintentar
          </button>
        </p>
      ) : null}
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: C.navy900, margin: "0.5rem 0 0.65rem" }}>
        {view.title}
      </h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", margin: "0 0 1.15rem" }}>
        {view.chips.map((chip) => (
          <span key={chip} style={metaChip}>
            {chip}
          </span>
        ))}
        {isSuperAdmin ? (
          <button type="button" onClick={() => openEdit(id)} style={editButton}>
            <Pencil size={14} /> Editar torneo
          </button>
        ) : null}
      </div>
      {view.showPodium ? <Podium slots={view.podium} /> : null}
      <StandingsTable
        standings={tables.standings}
        clubsById={tables.clubsById}
        clubNames={tables.clubNames}
        loading={false}
      />
      <ScorersTable scorers={tables.scorers} clubsById={tables.clubsById} clubNames={tables.clubNames} />
      <TournamentCalendarPanel
        rounds={view.rounds}
        durationMinutes={view.durationMinutes}
        startDate={view.startDate}
        admin={isSuperAdmin}
        onSaved={onRefresh}
      />
    </PlatformLayout>
  );
}

function tableModels(view: TournamentScreenView) {
  const clubsById: Record<string, ClubSummary> = {};
  const clubNames: Record<string, string> = {};
  const remember = (row: { clubId?: string; clubName: string; clubSlug?: string | null; logoUrl?: string | null }) => {
    if (!row.clubId) return;
    clubNames[row.clubId] = row.clubName;
    clubsById[row.clubId] = {
      id: row.clubId,
      slug: row.clubSlug || row.clubId,
      name: row.clubName,
      logoUrl: row.logoUrl || undefined,
      active: true,
    };
  };
  view.standings.forEach(remember);
  view.scorers.forEach((row) => remember({ ...row, clubSlug: clubsById[row.clubId]?.slug, logoUrl: row.clubLogo }));
  const standings: StandingRow[] = view.standings.map((row: StandingRowView) => ({
    clubId: row.clubId || row.clubName,
    pj: row.played,
    g: row.won,
    e: row.drawn,
    p: row.lost,
    gf: row.goalsFor,
    gc: row.goalsAgainst,
    dg: row.goalDiff,
    pts: row.points,
  }));
  const scorers: Array<ScorerRow & { imageUrl?: string }> = view.scorers.map((row) => ({
    playerId: row.playerId,
    name: row.name,
    clubId: row.clubId,
    goals: row.goals,
    assists: row.assists,
    imageUrl: row.imageUrl,
  }));
  return { standings, scorers, clubsById, clubNames };
}

function BackLink() {
  return (
    <Link to="/torneos" style={{ fontSize: "0.8rem", fontWeight: 700, color: C.gray500, textDecoration: "none" }}>
      ← Torneos
    </Link>
  );
}

function Podium({ slots }: { slots: PodiumSlotView[] }) {
  return (
    <SectionCard title="Podio" icon={<Trophy size={16} color={C.amber} />} style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "0.55rem", alignItems: "end" }}>
        {slots.map((slot, index) => {
          const style = PODIUM_STYLE[index] ?? PODIUM_STYLE[2];
          const Icon = index === 1 ? Trophy : Medal;
          return (
            <div
              key={slot.placeLabel}
              style={{
                textAlign: "center",
                padding: "1rem 0.7rem 0.85rem",
                border: `1px solid ${style.border}`,
                background: style.bg,
                borderRadius: RADIUS.lg,
                minHeight: style.minH,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.35rem",
              }}
            >
              <Icon size={index === 1 ? 28 : 22} color={style.accent} />
              <div style={{ fontWeight: 800, fontSize: "0.62rem", color: style.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {slot.placeLabel}
              </div>
              {slot.clubName && slot.clubHref ? (
                <Link to={slot.clubHref} style={clubLink}>
                  {slot.clubName}
                </Link>
              ) : (
                <span style={{ color: C.gray400, fontWeight: 700 }}>{slot.clubName || "—"}</span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

const metaChip = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: C.gray600,
  backgroundColor: C.gray100,
  border: `1px solid ${C.gray200}`,
  borderRadius: RADIUS.full,
  padding: "0.2rem 0.6rem",
} as const;

const editButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  border: `1px solid ${C.gray200}`,
  background: C.white,
  color: C.navy900,
  borderRadius: 999,
  padding: "0.2rem 0.6rem",
  fontWeight: 800,
  fontSize: "0.72rem",
  cursor: "pointer",
} as const;

const textButton = {
  color: C.navy900,
  fontWeight: 700,
  fontSize: "0.85rem",
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;

const clubLink = { color: C.navy900, fontWeight: 800, textDecoration: "none" } as const;
