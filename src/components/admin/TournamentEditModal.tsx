import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import { updateDoc } from "firebase/firestore";
import { tournamentRef } from "../../lib/paths";
import {
  expectedMatchCount,
  playedReturnsIfSingleLeg,
  syncTournamentFixtures,
  tournamentLegs,
} from "../../lib/fixtures";
import { useAuth } from "../../context/AuthContext";
import { usePlatformCatalog, useTournamentMatches } from "../../hooks/usePlatformCatalog";
import { useModalLock } from "../../hooks/useModalLock";
import { isPlayed } from "../../lib/stats";
import {
  FOOTBALL_TYPES,
  asFootballType,
  footballTypeLabel,
  type ClubSummary,
  type FootballType,
  type Tournament,
} from "../../lib/types";
import ConfirmModal from "../ConfirmModal";
import Field from "./Field";
import {
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SHADOWS,
  SecondaryButton,
  SegmentedControl,
} from "../ui";

const EditCtx = createContext<{ openEdit: (id: string) => void }>({
  openEdit: () => {},
});

export function useTournamentEdit() {
  return useContext(EditCtx);
}

export function TournamentEditHost({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const [id, setId] = useState<string | null>(null);
  const openEdit = useCallback(
    (tournamentId: string) => {
      if (!isSuperAdmin) return;
      setId(tournamentId);
    },
    [isSuperAdmin],
  );
  const close = useCallback(() => setId(null), []);

  return (
    <EditCtx.Provider value={{ openEdit }}>
      {children}
      {isSuperAdmin && id ? (
        <TournamentEditModal tournamentId={id} onClose={close} />
      ) : null}
    </EditCtx.Provider>
  );
}

export default function TournamentEditModal({
  tournamentId,
  onClose,
}: {
  tournamentId: string;
  onClose: () => void;
}) {
  const { tournamentsById, clubs, categoryName } = usePlatformCatalog();
  const tournament = tournamentsById[tournamentId];
  const { matches, loading: matchesLoading } = useTournamentMatches(tournamentId);
  const [draftClubIds, setDraftClubIds] = useState<string[]>([]);
  const [draftLegs, setDraftLegs] = useState<1 | 2>(2);
  const [draftFootballType, setDraftFootballType] = useState<FootballType>(7);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const hasTournament = Boolean(tournament);

  useModalLock(saveOpen ? null : onClose);

  useEffect(() => {
    if (!tournament) return;
    setDraftClubIds([...tournament.clubIds]);
    setDraftLegs(tournamentLegs(tournament));
    setDraftFootballType(asFootballType(tournament.footballType));
    setDraftStartDate(tournament.startDate || "");
    setSaveOpen(false);
    setReady(true);
  }, [tournamentId, hasTournament]);

  useEffect(() => {
    if (ready && !hasTournament) onClose();
  }, [ready, hasTournament, onClose]);

  const clubNames = useMemo(
    () => Object.fromEntries(clubs.map((c) => [c.id, c.name])),
    [clubs],
  );
  const lockedClubIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of matches) {
      if (!isPlayed(m)) continue;
      ids.add(m.homeClubId);
      ids.add(m.awayClubId);
    }
    return ids;
  }, [matches]);

  if (!tournament || !ready) return null;

  const catLabel = categoryName[tournament.categoryId] || "—";
  const enrolled = clubs.filter((c) => draftClubIds.includes(c.id));
  const addable = clubs.filter((c) => c.active && !draftClubIds.includes(c.id));
  const savedLegs = tournamentLegs(tournament);
  const savedFootballType = asFootballType(tournament.footballType);
  const savedStartDate = tournament.startDate || "";
  const dirty =
    draftLegs !== savedLegs ||
    draftFootballType !== savedFootballType ||
    draftStartDate !== savedStartDate ||
    !sameIdList(draftClubIds, tournament.clubIds);
  const planned = expectedMatchCount(draftClubIds.length, draftLegs);
  const playedReturns =
    draftLegs === 1
      ? playedReturnsIfSingleLeg(
          { ...tournament, clubIds: draftClubIds, legs: 1 },
          matches,
        )
      : [];

  const addClub = (clubId: string) => {
    if (draftClubIds.includes(clubId)) return;
    setDraftClubIds([...draftClubIds, clubId]);
  };

  const removeClub = (clubId: string) => {
    if (lockedClubIds.has(clubId)) return;
    setDraftClubIds(draftClubIds.filter((id) => id !== clubId));
  };

  const cancelDraft = () => {
    setDraftClubIds([...tournament.clubIds]);
    setDraftLegs(savedLegs);
    setDraftFootballType(savedFootballType);
    setDraftStartDate(savedStartDate);
    setSaveOpen(false);
    onClose();
  };

  const confirmSave = async () => {
    try {
      setBusy(true);
      const nextClubIds = [
        ...draftClubIds.filter((id) => !lockedClubIds.has(id) || tournament.clubIds.includes(id)),
        ...tournament.clubIds.filter((id) => lockedClubIds.has(id) && !draftClubIds.includes(id)),
      ];
      await updateDoc(tournamentRef(tournament.id), {
        clubIds: nextClubIds,
        legs: draftLegs,
        footballType: draftFootballType,
        startDate: draftStartDate || null,
      });
      setSaveOpen(false);
    } catch (err) {
      console.error(err);
      alert("No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tournament-edit-title"
      onClick={saveOpen ? undefined : onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        backgroundColor: "rgba(20, 18, 15, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="compact-form"
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          border: `1px solid ${C.gray200}`,
          boxShadow: SHADOWS.xl,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: "absolute",
            top: "0.7rem",
            right: "0.7rem",
            background: "none",
            border: "none",
            color: C.gray400,
            cursor: "pointer",
            padding: "0.2rem",
            zIndex: 1,
          }}
        >
          <X size={18} />
        </button>
        <div style={{ padding: "1.15rem 1.2rem 0" }}>
        <h3
          id="tournament-edit-title"
          style={{
            margin: "0 1.75rem 0.25rem 0",
            fontSize: "1.05rem",
            fontWeight: 800,
            color: C.navy900,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Pencil size={16} color={C.amber} /> Editar torneo
        </h3>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.8rem", color: C.gray500 }}>
          {tournament.name}
          {catLabel !== "—" ? ` · ${catLabel}` : ""}
        </p>
        </div>

        <div style={{ padding: "0 1.2rem", overflowY: "auto", flex: 1, minHeight: 0 }}>

        <TournamentSync
          tournament={tournament}
          matches={matches}
          matchesLoading={matchesLoading}
          dirty={dirty}
        />

        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            margin: "0 0 0.4rem",
          }}
        >
          Equipos — {catLabel}
        </div>
        <ClubEnrollPicker
          enrolled={enrolled}
          addable={addable}
          lockedIds={lockedClubIds}
          onAdd={addClub}
          onRemove={removeClub}
        />

        <div className="tournament-edit-settings">
          <Field label="Tipo de fútbol">
            <div style={{ maxWidth: 360 }}>
              <SegmentedControl
                value={String(draftFootballType)}
                onChange={(v) => setDraftFootballType(asFootballType(Number(v)))}
                options={FOOTBALL_TYPES.map((n) => ({
                  label: `Fútbol ${n}`,
                  value: String(n),
                }))}
              />
            </div>
          </Field>
          <Field label="Fecha de inicio">
            <FormInput
              type="date"
              value={draftStartDate}
              onChange={(e) => setDraftStartDate(e.target.value)}
            />
          </Field>
        </div>

        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            margin: "0.95rem 0 0.4rem",
          }}
        >
          Vueltas — {catLabel}
        </div>
        <div style={{ maxWidth: 360 }}>
          <SegmentedControl
            value={String(draftLegs)}
            onChange={(v) => setDraftLegs(v === "1" ? 1 : 2)}
            options={[
              { label: "1 partido", value: "1" },
              { label: "Ida y vuelta", value: "2" },
            ]}
          />
        </div>
        <p style={{ margin: "0.45rem 0 0", fontSize: "0.75rem", color: C.gray500 }}>
          {matchesLoading
            ? "Cargando calendario…"
            : draftClubIds.length < 2
              ? "Con 2 o más equipos se genera el calendario según este formato."
              : `${planned} partido${planned === 1 ? "" : "s"} en esta categoría. Fecha, hora y sede se asignan en la ficha del torneo.`}
        </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: "0.5rem",
            padding: "1rem 1.2rem 1.1rem",
          }}
        >
          <SecondaryButton type="button" disabled={busy} onClick={cancelDraft}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={!dirty || busy || matchesLoading}
            onClick={() => setSaveOpen(true)}
          >
            Guardar
          </PrimaryButton>
        </div>

        <ConfirmModal
          open={saveOpen}
          title={`Guardar ${catLabel}`}
          message={saveMessage(
            tournament,
            draftClubIds,
            draftLegs,
            savedLegs,
            draftFootballType,
            savedFootballType,
            draftStartDate,
            savedStartDate,
            clubNames,
            playedReturns,
          )}
          confirmLabel="Guardar cambios"
          danger={playedReturns.length > 0}
          busy={busy}
          onCancel={() => setSaveOpen(false)}
          onConfirm={() => void confirmSave()}
        />
      </div>
    </div>,
    document.body,
  );
}

