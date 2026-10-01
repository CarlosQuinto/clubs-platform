import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import canchaHero from "../assets/cancha-hero.jpg";
import PlatformLayout from "../components/platform/PlatformLayout";
import PageHeroBanner from "../components/platform/PageHeroBanner";
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
import { C, FormInput, FormSelect, SectionCard } from "../components/ui";

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
  const selected = active.find((court) => court.id === courtId) || null;

  if (platformConfig === null) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Cargando...</p>
      </PlatformLayout>
    );
  }

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

  return (
    <PlatformLayout flush>
      <PageHeroBanner
        size="short"
        images={[canchaHero]}
        headline="Renta tu cancha y vive la pasión del fútbol"
        tagline={null}
      />
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "1.25rem 1rem 2.5rem" }}>
        <SectionCard title="Canchas" icon={<MapPin size={16} />}>
          {!enabled ? (
            <p style={{ margin: 0, color: C.gray500 }}>
              El apartado de canchas no está disponible.
            </p>
          ) : courtsLoading || holdsLoading ? (
            <p style={{ margin: 0, color: C.gray400 }}>Cargando canchas…</p>
          ) : windows.length === 0 ? (
            <p style={{ margin: 0, color: C.gray500 }}>
              El horario de apertura aún no está definido.
            </p>
          ) : active.length === 0 ? (
            <p style={{ margin: 0, color: C.gray500 }}>Aún no hay canchas publicadas.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!whatsapp && isSuperAdmin && (
                <p style={{ margin: 0, fontSize: "0.8rem", color: C.amber }}>
                  Falta el WhatsApp de la portada para que la gente pueda apartar.
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {active.map((court) => {
                  const on = court.id === selected?.id;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      onClick={() => pickCourt(court.id)}
                      style={{
                        textAlign: "left",
                        border: `1px solid ${on ? C.navy900 : C.gray200}`,
                        background: on ? C.gray50 : C.white,
                        borderRadius: 12,
                        padding: "0.65rem 0.7rem",
                        cursor: "pointer",
                        minWidth: 0,
                      }}
                    >
                      <strong style={{ color: C.navy900, display: "block" }}>{court.name}</strong>
                      {court.description ? (
                        <span style={{ display: "block", fontSize: "0.78rem", color: C.gray500, marginTop: 4 }}>
                          {court.description}
                        </span>
                      ) : null}
                      <span style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: C.navy900, marginTop: 8 }}>
                        ${court.hourlyRate} / hora
                      </span>
                    </button>
                  );
                })}
              </div>
              {selected && (
                <CourtDay
                  court={selected}
                  date={date}
                  onDate={pickDate}
                  slot={slot}
                  starts={starts}
                  holds={holds}
                  windows={windows}
                  whatsapp={whatsapp}
                  start={start}
                  duration={duration}
                  onStart={(minutes) => {
                    setStart(minutes);
                    setDuration(slot);
                  }}
                  onDuration={setDuration}
                />
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </PlatformLayout>
  );
}

function CourtDay({
  court,
  date,
  onDate,
  slot,
  starts,
  holds,
  windows,
  whatsapp,
  start,
  duration,
  onStart,
  onDuration,
}: {
  court: Court;
  date: string;
  onDate: (value: string) => void;
  slot: CourtSlotMinutes;
  starts: number[];
  holds: CourtHold[];
  windows: TimeWindow[];
  whatsapp: string;
  start: number | null;
  duration: number;
  onStart: (minutes: number) => void;
  onDuration: (minutes: number) => void;
}) {
  const freeStarts = starts.filter(
    (minutes) => !slotOccupied(holds, court.id, date, minutes, slot),
  );
  const maxMinutes =
    start == null
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: court.id,
          date,
          start,
          slotMinutes: slot,
          openWindows: windows,
        });
  const options: number[] = [];
  for (let minutes = slot; minutes <= maxMinutes; minutes += slot) options.push(minutes);
  const chosen = options.includes(duration) ? duration : options[0] || 0;
  const end = start == null || !chosen ? null : start + chosen;
  const cost = end == null ? null : (court.hourlyRate * chosen) / 60;
  const href =
    end == null
      ? ""
      : whatsappUrl(
          whatsapp,
          `Hola, quiero apartar ${court.name} el ${formatFriendlyDate(date)} de ${formatFriendlyTime(fromMinutes(start || 0))} a ${formatFriendlyTime(fromMinutes(end))} (${formatDuration(chosen)}).`,
        );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxWidth: 220 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gray500 }}>DÍA</span>
        <FormInput type="date" value={date} onChange={(e) => onDate(e.target.value)} />
      </label>
      {starts.length === 0 ? (
        <p style={{ margin: 0, color: C.gray500 }}>Este día la cancha está cerrada.</p>
      ) : freeStarts.length === 0 ? (
        <p style={{ margin: 0, color: C.gray500 }}>No hay horarios libres este día.</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {freeStarts.map((minutes) => {
            const on = minutes === start;
            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={on}
                onClick={() => onStart(minutes)}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  padding: "0.45rem 0.6rem",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: on ? C.navy900 : C.greenLight,
                  color: on ? C.white : C.green,
                  border: `1px solid ${on ? C.navy900 : C.greenBorder}`,
                }}
              >
                {formatFriendlyTime(fromMinutes(minutes))}
              </button>
            );
          })}
        </div>
      )}
      {start != null && options.length > 0 && (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: 220 }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gray500 }}>DURACIÓN</span>
          <FormSelect value={String(chosen)} onChange={(e) => onDuration(Number(e.target.value))}>
            {options.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </FormSelect>
        </label>
      )}
      {end != null && cost != null && (
        <div
          style={{
            border: `1px solid ${C.gray200}`,
            borderRadius: 12,
            padding: "0.9rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            background: C.gray50,
          }}
        >
          <strong style={{ color: C.navy900 }}>{court.name}</strong>
          <span style={{ fontSize: "0.85rem", color: C.gray600 }}>{formatFriendlyDate(date)}</span>
          <span style={{ fontSize: "0.85rem", color: C.gray600 }}>
            {formatFriendlyTime(fromMinutes(start || 0))} – {formatFriendlyTime(fromMinutes(end))}
            {" · "}
            {formatDuration(chosen)}
          </span>
          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy900 }}>
            ${formatMoney(cost)} estimados
          </span>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: "0.35rem",
                alignSelf: "flex-start",
                fontSize: "0.8rem",
                fontWeight: 800,
                padding: "0.65rem 0.8rem",
                borderRadius: 8,
                background: C.navy900,
                color: C.white,
                textDecoration: "none",
              }}
            >
              Apartar por WhatsApp
            </a>
          ) : (
            <span style={{ fontSize: "0.8rem", color: C.gray500 }}>
              El WhatsApp de apartado aún no está publicado.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
