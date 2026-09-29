import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Calendar, ChevronDown, MapPin } from "lucide-react";
import { updateDoc } from "firebase/firestore";
import { matchRef, tournamentRef } from "../../lib/paths";
import {
  calendarStatus,
  groupMatchesByRound,
  isPlayed,
} from "../../lib/stats";
import type { Match, MatchSide, Tournament } from "../../lib/types";
import { formatFriendlyTime, formatShortDate } from "../../utils/helpers";
import {
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SectionCard,
} from "../ui";
import MatchStatsEditor from "./MatchStatsEditor";

export default function TournamentCalendar({
  tournament,
  matches,
  loading,
  clubNames,
  isAdmin,
}: {
  tournament: Tournament;
  matches: Match[];
  loading: boolean;
  clubNames: Record<string, string>;
  isAdmin: boolean;
}) {
  const { openGroups, finishedGroups } = useMemo(() => {
    const groups = groupMatchesByRound(matches);
    const open: typeof groups = [];
    const finished: typeof groups = [];
    for (const group of groups) {
      if (group.list.length > 0 && group.list.every(isPlayed)) finished.push(group);
      else open.push(group);
    }
    return { openGroups: open, finishedGroups: finished };
  }, [matches]);

  return (
    <SectionCard title="Calendario" icon={<Calendar size={16} />}>
      {loading ? (
        <p style={{ margin: 0, color: C.gray400 }}>Cargando partidos…</p>
      ) : matches.length === 0 ? (
        <p style={{ margin: 0, color: C.gray400 }}>
          {tournament.clubIds.length < 2
            ? "Inscribe al menos 2 equipos para generar el calendario."
            : "Sin partidos."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {isAdmin && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>
              Toca Editar para fecha, hora y sede. Marcador abre goles,
              asistencias y tarjetas.
            </p>
          )}
          {openGroups.map((group) => (
            <RoundBlock
              key={group.round}
              round={group.round}
              matches={group.list}
              tournament={tournament}
              clubNames={clubNames}
              isAdmin={isAdmin}
              collapsed={false}
            />
          ))}
          {finishedGroups.map((group) => (
            <RoundBlock
              key={group.round}
              round={group.round}
              matches={group.list}
              tournament={tournament}
              clubNames={clubNames}
              isAdmin={isAdmin}
              collapsed
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function roundTitle(round: string) {
  return /^\d+$/.test(round) ? `Jornada ${round}` : round;
}

function RoundBlock({
  round,
  matches,
  tournament,
  clubNames,
  isAdmin,
  collapsed,
}: {
  round: string;
  matches: Match[];
  tournament: Tournament;
  clubNames: Record<string, string>;
  isAdmin: boolean;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(!collapsed);
  const title = roundTitle(round);

  const list = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          tournament={tournament}
          clubNames={clubNames}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );

  if (!collapsed) {
    return (
      <div>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "0.3rem",
          }}
        >
          {title}
        </div>
        {list}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.15rem 0 0.35rem",
          marginBottom: open ? "0.2rem" : 0,
          background: "none",
          border: "none",
          borderBottom: `1px solid ${C.gray200}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            color: C.gray600,
            fontWeight: 800,
            fontSize: "0.65rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <ChevronDown
            size={14}
            color={C.gray400}
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s ease",
            }}
          />
          {title}
        </span>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: C.gray400 }}>
          {matches.length} {matches.length === 1 ? "partido" : "partidos"}
        </span>
      </button>
      {open ? list : null}
    </div>
  );
}

function MatchRow({
  match,
  tournament,
  clubNames,
  isAdmin,
}: {
  match: Match;
  tournament: Tournament;
  clubNames: Record<string, string>;
  isAdmin: boolean;
}) {
  const status = calendarStatus(match);
  const played = isPlayed(match);
  const [date, setDate] = useState(match.date || "");
  const [time, setTime] = useState(match.time || "");
  const [venue, setVenue] = useState(match.venue || "");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    setDate(match.date || "");
    setTime(match.time || "");
    setVenue(match.venue || "");
  }, [match.date, match.time, match.venue]);

  const saveSchedule = async () => {
    try {
      setBusy(true);
      const scheduled = Boolean(date && time);
      await updateDoc(matchRef(match.id), {
        date: date || "",
        time: time || "",
        venue: venue.trim(),
        status: played ? "played" : scheduled ? "scheduled" : "unscheduled",
        updatedAt: new Date().toISOString(),
      });
      if (scheduled && tournament.status === "upcoming") {
        await updateDoc(tournamentRef(tournament.id), { status: "active" });
      }
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la programación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        padding: "0.4rem 0.6rem",
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.md,
        backgroundColor: C.white,
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.65rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.8rem",
                lineHeight: 1.25,
                color: C.gray800,
                overflowWrap: "break-word",
              }}
            >
              {clubNames[match.homeClubId] || match.homeClubId} vs{" "}
              {clubNames[match.awayClubId] || match.awayClubId}
            </div>
            {played ? (
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                }}
              >
                {match.homeScore}-{match.awayScore}
              </span>
            ) : null}
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              color: C.gray500,
              fontWeight: 600,
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.15rem 0.55rem",
            }}
          >
            <span>
              {status === "unscheduled"
                ? "Por definir"
                : [formatShortDate(match.date || ""), formatFriendlyTime(match.time || "")]
                    .filter(Boolean)
                    .join(" · ")}
            </span>
            {match.venue && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <MapPin size={10} /> {match.venue}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            flexShrink: 0,
          }}
        >
          {hasMatchSummary(match) && (
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              aria-expanded={summaryOpen}
              style={linkBtn}
            >
              {summaryOpen ? "Ocultar" : "Resumen"}
            </button>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                style={linkBtn}
              >
                {editing ? "Cerrar" : "Editar"}
              </button>
              <button
                type="button"
                onClick={() => setStatsOpen(true)}
                style={linkBtn}
              >
                Marcador
              </button>
            </>
          )}
        </div>
      </div>

      {summaryOpen && (
        <MatchSummaryPanel match={match} clubNames={clubNames} />
      )}

      {isAdmin && editing && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            paddingTop: "0.15rem",
          }}
        >
          <div className="match-edit-when">
            <label style={matchField}>
              <span style={matchFieldLabel}>Fecha</span>
              <FormInput
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Fecha"
                style={compactInput}
              />
            </label>
            <label style={matchField}>
              <span style={matchFieldLabel}>Hora</span>
              <FormInput
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Hora"
                style={compactInput}
              />
            </label>
          </div>
          <label style={matchField}>
            <span style={matchFieldLabel}>Sede</span>
            <FormInput
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Sede"
              aria-label="Sede"
              style={compactInput}
            />
          </label>
          <div className="match-edit-actions">
            <PrimaryButton
              type="button"
              disabled={busy}
              onClick={() => void saveSchedule()}
              style={compactBtn}
            >
              {busy ? "…" : "Guardar"}
            </PrimaryButton>
          </div>
        </div>
      )}
      {statsOpen && (
        <MatchStatsEditor
          match={match}
          tournament={tournament}
          clubNames={clubNames}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </div>
  );
}

function hasMatchSummary(match: Match) {
  const home = match.sides?.[match.homeClubId];
  const away = match.sides?.[match.awayClubId];
  return Boolean(
    goalLines(home).length ||
      goalLines(away).length ||
      cardNames(home, "yellowCards").length ||
      cardNames(away, "yellowCards").length ||
      cardNames(home, "redCards").length ||
      cardNames(away, "redCards").length,
  );
}

function MatchSummaryPanel({
  match,
  clubNames,
}: {
  match: Match;
  clubNames: Record<string, string>;
}) {
  const home = match.sides?.[match.homeClubId];
  const away = match.sides?.[match.awayClubId];
  const homeName = clubNames[match.homeClubId] || "Local";
  const awayName = clubNames[match.awayClubId] || "Visita";
  const homeGoals = goalLines(home);
  const awayGoals = goalLines(away);
  const homeY = cardNames(home, "yellowCards");
  const awayY = cardNames(away, "yellowCards");
  const homeR = cardNames(home, "redCards");
  const awayR = cardNames(away, "redCards");
  const showGoals = homeGoals.length > 0 || awayGoals.length > 0;
  const showYellow = homeY.length > 0 || awayY.length > 0;
  const showRed = homeR.length > 0 || awayR.length > 0;

  return (
    <div
      style={{
        borderTop: `1px solid ${C.gray200}`,
        paddingTop: "0.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        fontSize: "0.72rem",
        color: C.gray700,
      }}
    >
      {showGoals && (
        <SummaryBlock title="Goles">
          <TeamLine name={homeName} items={homeGoals} empty="Sin goles" />
          <TeamLine name={awayName} items={awayGoals} empty="Sin goles" />
        </SummaryBlock>
      )}
      {showYellow && (
        <SummaryBlock title="Tarjetas amarillas">
          <TeamLine name={homeName} items={homeY} empty="Ninguna" />
          <TeamLine name={awayName} items={awayY} empty="Ninguna" />
        </SummaryBlock>
      )}
      {showRed && (
        <SummaryBlock title="Tarjetas rojas">
          <TeamLine name={homeName} items={homeR} empty="Ninguna" />
          <TeamLine name={awayName} items={awayR} empty="Ninguna" />
        </SummaryBlock>
      )}
    </div>
  );
}

function SummaryBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: C.gray500,
          marginBottom: "0.2rem",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function TeamLine({
  name,
  items,
  empty,
}: {
  name: string;
  items: string[];
  empty: string;
}) {
  return (
    <div style={{ lineHeight: 1.4 }}>
      <span style={{ fontWeight: 800, color: C.navy900 }}>{name}</span>
      <span style={{ color: C.gray500 }}> · </span>
      <span style={{ fontWeight: 600, color: items.length ? C.gray700 : C.gray400 }}>
        {items.length ? items.join(" · ") : empty}
      </span>
    </div>
  );
}

function goalLines(side?: MatchSide) {
  if (!side?.stats?.length) return [];
  const names = side.playerNames || {};
  return side.stats
    .filter((s) => s.scorer)
    .map((s) => {
      const scorer = names[s.scorer] || s.scorer;
      if (s.isOwnGoal) return `${scorer}, autogol`;
      if (s.isPenalty) return `${scorer}, penal`;
      if (s.assist) return `${scorer}, asistencia ${names[s.assist] || s.assist}`;
      return scorer;
    });
}

function cardNames(side: MatchSide | undefined, key: "yellowCards" | "redCards") {
  if (!side?.[key]?.length) return [];
  const names = side.playerNames || {};
  return side[key]!.map((id) => names[id] || id);
}

const compactInput: CSSProperties = {
  padding: "0.35rem 0.5rem",
  fontSize: "0.78rem",
};

const linkBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: C.navy900,
  fontSize: "0.68rem",
  fontWeight: 800,
  cursor: "pointer",
  padding: "0.15rem 0",
};

const compactBtn: CSSProperties = {
  padding: "0.35rem 0.6rem",
  fontSize: "0.72rem",
};

const matchField: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const matchFieldLabel: CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 700,
  color: C.gray500,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
