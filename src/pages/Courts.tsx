import { useMemo, useState, type ReactNode } from "react";
import { Calendar, Check, ChevronRight, Clock, MapPin, Timer, Trophy, Users } from "lucide-react";
import courtDefault from "../assets/court-default.jpg";
import rentBg from "../assets/rent-bg.jpg";
import PlatformLayout from "../components/platform/PlatformLayout";
import { useAuth } from "../context/AuthContext";
import { useCourtHolds, useCourts } from "../hooks/useCourts";
import {
  daySlotStarts,
  formatDuration,
  fromMinutes,
  maxFreeMinutes,
  readWindows,
  slotOccupied,
  todayIso,
  weekdayOf,
} from "../lib/courts";
import { whatsappUrl } from "../lib/social";
import { asCourtSlot, type Court, type CourtHold, type CourtSlotMinutes, type TimeWindow } from "../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../utils/helpers";
import { FormInput, FormSelect } from "../components/ui";

export default function CourtsPage() {
  const { platformConfig, isSuperAdmin } = useAuth();
  const enabled = platformConfig?.courtsEnabled === true;
  const slot = asCourtSlot(platformConfig?.courtSlotMinutes);
  const windows = readWindows(platformConfig?.courtOpenWindows);
  const [date, setDate] = useState(todayIso);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(slot);
  const { courts, loading: courtsLoading } = useCourts(enabled);
  const { holds, loading: holdsLoading } = useCourtHolds(
    enabled ? date : null,
    enabled ? date : null,
  );
  const whatsapp = platformConfig?.social?.whatsapp?.trim() || "";
  const day = weekdayOf(date);
  const starts = useMemo(
    () => (day ? daySlotStarts(windows, day, slot) : []),
    [day, windows, slot],
  );
  const active = courts.filter((court) => court.active);
  const selected = active.find((court) => court.id === courtId) || active[0] || null;

  const pickCourt = (id: string) => {
    setCourtId(id);
    setStart(null);
    setDuration(slot);
  };

  const pickDate = (value: string) => {
    setDate(value);
    setStart(null);
    setDuration(slot);
  };

  let body: ReactNode;
  if (platformConfig === null || (enabled && (courtsLoading || holdsLoading))) {
    body = <p className="rent-empty">Cargando canchas…</p>;
  } else if (!enabled) {
    body = <p className="rent-empty">El apartado de canchas no está disponible.</p>;
  } else if (windows.length === 0) {
    body = <p className="rent-empty">El horario de apertura aún no está definido.</p>;
  } else if (!selected) {
    body = <p className="rent-empty">Aún no hay canchas publicadas.</p>;
  } else {
    body = (
      <Booking
        courts={active}
        selected={selected}
        onCourt={pickCourt}
        date={date}
        onDate={pickDate}
        slot={slot}
        starts={starts}
        holds={holds}
        windows={windows}
        whatsapp={whatsapp}
        warnMissingWhatsapp={!whatsapp && isSuperAdmin}
        start={start}
        duration={duration}
        onStart={(minutes) => {
          setStart(minutes);
          setDuration(slot);
        }}
        onDuration={setDuration}
      />
    );
  }

  return (
    <PlatformLayout flush>
      <div className="rent-stage" style={{ backgroundImage: `url(${rentBg})` }}>
        <div className="rent-layout">
          <aside className="rent-intro">
            <h1>
              Reserva
              <em>tu cancha</em>
            </h1>
            <p>Vive la pasión del deporte. Elige tu horario y reserva tu lugar.</p>
            <ul className="rent-perks">
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Calendar size={18} />
                </span>
                <span>
                  <strong>Rápido</strong>
                  <span>Reserva en minutos</span>
                </span>
              </li>
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Users size={18} />
                </span>
                <span>
                  <strong>Fácil</strong>
                  <span>Desde cualquier dispositivo</span>
                </span>
              </li>
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Trophy size={18} />
                </span>
                <span>
                  <strong>Seguro</strong>
                  <span>Tu reserva confirmada</span>
                </span>
              </li>
            </ul>
          </aside>
          <div className="rent-card">{body}</div>
        </div>
      </div>
    </PlatformLayout>
  );
}

