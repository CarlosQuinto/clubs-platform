import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  loadCourts,
  removeCourt,
  removeManualHold,
  saveCourtModule,
  upsertCourt,
  upsertHold,
} from "../../../domains/courts/courtCommands";
import { toCourtsAdmin } from "./courtsAdminMapper";
import { useAdminQuery } from "../useAdminQuery";
import { useModalLock } from "../../../shared/useModalLock";
import {
  courtsFreeAt,
  daySlotStarts,
  windowsOnDay,
  formatDuration,
  fromMinutes,
  rangesOverlap,
  readWindows,
  todayIso,
  toMinutes,
  weekdayOf,
} from "../../../domains/courts/courts";
import { platformStoragePath } from "../../../shared/paths";
import { saveMatchSchedule } from "../../../domains/matches/matchCommands";
import { sendCourtBookingNotice } from "../../../infrastructure/functions/callables";
import {
  courtName,
  courtNote,
  isCourtName,
  isCourtNote,
  isEmail,
  isMoneyText,
  moneyLabel,
  moneyText,
} from "../../../shared/textLimits";
import { IMAGE_ACCEPT, isAllowedImage } from "../../../shared/imageFile";
import { uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import { asMatchDuration, type Court, type CourtHold, type CourtSlotMinutes, type TimeWindow } from "../../../shared/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../../shared/helpers";
import WindowsEditor from "../../../shared/WindowsEditor";
import ConfirmModal from "../../../shared/ConfirmModal";
import Field from "../Field";
import {
  C,
  FormInput,
  FormSelect,
  FormTextarea,
  PrimaryButton,
  SectionCard,
} from "../../../shared/ui";

const COURT_TEXT_LIMIT = 15;

const PHOTO_ERROR = "La foto tiene que ser JPG, PNG o WEBP de hasta 5 MB.";

function courtSaveHint(name: string, description: string, rate: string) {
  const missing: string[] = [];
  if (!isCourtName(name)) missing.push("el nombre (3 a 15)");
  if (!isCourtNote(description)) missing.push("la descripción (3 a 15)");
  if (!isMoneyText(rate)) missing.push("el costo por hora");
  if (missing.length === 0) return "";
  if (missing.length === 1) return `Escribe ${missing[0]}.`;
  if (missing.length === 2) return `Escribe ${missing[0]} y ${missing[1]}.`;
  return `Escribe ${missing[0]}, ${missing[1]} y ${missing[2]}.`;
}

const BOOKING_MAIL_FAIL = "El cambio quedó guardado, pero el correo no se envió.";
const COURT_TAKEN = "Esa cancha no está disponible en esa fecha y hora.";

function bookingPriceLabel(hourlyRate: number, minutes: number) {
  const price = Math.round(((hourlyRate * minutes) / 60) * 100) / 100;
  const text = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `$${text}`;
}

function bookingSlot(court: Court | undefined, start: number, end: number) {
  const minutes = Math.max(0, end - start);
  return {
    courtName: court?.name || "Cancha",
    startLabel: formatFriendlyTime(fromMinutes(start)),
    endLabel: formatFriendlyTime(fromMinutes(end)),
    durationLabel: formatDuration(minutes),
    priceLabel: bookingPriceLabel(court?.hourlyRate ?? 0, minutes),
  };
}

async function mailBooking(input: {
  to: string;
  kind: "created" | "updated" | "cancelled";
  date: string;
  note: string;
  slots: ReturnType<typeof bookingSlot>[];
}) {
  const to = input.to.trim().toLowerCase();
  if (!to) return true;
  try {
    return await sendCourtBookingNotice({
      to,
      kind: input.kind,
      dateLabel: formatFriendlyDate(input.date),
      note: input.note,
      slots: input.slots,
    });
  } catch (err) {
    console.error(err);
    return false;
  }
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

async function deleteCourtAndLinks(court: Court, holds: CourtHold[]) {
  const own = holds.filter((hold) => hold.courtId === court.id);
  const matches = own.filter((hold) => hold.source === "match").length;
  const rentals = own.filter((hold) => hold.source !== "match").length;
  const linked = own.length > 0;
  if (!window.confirm(deleteCourtMessage(court.name, matches, rentals, linked))) return false;
  await removeCourt(court.id);
  return true;
}

export default function CourtsAdmin() {
  const today = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }, []);
  const screen = useAdminQuery(() => loadCourts());
  const view = useMemo(
    () => (screen.data ? toCourtsAdmin(screen.data) : null),
    [screen.data],
  );
  const courts = view?.courts ?? [];
  const holds = view?.holds ?? [];
  const [enabled, setEnabled] = useState(false);
  const [slot, setSlot] = useState<CourtSlotMinutes>(60);
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  useEffect(() => {
    if (!view) return;
    setEnabled(view.enabled);
    setSlot(view.slot);
    setWindows(view.windows);
  }, [view]);
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
  const [draftPhotoError, setDraftPhotoError] = useState("");
  const [draftError, setDraftError] = useState("");
  const savingCourt = useRef(false);
  const photoTicket = useRef(0);

  const saveConfig = async () => {
    const clean = readWindows(windows);
    setConfigBusy(true);
    try {
      await saveCourtModule(
        enabled,
        slot,
        clean.map((window) => ({
          weekday: window.day,
          startTime: window.start,
          endTime: window.end,
        })),
      );
      setWindows(clean);
      screen.reload();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el horario de canchas.");
    } finally {
      setConfigBusy(false);
    }
  };

  const clearPhoto = () => {
    photoTicket.current += 1;
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
    setDraftFile(null);
    setDraftImageUrl("");
    setDraftPhotoError("");
  };

  const openAddCourt = () => {
    setDraftName("");
    setDraftDescription("");
    setDraftRate("");
    setDraftFootball(true);
    setDraftError("");
    clearPhoto();
    setCourtModal("add");
  };

  const openEditCourt = (court: Court) => {
    setDraftName(courtName(court.name));
    setDraftDescription(courtNote(court.description));
    setDraftRate(moneyText(String(court.hourlyRate)));
    setDraftFootball(court.football !== false);
    setDraftError("");
    setDraftPhotoError("");
    photoTicket.current += 1;
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return court.imageUrl?.trim() || "";
    });
    setDraftFile(null);
    setDraftImageUrl(court.imageUrl?.trim() || "");
    setCourtModal(court);
  };

  const pickPhoto = async (file: File) => {
    const ticket = ++photoTicket.current;
    const allowed = await isAllowedImage(file).catch(() => false);
    if (ticket !== photoTicket.current) return;
    if (!allowed) {
      setDraftFile(null);
      setDraftPhotoError(PHOTO_ERROR);
      return;
    }
    setDraftPhotoError("");
    setDraftPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setDraftFile(file);
  };

  const saveCourtModal = async () => {
    if (savingCourt.current) return;
    if (courtSaveHint(draftName, draftDescription, draftRate) || draftPhotoError) return;
    const cleanName = draftName.trim();
    const cleanDescription = draftDescription.trim();
    const hourlyRate = Math.round(Number(draftRate) * 100) / 100;
    savingCourt.current = true;
    setDraftBusy(true);
    setDraftError("");
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
        await upsertCourt({
          id: crypto.randomUUID(),
          name: cleanName,
          description: cleanDescription,
          hourlyRate,
          imageUrl,
          football: draftFootball,
          active: true,
          sortOrder: order,
        });
      } else if (courtModal) {
        await upsertCourt({
          id: courtModal.id,
          name: cleanName,
          description: cleanDescription,
          hourlyRate,
          imageUrl,
          football: draftFootball,
          active: courtModal.active,
          sortOrder: courtModal.order,
        });
      }
      screen.reload();
      clearPhoto();
      setCourtModal(null);
    } catch (err) {
      console.error(err);
      setDraftError("No se pudo guardar la cancha.");
    } finally {
      savingCourt.current = false;
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
          onChanged={screen.reload}
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
        photoError={draftPhotoError}
        error={draftError}
        onName={(value) => {
          setDraftName(value);
          setDraftError("");
        }}
        onDescription={(value) => {
          setDraftDescription(value);
          setDraftError("");
        }}
        onRate={(value) => {
          setDraftRate(value);
          setDraftError("");
        }}
        onFootball={setDraftFootball}
        onPhoto={(file) => void pickPhoto(file)}
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
          void upsertCourt({
            id: courtModal.id,
            name: courtName(courtModal.name).trim(),
            description: courtNote(courtModal.description).trim(),
            hourlyRate: courtModal.hourlyRate,
            football: courtModal.football !== false,
            imageUrl: courtModal.imageUrl || "",
            sortOrder: courtModal.order,
            active: next,
          })
            .then(() => {
              screen.reload();
              setCourtModal({ ...courtModal, active: next });
            })
            .catch(() => alert("No se pudo actualizar la cancha."));
        }}
        onDelete={() => {
          if (!courtModal || courtModal === "add" || draftBusy) return;
          setDraftBusy(true);
          void deleteCourtAndLinks(courtModal, holds)
            .then((removed) => {
              if (removed) {
                screen.reload();
                setCourtModal(null);
              }
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
  photoError,
  error,
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
  photoError: string;
  error: string;
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

  const missing = courtSaveHint(name, description, rate);
  const touched = Boolean(name || description || rate);
  const saveHint = touched ? missing : "";
  const ready = !missing && !photoError && !busy;

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
                onChange={(event) => onName(courtName(event.target.value))}
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
                onChange={(event) => onDescription(courtNote(event.target.value))}
              />
            </span>
          </label>
          <label className="court-form__label">
            Costo por hora
            <span className="court-form__field">
              <CircleDollarSign size={16} aria-hidden="true" />
              <FormInput
                inputMode="decimal"
                autoComplete="off"
                maxLength={14}
                value={moneyLabel(rate)}
                disabled={busy}
                placeholder="400.00"
                onChange={(event) => onRate(moneyText(event.target.value))}
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
                <p>Opcional. JPG, PNG o WEBP de hasta 5 MB. Sin foto se muestra la cancha por defecto.</p>
                {photoError ? (
                  <p style={{ color: C.red }} role="alert">
                    {photoError}
                  </p>
                ) : null}
                {preview ? (
                  <button type="button" className="court-form__remove" disabled={busy} onClick={onClearPhoto}>
                    Quitar foto
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT}
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
            <span className="court-form__save">
              {error || saveHint ? (
                <span className="court-form__hint" role="tooltip">
                  {error || saveHint}
                </span>
              ) : null}
              <PrimaryButton variant="green" disabled={!ready} onClick={onSave}>
                <Save size={15} />
                {busy ? "Guardando..." : "Guardar"}
              </PrimaryButton>
            </span>
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
  onChanged,
}: {
  date: string;
  onDate: (value: string) => void;
  courts: Court[];
  holds: CourtHold[];
  windows: TimeWindow[];
  slot: CourtSlotMinutes;
  onEditCourt: (court: Court) => void;
  onAddCourt: () => void;
  onChanged: () => void;
}) {
  const day = weekdayOf(date);
  const starts = day ? daySlotStarts(windows, day, slot) : [];
  const [picked, setPicked] = useState<SlotPick[]>([]);
  const [open, setOpen] = useState(false);
  const [guest, setGuest] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestHint, setGuestHint] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editHold, setEditHold] = useState<CourtHold | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNameHint, setEditNameHint] = useState("");
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

  const past = date < todayIso();

  const toggle = (courtId: string, start: number) => {
    if (past) return;
    setPicked((current) => {
      const exists = current.some((item) => item.courtId === courtId && item.start === start);
      if (exists) return current.filter((item) => !(item.courtId === courtId && item.start === start));
      return [...current, { courtId, start }];
    });
  };

  const close = () => {
    if (busy) return;
    setGuestHint("");
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
  const homeName = matchHold?.homeClubName?.trim();
  const awayName = matchHold?.awayClubName?.trim();
  const matchTitle = homeName && awayName ? `${homeName} vs ${awayName}` : "Partido";

  const saveHold = async () => {
    const cleanName = editName.trim().slice(0, 30);
    const cleanNote = editNote.trim().slice(0, 50);
    if (!editHold || editHold.date < todayIso() || !editCourt) return;
    const cleanEmail = editEmail.trim().toLowerCase();
    if (!cleanName) {
      setEditNameHint("Escribe el nombre.");
      return;
    }
    if (cleanEmail && !isEmail(cleanEmail)) {
      setEditNameHint("Escribe un correo válido.");
      return;
    }
    setEditNameHint("");
    const text = cleanNote ? `${cleanName} · ${cleanNote}` : cleanName;
    if (text.length >= 200) {
      alert("El nombre y la nota juntos no pueden pasar de 200 caracteres.");
      return;
    }
    const end = editStart + editDuration;
    setEditBusy(true);
    try {
      await upsertHold({
        id: editHold.id,
        courtId: editCourt.id,
        holdDate: editDate,
        startTime: fromMinutes(editStart),
        endTime: fromMinutes(end),
        note: text,
        guestEmail: cleanEmail,
      });
      onChanged();
      const mailed = await mailBooking({
        to: cleanEmail,
        kind: "updated",
        date: editDate,
        note: cleanNote,
        slots: [bookingSlot(editCourt, editStart, end)],
      });
      setEditHold(null);
      const saved = `${editCourt.name} apartada para ${formatFriendlyDate(editDate)} de ${formatFriendlyTime(fromMinutes(editStart))} a ${formatFriendlyTime(fromMinutes(end))}.`;
      setNotice(mailed ? saved : `${saved} ${BOOKING_MAIL_FAIL}`);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el apartado.");
    } finally {
      setEditBusy(false);
    }
  };

  const saveMatch = async () => {
    if (!matchHold?.matchId || matchHold.date < todayIso() || !matchCourt) return;
    setMatchBusy(true);
    try {
      await saveMatchSchedule({
        matchId: matchHold.matchId,
        date: matchDate,
        time: fromMinutes(matchStart),
        venue: matchCourt.name,
        courtId: matchCourt.id,
        durationMinutes: matchDuration,
        courts: courts.filter((court) => court.football !== false),
        openWindows: windows,
        slotMinutes: slot,
      });
      onChanged();
      const end = matchStart + matchDuration;
      setMatchHold(null);
      setNotice(
        `${matchCourt.name} apartada para ${formatFriendlyDate(matchDate)} de ${formatFriendlyTime(fromMinutes(matchStart))} a ${formatFriendlyTime(fromMinutes(end))}.`,
      );
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error && err.message === COURT_TAKEN
          ? COURT_TAKEN
          : "No se pudo guardar el partido.",
      );
    } finally {
      setMatchBusy(false);
    }
  };

  const save = async () => {
    const cleanName = guest.trim().slice(0, 30);
    const cleanNote = note.trim().slice(0, 50);
    if (past || ranges.length === 0) return;
    const cleanEmail = guestEmail.trim().toLowerCase();
    if (!cleanName) {
      setGuestHint("Escribe el nombre.");
      return;
    }
    if (!isEmail(cleanEmail)) {
      setGuestHint("Escribe un correo válido.");
      return;
    }
    setGuestHint("");
    const text = cleanNote ? `${cleanName} · ${cleanNote}` : cleanName;
    if (text.length >= 200) {
      alert("El nombre y la nota juntos no pueden pasar de 200 caracteres.");
      return;
    }
    setBusy(true);
    try {
      for (const range of ranges) {
        await upsertHold({
          id: crypto.randomUUID(),
          courtId: range.courtId,
          holdDate: date,
          startTime: fromMinutes(range.start),
          endTime: fromMinutes(range.end),
          note: text,
          guestEmail: cleanEmail,
        });
      }
      onChanged();
      const mailed = await mailBooking({
        to: cleanEmail,
        kind: "created",
        date,
        note: cleanNote,
        slots: ranges.map((range) =>
          bookingSlot(
            courts.find((court) => court.id === range.courtId),
            range.start,
            range.end,
          ),
        ),
      });
      setPicked([]);
      setGuest("");
      setGuestEmail("");
      setNote("");
      setOpen(false);
      if (!mailed) setNotice(BOOKING_MAIL_FAIL);
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
      {!past && ranges.length > 0 && (
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
        <>
          <p className="book-closed">Este día las canchas están cerradas.</p>
          <ul className="book-court-list">
            {courts.map((court) => (
              <li key={court.id}>
                <CourtName court={court} onEdit={() => onEditCourt(court)} />
              </li>
            ))}
          </ul>
        </>
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
                  past={past}
                  onToggle={toggle}
                  onEdit={() => onEditCourt(court)}
                  onOpenHold={(hold) => {
                    const start = toMinutes(hold.startTime) ?? 0;
                    const end = toMinutes(hold.endTime);
                    const duration = end != null && end > start ? end - start : 60;
                    if (hold.source === "match" && hold.matchId) {
                      setMatchDate(hold.date);
                      setMatchStart(start);
                      setMatchDuration(
                        hold.matchDurationMinutes != null
                          ? asMatchDuration(hold.matchDurationMinutes)
                          : duration,
                      );
                      setMatchHold(hold);
                      return;
                    }
                    const parts = splitHoldNote(hold.note || "");
                    setEditNameHint("");
                    setEditName(parts.name.slice(0, 30));
                    setEditEmail((hold.guestEmail || "").slice(0, 320));
                    setEditNote(parts.note.slice(0, 50));
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
        confirmHint={guestHint}
        onConfirm={() => void save()}
        onCancel={close}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Nombre">
            <FormInput
              value={guest}
              maxLength={30}
              onChange={(e) => {
                setGuest(e.target.value.slice(0, 30));
                setGuestHint("");
              }}
              placeholder="Quién aparta"
              autoFocus
            />
          </Field>
          <Field label="Correo">
            <FormInput
              type="email"
              value={guestEmail}
              maxLength={320}
              onChange={(e) => {
                setGuestEmail(e.target.value.slice(0, 320));
                setGuestHint("");
              }}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Nota">
            <FormInput
              value={note}
              maxLength={50}
              onChange={(e) => setNote(e.target.value.slice(0, 50))}
              placeholder="Opcional"
            />
          </Field>
        </div>
      </ConfirmModal>
      <ConfirmModal
        open={editHold !== null}
        title="Apartado"
        confirmLabel="Guardar"
        cancelLabel={editHold && editHold.date < todayIso() ? "Cerrar" : "Cancelar"}
        busy={editBusy}
        readOnly={editHold !== null && editHold.date < todayIso()}
        confirmDisabled={!editCourt}
        confirmHint={editNameHint}
        dangerAction={{
          label: "Eliminar",
          onClick: () => {
            if (!editHold) return;
            const hold = editHold;
            const court = courts.find((item) => item.id === hold.courtId);
            const start = toMinutes(hold.startTime) ?? 0;
            const end = toMinutes(hold.endTime) ?? start;
            const comment = splitHoldNote(hold.note || "").note;
            setEditBusy(true);
            void removeManualHold(hold.id)
              .then(async () => {
                onChanged();
                setEditHold(null);
                const mailed = await mailBooking({
                  to: hold.guestEmail || "",
                  kind: "cancelled",
                  date: hold.date,
                  note: comment,
                  slots: [bookingSlot(court, start, end)],
                });
                if (!mailed) setNotice(BOOKING_MAIL_FAIL);
              })
              .catch(() => alert("No se pudo quitar el apartado."))
              .finally(() => setEditBusy(false));
          },
        }}
        onConfirm={() => void saveHold()}
        onCancel={() => {
          if (editBusy) return;
          setEditNameHint("");
          setEditHold(null);
        }}
      >
        <HoldEditor
          name={editName}
          email={editEmail}
          note={editNote}
          dateValue={editDate}
          start={editStart}
          duration={editDuration}
          slot={slot}
          windows={windows}
          locked={editHold !== null && editHold.date < todayIso()}
          onName={(value) => {
            setEditName(value.slice(0, 30));
            setEditNameHint("");
          }}
          onEmail={(value) => {
            setEditEmail(value.slice(0, 320));
            setEditNameHint("");
          }}
          onNote={(value) => setEditNote(value.slice(0, 50))}
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
        cancelLabel={matchHold && matchHold.date < todayIso() ? "Cerrar" : "Cancelar"}
        busy={matchBusy}
        readOnly={matchHold !== null && matchHold.date < todayIso()}
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
              disabled={matchHold !== null && matchHold.date < todayIso()}
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
            <FormSelect
              value={String(matchStart)}
              disabled={matchHold !== null && matchHold.date < todayIso()}
              onChange={(e) => setMatchStart(Number(e.target.value))}
            >
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
  past,
  onToggle,
  onEdit,
  onOpenHold,
}: {
  court: Court;
  starts: number[];
  holds: CourtHold[];
  date: string;
  slot: number;
  picked: SlotPick[];
  past: boolean;
  onToggle: (courtId: string, start: number) => void;
  onEdit: () => void;
  onOpenHold: (hold: CourtHold) => void;
}) {
  const cells = rowCells(holds, court.id, date, starts, slot);
  const chosen = picked.some((item) => item.courtId === court.id);
  return (
    <>
      <CourtName court={court} chosen={chosen} onEdit={onEdit} />
      {cells.map((cell) => {
        if (cell.kind === "free") {
          if (past) {
            return <span key={cell.start} className="book-cell book-cell--free" title="Libre" />;
          }
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
        const label = manual ? holdLabel(cell.hold) : matchSigla(cell.hold);
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

function CourtName({
  court,
  chosen = false,
  onEdit,
}: {
  court: Court;
  chosen?: boolean;
  onEdit: () => void;
}) {
  return (
    <span className={`book-court${chosen ? " is-on" : ""}${court.active ? "" : " is-hidden"}`}>
      <CourtMark football={court.football !== false} />
      <span className="book-court__name">{court.name}</span>
      {!court.active && <span className="book-court__hidden">Oculta</span>}
      <button type="button" className="book-court__edit" aria-label={`Editar ${court.name}`} onClick={onEdit}>
        <Pencil size={13} />
      </button>
    </span>
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

function teamInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words.map((word) => word[0] || "").join("").toUpperCase();
}

function matchSigla(hold: CourtHold) {
  const home = hold.homeClubName?.trim();
  const away = hold.awayClubName?.trim();
  if (!home || !away) return "Partido";
  return `${teamInitials(home)} vs ${teamInitials(away)}`;
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
  email,
  note,
  dateValue,
  start,
  duration,
  slot,
  windows,
  locked = false,
  onName,
  onEmail,
  onNote,
  onDate,
  onStart,
  onDuration,
}: {
  name: string;
  email: string;
  note: string;
  dateValue: string;
  start: number;
  duration: number;
  slot: CourtSlotMinutes;
  windows: TimeWindow[];
  locked?: boolean;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onNote: (value: string) => void;
  onDate: (value: string) => void;
  onStart: (value: number) => void;
  onDuration: (value: number) => void;
}) {
  const starts = slotStartsFor(windows, dateValue, slot);
  const options = durationOptions(windows, dateValue, start, slot);
  useEffect(() => {
    if (locked || !options.length || options.includes(duration)) return;
    onDuration(options[options.length - 1]);
  }, [duration, locked, onDuration, options]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <Field label="Nombre">
        <FormInput
          value={name}
          maxLength={30}
          disabled={locked}
          onChange={(e) => onName(e.target.value.slice(0, 30))}
          autoFocus
        />
      </Field>
      <Field label="Correo">
        <FormInput
          type="email"
          value={email}
          maxLength={320}
          disabled={locked}
          onChange={(e) => onEmail(e.target.value.slice(0, 320))}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Nota">
        <FormInput
          value={note}
          maxLength={50}
          disabled={locked}
          onChange={(e) => onNote(e.target.value.slice(0, 50))}
          placeholder="Pagó la mitad, pago completo…"
        />
      </Field>
      <Field label="Fecha">
        <FormInput type="date" value={dateValue} disabled={locked} onChange={(e) => onDate(e.target.value)} />
      </Field>
      <Field label="Horario">
        <FormSelect value={String(start)} disabled={locked} onChange={(e) => onStart(Number(e.target.value))}>
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
      <Field label="Duración">
        <FormSelect
          value={options.includes(duration) ? String(duration) : ""}
          disabled={locked}
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

