import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { getDocs, updateDoc } from "firebase/firestore";
import { Plus, X } from "lucide-react";
import { useModalLock } from "../../hooks/useModalLock";
import { clubCol, matchRef, tournamentRef } from "../../lib/paths";
import type { GoalStat, Match, Tournament } from "../../lib/types";
import {
  C,
  FormInput,
  FormSelect,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SHADOWS,
} from "../ui";

type GoalRow = {
  scorer: string;
  assist: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
};
type Player = { id: string; name: string };

export default function MatchStatsEditor({
  match,
  tournament,
  clubNames,
  onClose,
}: {
  match: Match;
  tournament: Tournament;
  clubNames: Record<string, string>;
  onClose: () => void;
}) {
  useModalLock(onClose);

  const homeName = clubNames[match.homeClubId] || "Local";
  const awayName = clubNames[match.awayClubId] || "Visita";
  const homeSide = match.sides?.[match.homeClubId];
  const awaySide = match.sides?.[match.awayClubId];

  const [homeScore, setHomeScore] = useState(String(match.homeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(match.awayScore ?? 0));
  const [homeGoals, setHomeGoals] = useState<GoalRow[]>(
    padGoals(homeSide?.stats, Number(match.homeScore ?? 0)),
  );
  const [awayGoals, setAwayGoals] = useState<GoalRow[]>(
    padGoals(awaySide?.stats, Number(match.awayScore ?? 0)),
  );
  const [homeYellow, setHomeYellow] = useState<string[]>(
    homeSide?.yellowCards?.length ? [...homeSide.yellowCards] : [],
  );
  const [awayYellow, setAwayYellow] = useState<string[]>(
    awaySide?.yellowCards?.length ? [...awaySide.yellowCards] : [],
  );
  const [homeRed, setHomeRed] = useState<string[]>(
    homeSide?.redCards?.length ? [...homeSide.redCards] : [],
  );
  const [awayRed, setAwayRed] = useState<string[]>(
    awaySide?.redCards?.length ? [...awaySide.redCards] : [],
  );
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingPlayers(true);
    void Promise.all([
      loadPlayers(match.homeClubId),
      loadPlayers(match.awayClubId),
    ]).then(([home, away]) => {
      if (cancelled) return;
      setHomePlayers(home);
      setAwayPlayers(away);
      setLoadingPlayers(false);
    });
    return () => {
      cancelled = true;
    };
  }, [match.homeClubId, match.awayClubId]);

  const homeN = Math.max(0, parseInt(homeScore, 10) || 0);
  const awayN = Math.max(0, parseInt(awayScore, 10) || 0);

  useEffect(() => {
    setHomeGoals((rows) => padGoals(rows, homeN));
  }, [homeN]);
  useEffect(() => {
    setAwayGoals((rows) => padGoals(rows, awayN));
  }, [awayN]);

  const save = async () => {
    try {
      setBusy(true);
      const names = {
        ...nameMap(homePlayers),
        ...nameMap(awayPlayers),
        ...(homeSide?.playerNames || {}),
        ...(awaySide?.playerNames || {}),
      };
      const homeStats = compactGoals(homeGoals, homeN);
      const awayStats = compactGoals(awayGoals, awayN);
      const used = [
        ...homeStats.flatMap((g) => [g.scorer, g.assist]),
        ...awayStats.flatMap((g) => [g.scorer, g.assist]),
        ...homeYellow,
        ...awayYellow,
        ...homeRed,
        ...awayRed,
      ].filter(Boolean) as string[];
      const playerNames: Record<string, string> = {};
      used.forEach((id) => {
        playerNames[id] = names[id] || id;
      });

      await updateDoc(matchRef(match.id), {
        homeScore: homeN,
        awayScore: awayN,
        status: "played",
        updatedAt: new Date().toISOString(),
        [`sides.${match.homeClubId}.stats`]: homeStats,
        [`sides.${match.homeClubId}.yellowCards`]: homeYellow.filter(Boolean),
        [`sides.${match.homeClubId}.redCards`]: homeRed.filter(Boolean),
        [`sides.${match.homeClubId}.playerNames`]: {
          ...(homeSide?.playerNames || {}),
          ...pick(playerNames, [
            ...homeStats.flatMap((g) => [g.scorer, g.assist]),
            ...homeYellow,
            ...homeRed,
          ]),
        },
        [`sides.${match.awayClubId}.stats`]: awayStats,
        [`sides.${match.awayClubId}.yellowCards`]: awayYellow.filter(Boolean),
        [`sides.${match.awayClubId}.redCards`]: awayRed.filter(Boolean),
        [`sides.${match.awayClubId}.playerNames`]: {
          ...(awaySide?.playerNames || {}),
          ...pick(playerNames, [
            ...awayStats.flatMap((g) => [g.scorer, g.assist]),
            ...awayYellow,
            ...awayRed,
          ]),
        },
      });
      if (tournament.status === "upcoming") {
        await updateDoc(tournamentRef(tournament.id), { status: "active" });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("No se pudieron guardar las estadísticas.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-stats-title"
      onClick={onClose}
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(20, 18, 15, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.75rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="match-stats-panel"
        style={{
          width: "min(800px, 100%)",
          maxHeight: "92vh",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          boxShadow: SHADOWS.lg,
        }}
      >
        <div className="match-stats-head">
          <div>
            <h2
              id="match-stats-title"
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 900,
                color: C.navy900,
              }}
            >
              Marcador y estadísticas
            </h2>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.78rem",
                color: C.gray500,
              }}
            >
              {homeName} vs {awayName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              border: "none",
              background: "transparent",
              color: C.gray500,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="match-stats-body">
          <div className="match-scoreboard">
            <label className="match-scoreboard__team">
              <span className="match-scoreboard__name">{homeName}</span>
              <FormInput
                type="number"
                min={0}
                inputMode="numeric"
                value={homeScore}
                aria-label={`Goles ${homeName}`}
                onChange={(e) => setHomeScore(e.target.value)}
                style={{
                  width: "4.4rem",
                  textAlign: "center",
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  padding: "0.45rem 0.3rem",
                }}
              />
            </label>
            <span className="match-scoreboard__sep">–</span>
            <label className="match-scoreboard__team">
              <span className="match-scoreboard__name">{awayName}</span>
              <FormInput
                type="number"
                min={0}
                inputMode="numeric"
                value={awayScore}
                aria-label={`Goles ${awayName}`}
                onChange={(e) => setAwayScore(e.target.value)}
                style={{
                  width: "4.4rem",
                  textAlign: "center",
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  padding: "0.45rem 0.3rem",
                }}
              />
            </label>
          </div>

          {loadingPlayers ? (
            <p style={{ color: C.gray400, fontSize: "0.85rem", margin: 0 }}>
              Cargando plantillas…
            </p>
          ) : (
            <div className="match-stats-grid">
              <TeamBlock
                name={homeName}
                goals={homeN}
                rows={homeGoals}
                onRows={setHomeGoals}
                yellow={homeYellow}
                onYellow={setHomeYellow}
                red={homeRed}
                onRed={setHomeRed}
                players={homePlayers}
                rivals={awayPlayers}
              />
              <TeamBlock
                name={awayName}
                goals={awayN}
                rows={awayGoals}
                onRows={setAwayGoals}
                yellow={awayYellow}
                onYellow={setAwayYellow}
                red={awayRed}
                onRed={setAwayRed}
                players={awayPlayers}
                rivals={homePlayers}
              />
            </div>
          )}
        </div>

        <div className="match-stats-footer">
          <SecondaryButton type="button" onClick={onClose} disabled={busy}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => void save()}
            disabled={busy || loadingPlayers}
          >
            {busy ? "Guardando…" : "Guardar"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TeamBlock({
  name,
  goals,
  rows,
  onRows,
  yellow,
  onYellow,
  red,
  onRed,
  players,
  rivals,
}: {
  name: string;
  goals: number;
  rows: GoalRow[];
  onRows: (rows: GoalRow[]) => void;
  yellow: string[];
  onYellow: (ids: string[]) => void;
  red: string[];
  onRed: (ids: string[]) => void;
  players: Player[];
  rivals: Player[];
}) {
  const options = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );
  const rivalOptions = useMemo(
    () => [...rivals].sort((a, b) => a.name.localeCompare(b.name)),
    [rivals],
  );

  const patch = (i: number, next: Partial<GoalRow>) =>
    onRows(rows.map((r, idx) => (idx === i ? { ...r, ...next } : r)));

  return (
    <div className="match-team-block">
      <div
        style={{
          fontWeight: 800,
          fontSize: "0.85rem",
          marginBottom: "0.7rem",
          color: C.navy900,
        }}
      >
        {name}
      </div>

      <div style={sectionLabel}>Goles</div>
      {goals === 0 ? (
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.75rem", color: C.gray400 }}>
          Sin goles.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginBottom: "0.95rem",
          }}
        >
          {rows.slice(0, goals).map((row, i) => {
            const scorers = row.isOwnGoal ? rivalOptions : options;
            return (
              <div key={i} className="match-goal-card">
                <div className="match-goal-card__label">
                  {row.isOwnGoal ? `Autogol ${i + 1}` : `Gol ${i + 1}`}
                </div>
                <FormSelect
                  value={row.scorer}
                  aria-label={`Goleador ${i + 1} ${name}`}
                  onChange={(e) => patch(i, { scorer: e.target.value })}
                >
                  <option value="">
                    {row.isOwnGoal ? "Jugador rival" : "Goleador"}
                  </option>
                  {scorers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </FormSelect>
                {!row.isOwnGoal && !row.isPenalty && (
                  <FormSelect
                    value={row.assist}
                    aria-label={`Asistencia ${i + 1} ${name}`}
                    onChange={(e) => patch(i, { assist: e.target.value })}
                  >
                    <option value="">Asistencia (opcional)</option>
                    {options.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
                <div className="match-goal-flags">
                  <button
                    type="button"
                    className={`match-flag${row.isPenalty ? " is-on" : ""}`}
                    aria-pressed={row.isPenalty}
                    onClick={() =>
                      patch(i, {
                        isPenalty: !row.isPenalty,
                        isOwnGoal: false,
                        assist: "",
                      })
                    }
                  >
                    Penal
                  </button>
                  <button
                    type="button"
                    className={`match-flag match-flag--og${row.isOwnGoal ? " is-on" : ""}`}
                    aria-pressed={row.isOwnGoal}
                    onClick={() =>
                      patch(i, {
                        isOwnGoal: !row.isOwnGoal,
                        isPenalty: false,
                        assist: "",
                        scorer: "",
                      })
                    }
                  >
                    Autogol
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <IdList label="Amarillas" ids={yellow} onChange={onYellow} players={options} />
      <IdList label="Rojas" ids={red} onChange={onRed} players={options} />
    </div>
  );
}

function IdList({
  label,
  ids,
  onChange,
  players,
}: {
  label: string;
  ids: string[];
  onChange: (ids: string[]) => void;
  players: Player[];
}) {
  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.35rem",
        }}
      >
        <span style={sectionLabel}>{label}</span>
        <button
          type="button"
          onClick={() => onChange([...ids, ""])}
          style={{
            border: "none",
            background: "transparent",
            color: C.navy900,
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Plus size={12} /> Añadir
        </button>
      </div>
      {ids.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray400 }}>Ninguna.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {ids.map((id, i) => (
            <div key={`${label}-${i}`} style={{ display: "flex", gap: "0.35rem" }}>
              <FormSelect
                value={id}
                onChange={(e) =>
                  onChange(ids.map((x, idx) => (idx === i ? e.target.value : x)))
                }
              >
                <option value="">Jugador</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </FormSelect>
              <button
                type="button"
                aria-label="Quitar"
                onClick={() => onChange(ids.filter((_, idx) => idx !== i))}
                style={{
                  border: "none",
                  background: "transparent",
                  color: C.gray400,
                  cursor: "pointer",
                  padding: "0 0.2rem",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function padGoals(stats: GoalStat[] | GoalRow[] | undefined, n: number): GoalRow[] {
  const src = (stats || []).map((s) => ({
    scorer: s.scorer || "",
    assist: s.assist || "",
    isPenalty: !!s.isPenalty,
    isOwnGoal: !!s.isOwnGoal,
  }));
  const next = src.slice(0, n);
  while (next.length < n)
    next.push({ scorer: "", assist: "", isPenalty: false, isOwnGoal: false });
  return next;
}

function compactGoals(rows: GoalRow[], n: number): GoalStat[] {
  return rows.slice(0, n).filter((g) => g.scorer).map((g) => {
    const row: GoalStat = { scorer: g.scorer };
    if (g.isOwnGoal) row.isOwnGoal = true;
    else if (g.isPenalty) row.isPenalty = true;
    else if (g.assist) row.assist = g.assist;
    return row;
  });
}

async function loadPlayers(clubId: string): Promise<Player[]> {
  const snap = await getDocs(clubCol(clubId, "players"));
  return snap.docs
    .map((d) => {
      const data = d.data() as { name?: string };
      return { id: d.id, name: data.name || d.id };
    })
    .filter((p) => p.name);
}

function nameMap(players: Player[]) {
  const map: Record<string, string> = {};
  players.forEach((p) => {
    map[p.id] = p.name;
  });
  return map;
}

function pick(names: Record<string, string>, ids: (string | undefined)[]) {
  const out: Record<string, string> = {};
  ids.filter(Boolean).forEach((id) => {
    if (id && names[id]) out[id] = names[id];
  });
  return out;
}

const sectionLabel: CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 800,
  color: C.gray500,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: 0,
};
