import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
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
  type CourtHoldOutside,
  type MatchOutside,
  loadCourts,
  removeCourt,
  removeManualHold,
  saveCourtModule,
  upsertCourt,
  HOLD_REJECTED,
  upsertHold,
} from "../../../domains/courts/courtCommands";
import { changeChargeStatus, markChargePaid } from "../../../domains/finances/leagueCommands";
import { invalidatePlatformChrome } from "../../shell/usePlatformChrome";
import { toCourtsAdmin } from "./courtsAdminMapper";
import { useAdminQuery } from "../useAdminQuery";
import { useModalLock } from "../../../shared/useModalLock";
import {
  courtsFreeAt,
  daySlotStarts,
  windowsOnDay,
  formatDuration,
  fromMinutes,
  isIsoDate,
  rangesOverlap,
  readWindows,
  todayIso,
  toMinutes,
  weekdayOf,
} from "../../../domains/courts/courts";
import { platformStoragePath } from "../../../shared/paths";
import { saveMatchSchedule } from "../../../domains/matches/matchCommands";
import { notifyMatchScheduled, sendCourtBookingNotice } from "../../../infrastructure/functions/callables";
import { rpcErrorHint } from "../../../infrastructure/dataconnect";
import {
  courtLocation,
  courtName,
  courtNote,
  emailText,
  holdName,
  holdNote,
  isBookingEmail,
  isCourtLocation,
  isCourtName,
  isCourtNote,
  isHoldName,
  isHoldNote,
  isMoneyText,
  moneyLabel,
  moneyText,
  titleCase,
} from "../../../shared/textLimits";
import { IMAGE_ACCEPT, isAllowedImage } from "../../../shared/imageFile";
import { uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import {
  asMatchDuration,
  type Court,
  type CourtHold,
  type CourtSlotMinutes,
  type HoldRental,
  type TimeWindow,
} from "../../../shared/types";
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
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";

const COURT_TEXT_LIMIT = 15;
const COURT_LOCATION_LIMIT = 60;

const PHOTO_ERROR = "La foto tiene que ser JPG, PNG o WEBP de hasta 5 MB.";

function missingHint(missing: string[]) {
  if (missing.length === 0) return "";
  if (missing.length === 1) return `Escribe ${missing[0]}.`;
  const last = missing[missing.length - 1];
  return `Escribe ${missing.slice(0, -1).join(", ")} y ${last}.`;
}

function courtSaveHint(name: string, description: string, rate: string, location: string) {
  const missing: string[] = [];
  if (!isCourtName(name)) missing.push("el nombre (3 a 15)");
  if (!isCourtNote(description)) missing.push("la descripción (3 a 15)");
  if (!isMoneyText(rate)) missing.push("el costo por hora");
  // La ubicación es opcional: solo avisa si se escribió algo demasiado corto.
  if (!isCourtLocation(location)) missing.push("la ubicación (3 a 60)");
  return missingHint(missing);
}

type HoldField = "name" | "email" | "note" | "date" | "start" | "deposit";

const HOLD_FIELDS: HoldField[] = ["name", "email", "note", "date", "start", "deposit"];

/** Aviso de cada campo del apartado; vacío si el campo está bien. */
function holdTips(name: string, email: string, note: string): Record<HoldField, string> {
  return {
    name: isHoldName(name) ? "" : name.trim() ? "Usa de 3 a 30 letras." : "Escribe el nombre.",
    email: isBookingEmail(email) ? "" : email ? "Escribe un correo válido." : "Escribe el correo.",
    note: isHoldNote(note) ? "" : "Usa letras, números y . , ¡! ¿? -",
    date: "",
    start: "",
    deposit: "",
  };
}

/** Cómo se pagó al apartar: todo, o una parte (anticipo) y el resto el día de la renta. */
type PayMode = "full" | "part";

/** Precio en centavos con el mismo redondeo que SQL: round(costo por hora × minutos / 60, 2). */
function priceCents(hourlyRate: number, minutes: number) {
  return Math.round((Math.round(hourlyRate * 100) * Math.max(0, minutes)) / 60);
}

/** Pesos a centavos (montos de la base, con dos decimales). */
function toCents(amount: number) {
  return Math.round(amount * 100);
}

/** «$1,234» o «$1,234.50». */
function centsLabel(cents: number) {
  const text = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return `$${moneyLabel(text)}`;
}

/** Anticipo escrito, en centavos; 0 si no es un monto. */
function depositCents(text: string) {
  return isMoneyText(text) ? Math.round(Number(text) * 100) : 0;
}

/** Aviso del anticipo; vacío si está bien. La misma regla que save_court_hold: mayor que 0 (y aquí, menor que el precio). */
function depositTip(mode: PayMode, text: string, price: number) {
  if (mode === "full" || price <= 0) return "";
  if (!text) return "Escribe el anticipo.";
  const cents = depositCents(text);
  if (cents <= 0) return "Escribe un anticipo mayor que $0.";
  if (cents >= price) return `El anticipo debe ser menor que el precio (${centsLabel(price)}).`;
  return "";
}

/**
 * Reparte un anticipo (centavos) entre los tramos de una misma reserva, en proporción a su precio. Los tramos
 * sin costo no llevan anticipo (null) y ninguno llega a su precio: lo que sobra pasa al siguiente con lugar.
 */
function splitDeposit(total: number, prices: number[]): { shares: (number | null)[] } | { error: string } {
  const priced = prices.flatMap((price, index) => (price > 0 ? [{ price, index }] : []));
  const sum = priced.reduce((acc, item) => acc + item.price, 0);
  const shares: (number | null)[] = prices.map(() => null);
  let left = total;
  priced.forEach(({ price, index }, position) => {
    const share = position === priced.length - 1 ? left : Math.floor((total * price) / sum);
    shares[index] = share;
    left -= share;
  });
  let overflow = 0;
  for (const { price, index } of priced) {
    const share = shares[index] ?? 0;
    if (share > price - 1) {
      overflow += share - (price - 1);
      shares[index] = price - 1;
    }
  }
  for (const { price, index } of priced) {
    const room = price - 1 - (shares[index] ?? 0);
    const add = Math.min(room, overflow);
    shares[index] = (shares[index] ?? 0) + add;
    overflow -= add;
  }
  if (overflow > 0) return { error: "El anticipo debe dejar algo por pagar en cada tramo." };
  if (priced.some(({ index }) => (shares[index] ?? 0) <= 0)) {
    return { error: "El anticipo es muy bajo para repartirlo entre los tramos." };
  }
  return { shares };
}

/** Línea de pago del correo de la renta; vacía si no tiene precio. waived: el resto se condonó, no se cobra. */
function paymentText(amount: number, paid: number, waived = false) {
  if (amount <= 0) return "";
  if (waived) return `Pagado: ${centsLabel(paid)}`;
  if (paid >= amount) return `Pagado: ${centsLabel(amount)}`;
  return `Pagado: ${centsLabel(paid)} · Resta: ${centsLabel(amount - paid)} (se paga al llegar)`;
}

/** Lo que falta por cobrar de una renta (centavos); 0 si está pagada, condonada o sin cobro. */
function holdDue(hold: CourtHold) {
  const rental = hold.rental;
  if (!rental || (rental.status !== "PENDIENTE" && rental.status !== "PARCIAL")) return 0;
  return Math.max(0, toCents(rental.amount) - toCents(rental.paid));
}

/** Lo ya pagado de una renta que, si se cancela, se decide si se devuelve (no las condonadas). */
function holdPaid(hold: CourtHold) {
  const rental = hold.rental;
  if (!rental || rental.status === "CONDONADO") return 0;
  return toCents(rental.paid);
}

/** El primer campo con aviso, para mostrar uno a la vez. */
function firstTip(tips: Record<HoldField, string>, shown: Partial<Record<HoldField, boolean>> | null = null) {
  const field = HOLD_FIELDS.find((key) => tips[key] && (!shown || shown[key]));
  return field ? { field, text: tips[field] } : null;
}

type HoldTip = ReturnType<typeof firstTip>;

function holdText(name: string, note: string) {
  const cleanName = titleCase(name);
  const cleanNote = note.trim();
  return cleanNote ? `${cleanName} · ${cleanNote}` : cleanName;
}

const BOOKING_MAIL_FAIL = "El cambio quedó guardado, pero el correo no se envió.";
const HOURS_SAVE_FAIL = "No se pudo guardar el horario de canchas.";
const HOURS_MAIL_FAIL = "El horario quedó guardado, pero algún aviso de cancelación no se envió.";

/** Nombre de quien rentó: la nota se guarda como «Nombre · Nota». */
function holdGuestName(note: string) {
  return note.split(" · ")[0] || "Sin nombre";
}

type HourConflicts = { holds: CourtHoldOutside[]; matches: MatchOutside[] };

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Texto del aviso según haya rentas, partidos o ambos fuera del horario nuevo. */
function hourConflictsMessage({ holds, matches }: HourConflicts) {
  const what = [
    holds.length ? plural(holds.length, "renta", "rentas") : "",
    matches.length ? plural(matches.length, "partido programado", "partidos programados") : "",
  ]
    .filter(Boolean)
    .join(" y ");
  const effects = [
    holds.length ? (holds.length === 1 ? "la renta se eliminará" : "las rentas se eliminarán") : "",
    matches.length
      ? matches.length === 1
        ? "el partido quedará por programar"
        : "los partidos quedarán por programar"
      : "",
  ]
    .filter(Boolean)
    .join(" y ");
  const notice = [
    holds.length ? "a quien rentó" : "",
    matches.length ? "a los presidentes de los clubes" : "",
  ]
    .filter(Boolean)
    .join(" y ");
  const paid = holds.reduce((sum, hold) => sum + toCents(hold.paid ?? 0), 0);
  const refund = paid > 0
    ? ` Lo pagado de ${holds.length === 1 ? "esa renta" : "esas rentas"} (${centsLabel(paid)}) se anula: devuélveselo a quien rentó.`
    : "";
  return `Hay ${what} fuera del horario nuevo. Si continúas, ${effects}; se avisará por correo ${notice}.${refund}`;
}
const COURT_TAKEN = "Esa cancha no está disponible en esa fecha y hora.";
const HOLD_TAKEN = "No se pudo guardar. Puede que ese horario ya no esté libre; revisa la rejilla.";

function holdSaveError(err: unknown) {
  return err instanceof Error && err.message === HOLD_REJECTED
    ? HOLD_TAKEN
    : "No se pudo guardar el apartado. Revisa tu conexión e inténtalo de nuevo.";
}


function bookingSlot(court: Pick<Court, "name" | "hourlyRate"> | undefined, start: number, end: number) {
  const minutes = Math.max(0, end - start);
  return {
    courtName: court?.name || "Cancha",
    startLabel: formatFriendlyTime(fromMinutes(start)),
    endLabel: formatFriendlyTime(fromMinutes(end)),
    durationLabel: formatDuration(minutes),
    priceLabel: centsLabel(priceCents(court?.hourlyRate ?? 0, minutes)),
  };
}

async function mailBooking(input: {
  to: string;
  kind: "created" | "updated" | "cancelled";
  date: string;
  note: string;
  slots: ReturnType<typeof bookingSlot>[];
  /** «Pagado: $X · Resta: $Y (se paga al llegar)»; solo en el alta y el cambio. */
  paymentLabel?: string;
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
      ...(input.paymentLabel ? { paymentLabel: input.paymentLabel } : {}),
    });
  } catch (err) {
    console.error(err);
    return false;
  }
}