function Booking({
  courts,
  selected,
  onCourt,
  date,
  onDate,
  slot,
  starts,
  holds,
  windows,
  whatsapp,
  warnMissingWhatsapp,
  start,
  duration,
  onStart,
  onDuration,
}: {
  courts: Court[];
  selected: Court;
  onCourt: (id: string) => void;
  date: string;
  onDate: (value: string) => void;
  slot: CourtSlotMinutes;
  starts: number[];
  holds: CourtHold[];
  windows: TimeWindow[];
  whatsapp: string;
  warnMissingWhatsapp: boolean;
  start: number | null;
  duration: number;
  onStart: (minutes: number) => void;
  onDuration: (minutes: number) => void;
}) {
  const freeStarts = starts.filter(
    (minutes) => !slotOccupied(holds, selected.id, date, minutes, slot),
  );
  const maxMinutes =
    start == null
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: selected.id,
          date,
          start,
          slotMinutes: slot,
          openWindows: windows,
        });
  const options: number[] = [];
  for (let minutes = slot; minutes <= maxMinutes; minutes += slot) options.push(minutes);
  const chosen = options.includes(duration) ? duration : options[0] || 0;
  const end = start == null || !chosen ? null : start + chosen;
  const cost = end == null ? null : (selected.hourlyRate * chosen) / 60;
  const href =
    end == null
      ? ""
      : whatsappUrl(
          whatsapp,
          `Hola, quiero apartar ${selected.name} el ${formatFriendlyDate(date)} de ${formatFriendlyTime(fromMinutes(start || 0))} a ${formatFriendlyTime(fromMinutes(end))} (${formatDuration(chosen)}).`,
        );

  return (
    <>
      {warnMissingWhatsapp && (
        <p className="rent-warn">
          Falta el WhatsApp de la portada para que la gente pueda apartar.
        </p>
      )}
      <section className="rent-block">
        <BlockTitle
          icon={<MapPin size={18} />}
          title="Canchas"
          hint="Selecciona la cancha que deseas rentar"
        />
        <div className="rent-courts">
          {courts.map((court) => {
            const on = court.id === selected.id;
            return (
              <button
                key={court.id}
                type="button"
                className={on ? "rent-court is-on" : "rent-court"}
                aria-pressed={on}
                onClick={() => onCourt(court.id)}
              >
                <img src={courtPhoto(court)} alt="" />
                <span className="rent-court__copy">
                  <strong>{court.name}</strong>
                  {court.description ? (
                    <span className="rent-court__desc">{court.description}</span>
                  ) : null}
                  <span className="rent-court__price">${court.hourlyRate} / hora</span>
                </span>
                {on ? (
                  <span className="rent-court__check" aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rent-block">
        <BlockTitle
          icon={<Calendar size={18} />}
          title="Día"
          hint="Selecciona la fecha de tu reserva"
        />
        <label className="rent-date">
          <FormInput
            type="date"
            value={date}
            aria-label="Día"
            onChange={(e) => onDate(e.target.value)}
            style={{ borderRadius: 12, minHeight: 48, paddingRight: "2.6rem" }}
          />
          <Calendar size={18} className="rent-date__icon" aria-hidden="true" />
        </label>
      </section>

      <section className="rent-block">
        <BlockTitle
          icon={<Clock size={18} />}
          title="Horario"
          hint="Elige el horario disponible"
        />
        {starts.length === 0 ? (
          <p className="rent-empty">Este día la cancha está cerrada.</p>
        ) : freeStarts.length === 0 ? (
          <p className="rent-empty">No hay horarios libres este día.</p>
        ) : (
          <div className="rent-slots">
            {freeStarts.map((minutes) => {
              const on = minutes === start;
              return (
                <button
                  key={minutes}
                  type="button"
                  className={on ? "rent-slot is-on" : "rent-slot"}
                  aria-pressed={on}
                  onClick={() => onStart(minutes)}
                >
                  {formatFriendlyTime(fromMinutes(minutes))}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rent-block">
        <BlockTitle
          icon={<Timer size={18} />}
          title="Duración"
          hint="Selecciona el tiempo de tu partida"
        />
        <FormSelect
          className="rent-duration"
          aria-label="Duración"
          disabled={options.length === 0}
          value={options.length === 0 ? "" : String(chosen)}
          onChange={(e) => onDuration(Number(e.target.value))}
          style={{ borderRadius: 12, minHeight: 48 }}
        >
          {options.length === 0 ? (
            <option value="">Elige un horario</option>
          ) : (
            options.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))
          )}
        </FormSelect>
      </section>

      {end != null && cost != null && (
        <div className="rent-summary">
          <div className="rent-summary__main">
            <img className="rent-summary__photo" src={courtPhoto(selected)} alt="" />
            <div className="rent-summary__copy">
              <strong>{selected.name}</strong>
              <span>{formatFriendlyDate(date)}</span>
              <span>
                {formatFriendlyTime(fromMinutes(start || 0))} – {formatFriendlyTime(fromMinutes(end))}
                {" · "}
                {formatDuration(chosen)}
              </span>
              <span className="rent-summary__price">${formatMoney(cost)} estimados</span>
            </div>
          </div>
          {href ? (
            <a className="rent-wa" href={href} target="_blank" rel="noreferrer">
              <WhatsAppGlyph />
              Apartar por WhatsApp
              <ChevronRight size={16} />
            </a>
          ) : (
            <span className="rent-summary__note">
              El WhatsApp de apartado aún no está publicado.
            </span>
          )}
        </div>
      )}
    </>
  );
}

function BlockTitle({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="rent-head">
      <span className="rent-head__icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
    </div>
  );
}

function courtPhoto(court: Court) {
  const url = court.imageUrl?.trim();
  return url || courtDefault;
}

function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.4c0-.1-.6-1.5-.8-2s-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c.6.2 1.1.4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c-.1-.2-.3-.2-.6-.3z"
      />
    </svg>
  );
}

function formatMoney(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