function TournamentSync({
  tournament,
  matches,
  matchesLoading,
  dirty,
}: {
  tournament: Tournament;
  matches: ReturnType<typeof useTournamentMatches>["matches"];
  matchesLoading: boolean;
  dirty: boolean;
}) {
  useEffect(() => {
    if (matchesLoading || dirty) return;
    void syncTournamentFixtures(tournament, matches);
  }, [
    matchesLoading,
    dirty,
    tournament,
    tournament.id,
    tournament.legs,
    tournament.clubIds.join(","),
    matches,
  ]);
  return null;
}

function ClubEnrollPicker({
  enrolled,
  addable,
  lockedIds,
  onAdd,
  onRemove,
}: {
  enrolled: ClubSummary[];
  addable: ClubSummary[];
  lockedIds: Set<string>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div
      ref={boxRef}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.4rem",
        alignItems: "center",
      }}
    >
      {enrolled.map((c) => {
        const locked = lockedIds.has(c.id);
        return (
        <button
          key={c.id}
          type="button"
          title={
            locked
              ? "No se puede quitar: ya tiene partidos jugados"
              : "Quitar"
          }
          disabled={locked}
          onClick={() => onRemove(c.id)}
          style={{
            border: `1px solid ${locked ? C.gray300 : C.amber}`,
            backgroundColor: locked ? C.gray100 : C.amberLight,
            color: locked ? C.gray500 : C.navy900,
            borderRadius: RADIUS.full,
            padding: "0.3rem 0.7rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: locked ? "not-allowed" : "pointer",
            opacity: locked ? 0.85 : 1,
          }}
        >
          {c.name}
          {locked ? "" : " ×"}
        </button>
        );
      })}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Añadir equipo"
          title="Añadir equipo"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.full,
            border: `1px dashed ${C.amber}`,
            backgroundColor: C.white,
            color: C.amber,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={16} />
        </button>
        {open && (
          <div
            style={{
              position: "absolute",
              zIndex: 30,
              top: "calc(100% + 6px)",
              left: 0,
              width: "min(280px, calc(100vw - 3.5rem))",
              maxHeight: 280,
              overflowY: "auto",
              padding: "0.75rem",
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: RADIUS.lg,
              boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                marginBottom: "0.45rem",
              }}
            >
              Equipos disponibles
            </div>
            {addable.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray400 }}>
                No hay clubes activos por inscribir en esta categoría.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {addable.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onAdd(c.id)}
                    style={{
                      border: `1px solid ${C.gray300}`,
                      backgroundColor: C.white,
                      color: C.gray700,
                      borderRadius: RADIUS.full,
                      padding: "0.3rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function sameIdList(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}

function saveMessage(
  tournament: Tournament,
  draftClubIds: string[],
  draftLegs: 1 | 2,
  savedLegs: 1 | 2,
  draftFootballType: FootballType,
  savedFootballType: FootballType,
  draftStartDate: string,
  savedStartDate: string,
  clubNames: Record<string, string>,
  playedReturns: { homeClubId: string; awayClubId: string }[],
) {
  const added = draftClubIds.filter((id) => !tournament.clubIds.includes(id));
  const removed = tournament.clubIds.filter((id) => !draftClubIds.includes(id));
  const lines: string[] = [];

  if (added.length) {
    lines.push(
      `Se inscribirán: ${added.map((id) => clubNames[id] || id).join(", ")}.`,
    );
  }
  if (removed.length) {
    lines.push(
      `Se darán de baja: ${removed.map((id) => clubNames[id] || id).join(", ")}. Los partidos no jugados de esos equipos se eliminarán.`,
    );
  }
  if (draftLegs !== savedLegs) {
    lines.push(
      draftLegs === 1
        ? "El formato pasa a 1 partido."
        : "El formato pasa a ida y vuelta.",
    );
  }
  if (draftFootballType !== savedFootballType) {
    lines.push(`El tipo pasa a ${footballTypeLabel(draftFootballType)}.`);
  }
  if (draftStartDate !== savedStartDate) {
    lines.push(
      draftStartDate
        ? `La fecha de inicio pasa a ${draftStartDate}.`
        : "Se quita la fecha de inicio del torneo.",
    );
  }
  if (playedReturns.length) {
    lines.push(
      `Se eliminarán ${playedReturns.length} partido${playedReturns.length === 1 ? "" : "s"} de vuelta ya jugado${playedReturns.length === 1 ? "" : "s"} (los más recientes), junto con sus estadísticas:`,
    );
    playedReturns.forEach((m) => {
      lines.push(
        `• ${clubNames[m.homeClubId] || m.homeClubId} vs ${clubNames[m.awayClubId] || m.awayClubId}`,
      );
    });
  }
  if (lines.length === 0) {
    return "No hay cambios para guardar.";
  }
  lines.push("\n¿Confirmas guardar estos cambios?");
  return lines.join("\n");
}