function deleteCourtMessage(name: string, matches: number, rentals: number, linked: boolean, paid: number) {
  if (!linked) {
    return `¿Seguro que deseas eliminar ${name}? Esta acción no se puede deshacer.`;
  }
  const refund = paid > 0
    ? ` Lo pagado de las rentas que no han pasado (${centsLabel(paid)}) se anula: devuélveselo a quien rentó.`
    : "";
  const parts: string[] = [];
  if (matches === 1) parts.push("1 partido");
  else if (matches > 1) parts.push(`${matches} partidos`);
  if (rentals === 1) parts.push("1 renta");
  else if (rentals > 1) parts.push(`${rentals} rentas`);
  const has = parts.length ? `Tiene ${parts.join(" y ")}. ` : "";
  return `¿Seguro que deseas eliminar ${name}? ${has}Se quitarán esos apartados y los partidos quedarán sin esta cancha. El marcador y la fecha se conservan.${refund}`;
}

/** Ocultar no toca los partidos: siguen ligados a la cancha (y apartándola) hasta que se reprogramen. */
function hideCourtMessage(court: Court, holds: CourtHold[], today: string) {
  const matches = holds.filter((hold) => hold.courtId === court.id && hold.source === "match" && hold.date >= today).length;
  const linked = matches
    ? ` Tiene ${plural(matches, "partido programado", "partidos programados")}; seguirán ligados a ella hasta que se reprogramen.`
    : "";
  return `¿Ocultar ${court.name}? Esta cancha ya no estará disponible para el público.${linked}`;
}

