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
import { useLocation } from "react-router-dom";
import { Pencil, Plus, X } from "lucide-react";
import { diffFixtures, fixtureShape, lateWalkoverFixtures, playedReturnsIfSingleLeg, tournamentLegs, expectedMatchCount, type LateEntryChoice } from "../../domains/competition/fixtures";
import {
  addTournamentClub,
  dataConnect,
  deleteUnplayedMatch,
  insertUnplayedMatch,
  markMatchWalkover,
  QueryFetchPolicy,
  removeTournamentClub,
  setMatchRound,
  tournamentEditor,
  updateTournamentSettings,
} from "../../infrastructure/dataconnect";
import { currentUser } from "../../infrastructure/auth";
import { notifyTournamentEnrollment } from "../../infrastructure/functions/callables";
import { notifyTournamentEdited } from "../../domains/competition/tournamentEdited";
import { toTournamentEditor, type TournamentEditorModel } from "./tournamentEditorMapper";
import { useAuth } from "../../domains/auth/AuthContext";
import { useModalLock } from "../../shared/useModalLock";
import { calendarStatus, isPlayed } from "../../domains/competition/stats";
import {
  FOOTBALL_TYPES,
  asFootballType,
  asMatchDuration,
  footballTypeLabel,
  MATCH_DURATIONS,
  type ClubSummary,
  type FootballType,
  type MatchDurationMinutes,
  type Tournament,
} from "../../shared/types";
import ConfirmModal from "../../shared/ConfirmModal";
import { isTournamentPrize, tournamentPrize } from "../../shared/textLimits";
import Field from "../admin/Field";
import {
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SHADOWS,
  SecondaryButton,
  SegmentedControl,
} from "../../shared/ui";

const EditCtx = createContext<{ openEdit: (id: string) => void }>({
  openEdit: () => {},
});

export function useTournamentEdit() {
  return useContext(EditCtx);
}

export function TournamentEditHost({ children }: { children: ReactNode }) {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();
  const [id, setId] = useState<string | null>(null);
  const openEdit = useCallback(
    (tournamentId: string) => {
      if (!isSuperAdmin) return;
      setId(tournamentId);
    },
    [isSuperAdmin],
  );
  const close = useCallback(() => setId(null), []);
  const [savedNotice, setSavedNotice] = useState(false);
  const handleSaved = useCallback(() => {
    const editedId = id;
    setId(null);
    if (editedId && location.pathname === `/torneos/${editedId}`) {
      window.location.reload();
      return;
    }
    notifyTournamentEdited();
    setSavedNotice(true);
  }, [id, location.pathname]);

  return (
    <EditCtx.Provider value={{ openEdit }}>
      {children}
      {isSuperAdmin && id ? (
        <TournamentEditModal tournamentId={id} onClose={close} onSaved={handleSaved} />
      ) : null}
      <ConfirmModal
        open={savedNotice}
        title="Cambios guardados."
        confirmLabel="Entendido"
        cancelLabel="Cerrar"
        onConfirm={() => setSavedNotice(false)}
        onCancel={() => setSavedNotice(false)}
      />
    </EditCtx.Provider>
  );
}

