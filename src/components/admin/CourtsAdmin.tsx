import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, deleteDoc, getDoc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import {
  Calendar,
  CircleDollarSign,
  Clock,
  FileText,
  Image as ImageIcon,
  Info,
  MapPin,
  Menu,
  Pencil,
  Plus,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCourtHolds, useCourts } from "../../hooks/useCourts";
import { useModalLock } from "../../hooks/useModalLock";
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
  matchesCol,
  platformConfigRef,
  platformStoragePath,
  tournamentRef,
} from "../../lib/paths";
import { db } from "../../lib/firebase";
import { scheduleMatch } from "../../lib/scheduleMatch";
import { uploadImageFile } from "../../lib/uploadImage";
import { asCourtSlot, asMatchDuration, type Court, type CourtHold, type CourtSlotMinutes, type TimeWindow } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import WindowsEditor, { dayLabel } from "../courts/WindowsEditor";
import ConfirmModal from "../ConfirmModal";
import Field from "./Field";
import {
  C,
  FormInput,
  FormSelect,
  FormTextarea,
  PrimaryButton,
  SectionCard,
} from "../ui";

const COURT_TEXT_LIMIT = 15;

function clipCourtText(value: string) {
  return value.slice(0, COURT_TEXT_LIMIT);
}

function deleteCourtMessage(name: string, matches: number, rentals: number, linked: boolean) {
  if (!linked) {
    return `¿Seguro que deseas eliminar ${name}? Esta acción no se puede deshacer.`;
  }
  const parts: string[] = [];
  if (matches === 1) parts.push("1 partido");
  else if (matches > 1) parts.push(`${matches} partidos`);
  if (rentals === 1) parts.push("1 renta");
  else if (rentals > 1) parts.push(`${rentals} rentas`);
  const has = parts.length ? `Tiene ${parts.join(" y ")}. ` : "";
  return `¿Seguro que deseas eliminar ${name}? ${has}Se quitarán esos apartados y los partidos quedarán sin esta cancha. El marcador y la fecha se conservan.`;
}