async function deleteCourtAndLinks(court: Court, holds: CourtHold[]) {
  const own = holds.filter((hold) => hold.courtId === court.id);
  const matches = own.filter((hold) => hold.source === "match").length;
  const rentals = own.filter((hold) => hold.source !== "match").length;
  const linked = own.length > 0;
  const today = todayIso();
  const paid = own.reduce((sum, hold) => sum + (hold.source === "manual" && hold.date >= today ? holdPaid(hold) : 0), 0);
  if (!window.confirm(deleteCourtMessage(court.name, matches, rentals, linked, paid))) return false;
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
  const [configError, setConfigError] = useState("");
  /** Rentas y partidos que quedarían fuera del horario nuevo; abre la confirmación. */
  const [hourConflicts, setHourConflicts] = useState<HourConflicts | null>(null);
  const [gridDate, setGridDate] = useState(today);
  const [courtModal, setCourtModal] = useState<null | "add" | Court>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
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

  const saveConfig = async (force = false) => {
    const clean = readWindows(windows);
    setConfigBusy(true);
    setConfigError("");
    try {
      const result = await saveCourtModule(
        enabled,
        slot,
        clean.map((window) => ({
          weekday: window.day,
          startTime: window.start,
          endTime: window.end,
        })),
        force,
      );
      if (!result.saved) {
        setHourConflicts({ holds: result.conflicts, matches: result.matchConflicts });
        return;
      }
      setHourConflicts(null);
      setWindows(clean);
      // El header y el footer leen el interruptor de una caché en memoria
      invalidatePlatformChrome();
      let mailFailed = false;
      for (const hold of result.removed) {
        if (!hold.guestEmail) continue;
        const ok = await mailBooking({
          to: hold.guestEmail,
          kind: "cancelled",
          date: hold.holdDate,
          note: hold.note,
          slots: [
            bookingSlot(
              { name: hold.courtName, hourlyRate: hold.hourlyRate },
              toMinutes(hold.startTime) ?? 0,
              toMinutes(hold.endTime) ?? 0,
            ),
          ],
        });
        if (!ok) mailFailed = true;
      }
      if (mailFailed) setConfigError(HOURS_MAIL_FAIL);
      // Los clubes reciben «partido por reprogramar»; si falla el correo, el partido ya quedó sin fecha
      for (const match of result.unscheduledMatches) notifyMatchScheduled(match.matchId, "courts");
      screen.reload();
    } catch (err) {
      // El detalle técnico se queda en la consola; la pantalla dice qué puede hacer la persona
      console.error(err);
      setConfigError(`${HOURS_SAVE_FAIL} ${rpcErrorHint(err)}`);
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
    setDraftLocation("");
    setDraftRate("");
    setDraftFootball(true);
    setDraftError("");
    clearPhoto();
    setCourtModal("add");
  };

  const openEditCourt = (court: Court) => {
    setDraftName(courtName(court.name));
    setDraftDescription(courtNote(court.description));
    setDraftLocation(courtLocation(court.location));
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
    if (courtSaveHint(draftName, draftDescription, draftRate, draftLocation) || draftPhotoError) return;
    const cleanName = draftName.trim();
    const cleanDescription = draftDescription.trim();
    const cleanLocation = draftLocation.trim();
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
          location: cleanLocation,
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
          location: cleanLocation,
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
          {configError ? (
            <p role="alert" style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: C.red }}>
              {configError}
            </p>
          ) : null}
        </div>
      </SectionCard>
      <ConfirmModal
        open={hourConflicts !== null}
        title="Apartados fuera del nuevo horario"
        message={hourConflicts ? hourConflictsMessage(hourConflicts) : ""}
        confirmLabel="Continuar"
        cancelLabel="Volver"
        danger
        busy={configBusy}
        onConfirm={() => void saveConfig(true)}
        onCancel={() => setHourConflicts(null)}
      >
        {hourConflicts?.holds.length ? (
          <div style={{ fontSize: "0.82rem", color: C.gray600, lineHeight: 1.5 }}>
            <strong style={{ color: C.navy900 }}>Rentas</strong>
            <ul style={{ margin: "0.2rem 0 0.6rem", paddingLeft: "1.1rem" }}>
              {hourConflicts.holds.map((hold) => (
                <li key={hold.id}>
                  {formatFriendlyDate(hold.holdDate)} · {hold.courtName} · {formatFriendlyTime(hold.startTime)} a{" "}
                  {formatFriendlyTime(hold.endTime)} · {holdGuestName(hold.note)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {hourConflicts?.matches.length ? (
          <div style={{ fontSize: "0.82rem", color: C.gray600, lineHeight: 1.5 }}>
            <strong style={{ color: C.navy900 }}>Partidos programados</strong>
            <ul style={{ margin: "0.2rem 0 0", paddingLeft: "1.1rem" }}>
              {hourConflicts.matches.map((match) => (
                <li key={match.matchId}>
                  {formatFriendlyDate(match.holdDate)} · {match.courtName} · {formatFriendlyTime(match.startTime)} a{" "}
                  {formatFriendlyTime(match.endTime)} · {match.homeClub} vs {match.awayClub} · {match.tournamentName}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </ConfirmModal>

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
        location={draftLocation}
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
        onLocation={(value) => {
          setDraftLocation(value);
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
          if (!next && !window.confirm(hideCourtMessage(courtModal, holds, today))) return;
          void upsertCourt({
            id: courtModal.id,
            name: courtName(courtModal.name).trim(),
            description: courtNote(courtModal.description).trim(),
            location: courtLocation(courtModal.location).trim(),
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
  location,
  rate,
  football,
  preview,
  busy,
  photoError,
  error,
  onName,
  onDescription,
  onLocation,
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
  location: string;
  rate: string;
  football: boolean;
  preview: string;
  busy: boolean;
  photoError: string;
  error: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onLocation: (value: string) => void;
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

  const missing = courtSaveHint(name, description, rate, location);
  const touched = Boolean(name || description || rate || location);
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
            Ubicación
            <span className="court-form__field">
              <MapPin size={16} aria-hidden="true" />
              <FormInput
                value={location}
                disabled={busy}
                maxLength={COURT_LOCATION_LIMIT}
                placeholder="Col. Centro, Calle 5 #12"
                onChange={(event) => onLocation(courtLocation(event.target.value))}
              />
            </span>
            <small className="court-form__help">
              Opcional. Se muestra antes del nombre de la cancha en los partidos y en la renta.
            </small>
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
  const [note, setNote] = useState("");
  const [payMode, setPayMode] = useState<PayMode>("full");
  const [deposit, setDeposit] = useState("");
  const [bookSeen, setBookSeen] = useState<Partial<Record<HoldField, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const booking = useRef(false);
  const [editHold, setEditHold] = useState<CourtHold | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState(date);
  const [editStart, setEditStart] = useState(0);
  const [editDuration, setEditDuration] = useState(60);
  const [editPayMode, setEditPayMode] = useState<PayMode>("full");
  const [editDeposit, setEditDeposit] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const editing = useRef(false);
  // Cancelar una renta con algo pagado: se decide si se devolvió (false) o la liga se lo queda (true)
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelKeep, setCancelKeep] = useState<boolean | null>(null);
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
  const rangePrices = ranges.map((range) =>
    priceCents(courts.find((court) => court.id === range.courtId)?.hourlyRate ?? 0, range.end - range.start),
  );
  const bookPrice = rangePrices.reduce((sum, price) => sum + price, 0);
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
    setOpen(false);
  };

  // El anticipo es uno para toda la reserva; se reparte entre los tramos con precio
  const bookDepositTip = depositTip(payMode, deposit, bookPrice);
  const bookSplit = payMode === "part" && bookPrice > 0 && !bookDepositTip
    ? splitDeposit(depositCents(deposit), rangePrices)
    : null;
  const bookTips = {
    ...holdTips(guest, guestEmail, note),
    deposit: bookDepositTip || (bookSplit && "error" in bookSplit ? bookSplit.error : ""),
  };
  const bookHint = firstTip(bookTips)?.text || "";
  // Al apartar, el aviso de un campo sale hasta que el usuario lo deja.
  const bookTip = firstTip(bookTips, bookSeen);
  const seeBook = (field: HoldField) => setBookSeen((current) => (current[field] ? current : { ...current, [field]: true }));

  const editPast = editHold !== null && editHold.date < todayIso();
  // El cobro al día (tras cobrar el resto se recarga la lista y el modal lo ve sin cerrarse)
  const editLive = editHold ? holds.find((hold) => hold.id === editHold.id) ?? editHold : null;
  const editRental = editLive?.rental ?? null;
  const editRestPaid = toCents(editRental?.restPaid ?? 0) > 0;
  // Con el resto cobrado ya no cambia de cancha, fecha ni horario (save_court_hold lo rechaza): se guarda el
  // tramo de la renta, sin mirar los campos ni buscar otra cancha (la suya pudo quedar oculta)
  const editSlotLocked = editRestPaid;
  const editOrigStart = editHold ? toMinutes(editHold.startTime) ?? 0 : 0;
  const editOrigEnd = editHold ? toMinutes(editHold.endTime) ?? editOrigStart : 0;
  const slotDate = editSlotLocked && editHold ? editHold.date : editDate;
  const slotStart = editSlotLocked ? editOrigStart : editStart;
  const slotDuration = editSlotLocked ? editOrigEnd - editOrigStart : editDuration;
  const editDateOk = isIsoDate(slotDate) && slotDate >= todayIso();
  const editCourt = !editHold
    ? null
    : editSlotLocked
      ? courts.find((court) => court.id === editHold.courtId) ?? null
      : editDateOk
        ? pickCourt(courts, holds, windows, slot, editDate, editStart, editDuration, editHold)
        : null;
  const editSlotChanged = editHold !== null && !editSlotLocked && (
    (editCourt?.id ?? editHold.courtId) !== editHold.courtId ||
    editDate !== editHold.date ||
    editStart !== editOrigStart ||
    editDuration !== editOrigEnd - editOrigStart
  );
  // La renta se cotizó al apartar: su precio solo cambia si cambian la cancha, la fecha o el horario
  const editPrice = editRental && !editSlotChanged
    ? toCents(editRental.amount)
    : priceCents((editCourt ?? courts.find((court) => court.id === editHold?.courtId))?.hourlyRate ?? 0, slotDuration);
  const editCanPay = !editPast && !editRestPaid && editRental?.status !== "CONDONADO";
  const editTip = !editHold || editPast
    ? null
    : firstTip({
        ...holdTips(editName, editEmail, editNote),
        date: editDateOk ? "" : "Elige una fecha de hoy en adelante.",
        start: editDateOk && !editCourt ? "Ese horario ya está ocupado o cerrado." : "",
        deposit: editCanPay ? depositTip(editPayMode, editDeposit, editPrice) : "",
      });
  const editHint = editTip?.text || "";
  const editDepositValue = editPayMode === "part" && editPrice > 0 ? depositCents(editDeposit) / 100 : null;
  const editDepositChanged = editHold !== null && editCanPay && (
    (editHold.deposit ?? null) === null
      ? editDepositValue !== null
      : editDepositValue === null || toCents(editHold.deposit ?? 0) !== toCents(editDepositValue)
  );
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
    if (editing.current || !editHold || editPast || !editCourt || editHint) return;
    const cleanNote = editNote.trim();
    const cleanEmail = editEmail.trim();
    const end = slotStart + slotDuration;
    editing.current = true;
    setEditBusy(true);
    try {
      const rental = await upsertHold({
        id: editHold.id,
        courtId: editCourt.id,
        holdDate: slotDate,
        startTime: fromMinutes(slotStart),
        endTime: fromMinutes(end),
        note: holdText(editName, editNote),
        guestEmail: cleanEmail,
        ...(editDepositChanged ? { deposit: editDepositValue } : {}),
      });
      onChanged();
      // Con cobro, los montos tal como quedaron; sin él (la liga no cobra rentas), lo anotado en el modal
      const deposit = editDepositChanged ? editDepositValue : editHold.deposit ?? null;
      const slotMail = bookingSlot(editCourt, slotStart, end);
      if (rental) slotMail.priceLabel = centsLabel(toCents(rental.amount));
      const mailed = await mailBooking({
        to: cleanEmail,
        kind: "updated",
        date: slotDate,
        note: cleanNote,
        slots: [slotMail],
        paymentLabel: rental
          ? paymentText(toCents(rental.amount), toCents(rental.paid), rental.status === "CONDONADO")
          : paymentText(editPrice, deposit === null ? editPrice : toCents(deposit)),
      });
      setEditHold(null);
      const saved = `${editCourt.name} apartada para ${formatFriendlyDate(slotDate)} de ${formatFriendlyTime(fromMinutes(slotStart))} a ${formatFriendlyTime(fromMinutes(end))}.`;
      setNotice(mailed ? saved : `${saved} ${BOOKING_MAIL_FAIL}`);
    } catch (err) {
      console.error(err);
      onChanged();
      alert(holdSaveError(err));
    } finally {
      editing.current = false;
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
        startDate: matchHold.matchStartDate || "",
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
    if (booking.current || past || ranges.length === 0 || bookHint) return;
    const cleanNote = note.trim();
    const cleanEmail = guestEmail.trim();
    const text = holdText(guest, note);
    const shares = bookSplit && "shares" in bookSplit ? bookSplit.shares : ranges.map(() => null);
    booking.current = true;
    setBusy(true);
    // Lo que sí quedó apartado, con su cobro (para el correo y por si un tramo falla)
    const saved: { range: (typeof ranges)[number]; price: number; share: number | null; rental: HoldRental | null }[] = [];
    const bookingMail = () => {
      const amount = saved.reduce((sum, item) => sum + (item.rental ? toCents(item.rental.amount) : item.price), 0);
      const paid = saved.reduce(
        (sum, item) => sum + (item.rental ? toCents(item.rental.paid) : item.share ?? item.price),
        0,
      );
      return mailBooking({
        to: cleanEmail,
        kind: "created",
        date,
        note: cleanNote,
        slots: saved.map((item) => {
          const mail = bookingSlot(courts.find((court) => court.id === item.range.courtId), item.range.start, item.range.end);
          return item.rental ? { ...mail, priceLabel: centsLabel(toCents(item.rental.amount)) } : mail;
        }),
        paymentLabel: paymentText(amount, paid),
      });
    };
    try {
      for (const [index, range] of ranges.entries()) {
        const share = shares[index] ?? null;
        const rental = await upsertHold({
          id: crypto.randomUUID(),
          courtId: range.courtId,
          holdDate: date,
          startTime: fromMinutes(range.start),
          endTime: fromMinutes(range.end),
          note: text,
          guestEmail: cleanEmail,
          deposit: share === null ? null : share / 100,
          fresh: true,
        });
        saved.push({ range, price: rangePrices[index], share, rental });
      }
      onChanged();
      const mailed = await bookingMail();
      setPicked([]);
      setGuest("");
      setGuestEmail("");
      setNote("");
      setPayMode("full");
      setDeposit("");
      setBookSeen({});
      setOpen(false);
      if (!mailed) setNotice(BOOKING_MAIL_FAIL);
    } catch (err) {
      console.error(err);
      setPicked([]);
      setOpen(false);
      onChanged();
      if (saved.length === 0) {
        alert(holdSaveError(err));
      } else {
        // Algunos tramos sí quedaron: se avisa cuáles y se manda su correo
        const kept = saved
          .map((item) => {
            const court = courts.find((entry) => entry.id === item.range.courtId);
            return `${court?.name || "Cancha"} de ${formatFriendlyTime(fromMinutes(item.range.start))} a ${formatFriendlyTime(fromMinutes(item.range.end))}`;
          })
          .join(", ");
        const mailed = await bookingMail();
        const parts = [
          `Solo se apartó ${kept}; lo demás ya no estaba libre.`,
          payMode === "part" ? "Revisa el anticipo de lo que sí quedó apartado." : "",
          mailed ? "" : BOOKING_MAIL_FAIL,
        ];
        setNotice(parts.filter(Boolean).join(" "));
      }
    } finally {
      booking.current = false;
      setBusy(false);
    }
  };

  /** Cobra el resto de la renta o lo condona (no llegó), desde el apartado. */
  const settleRest = async (action: "pay" | "condone") => {
    const rental = editRental;
    if (editing.current || !rental) return;
    const due = holdDue(editLive ?? editHold!);
    if (
      action === "condone" &&
      !window.confirm(`¿Condonar el resto (${centsLabel(due)})? En Finanzas cuenta como pérdida.`)
    ) {
      return;
    }
    editing.current = true;
    setEditBusy(true);
    try {
      if (action === "pay") await markChargePaid(rental.chargeId, true);
      else await changeChargeStatus({ id: rental.chargeId, action: "CONDONAR", note: "No pagó el resto" });
      if (action === "pay" && editHold) {
        setEditDate(editHold.date);
        setEditStart(editOrigStart);
        setEditDuration(editOrigEnd - editOrigStart);
      }
      onChanged();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el cobro. Inténtalo de nuevo.");
    } finally {
      editing.current = false;
      setEditBusy(false);
    }
  };

  /** Texto de la cancelación de un apartado: quién, cancha y horario, y si se le avisará por correo. */
  const cancelText = (hold: CourtHold) => {
    const court = courts.find((item) => item.id === hold.courtId);
    const start = toMinutes(hold.startTime) ?? 0;
    const end = toMinutes(hold.endTime) ?? start;
    const parts = splitHoldNote(hold.note || "");
    const who = parts.name ? ` de ${parts.name}` : "";
    const when = `${formatFriendlyDate(hold.date)} de ${formatFriendlyTime(fromMinutes(start))} a ${formatFriendlyTime(fromMinutes(end))}`;
    const mailNote = hold.guestEmail ? " Se le avisará por correo." : "";
    return `¿Seguro que deseas cancelar el apartado${who} (${court?.name || "Cancha"}, ${when})?${mailNote}`;
  };

  /** Quita el apartado. keepPaid: qué pasa con lo pagado (sin decidir, como el trigger). */
  const removeHold = (hold: CourtHold, keepPaid?: boolean) => {
    if (editing.current) return;
    const court = courts.find((item) => item.id === hold.courtId);
    const start = toMinutes(hold.startTime) ?? 0;
    const end = toMinutes(hold.endTime) ?? start;
    const comment = splitHoldNote(hold.note || "").note;
    editing.current = true;
    setEditBusy(true);
    void removeManualHold(hold.id, keepPaid)
      .then(async () => {
        onChanged();
        setCancelOpen(false);
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
      .finally(() => {
        editing.current = false;
        setEditBusy(false);
      });
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
          <button type="button" className="book-bar__go" onClick={() => {
            setBookSeen({});
            setOpen(true);
          }}>
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
                    setEditName(holdName(parts.name));
                    setEditEmail(emailText(hold.guestEmail || ""));
                    setEditNote(holdNote(parts.note));
                    setEditDate(hold.date);
                    setEditStart(start);
                    setEditDuration(duration);
                    const partial = hold.deposit != null &&
                      (!hold.rental || toCents(hold.deposit) < toCents(hold.rental.amount));
                    setEditPayMode(partial ? "part" : "full");
                    setEditDeposit(partial ? moneyText(String(hold.deposit)) : "");
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
        confirmDisabled={Boolean(bookHint)}
        onConfirm={() => void save()}
        onCancel={close}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Nombre" tip={bookTip?.field === "name" ? bookTip.text : ""}>
            <FormInput
              value={guest}
              maxLength={30}
              disabled={busy}
              aria-invalid={bookTip?.field === "name"}
              onChange={(e) => setGuest(holdName(e.target.value))}
              onBlur={() => seeBook("name")}
              placeholder="Quién aparta"
              autoComplete="name"
              autoFocus
            />
          </Field>
          <Field label="Correo" tip={bookTip?.field === "email" ? bookTip.text : ""}>
            <FormInput
              type="email"
              value={guestEmail}
              maxLength={100}
              disabled={busy}
              aria-invalid={bookTip?.field === "email"}
              onChange={(e) => setGuestEmail(emailText(e.target.value))}
              onBlur={() => seeBook("email")}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Nota" tip={bookTip?.field === "note" ? bookTip.text : ""}>
            <FormInput
              value={note}
              maxLength={50}
              disabled={busy}
              aria-invalid={bookTip?.field === "note"}
              onChange={(e) => setNote(holdNote(e.target.value))}
              onBlur={() => seeBook("note")}
              placeholder="Opcional"
            />
          </Field>
          <HoldPayment
            price={bookPrice}
            mode={payMode}
            deposit={deposit}
            locked={busy}
            tip={bookTip?.field === "deposit" ? bookTip.text : ""}
            onMode={setPayMode}
            onDeposit={setDeposit}
            onBlur={() => seeBook("deposit")}
          />
        </div>
      </ConfirmModal>
      <ConfirmModal
        open={editHold !== null}
        title="Apartado"
        confirmLabel="Guardar"
        cancelLabel={editPast ? "Cerrar" : "Cancelar"}
        busy={editBusy}
        readOnly={editPast}
        confirmDisabled={Boolean(editHint)}
        dangerAction={{
          label: "Eliminar",
          onClick: () => {
            if (!editHold || editing.current) return;
            const hold = editLive ?? editHold;
            if (holdPaid(hold) > 0) {
              setCancelKeep(null);
              setCancelOpen(true);
              return;
            }
            if (!window.confirm(`${cancelText(hold)} Esta acción no se puede deshacer.`)) return;
            removeHold(hold);
          },
        }}
        onConfirm={() => void saveHold()}
        onCancel={() => {
          // Con la decisión de cancelar abierta, Escape solo cierra esa
          if (editBusy || cancelOpen) return;
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
          locked={editPast || editBusy}
          slotLocked={editSlotLocked}
          tip={editTip}
          onName={(value) => setEditName(holdName(value))}
          onEmail={(value) => setEditEmail(emailText(value))}
          onNote={(value) => setEditNote(holdNote(value))}
          onDate={(value) => {
            setEditDate(value);
            const day = weekdayOf(value);
            const next = day ? daySlotStarts(windows, day, slot) : [];
            if (next.length && !next.includes(editStart)) setEditStart(next[0]);
          }}
          onStart={setEditStart}
          onDuration={setEditDuration}
        />
        {editHold && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.65rem" }}>
            <RentalStatus
              hold={editLive ?? editHold}
              busy={editBusy}
              unsaved={editSlotChanged || editDepositChanged}
              onPay={() => void settleRest("pay")}
              onCondone={() => void settleRest("condone")}
            />
            {editSlotLocked && !editPast ? (
              <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>
                Ya se cobró el resto: la cancha, la fecha y el horario ya no cambian.
              </p>
            ) : null}
            {editCanPay && (
              <HoldPayment
                price={editPrice}
                mode={editPayMode}
                deposit={editDeposit}
                locked={editBusy}
                tip={editTip?.field === "deposit" ? editTip.text : ""}
                note={priceChangeNote(editSlotChanged && editRental && editPayMode === "full" ? toCents(editRental.amount) : 0, editPrice)}
                onMode={setEditPayMode}
                onDeposit={setEditDeposit}
              />
            )}
          </div>
        )}
      </ConfirmModal>
      <ConfirmModal
        open={cancelOpen && editHold !== null}
        title="Cancelar apartado"
        message={
          editHold
            ? `${cancelText(editLive ?? editHold)} Ya pagó ${centsLabel(holdPaid(editLive ?? editHold))}: ¿qué pasa con ese dinero?`
            : ""
        }
        confirmLabel="Cancelar apartado"
        cancelLabel="Volver"
        danger
        busy={editBusy}
        confirmDisabled={cancelKeep === null}
        zIndex={10200}
        onConfirm={() => {
          if (editHold && cancelKeep !== null) removeHold(editLive ?? editHold, cancelKeep);
        }}
        onCancel={() => {
          if (!editBusy) setCancelOpen(false);
        }}
      >
        <div
          role="radiogroup"
          aria-label="Lo que ya pagó"
          style={{ display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.85rem", color: C.navy900 }}
        >
          {[
            { keep: false, label: "Se le devolvió", hint: "El cobro y lo pagado se anulan." },
            { keep: true, label: "La liga se lo queda", hint: "Queda como ingreso en Finanzas." },
          ].map((option) => (
            <label key={String(option.keep)} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="radio"
                name="hold-paid"
                checked={cancelKeep === option.keep}
                disabled={editBusy}
                onChange={() => setCancelKeep(option.keep)}
                style={{ marginTop: "0.2rem" }}
              />
              <span>
                <strong>{option.label}</strong>
                <br />
                <span style={{ color: C.gray500, fontSize: "0.78rem" }}>{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
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
              min={matchHold?.matchStartDate || undefined}
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
        const due = manual ? holdDue(cell.hold) : 0;
        const title = manual ? cell.hold.note || "Apartado" : label;
        return (
          <button
            key={cell.hold.id + cell.start}
            type="button"
            className={`book-cell ${manual ? "book-cell--hold" : "book-cell--match"}`}
            style={{ gridColumn: `span ${cell.span}` }}
            title={due > 0 ? `${title} · Resta ${centsLabel(due)}` : title}
            onClick={() => onOpenHold(cell.hold)}
          >
            {manual && <User size={13} />}
            <span>{label}</span>
            {due > 0 && <CircleDollarSign size={13} aria-label={`Resta ${centsLabel(due)}`} />}
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
  slotLocked = false,
  tip,
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
  /** Fecha, horario y duración fijos (ya se cobró el resto de la renta). */
  slotLocked?: boolean;
  tip: HoldTip;
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
  const tipFor = (field: HoldField) => (tip?.field === field ? tip.text : "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <Field label="Nombre" tip={tipFor("name")}>
        <FormInput
          value={name}
          maxLength={30}
          disabled={locked}
          aria-invalid={Boolean(tipFor("name"))}
          onChange={(e) => onName(e.target.value)}
          autoComplete="name"
          autoFocus
        />
      </Field>
      <Field label="Correo" tip={tipFor("email")}>
        <FormInput
          type="email"
          value={email}
          maxLength={100}
          disabled={locked}
          aria-invalid={Boolean(tipFor("email"))}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Nota" tip={tipFor("note")}>
        <FormInput
          value={note}
          maxLength={50}
          disabled={locked}
          aria-invalid={Boolean(tipFor("note"))}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Opcional"
        />
      </Field>
      <Field label="Fecha" tip={tipFor("date")}>
        <FormInput
          type="date"
          value={dateValue}
          min={locked ? undefined : todayIso()}
          required
          disabled={locked || slotLocked}
          aria-invalid={Boolean(tipFor("date"))}
          onChange={(e) => onDate(e.target.value)}
        />
      </Field>
      <Field label="Horario" tip={tipFor("start")}>
        <FormSelect
          value={String(start)}
          disabled={locked || slotLocked}
          aria-invalid={Boolean(tipFor("start"))}
          onChange={(e) => onStart(Number(e.target.value))}
        >
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
          disabled={locked || slotLocked}
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

/** Cómo se pagó al apartar: todo o un anticipo (el resto se cobra el día de la renta). */
function HoldPayment({
  price,
  mode,
  deposit,
  locked,
  tip,
  note = "",
  onMode,
  onDeposit,
  onBlur,
}: {
  /** Precio en centavos; sin precio no hay nada que pagar. */
  price: number;
  mode: PayMode;
  deposit: string;
  locked: boolean;
  tip: string;
  note?: string;
  onMode: (value: PayMode) => void;
  onDeposit: (value: string) => void;
  onBlur?: () => void;
}) {
  if (price <= 0) return null;
  const cents = depositCents(deposit);
  const rest = price - cents;
  return (
    <>
      <Field label={`Pago · precio ${centsLabel(price)}`}>
        <FormSelect value={mode} disabled={locked} onChange={(e) => onMode(e.target.value as PayMode)}>
          <option value="full">Pagó todo</option>
          <option value="part">Pagó una parte (anticipo)</option>
        </FormSelect>
      </Field>
      {mode === "part" && (
        <Field
          label="Anticipo"
          tip={tip}
          hint={cents > 0 && rest > 0 ? `Resta ${centsLabel(rest)}, se cobra el día de la renta.` : ""}
        >
          <FormInput
            value={deposit}
            inputMode="decimal"
            maxLength={11}
            disabled={locked}
            aria-invalid={Boolean(tip)}
            onChange={(e) => onDeposit(moneyText(e.target.value))}
            onBlur={onBlur}
            placeholder="0.00"
          />
        </Field>
      )}
      {note ? <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>{note}</p> : null}
    </>
  );
}

/** Lo pagado de una renta y lo que falta, con «Cobrar resto» y «Condonar resto». */
/** Aviso cuando cambia el precio de una renta pagada completa; vacío si no cambió (before 0 = no aplica). */
function priceChangeNote(before: number, after: number) {
  if (before <= 0 || before === after) return "";
  if (after > before) {
    return `El precio subió de ${centsLabel(before)} a ${centsLabel(after)}. Si no pagó la diferencia, elige «Pagó una parte».`;
  }
  return `El precio bajó de ${centsLabel(before)} a ${centsLabel(after)}: devuélvele ${centsLabel(before - after)}.`;
}

function RentalStatus({
  hold,
  busy,
  unsaved,
  onPay,
  onCondone,
}: {
  hold: CourtHold;
  busy: boolean;
  /** Hay cambios sin guardar (horario o anticipo): primero se guardan o se descartan. */
  unsaved: boolean;
  onPay: () => void;
  onCondone: () => void;
}) {
  const rental = hold.rental;
  const text = { margin: 0, fontSize: "0.8rem", color: C.gray600 };
  if (!rental) {
    return hold.deposit != null ? (
      <p style={text}>
        Anticipo {centsLabel(toCents(hold.deposit))}. La liga no registra el cobro de esta renta (Finanzas → Tarifas).
      </p>
    ) : null;
  }
  const paid = toCents(rental.paid);
  const due = holdDue(hold);
  const small = { padding: "0.3rem 0.65rem", fontSize: "0.75rem" };
  return (
    <div
      style={{
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.md,
        padding: "0.55rem 0.7rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      {rental.status === "CONDONADO" ? (
        <p style={text}>Pagado {centsLabel(paid)} · el resto se condonó en Finanzas.</p>
      ) : due > 0 ? (
        <p style={text}>
          Pagado <strong>{centsLabel(paid)}</strong> · Resta <strong style={{ color: C.red }}>{centsLabel(due)}</strong>
        </p>
      ) : (
        <p style={{ ...text, color: C.green, display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
          <Check size={14} /> Pagado completo ({centsLabel(paid)})
        </p>
      )}
      {due > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
          <SecondaryButton type="button" disabled={busy || unsaved} onClick={onPay} style={small}>
            Cobrar resto
          </SecondaryButton>
          <SecondaryButton type="button" disabled={busy || unsaved} onClick={onCondone} style={small}>
            Condonar resto
          </SecondaryButton>
          {unsaved ? (
            <span style={{ fontSize: "0.72rem", color: C.gray500 }}>Guarda o descarta los cambios antes de cobrar.</span>
          ) : null}
        </div>
      )}
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