export default function TournamentEditModal({
  tournamentId,
  onClose,
  onSaved,
}: {
  tournamentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [model, setModel] = useState<TournamentEditorModel | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    void tournamentEditor(dataConnect, { id: tournamentId }, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (alive) setModel(toTournamentEditor(result.data));
      })
      .catch((err: unknown) => console.error(err))
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [tournamentId]);

  const tournament = model?.tournament;
  const clubs = model?.clubs ?? [];
  const matches = model?.matches ?? [];
  const seasonStart = model?.seasonStart;
  const seasonEnd = model?.seasonEnd;
  const categoryLabel = model?.categoryLabel || "—";
  const [draftClubIds, setDraftClubIds] = useState<string[]>([]);
  const [draftLegs, setDraftLegs] = useState<1 | 2>(2);
  const [draftFootballType, setDraftFootballType] = useState<FootballType>(7);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftDuration, setDraftDuration] = useState<MatchDurationMinutes>(60);
  const [draftPrize, setDraftPrize] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [lateEntry, setLateEntry] = useState<LateEntryChoice | null>(null);
  const [lateEntryHint, setLateEntryHint] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  /** Motivo que se puede mostrar tal cual (un jugador ya juega el torneo con otro club); vacío = genérico. */
  const [errorText, setErrorText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const hasTournament = Boolean(tournament);

  useModalLock(saveOpen || errorOpen ? null : onClose);

  useEffect(() => {
    if (!tournament) return;
    setDraftClubIds([...tournament.clubIds]);
    setDraftLegs(tournamentLegs(tournament));
    setDraftFootballType(asFootballType(tournament.footballType));
    setDraftStartDate(tournament.startDate || "");
    setDraftDuration(asMatchDuration(tournament.durationMinutes));
    setDraftPrize(tournament.prize || "");
    setSaveOpen(false);
    setReady(true);
  }, [tournamentId, hasTournament]);

  useEffect(() => {
    if (loaded && !hasTournament) onClose();
  }, [loaded, hasTournament, onClose]);

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

  const catLabel = categoryLabel;
  const enrolled = clubs.filter((c) => draftClubIds.includes(c.id));
  const addable = clubs.filter((c) => c.active && !draftClubIds.includes(c.id));
  const savedLegs = tournamentLegs(tournament);
  const savedFootballType = asFootballType(tournament.footballType);
  const savedStartDate = tournament.startDate || "";
  const savedDuration = asMatchDuration(tournament.durationMinutes);
  const savedPrize = tournament.prize || "";
  const prizeOk = isTournamentPrize(draftPrize);
  const dirty =
    draftPrize.trim() !== savedPrize ||
    draftLegs !== savedLegs ||
    draftFootballType !== savedFootballType ||
    draftStartDate !== savedStartDate ||
    draftDuration !== savedDuration ||
    !sameIdList(draftClubIds, tournament.clubIds);
  const planned = expectedMatchCount(draftClubIds.length, draftLegs);
  const shape = fixtureShape(draftClubIds.length, draftLegs);
  // Lo que el SQL desprograma al guardar: todo lo programado si cambia la duración; si solo avanza el
  // inicio, lo programado antes de la fecha nueva.
  const scheduledMatches = matches.filter((m) => calendarStatus(m) === "scheduled");
  const unscheduleAll = draftDuration !== savedDuration ? scheduledMatches.length : 0;
  const unscheduleBefore =
    draftDuration === savedDuration && draftStartDate && (!savedStartDate || draftStartDate > savedStartDate)
      ? scheduledMatches.filter((m) => (m.date || "") < draftStartDate).length
      : 0;
  const playedReturns =
    draftLegs === 1
      ? playedReturnsIfSingleLeg(
          { ...tournament, clubIds: draftClubIds, legs: 1 },
          matches,
        )
      : [];
  const nextClubIds = [
    ...draftClubIds.filter((id) => !lockedClubIds.has(id) || tournament.clubIds.includes(id)),
    ...tournament.clubIds.filter((id) => lockedClubIds.has(id) && !draftClubIds.includes(id)),
  ];
  const addedClubIds = nextClubIds.filter((id) => !tournament.clubIds.includes(id));
  const walkovers = lateWalkoverFixtures(
    { ...tournament, clubIds: nextClubIds, legs: draftLegs },
    matches,
    addedClubIds,
  );
  const needsLateChoice = walkovers.length > 0;

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
    setDraftDuration(savedDuration);
    setDraftPrize(savedPrize);
    setSaveOpen(false);
    onClose();
  };

  const confirmSave = async () => {
    try {
      setBusy(true);
      const football =
        draftFootballType === 7 ? "FUT_7" : draftFootballType === 9 ? "FUT_9" : "FUT_11";
      const userId = currentUser()?.uid;
      if (!userId) throw new Error("Debes iniciar sesión.");
      const settings = await updateTournamentSettings(dataConnect, {
        userId,
        id: tournament.id,
        legs: draftLegs,
        footballType: football,
        durationMinutes: draftDuration,
        startDate: draftStartDate,
        prize: draftPrize.trim(),
      });
      if (settings.data.tournament == null) throw new Error("No se pudo guardar.");
      const previous = new Set(tournament.clubIds);
      const next = new Set(nextClubIds);
      for (const clubId of previous) {
        if (!next.has(clubId)) {
          await removeTournamentClub(dataConnect, { userId, tournamentId: tournament.id, clubId });
        }
      }
      for (const clubId of next) {
        if (!previous.has(clubId)) {
          const added = await addTournamentClub(dataConnect, { userId, tournamentId: tournament.id, clubId });
          if (added.data.row == null) {
            if (added.data.conflicts?.length) {
              throw new EnrollmentConflictError(enrollmentConflictMessage(clubNames[clubId] || clubId, added.data.conflicts));
            }
            throw new Error("No se pudo guardar.");
          }
        }
      }
      const updated: Tournament = {
        ...tournament,
        clubIds: nextClubIds,
        legs: draftLegs,
        footballType: draftFootballType,
        startDate: draftStartDate || undefined,
        durationMinutes: draftDuration,
        prize: draftPrize.trim(),
      };
      const { toCreate, toDelete, toRelabel } = diffFixtures(updated, matches);
      for (const match of toDelete) {
        if (!isPlayed(match)) await deleteUnplayedMatch(dataConnect, { userId, id: match.id });
      }
      for (const item of toRelabel) {
        const relabeled = await setMatchRound(dataConnect, {
          id: item.match.id,
          roundLabel: item.round.slice(0, 16),
          roundNumber: Number(item.round) || 0,
        });
        if (relabeled.data.match == null) throw new Error("No se pudo guardar.");
      }
      const fresh = new Set(addedClubIds);
      for (const fixture of toCreate) {
        const award =
          needsLateChoice &&
          lateEntry === "walkover" &&
          (fresh.has(fixture.homeClubId) !== fresh.has(fixture.awayClubId));
        const homeScore = !award ? null : fresh.has(fixture.homeClubId) ? 0 : 3;
        const awayScore = !award ? null : fresh.has(fixture.homeClubId) ? 3 : 0;
        const matchId = crypto.randomUUID();
        const created = await insertUnplayedMatch(dataConnect, {
          userId,
          id: matchId,
          tournamentId: tournament.id,
          roundLabel: fixture.round.slice(0, 16),
          roundNumber: Number(fixture.round) || 0,
          homeClubId: fixture.homeClubId,
          awayClubId: fixture.awayClubId,
          status: award ? "PLAYED" : "UNSCHEDULED",
          walkover: award,
        });
        if (created.data.match == null) throw new Error("No se pudo guardar.");
        if (award && homeScore != null && awayScore != null) {
          const marked = await markMatchWalkover(dataConnect, {
            userId,
            id: matchId,
            homeScore,
            awayScore,
            walkover: true,
          });
          if (marked.data.match == null) throw new Error("No se pudo guardar.");
        }
      }
      notifyTournamentEnrollment(tournament.id, addedClubIds);
      setBusy(false);
      setSaveOpen(false);
      onSaved();
    } catch (err) {
      console.error(err);
      setBusy(false);
      setSaveOpen(false);
      setErrorText(err instanceof EnrollmentConflictError ? err.message : "");
      setErrorOpen(true);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tournament-edit-title"
      onClick={saveOpen || errorOpen ? undefined : onClose}
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
          minWidth: 0,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          border: `1px solid ${C.gray200}`,
          boxShadow: SHADOWS.xl,
          position: "relative",
        }}
        data-tournament-edit=""
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

        <div
          data-tournament-edit-scroll=""
          style={{
            padding: "0 1.2rem",
            overflowX: "hidden",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            margin: "0 0 0.4rem",
          }}
        >
          Equipos — {catLabel}
        </p>
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
          <Field label="Duración del partido" hint="Minutos que ocupa la cancha.">
            <div style={{ maxWidth: 420 }}>
              <SegmentedControl
                value={String(draftDuration)}
                onChange={(v) => setDraftDuration(asMatchDuration(Number(v)))}
                options={MATCH_DURATIONS.map((minutes) => ({
                  label: `${minutes} min`,
                  value: String(minutes),
                }))}
              />
            </div>
          </Field>
          <Field label="Fecha de inicio">
            <FormInput
              type="date"
              value={draftStartDate}
              min={seasonStart}
              max={seasonEnd}
              onChange={(e) => setDraftStartDate(e.target.value)}
            />
          </Field>
          <Field label="Premio al campeón" hint={`Solo para ${catLabel}. Vacío = sin premio.`}>
            <FormInput
              value={draftPrize}
              maxLength={60}
              placeholder="Ej. $25,000 MXN"
              onChange={(e) => setDraftPrize(tournamentPrize(e.target.value))}
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
          {!loaded
            ? "Cargando calendario…"
            : draftClubIds.length < 2
              ? "Con 2 o más equipos se genera el calendario según este formato."
              : `${planned} partido${planned === 1 ? "" : "s"} en esta categoría: ${shape.rounds} jornada${shape.rounds === 1 ? "" : "s"} de ${shape.perRound} partido${shape.perRound === 1 ? "" : "s"}${shape.bye ? " (con equipos impares, uno descansa en cada jornada)" : ""}. Fecha, hora y sede se asignan en la ficha del torneo.`}
        </p>
        </div>

        <div
          data-tournament-edit-footer=""
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
            disabled={!dirty || !prizeOk || busy || !loaded || !draftStartDate}
            onClick={() => {
              setLateEntry(null);
              setLateEntryHint(false);
              setSaveOpen(true);
            }}
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
            draftDuration,
            savedDuration,
            draftPrize.trim(),
            savedPrize,
            clubNames,
            playedReturns,
            unscheduleAll,
            unscheduleBefore,
          )}
          confirmLabel="Guardar cambios"
          danger={playedReturns.length > 0}
          busy={busy}
          confirmHint={
            lateEntryHint && needsLateChoice && !lateEntry
              ? "Selecciona una opción."
              : undefined
          }
          onCancel={() => {
            setLateEntryHint(false);
            setSaveOpen(false);
          }}
          onConfirm={() => {
            if (needsLateChoice && !lateEntry) {
              setLateEntryHint(true);
              return;
            }
            void confirmSave();
          }}
        >
          {needsLateChoice ? (
            <LateEntryPicker
              value={lateEntry}
              onChange={(choice) => {
                setLateEntry(choice);
                setLateEntryHint(false);
              }}
            />
          ) : null}
        </ConfirmModal>
        <ConfirmModal
          open={errorOpen}
          title="Los cambios no se pudieron guardar."
          message={errorText || undefined}
          confirmLabel="Entendido"
          cancelLabel="Cerrar"
          onConfirm={() => setErrorOpen(false)}
          onCancel={() => setErrorOpen(false)}
        />
      </div>
    </div>,
    document.body,
  );
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
  const [panel, setPanel] = useState({ maxHeight: 200, above: false });
  const boxRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc, true);
    return () => document.removeEventListener("pointerdown", onDoc, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fit = () => {
      const box = boxRef.current;
      const modal = box?.closest("[data-tournament-edit]") as HTMLElement | null;
      if (!box || !modal) return;
      const footer = modal.querySelector("[data-tournament-edit-footer]");
      const boxRect = box.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const bottomLimit = footer
        ? footer.getBoundingClientRect().top - 8
        : modalRect.bottom - 12;
      const topLimit = modalRect.top + 12;
      const below = bottomLimit - boxRect.bottom - 6;
      const above = boxRect.top - topLimit - 6;
      const aboveFits = below < 140 && above > below;
      const room = Math.min(220, Math.max(0, aboveFits ? above : below));
      setPanel({ maxHeight: room, above: aboveFits });
    };
    fit();
    const scroller = boxRef.current?.closest("[data-tournament-edit-scroll]");
    window.addEventListener("resize", fit);
    scroller?.addEventListener("scroll", fit);
    return () => {
      window.removeEventListener("resize", fit);
      scroller?.removeEventListener("scroll", fit);
    };
  }, [open, enrolled.length]);

  return (
    <div
      ref={boxRef}
      style={{
        position: "relative",
        minWidth: 0,
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
      <div>
        <button
          ref={toggleRef}
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
            ref={panelRef}
            style={{
              position: "absolute",
              zIndex: 5,
              ...(panel.above
                ? { bottom: "calc(100% + 6px)" }
                : { top: "calc(100% + 6px)" }),
              right: 0,
              width: "min(280px, 100%)",
              maxHeight: panel.maxHeight,
              overflowX: "hidden",
              overflowY: "auto",
              boxSizing: "border-box",
              padding: "0.65rem 0.75rem",
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
                      maxWidth: "100%",
                      border: `1px solid ${C.gray300}`,
                      backgroundColor: C.white,
                      color: C.gray700,
                      borderRadius: RADIUS.full,
                      padding: "0.3rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      overflowWrap: "anywhere",
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

function LateEntryPicker({
  value,
  onChange,
}: {
  value: LateEntryChoice | null;
  onChange: (choice: LateEntryChoice) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: C.navy900 }}>
        Hay jornadas ya jugadas. ¿Qué pasa con los partidos del equipo nuevo en esas jornadas?
      </p>
      <LateEntryOption
        selected={value === "walkover"}
        title="Dar por perdidas"
        note="El equipo nuevo no tendrá puntos en esas jornadas. El rival que le tocaba se lleva la victoria 3-0."
        onSelect={() => onChange("walkover")}
      />
      <LateEntryOption
        selected={value === "play"}
        title="Jugarlas"
        note="Esto prolongará la duración del torneo, porque todavía hay que programarlos y jugarlos."
        onSelect={() => onChange("play")}
      />
    </div>
  );
}

function LateEntryOption({
  selected,
  title,
  note,
  onSelect,
}: {
  selected: boolean;
  title: string;
  note: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        textAlign: "left",
        border: `1px solid ${selected ? C.navy900 : C.gray300}`,
        backgroundColor: selected ? C.gray50 : C.white,
        borderRadius: RADIUS.lg,
        padding: "0.65rem 0.75rem",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: C.navy900 }}>
        {title}
      </span>
      <span style={{ display: "block", marginTop: "0.2rem", fontSize: "0.75rem", color: C.gray600, lineHeight: 1.4 }}>
        {note}
      </span>
    </button>
  );
}

/** Un jugador activo del club ya juega el torneo con otro club (0010): el motivo se muestra tal cual. */
class EnrollmentConflictError extends Error {}

function enrollmentConflictMessage(
  clubName: string,
  conflicts: { playerName: string; clubName: string }[],
) {
  const who = conflicts.map((c) => `${c.playerName} (con ${c.clubName})`).join(", ");
  return `${clubName} no se inscribió: ${who} ya ${conflicts.length > 1 ? "juegan" : "juega"} este torneo con otro club. Un jugador solo puede representar a un club por torneo.`;
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
  draftDuration: MatchDurationMinutes,
  savedDuration: MatchDurationMinutes,
  draftPrize: string,
  savedPrize: string,
  clubNames: Record<string, string>,
  playedReturns: { homeClubId: string; awayClubId: string }[],
  unscheduleAll: number,
  unscheduleBefore: number,
) {
  const plural = (n: number) => (n === 1 ? "" : "s");
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
  if (draftDuration !== savedDuration) {
    lines.push(
      `Cada partido dura ${draftDuration} minutos.` +
        (unscheduleAll > 0
          ? ` Se desprogramarán los ${unscheduleAll} partido${plural(unscheduleAll)} programado${plural(unscheduleAll)} y se liberarán sus canchas: habrá que volver a programarlos.`
          : ""),
    );
  }
  if (draftPrize !== savedPrize) {
    lines.push(draftPrize ? `El premio al campeón pasa a «${draftPrize}».` : "Se quita el premio al campeón.");
  }
  if (draftStartDate !== savedStartDate) {
    lines.push(
      `La fecha de inicio pasa a ${draftStartDate}.` +
        (unscheduleBefore > 0
          ? ` Los ${unscheduleBefore} partido${plural(unscheduleBefore)} programado${plural(unscheduleBefore)} antes de esa fecha se desprogramarán y se liberarán sus canchas.`
          : ""),
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
