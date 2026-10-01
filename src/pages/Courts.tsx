import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
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

  if (platformConfig === null) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Cargando...</p>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout flush>
      <PageHeroBanner size="short" />
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
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxWidth: 220 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gray500 }}>DÍA</span>
                <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              {!whatsapp && isSuperAdmin && (
                <p style={{ margin: 0, fontSize: "0.8rem", color: C.amber }}>
                  Falta el WhatsApp de la portada para que la gente pueda apartar.
                </p>
              )}
              {starts.length === 0 ? (
                <p style={{ margin: 0, color: C.gray500 }}>Este día las canchas están cerradas.</p>
              ) : (
                active.map((court) => (
                  <article
                    key={court.id}
                    style={{
                      border: `1px solid ${C.gray200}`,
                      borderRadius: 12,
                      padding: "0.85rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                    }}
                  >
                    <div>
                      <strong style={{ color: C.navy900 }}>{court.name}</strong>
                      <div style={{ fontSize: "0.8rem", color: C.gray500 }}>
                        ${court.hourlyRate} / hora
                        {court.description ? ` · ${court.description}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {starts.map((start) => {
                        const busy = slotOccupied(holds, court.id, date, start, slot);
                        const label = formatFriendlyTime(fromMinutes(start));
                        return (
                          <span
                            key={start}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              padding: "0.35rem 0.55rem",
                              borderRadius: 8,
                              background: busy ? C.gray100 : C.greenLight,
                              color: busy ? C.gray400 : C.green,
                              border: `1px solid ${busy ? C.gray200 : C.greenBorder}`,
                            }}
                          >
                            {label}
                            {busy ? " · ocupado" : " · libre"}
                          </span>
                        );
                      })}
                    </div>
                    <CourtBooking
                      key={`${court.id}-${date}`}
                      court={court}
                      date={date}
                      slot={slot}
                      starts={starts}
                      holds={holds}
                      windows={windows}
                      whatsapp={whatsapp}
                    />
                  </article>
                ))
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </PlatformLayout>
  );
}

function CourtBooking({
  court,
  date,
  slot,
  starts,
  holds,
  windows,
  whatsapp,
}: {
  court: Court;
  date: string;
  slot: CourtSlotMinutes;
  starts: number[];
  holds: CourtHold[];
  windows: TimeWindow[];
  whatsapp: string;
}) {
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState<number>(slot);
  const freeStarts = starts.filter(
    (minutes) => !slotOccupied(holds, court.id, date, minutes, slot),
  );
  const startMinutes = start ? Number(start) : null;
  const maxMinutes =
    startMinutes == null
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: court.id,
          date,
          start: startMinutes,
          slotMinutes: slot,
          openWindows: windows,
        });
  const options: number[] = [];
  for (let minutes = slot; minutes <= maxMinutes; minutes += slot) options.push(minutes);
  const chosen = options.includes(duration) ? duration : options[0] || 0;
  const end = startMinutes == null || !chosen ? null : startMinutes + chosen;
  const href =
    end == null
      ? ""
      : whatsappUrl(
          whatsapp,
          `Hola, quiero apartar ${court.name} el ${formatFriendlyDate(date)} de ${formatFriendlyTime(fromMinutes(startMinutes || 0))} a ${formatFriendlyTime(fromMinutes(end))} (${formatDuration(chosen)}).`,
        );

  if (freeStarts.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.45rem",
        alignItems: "end",
      }}
    >
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 140, flex: 1 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gray500 }}>DESDE</span>
        <FormSelect
          value={freeStarts.includes(Number(start)) ? start : ""}
          onChange={(e) => {
            setStart(e.target.value);
            setDuration(slot);
          }}
        >
          <option value="">Elige hora</option>
          {freeStarts.map((minutes) => (
            <option key={minutes} value={minutes}>
              {formatFriendlyTime(fromMinutes(minutes))}
            </option>
          ))}
        </FormSelect>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 140, flex: 1 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gray500 }}>DURACIÓN</span>
        <FormSelect
          value={chosen ? String(chosen) : ""}
          disabled={!options.length}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          {options.length === 0 ? (
            <option value="">Elige la hora primero</option>
          ) : (
            options.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))
          )}
        </FormSelect>
      </label>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
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
      ) : null}
    </div>
  );
}
