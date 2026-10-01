import { useEffect, useMemo, useState } from "react";
import { addDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { MapPin, Pencil, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCourtHolds, useCourts } from "../../hooks/useCourts";
import {
  courtsFreeAt,
  daySlotStarts,
  windowsOnDay,
  formatDuration,
  fromMinutes,
  rangesOverlap,
  readWindows,
  toMinutes,
  weekdayOf,
} from "../../lib/courts";
import {
  clubDocRef,
  courtHoldRef,
  courtHoldsCol,
  courtRef,
  courtsCol,
  matchRef,
  platformConfigRef,
  tournamentRef,
} from "../../lib/paths";
import { scheduleMatch } from "../../lib/scheduleMatch";
import { asCourtSlot, asMatchDuration, type Court, type CourtHold, type CourtSlotMinutes, type TimeWindow } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import WindowsEditor, { dayLabel } from "../courts/WindowsEditor";
import ConfirmModal from "../ConfirmModal";
import Field from "./Field";
import {
  C,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
  SegmentedControl,
} from "../ui";

export default function CourtsAdmin() {
  const { platformConfig } = useAuth();
  const { courts } = useCourts();
  const today = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }, []);
  const { holds } = useCourtHolds(today, "2099-12-31");
  const [enabled, setEnabled] = useState(platformConfig?.courtsEnabled === true);
  const [slot, setSlot] = useState<CourtSlotMinutes>(
    asCourtSlot(platformConfig?.courtSlotMinutes),
  );
  const [windows, setWindows] = useState<TimeWindow[]>(
    readWindows(platformConfig?.courtOpenWindows),
  );
  const [configBusy, setConfigBusy] = useState(false);
  const [gridDate, setGridDate] = useState(today);
  const [courtModal, setCourtModal] = useState<null | "add" | Court>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftRate, setDraftRate] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);

  const saveConfig = async () => {
    const clean = readWindows(windows);
    setConfigBusy(true);
    try {
      await updateDoc(platformConfigRef(), {
        courtsEnabled: enabled,
        courtSlotMinutes: slot,
        courtOpenWindows: clean,
      });
      setWindows(clean);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el horario de canchas.");
    } finally {
      setConfigBusy(false);
    }
  };

  const openAddCourt = () => {
    setDraftName("");
    setDraftDescription("");
    setDraftRate("");
    setCourtModal("add");
  };

  const openEditCourt = (court: Court) => {
    setDraftName(court.name);
    setDraftDescription(court.description);
    setDraftRate(String(court.hourlyRate));
    setCourtModal(court);
  };

  const saveCourtModal = async () => {
    const cleanName = draftName.trim();
    const hourlyRate = Number(draftRate);
    if (!cleanName || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
      alert("Escribe el nombre y un costo por hora válido.");
      return;
    }
    setDraftBusy(true);
    try {
      if (courtModal === "add") {
        const order = courts.reduce((max, court) => Math.max(max, court.order), 0) + 1;
        await addDoc(courtsCol(), {
          name: cleanName,
          description: draftDescription.trim(),
          hourlyRate,
          active: true,
          order,
        });
      } else if (courtModal) {
        await updateDoc(courtRef(courtModal.id), {
          name: cleanName,
          description: draftDescription.trim(),
          hourlyRate,
        });
      }
      setCourtModal(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la cancha.");
    } finally {
      setDraftBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <SectionCard title="Horario de canchas" icon={<MapPin size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: C.navy900 }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Módulo de canchas visible para el público
          </label>
          <Field label="Paso del apartado" hint="Los inicios caen en esta rejilla.">
            <SegmentedControl
              value={String(slot)}
              onChange={(value) => setSlot(value === "30" ? 30 : 60)}
              options={[
                { label: "Cada hora", value: "60" },
                { label: "Cada 30 min", value: "30" },
              ]}
            />
          </Field>
          <Field label="Días y horario de apertura" hint="Fuera de estos rangos no se puede apartar.">
            <WindowsEditor windows={windows} onChange={setWindows} />
          </Field>
          <PrimaryButton type="button" disabled={configBusy} onClick={() => void saveConfig()}>
            {configBusy ? "Guardando…" : "Guardar horario"}
          </PrimaryButton>
        </div>
      </SectionCard>

      <SectionCard title="Apartar canchas" icon={<MapPin size={16} />}>
        <DayGrid
          date={gridDate}
          onDate={setGridDate}
          courts={courts}
          holds={holds}
          windows={windows}
          slot={slot}
          onEditCourt={openEditCourt}
          onAddCourt={openAddCourt}
        />
      </SectionCard>
      <ConfirmModal
        open={courtModal !== null}
        title={courtModal === "add" ? "Nueva cancha" : "Editar cancha"}
        confirmLabel="Guardar"
        busy={draftBusy}
        confirmDisabled={!draftName.trim() || draftRate.trim() === ""}
        onConfirm={() => void saveCourtModal()}
        onCancel={() => {
          if (!draftBusy) setCourtModal(null);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Nombre">
            <FormInput value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Cancha 1" autoFocus />
          </Field>
          <Field label="Descripción">
            <FormInput
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Pasto sintético, iluminación"
            />
          </Field>
          <Field label="Costo por hora">
            <FormInput
              type="number"
              min={0}
              value={draftRate}
              onChange={(e) => setDraftRate(e.target.value)}
              placeholder="400"
            />
          </Field>
          {courtModal && courtModal !== "add" && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <SecondaryButton
                type="button"
                disabled={draftBusy}
                onClick={() => {
                  const next = !courtModal.active;
                  void updateDoc(courtRef(courtModal.id), { active: next })
                    .then(() => setCourtModal({ ...courtModal, active: next }))
                    .catch(() => alert("No se pudo actualizar la cancha."));
                }}
              >
                {courtModal.active ? "Ocultar" : "Mostrar"}
              </SecondaryButton>
              <button
                type="button"
                disabled={draftBusy}
                onClick={() => {
                  if (!window.confirm(`¿Eliminar ${courtModal.name}?`)) return;
                  setDraftBusy(true);
                  void deleteDoc(courtRef(courtModal.id))
                    .then(() => setCourtModal(null))
                    .catch(() => alert("No se pudo eliminar la cancha."))
                    .finally(() => setDraftBusy(false));
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: C.red,
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </ConfirmModal>
    </div>
  );
}

function DayGrid({
  date,
  onDate,
  courts,
  holds,
  windows,
  slot,
  onEditCourt,
  onAddCourt,
}: {
  date: string;
  onDate: (value: string) => void;
  courts: Court[];
  holds: CourtHold[];
  windows: TimeWindow[];
  slot: CourtSlotMinutes;
  onEditCourt: (court: Court) => void;
  onAddCourt: () => void;
}) {
  const day = weekdayOf(date);
  const starts = day ? daySlotStarts(windows, day, slot) : [];
  const [picked, setPicked] = useState<SlotPick[]>([]);
  const [open, setOpen] = useState(false);
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editHold, setEditHold] = useState<CourtHold | null>(null);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState(date);
  const [editStart, setEditStart] = useState(0);
  const [editDuration, setEditDuration] = useState(60);
  const [editBusy, setEditBusy] = useState(false);
  const [matchHold, setMatchHold] = useState<CourtHold | null>(null);
  const [matchDate, setMatchDate] = useState(date);
  const [matchStart, setMatchStart] = useState(0);
  const [matchDuration, setMatchDuration] = useState(90);
  const [matchBusy, setMatchBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [matchLabels, setMatchLabels] = useState<Record<string, { home: string; away: string }>>({});
  const matchKey = holds
    .filter((hold) => hold.date === date && hold.matchId)
    .map((hold) => hold.matchId)
    .sort()
    .join("|");

  useEffect(() => {
    if (!matchKey) {
      setMatchLabels({});
      return;
    }
    let cancel = false;
    void Promise.all(
      matchKey.split("|").map(async (id) => {
        const snap = await getDoc(matchRef(id));
        const data = snap.data();
        if (!data) return null;
        const homeName = await clubName(data.homeClubId, "Local");
        const awayName = await clubName(data.awayClubId, "Visita");
        return [id, { home: homeName, away: awayName }] as const;
      }),
    ).then((rows) => {
      if (cancel) return;
      const next: Record<string, { home: string; away: string }> = {};
      for (const row of rows) {
        if (row) next[row[0]] = row[1];
      }
      setMatchLabels(next);
    });
    return () => {
      cancel = true;
    };
  }, [matchKey]);

  useEffect(() => {
    setPicked([]);
    setOpen(false);
  }, [date]);

  const freePicked = picked.filter(
    (item) => slotKind(holds, item.courtId, date, item.start, slot) === "free",
  );
  const ranges = bookingRanges(freePicked, slot);
  const summary = ranges
    .map((range) => {
      const court = courts.find((item) => item.id === range.courtId);
      return `${court?.name || "Cancha"} · ${formatFriendlyTime(fromMinutes(range.start))}–${formatFriendlyTime(fromMinutes(range.end))}`;
    })
    .join("\n");

  const toggle = (courtId: string, start: number) => {
    setPicked((current) => {
      const exists = current.some((item) => item.courtId === courtId && item.start === start);
      if (exists) return current.filter((item) => !(item.courtId === courtId && item.start === start));
      return [...current, { courtId, start }];
    });
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
  };

  const editCourt = editHold
    ? pickCourt(courts, holds, windows, slot, editDate, editStart, editDuration, editHold)
    : null;
  const matchStarts = slotStartsFor(windows, matchDate, slot);
  const matchCourt = matchHold
    ? pickCourt(courts, holds, windows, slot, matchDate, matchStart, matchDuration, matchHold)
    : null;
  const matchNames = matchHold?.matchId ? matchLabels[matchHold.matchId] : undefined;
  const matchTitle = matchNames ? `${matchNames.home} vs ${matchNames.away}` : "Partido";

  const saveHold = async () => {
    if (!editHold || !editCourt || !editName.trim()) return;
    const text = editNote.trim() ? `${editName.trim()} · ${editNote.trim()}` : editName.trim();
    if (text.length >= 200) {
      alert("El nombre y la nota juntos no pueden pasar de 200 caracteres.");
      return;
    }
    const end = editStart + editDuration;
    setEditBusy(true);
    try {
      await updateDoc(courtHoldRef(editHold.id), {
        courtId: editCourt.id,
        date: editDate,
        startTime: fromMinutes(editStart),
        endTime: fromMinutes(end),
        note: text,
      });
      setEditHold(null);
      setNotice(
        `${editCourt.name} apartada para ${formatFriendlyDate(editDate)} de ${formatFriendlyTime(fromMinutes(editStart))} a ${formatFriendlyTime(fromMinutes(end))}.`,
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el apartado.");
    } finally {
      setEditBusy(false);
    }
  };

  const saveMatch = async () => {
    if (!matchHold?.matchId || !matchCourt) return;
    setMatchBusy(true);
    try {
      await scheduleMatch({
        matchId: matchHold.matchId,
        date: matchDate,
        time: fromMinutes(matchStart),
        venue: matchCourt.name,
        courtId: matchCourt.id,
      });
      const end = matchStart + matchDuration;
      setMatchHold(null);
      setNotice(
        `${matchCourt.name} apartada para ${formatFriendlyDate(matchDate)} de ${formatFriendlyTime(fromMinutes(matchStart))} a ${formatFriendlyTime(fromMinutes(end))}.`,
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el partido.");
    } finally {
      setMatchBusy(false);
    }
  };

  const save = async () => {
    const cleanName = guest.trim();
    if (!cleanName || ranges.length === 0) return;
    const text = note.trim() ? `${cleanName} · ${note.trim()}` : cleanName;
    if (text.length >= 200) {
      alert("El nombre y la nota juntos no pueden pasar de 200 caracteres.");
      return;
    }
    setBusy(true);
    try {
      for (const range of ranges) {
        await addDoc(courtHoldsCol(), {
          courtId: range.courtId,
          date,
          startTime: fromMinutes(range.start),
          endTime: fromMinutes(range.end),
          source: "manual",
          note: text,
        });
      }
      setPicked([]);
      setGuest("");
      setNote("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("No se pudo apartar ese horario.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
      <Field label="Fecha">
        <FormInput type="date" value={date} onChange={(e) => onDate(e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: "0.7rem", fontSize: "0.72rem", color: C.gray500 }}>
        <span><Swatch color={C.greenLight} border={C.greenBorder} /> Libre</span>
        <span><Swatch color={C.gray100} border={C.gray300} /> Partido</span>
        <span><Swatch color={C.amberLight} border={C.amber} /> Apartado</span>
      </div>
      {ranges.length > 0 && (
        <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ alignSelf: "flex-start" }}>
          {ranges.length === 1 ? `Apartar · ${summary}` : `Apartar ${ranges.length} tramos`}
        </PrimaryButton>
      )}
      {courts.length === 0 ? (
        <button
          type="button"
          onClick={onAddCourt}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            border: `1px dashed ${C.gray300}`,
            background: C.white,
            color: C.navy900,
            borderRadius: 8,
            padding: "0.4rem 0.7rem",
            fontWeight: 800,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Agregar cancha
        </button>
      ) : starts.length === 0 ? (
        <p style={{ margin: 0, color: C.gray500, fontSize: "0.85rem" }}>Este día las canchas están cerradas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              width: "100%",
              gridTemplateColumns: `max-content repeat(${starts.length}, minmax(44px, 1fr))`,
              gap: 4,
            }}
          >
            <span />
            {starts.map((start) => (
              <span key={start} style={{ fontSize: "0.65rem", fontWeight: 700, color: C.gray500, textAlign: "center" }}>
                {formatFriendlyTime(fromMinutes(start))}
              </span>
            ))}
            {courts.map((court) => (
              <div key={court.id} style={{ display: "contents" }}>
                <CourtGridRow
                  court={court}
                  starts={starts}
                  holds={holds}
                  date={date}
                  slot={slot}
                  picked={freePicked}
                  onToggle={toggle}
                  onEdit={() => onEditCourt(court)}
                  matchLabels={matchLabels}
                  onOpenHold={(hold) => {
                    const start = toMinutes(hold.startTime) ?? 0;
                    const end = toMinutes(hold.endTime);
                    const duration = end != null && end > start ? end - start : 60;
                    if (hold.source === "match" && hold.matchId) {
                      setMatchDate(hold.date);
                      setMatchStart(start);
                      setMatchDuration(duration);
                      setMatchHold(hold);
                      void getDoc(matchRef(hold.matchId)).then(async (snap) => {
                        const tournamentId = snap.data()?.tournamentId;
                        if (typeof tournamentId !== "string") return;
                        const tournament = await getDoc(tournamentRef(tournamentId));
                        setMatchDuration(asMatchDuration(tournament.data()?.durationMinutes));
                      });
                      return;
                    }
                    const parts = splitHoldNote(hold.note || "");
                    setEditName(parts.name);
                    setEditNote(parts.note);
                    setEditDate(hold.date);
                    setEditStart(start);
                    setEditDuration(duration);
                    setEditHold(hold);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              aria-label="Agregar cancha"
              onClick={onAddCourt}
              style={{
                gridColumn: 1,
                justifySelf: "start",
                width: 28,
                height: 28,
                borderRadius: 6,
                border: `1px dashed ${C.gray300}`,
                background: C.white,
                color: C.navy900,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
      <ConfirmModal
        open={open}
        title="Apartar cancha"
        message={summary}
        confirmLabel="Apartar"
        busy={busy}
        confirmDisabled={!guest.trim()}
        onConfirm={() => void save()}
        onCancel={close}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Nombre">
            <FormInput
              value={guest}
              onChange={(e) => setGuest(e.target.value)}
              placeholder="Quién aparta"
              autoFocus
            />
          </Field>
          <Field label="Nota">
            <FormInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>
      </ConfirmModal>
      <ConfirmModal
        open={editHold !== null}
        title="Apartado"
        confirmLabel="Guardar"
        busy={editBusy}
        confirmDisabled={!editName.trim() || !editCourt}
        dangerAction={{
          label: "Eliminar",
          onClick: () => {
            if (!editHold) return;
            setEditBusy(true);
            void deleteDoc(courtHoldRef(editHold.id))
              .then(() => setEditHold(null))
              .catch(() => alert("No se pudo quitar el apartado."))
              .finally(() => setEditBusy(false));
          },
        }}
        onConfirm={() => void saveHold()}
        onCancel={() => {
          if (!editBusy) setEditHold(null);
        }}
      >
        <HoldEditor
          name={editName}
          note={editNote}
          dateValue={editDate}
          start={editStart}
          duration={editDuration}
          slot={slot}
          windows={windows}
          status={editCourt ? `Disponible en ${editCourt.name}` : "No hay cancha disponible en ese horario."}
          available={Boolean(editCourt)}
          onName={setEditName}
          onNote={setEditNote}
          onDate={(value) => {
            setEditDate(value);
            const day = weekdayOf(value);
            const next = day ? daySlotStarts(windows, day, slot) : [];
            if (next.length && !next.includes(editStart)) setEditStart(next[0]);
          }}
          onStart={setEditStart}
          onDuration={setEditDuration}
        />
      </ConfirmModal>
      <ConfirmModal
        open={matchHold !== null}
        title={matchTitle}
        confirmLabel="Guardar"
        busy={matchBusy}
        confirmDisabled={!matchCourt}
        onConfirm={() => void saveMatch()}
        onCancel={() => {
          if (!matchBusy) setMatchHold(null);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Fecha">
            <FormInput
              type="date"
              value={matchDate}
              onChange={(e) => {
                const value = e.target.value;
                setMatchDate(value);
                const day = weekdayOf(value);
                const next = day ? daySlotStarts(windows, day, slot) : [];
                if (next.length && !next.includes(matchStart)) setMatchStart(next[0]);
              }}
            />
          </Field>
          <Field label="Horario">
            <FormSelect value={String(matchStart)} onChange={(e) => setMatchStart(Number(e.target.value))}>
              {matchStarts.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatFriendlyTime(fromMinutes(minutes))}
                </option>
              ))}
            </FormSelect>
          </Field>
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
            Duración del partido: {formatDuration(matchDuration)}
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: matchCourt ? C.green : C.red }}>
            {matchCourt ? `Disponible en ${matchCourt.name}` : "No hay cancha disponible en ese horario."}
          </p>
        </div>
      </ConfirmModal>
      <ConfirmModal
        open={notice !== ""}
        title="Listo"
        message={notice}
        confirmLabel="Entendido"
        cancelLabel="Cerrar"
        onConfirm={() => setNotice("")}
        onCancel={() => setNotice("")}
      />
    </div>
  );
}

function CourtGridRow({
  court,
  starts,
  holds,
  date,
  slot,
  picked,
  onToggle,
  onEdit,
  onOpenHold,
  matchLabels,
}: {
  court: Court;
  starts: number[];
  holds: CourtHold[];
  date: string;
  slot: number;
  picked: SlotPick[];
  onToggle: (courtId: string, start: number) => void;
  onEdit: () => void;
  onOpenHold: (hold: CourtHold) => void;
  matchLabels: Record<string, { home: string; away: string }>;
}) {
  const cells = rowCells(holds, court.id, date, starts, slot);
  return (
    <>
      <span style={{ display: "flex", alignItems: "center", gap: "0.15rem", width: "max-content", alignSelf: "center", paddingRight: 8 }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: court.active ? C.navy900 : C.gray400,
            whiteSpace: "nowrap",
          }}
        >
          {court.name}
        </span>
        {!court.active && (
          <span style={{ fontSize: "0.62rem", fontWeight: 800, color: C.gray400 }}>Oculta</span>
        )}
        <button
          type="button"
          aria-label={`Editar ${court.name}`}
          onClick={onEdit}
          style={{
            border: "none",
            background: "transparent",
            color: C.gray500,
            cursor: "pointer",
            padding: "0.15rem",
            display: "inline-flex",
            flexShrink: 0,
          }}
        >
          <Pencil size={13} />
        </button>
      </span>
      {cells.map((cell) => {
        if (cell.kind === "free") {
          const selected = picked.some((item) => item.courtId === court.id && item.start === cell.start);
          return (
            <button
              key={cell.start}
              type="button"
              aria-pressed={selected}
              title="Libre"
              onClick={() => onToggle(court.id, cell.start)}
              style={{
                height: 28,
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 6,
                padding: 0,
                background: selected ? C.navy900 : C.greenLight,
                border: `1px solid ${selected ? C.navy900 : C.greenBorder}`,
                cursor: "pointer",
              }}
            />
          );
        }
        const manual = cell.hold.source === "manual";
        const label = manual ? holdLabel(cell.hold) : matchSigla(cell.hold, matchLabels);
        return (
          <button
            key={cell.hold.id + cell.start}
            type="button"
            title={manual ? cell.hold.note || "Apartado" : matchSigla(cell.hold, matchLabels)}
            onClick={() => onOpenHold(cell.hold)}
            style={{
              gridColumn: `span ${cell.span}`,
              height: 28,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              borderRadius: 6,
              padding: "0 0.4rem",
              background: manual ? C.amberLight : C.gray100,
              border: `1px solid ${manual ? C.amber : C.gray300}`,
              color: C.navy900,
              display: "block",
              fontSize: "0.68rem",
              fontWeight: 800,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </>
  );
}

function rowCells(holds: CourtHold[], courtId: string, date: string, starts: number[], slot: number) {
  const cells: Array<
    | { kind: "free"; start: number }
    | { kind: "hold"; hold: CourtHold; start: number; span: number }
  > = [];
  let index = 0;
  while (index < starts.length) {
    const start = starts[index];
    const hold = coveringHold(holds, courtId, date, start, slot);
    if (!hold) {
      cells.push({ kind: "free", start });
      index += 1;
      continue;
    }
    let span = 1;
    while (
      index + span < starts.length &&
      coveringHold(holds, courtId, date, starts[index + span], slot)?.id === hold.id
    ) {
      span += 1;
    }
    cells.push({ kind: "hold", hold, start, span });
    index += span;
  }
  return cells;
}

function coveringHold(holds: CourtHold[], courtId: string, date: string, start: number, slot: number) {
  return holds.find((hold) => {
    if (hold.courtId !== courtId || hold.date !== date) return false;
    const holdStart = toMinutes(hold.startTime);
    const holdEnd = toMinutes(hold.endTime);
    if (holdStart == null || holdEnd == null) return false;
    return rangesOverlap(start, start + slot, holdStart, holdEnd);
  });
}

function splitHoldNote(value: string) {
  const text = value.trim();
  const marker = " · ";
  const index = text.indexOf(marker);
  if (index === -1) return { name: text, note: "" };
  return { name: text.slice(0, index), note: text.slice(index + marker.length) };
}

function holdLabel(hold: CourtHold) {
  const note = hold.note?.trim() || "Apartado";
  return note.split(" · ")[0] || note;
}

async function clubName(id: unknown, fallback: string) {
  if (typeof id !== "string" || !id) return fallback;
  const snap = await getDoc(clubDocRef(id));
  const name = snap.data()?.name;
  return typeof name === "string" && name.trim() ? name : fallback;
}

function teamInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words.map((word) => word[0] || "").join("").toUpperCase();
}

function matchSigla(hold: CourtHold, labels: Record<string, { home: string; away: string }>) {
  const names = hold.matchId ? labels[hold.matchId] : undefined;
  if (!names) return "Partido";
  return `${teamInitials(names.home)} vs ${teamInitials(names.away)}`;
}

function slotStartsFor(windows: TimeWindow[], dateValue: string, slot: CourtSlotMinutes) {
  const day = weekdayOf(dateValue);
  return day ? daySlotStarts(windows, day, slot) : [];
}

function pickCourt(
  courts: Court[],
  holds: CourtHold[],
  windows: TimeWindow[],
  slot: CourtSlotMinutes,
  dateValue: string,
  start: number,
  duration: number,
  current: CourtHold,
) {
  const free = courtsFreeAt({
    courts,
    holds: holds.filter((hold) => hold.id !== current.id),
    openWindows: windows,
    date: dateValue,
    time: fromMinutes(start),
    slotMinutes: slot,
    duration,
    ignoreMatchId: current.matchId,
  });
  return free.find((court) => court.id === current.courtId) || free[0] || null;
}

function dayHoursHint(windows: TimeWindow[], dateValue: string) {
  const day = weekdayOf(dateValue);
  if (!day) return "Elige una fecha";
  const ranges = windowsOnDay(windows, day);
  if (!ranges.length) return `${dayLabel(day)}: cerrado`;
  const hours = ranges
    .map(([start, end]) => `${formatFriendlyTime(fromMinutes(start))} a ${formatFriendlyTime(fromMinutes(end))}`)
    .join(", ");
  return `${dayLabel(day)}: ${hours}`;
}

function durationOptions(windows: TimeWindow[], dateValue: string, start: number, slot: CourtSlotMinutes) {
  const day = weekdayOf(dateValue);
  if (!day) return [];
  const open = windowsOnDay(windows, day).find(([openStart, openEnd]) => start >= openStart && start < openEnd);
  if (!open) return [];
  const options: number[] = [];
  for (let minutes = slot; start + minutes <= open[1]; minutes += slot) options.push(minutes);
  return options;
}

function HoldEditor({
  name,
  note,
  dateValue,
  start,
  duration,
  slot,
  windows,
  status,
  available,
  onName,
  onNote,
  onDate,
  onStart,
  onDuration,
}: {
  name: string;
  note: string;
  dateValue: string;
  start: number;
  duration: number;
  slot: CourtSlotMinutes;
  windows: TimeWindow[];
  status: string;
  available: boolean;
  onName: (value: string) => void;
  onNote: (value: string) => void;
  onDate: (value: string) => void;
  onStart: (value: number) => void;
  onDuration: (value: number) => void;
}) {
  const starts = slotStartsFor(windows, dateValue, slot);
  const options = durationOptions(windows, dateValue, start, slot);
  useEffect(() => {
    if (!options.length || options.includes(duration)) return;
    onDuration(options[options.length - 1]);
  }, [duration, onDuration, options]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <Field label="Nombre">
        <FormInput value={name} onChange={(e) => onName(e.target.value)} autoFocus />
      </Field>
      <Field label="Nota">
        <FormInput
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Pagó la mitad, pago completo…"
        />
      </Field>
      <Field label="Fecha">
        <FormInput type="date" value={dateValue} onChange={(e) => onDate(e.target.value)} />
      </Field>
      <Field label="Horario">
        <FormSelect value={String(start)} onChange={(e) => onStart(Number(e.target.value))}>
          {starts.length === 0 ? (
            <option value={start}>Sin horario</option>
          ) : (
            starts.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatFriendlyTime(fromMinutes(minutes))}
              </option>
            ))
          )}
        </FormSelect>
      </Field>
      <Field label="Duración" hint={dayHoursHint(windows, dateValue)}>
        <FormSelect
          value={options.includes(duration) ? String(duration) : ""}
          onChange={(e) => onDuration(Number(e.target.value))}
        >
          {options.length === 0 ? (
            <option value="">Este día está cerrado</option>
          ) : (
            options.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))
          )}
        </FormSelect>
      </Field>
      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: available ? C.green : C.red }}>
        {status}
      </p>
    </div>
  );
}

type SlotPick = { courtId: string; start: number };

function bookingRanges(picked: SlotPick[], slot: number) {
  const byCourt = new Map<string, number[]>();
  for (const item of picked) {
    const list = byCourt.get(item.courtId) || [];
    list.push(item.start);
    byCourt.set(item.courtId, list);
  }
  const ranges: { courtId: string; start: number; end: number }[] = [];
  for (const [courtId, times] of byCourt) {
    const sorted = [...times].sort((a, b) => a - b);
    let runStart = sorted[0];
    let previous = sorted[0];
    for (let index = 1; index <= sorted.length; index += 1) {
      const current = sorted[index];
      if (current === previous + slot) {
        previous = current;
        continue;
      }
      ranges.push({ courtId, start: runStart, end: previous + slot });
      runStart = current;
      previous = current;
    }
  }
  return ranges;
}

function slotKind(
  holds: CourtHold[],
  courtId: string,
  date: string,
  start: number,
  slot: number,
) {
  const hit = holds.find((hold) => {
    if (hold.courtId !== courtId || hold.date !== date) return false;
    const holdStart = toMinutes(hold.startTime);
    const holdEnd = toMinutes(hold.endTime);
    if (holdStart == null || holdEnd == null) return false;
    return rangesOverlap(start, start + slot, holdStart, holdEnd);
  });
  if (!hit) return "free";
  return hit.source === "match" ? "match" : "manual";
}

function Swatch({ color, border }: { color: string; border: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 3,
        background: color,
        border: `1px solid ${border}`,
        marginRight: 4,
      }}
    />
  );
}
