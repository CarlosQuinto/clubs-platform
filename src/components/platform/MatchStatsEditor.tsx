import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getDocs, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useModalLock } from "../../hooks/useModalLock";
import { clubCol, matchRef, tournamentRef } from "../../lib/paths";
import type { GoalStat, Match, Tournament } from "../../lib/types";
import {
  C,
  FormSelect,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SHADOWS,
} from "../ui";

const SCORE_MAX = 30;

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

  const [homeScore, setHomeScore] = useState(clampScore(match.homeScore));
  const [awayScore, setAwayScore] = useState(clampScore(match.awayScore));
  const [homeGoals, setHomeGoals] = useState<GoalRow[]>(
    padGoals(homeSide?.stats, clampScore(match.homeScore)),
  );
  const [awayGoals, setAwayGoals] = useState<GoalRow[]>(
    padGoals(awaySide?.stats, clampScore(match.awayScore)),
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

  const homeN = homeScore;
  const awayN = awayScore;

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
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "4vh 0.75rem 0.75rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="match-stats-panel"
        style={{
          width: "min(800px, 100%)",
          maxHeight: "calc(100dvh - 4vh - 1.5rem)",
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
          <button type="button" onClick={onClose} aria-label="Cerrar" className="match-stats-close">
            <X size={18} />
          </button>
        </div>

        <div className="match-stats-body">
          <div className="match-scoreboard">
            <ScoreStepper
              name={homeName}
              value={homeN}
              onChange={setHomeScore}
            />
            <span className="match-scoreboard__sep" aria-hidden="true">
              –
            </span>
            <ScoreStepper
              name={awayName}
              value={awayN}
              onChange={setAwayScore}
            />
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

function ScoreStepper({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const up = () => onChange(stepScore(value, 1));
  const down = () => onChange(stepScore(value, -1));
  return (
    <div className="score-stepper">
      <span className="score-stepper__name">{name}</span>
      <div className="score-stepper__ctrl">
        <button
          type="button"
          className="score-stepper__btn"
          aria-label={`Subir marcador de ${name}`}
          onClick={up}
          disabled={value >= SCORE_MAX}
        >
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>
        <span className="score-stepper__value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="score-stepper__btn"
          aria-label={`Bajar marcador de ${name}`}
          onClick={down}
          disabled={value <= 0}
        >
          <ChevronDown size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
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
      <div className="match-team-block__name">{name}</div>

      <div className="match-section-label">Goles</div>
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

      <IdList
        label="Amarillas"
        tone="yellow"
        ids={yellow}
        onChange={onYellow}
        players={options}
      />
      <IdList
        label="Rojas"
        tone="red"
        ids={red}
        onChange={onRed}
        players={options}
      />
    </div>
  );
}

function IdList({
  label,
  tone,
  ids,
  onChange,
  players,
}: {
  label: string;
  tone: "yellow" | "red";
  ids: string[];
  onChange: (ids: string[]) => void;
  players: Player[];
}) {
  return (
    <div className={`match-discipline match-discipline--${tone}`}>
      <div className="match-discipline__head">
        <span className="match-section-label">{label}</span>
        <button
          type="button"
          className="match-discipline__add"
          onClick={() => onChange([...ids, ""])}
        >
          <Plus size={12} /> Añadir
        </button>
      </div>
      {ids.length === 0 ? (
        <p className="match-discipline__empty">Ninguna.</p>
      ) : (
        <div className="match-discipline__list">
          {ids.map((id, i) => (
            <div key={`${label}-${i}`} className="match-discipline__row">
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
                className="match-discipline__remove"
                aria-label={`Quitar ${label.toLowerCase()}`}
                onClick={() => onChange(ids.filter((_, idx) => idx !== i))}
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

function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(SCORE_MAX, Math.round(value)));
}

function stepScore(current: number, delta: number) {
  return clampScore(current + delta);
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

const squadCache = new Map<string, Player[]>();
const squadPending = new Map<string, Promise<Player[]>>();

/** Se vacía al salir de la ficha para no conservar plantillas de otra visita. */
export function clearMatchSquadCache() {
  squadCache.clear();
  squadPending.clear();
}

async function loadPlayers(clubId: string): Promise<Player[]> {
  const cached = squadCache.get(clubId);
  if (cached) return cached;
  const pending = squadPending.get(clubId);
  if (pending) return pending;

  const request = getDocs(clubCol(clubId, "players"))
    .then((snap) => {
      const players = snap.docs
        .map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data.name || d.id };
        })
        .filter((p) => p.name);
      squadCache.set(clubId, players);
      squadPending.delete(clubId);
      return players;
    })
    .catch((err) => {
      squadPending.delete(clubId);
      throw err;
    });
  squadPending.set(clubId, request);
  return request;
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