async function deleteCourtAndLinks(court: Court) {
  const [holdSnap, matchSnap] = await Promise.all([
    getDocs(query(courtHoldsCol(), where("courtId", "==", court.id))),
    getDocs(query(matchesCol(), where("courtId", "==", court.id))),
  ]);
  const rentals = holdSnap.docs.filter((docSnap) => docSnap.data().source !== "match").length;
  const linked = holdSnap.size > 0 || matchSnap.size > 0;
  if (!window.confirm(deleteCourtMessage(court.name, matchSnap.size, rentals, linked))) return false;

  const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
  for (const docSnap of holdSnap.docs) ops.push((batch) => batch.delete(docSnap.ref));
  for (const docSnap of matchSnap.docs) ops.push((batch) => batch.update(docSnap.ref, { courtId: "" }));
  for (let index = 0; index < ops.length; index += 450) {
    const batch = writeBatch(db);
    for (const op of ops.slice(index, index + 450)) op(batch);
    await batch.commit();
  }
  await deleteDoc(courtRef(court.id));
  return true;
}

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
  const [draftFootball, setDraftFootball] = useState(true);
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [draftPreview, setDraftPreview] = useState("");
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

  const clearPhoto = () => {
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    setDraftFile(null);
    setDraftImageUrl("");
  };

  const openAddCourt = () => {
    setDraftName("");
    setDraftDescription("");
    setDraftRate("");
    setDraftFootball(true);
    clearPhoto();
    setCourtModal("add");
  };

  const openEditCourt = (court: Court) => {
    setDraftName(clipCourtText(court.name));
    setDraftDescription(clipCourtText(court.description));
    setDraftRate(String(court.hourlyRate));
    setDraftFootball(court.football !== false);
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return court.imageUrl?.trim() || "";
    });
    setDraftFile(null);
    setDraftImageUrl(court.imageUrl?.trim() || "");
    setCourtModal(court);
  };

  const pickPhoto = (file: File) => {
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setDraftFile(file);
  };

  const saveCourtModal = async () => {
    const cleanName = clipCourtText(draftName.trim());
    const cleanDescription = clipCourtText(draftDescription.trim());
    const hourlyRate = Number(draftRate);
    if (!cleanName || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
      alert("Escribe el nombre y un costo por hora válido.");
      return;
    }
    setDraftBusy(true);
    try {
      let imageUrl = draftImageUrl.trim();
      if (draftFile) {
        imageUrl = await uploadImageFile(
          platformStoragePath("courts", `${Date.now()}.jpg`),
          draftFile,
          { maxSizeMB: 0.6, maxWidthOrHeight: 1200 },
        );
      }
      if (courtModal === "add") {
        const order = courts.reduce((max, court) => Math.max(max, court.order), 0) + 1;
        await addDoc(courtsCol(), {
          name: cleanName,
          description: cleanDescription,
          hourlyRate,
          imageUrl,
          football: draftFootball,
          active: true,
          order,
        });
      } else if (courtModal) {
        await updateDoc(courtRef(courtModal.id), {
          name: cleanName,
          description: cleanDescription,
          hourlyRate,
          imageUrl,
          football: draftFootball,
        });
      }
      clearPhoto();
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
        <div className="hours-form">
          <p className="hours-form__lead">
            Configura los horarios en que estará disponible el módulo de canchas para el público.
          </p>
          <div className={`hours-form__module${enabled ? " is-on" : ""}`}>
            <span>
              <strong>Módulo de canchas visible para el público</strong>
              <small>Cuando está activado, los usuarios podrán reservar en los horarios definidos.</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Módulo de canchas visible para el público"
              className={`hours-form__switch${enabled ? " is-on" : ""}`}
              onClick={() => setEnabled(!enabled)}
            >
              <span />
            </button>
          </div>
          <div className="hours-form__step">
            <span className="hours-form__kicker">
              <Clock size={14} />
              Paso del apartado
            </span>
            <div className="hours-form__choices">
              <button
                type="button"
                className={slot === 60 ? "is-on" : ""}
                onClick={() => setSlot(60)}
              >
                <Clock size={15} />
                Cada hora
              </button>
              <button
                type="button"
                className={slot === 30 ? "is-on" : ""}
                onClick={() => setSlot(30)}
              >
                <Clock size={15} />
                Cada 30 min
              </button>
            </div>
            <p>Los inicios caen en esta rejilla.</p>
          </div>
          <WindowsEditor windows={windows} onChange={setWindows} />
          <p className="hours-form__note">
            <Info size={14} />
            Fuera de estos rangos no se puede apartar.
          </p>
          <PrimaryButton type="button" disabled={configBusy} onClick={() => void saveConfig()}>
            <Save size={15} />
            {configBusy ? "Guardando…" : "Guardar horario"}
          </PrimaryButton>
        </div>
      </SectionCard>

      <SectionCard className="book-panel">
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
      <CourtFormModal
        open={courtModal !== null}
        editing={courtModal && courtModal !== "add" ? courtModal : null}
        name={draftName}
        description={draftDescription}
        rate={draftRate}
        football={draftFootball}
        preview={draftPreview}
        busy={draftBusy}
        canSave={Boolean(draftName.trim()) && draftRate.trim() !== ""}
        onName={setDraftName}
        onDescription={setDraftDescription}
        onRate={setDraftRate}
        onFootball={setDraftFootball}
        onPhoto={pickPhoto}
        onClearPhoto={clearPhoto}
        onSave={() => void saveCourtModal()}
        onCancel={() => {
          if (!draftBusy) setCourtModal(null);
        }}
        onToggleActive={() => {
          if (!courtModal || courtModal === "add") return;
          const next = !courtModal.active;
          if (
            !next &&
            !window.confirm(
              `¿Ocultar ${courtModal.name}? Esta cancha ya no estará disponible para el público.`,
            )
          ) {
            return;
          }
          void updateDoc(courtRef(courtModal.id), {
            active: next,
            name: clipCourtText(courtModal.name),
            description: clipCourtText(courtModal.description),
          })
            .then(() => setCourtModal({ ...courtModal, active: next }))
            .catch(() => alert("No se pudo actualizar la cancha."));
        }}
        onDelete={() => {
          if (!courtModal || courtModal === "add" || draftBusy) return;
          setDraftBusy(true);
          void deleteCourtAndLinks(courtModal)
            .then((removed) => {
              if (removed) setCourtModal(null);
            })
            .catch(() => alert("No se pudo eliminar la cancha."))
            .finally(() => setDraftBusy(false));
        }}
      />
    </div>
  );
}

function CourtFormModal({
  open,
  editing,
  name,
  description,
  rate,
  football,
  preview,
  busy,
  canSave,
  onName,
  onDescription,
  onRate,
  onFootball,
  onPhoto,
  onClearPhoto,
  onSave,
  onCancel,
  onToggleActive,
  onDelete,
}: {
  open: boolean;
  editing: Court | null;
  name: string;
  description: string;
  rate: string;
  football: boolean;
  preview: string;
  busy: boolean;
  canSave: boolean;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onRate: (value: string) => void;
  onFootball: (value: boolean) => void;
  onPhoto: (file: File) => void;
  onClearPhoto: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  useModalLock(open ? onCancel : null);
  if (!open) return null;

  return (
    <div
      className="court-form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="court-form-title"
      onClick={onCancel}
    >
      <div className="court-form__panel" onClick={(event) => event.stopPropagation()}>
        <header className="court-form__head">
          <span className="court-form__ball" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 7.2 14.6 9l-1 3.1H10.4L9.4 9 12 7.2Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M9.4 9 6.6 8.2 5.4 11.2 8.2 13.2M14.6 9l2.8-.8 1.2 3-2.8 2M8.2 13.2 7.4 16.6 10.4 18.1 12 15.1M15.8 13.2 16.6 16.6 13.6 18.1 12 15.1"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h3 id="court-form-title">{editing ? "Editar cancha" : "Nueva cancha"}</h3>
            <p>
              {editing
                ? "Actualiza la información de esta cancha."
                : "Completa la información para registrar una nueva cancha."}
            </p>
          </div>
          <button type="button" className="court-form__close" aria-label="Cerrar" onClick={onCancel}>
            <X size={18} />
          </button>
        </header>

        <div className="court-form__body">
          <label className="court-form__label">
            Nombre
            <span className="court-form__field">
              <Menu size={16} aria-hidden="true" />
              <FormInput
                value={name}
                autoFocus
                disabled={busy}
                maxLength={COURT_TEXT_LIMIT}
                placeholder="Cancha 1"
                onChange={(event) => onName(clipCourtText(event.target.value))}
              />
            </span>
          </label>
          <label className="court-form__label">
            Descripción
            <span className="court-form__field">
              <FileText size={16} aria-hidden="true" />
              <FormTextarea
                value={description}
                disabled={busy}
                maxLength={COURT_TEXT_LIMIT}
                rows={2}
                placeholder="Pasto sintético"
                onChange={(event) => onDescription(clipCourtText(event.target.value))}
              />
            </span>
          </label>
          <label className="court-form__label">
            Costo por hora
            <span className="court-form__field">
              <CircleDollarSign size={16} aria-hidden="true" />
              <FormInput
                type="number"
                min={0}
                value={rate}
                disabled={busy}
                placeholder="400"
                onChange={(event) => onRate(event.target.value)}
              />
            </span>
          </label>

          <div className={`court-form__football${football ? " is-on" : ""}`}>
            <span>
              <strong>Apta para torneos de fútbol</strong>
              <small>
                {football
                  ? "Se programa en el calendario de partidos."
                  : "Solo renta. No entra por tamaño o condiciones."}
              </small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={football}
              aria-label="Apta para torneos de fútbol"
              className={`court-form__switch${football ? " is-on" : ""}`}
              disabled={busy}
              onClick={() => onFootball(!football)}
            >
              <span />
            </button>
          </div>

          <div className="court-form__label">
            Foto
            <div className="court-form__photo">
              {preview ? (
                <img src={preview} alt="" />
              ) : (
                <span className="court-form__photo-empty">
                  <ImageIcon size={22} />
                </span>
              )}
              <div>
                <button
                  type="button"
                  className="court-form__file"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={15} />
                  Elegir archivo
                </button>
                <p>Opcional. Sin foto se muestra la cancha por defecto.</p>
                {preview ? (
                  <button type="button" className="court-form__remove" disabled={busy} onClick={onClearPhoto}>
                    Quitar foto
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onPhoto(file);
                }}
              />
            </div>
          </div>
        </div>

        <footer className="court-form__foot">
          {editing ? (
            <div className="court-form__danger">
              <button type="button" className="court-form__ghost" disabled={busy} onClick={onToggleActive}>
                {editing.active ? "Ocultar" : "Mostrar"}
              </button>
              <button type="button" className="court-form__delete" disabled={busy} onClick={onDelete}>
                Eliminar
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="court-form__actions">
            <button type="button" className="court-form__ghost" disabled={busy} onClick={onCancel}>
              Cancelar
            </button>
            <PrimaryButton variant="green" disabled={busy || !canSave} onClick={onSave}>
              <Save size={15} />
              {busy ? "Guardando…" : "Guardar"}
            </PrimaryButton>
          </div>
        </footer>
      </div>
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
      return `${court?.name || "Cancha"} · ${formatFriendlyTime(fromMinutes(range.start))} - ${formatFriendlyTime(fromMinutes(range.end))}`;
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
    ? pickCourt(
        courts.filter((court) => court.football !== false),
        holds,
        windows,
        slot,
        matchDate,
        matchStart,
        matchDuration,
        matchHold,
      )
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

  const barLabel = ranges.length === 1 ? `Apartar · ${summary}` : `Apartar ${ranges.length} tramos`;

  return (
    <div className="book-sheet">
      <BookArt />
      <header className="book-head">
        <span className="book-pin" aria-hidden="true">
          <MapPin size={16} />
        </span>
        <div>
          <h2>Apartar canchas</h2>
          <p>Selecciona la fecha y el horario disponible para reservar tu cancha.</p>
        </div>
      </header>
      <div className="book-tools">
        <label className="book-date">
          <span>Fecha</span>
          <FormInput type="date" value={date} onChange={(e) => onDate(e.target.value)} />
        </label>
        <div className="book-legend">
          <span><i className="is-free" /> Libre</span>
          <span><i className="is-match" /> Partido</span>
          <span><i className="is-hold" /> Apartado</span>
        </div>
      </div>
      {ranges.length > 0 && (
        <div className="book-bar">
          <button type="button" className="book-bar__go" onClick={() => setOpen(true)}>
            <Calendar size={15} />
            {barLabel}
          </button>
          <button
            type="button"
            className="book-bar__clear"
            aria-label="Quitar selección"
            onClick={() => setPicked([])}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {courts.length > 0 && starts.length === 0 && (
        <p className="book-closed">Este día las canchas están cerradas.</p>
      )}
      {courts.length > 0 && starts.length > 0 && (
        <div className="book-grid-wrap">
          <div
            className="book-grid"
            style={{ gridTemplateColumns: `minmax(148px, max-content) repeat(${starts.length}, minmax(52px, 1fr))` }}
          >
            <span className="book-time book-time--name">Cancha</span>
            {starts.map((start) => (
              <span key={start} className="book-time">
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
          </div>
        </div>
      )}
      <button type="button" className="book-add" onClick={onAddCourt}>
        <Plus size={16} /> Agregar cancha
      </button>
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
  const chosen = picked.some((item) => item.courtId === court.id);
  return (
    <>
      <span className={`book-court${chosen ? " is-on" : ""}${court.active ? "" : " is-hidden"}`}>
        <CourtMark football={court.football !== false} />
        <span className="book-court__name">{court.name}</span>
        {!court.active && <span className="book-court__hidden">Oculta</span>}
        <button type="button" className="book-court__edit" aria-label={`Editar ${court.name}`} onClick={onEdit}>
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
              className={`book-cell book-cell--free${selected ? " is-on" : ""}`}
              aria-pressed={selected}
              title="Libre"
              onClick={() => onToggle(court.id, cell.start)}
            />
          );
        }
        const manual = cell.hold.source === "manual";
        const label = manual ? holdLabel(cell.hold) : matchSigla(cell.hold, matchLabels);
        return (
          <button
            key={cell.hold.id + cell.start}
            type="button"
            className={`book-cell ${manual ? "book-cell--hold" : "book-cell--match"}`}
            style={{ gridColumn: `span ${cell.span}` }}
            title={manual ? cell.hold.note || "Apartado" : label}
            onClick={() => onOpenHold(cell.hold)}
          >
            {manual && <User size={13} />}
            <span>{label}</span>
          </button>
        );
      })}
    </>
  );
}

function CourtMark({ football }: { football: boolean }) {
  if (football) {
    return (
      <svg className="book-court__mark" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 4.2c1.8 2.2 2.7 4.7 2.7 7.8s-.9 5.6-2.7 7.8c-1.8-2.2-2.7-4.7-2.7-7.8s.9-5.6 2.7-7.8zM5 9.2h14M5 14.8h14" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg className="book-court__mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5 19 19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BookArt() {
  return (
    <svg className="book-art" viewBox="0 0 120 88" aria-hidden="true">
      <circle cx="28" cy="34" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M38 44c10 10 22 16 36 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="86" cy="58" rx="22" ry="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="96" cy="22" r="8" fill="currentColor" opacity="0.35" />
    </svg>
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

