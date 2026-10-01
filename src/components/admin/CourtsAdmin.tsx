import { useMemo, useState } from "react";
import { addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { MapPin, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCourtHolds, useCourts } from "../../hooks/useCourts";
import {
  daySlotStarts,
  formatDuration,
  fromMinutes,
  maxFreeMinutes,
  readWindows,
  slotOccupied,
  weekdayOf,
} from "../../lib/courts";
import {
  courtHoldRef,
  courtHoldsCol,
  courtRef,
  courtsCol,
  platformConfigRef,
} from "../../lib/paths";
import { asCourtSlot, type CourtSlotMinutes, type TimeWindow } from "../../lib/types";
import { formatFriendlyDate, formatFriendlyTime } from "../../utils/helpers";
import WindowsEditor from "../courts/WindowsEditor";
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [courtBusy, setCourtBusy] = useState(false);
  const [blockDate, setBlockDate] = useState(today);
  const [blockCourt, setBlockCourt] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockDuration, setBlockDuration] = useState(0);
  const [blockNote, setBlockNote] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);

  const activeCourts = courts.filter((court) => court.active);
  const blockDay = weekdayOf(blockDate);
  const blockStarts = blockDay ? daySlotStarts(windows, blockDay, slot) : [];
  const freeStarts = blockStarts.filter((start) => {
    if (!blockCourt) return false;
    return !slotOccupied(holds, blockCourt, blockDate, start, slot);
  });
  const blockStartMinutes = blockStart ? Number(blockStart) : null;
  const maxBlock =
    blockStartMinutes == null || !blockCourt
      ? 0
      : maxFreeMinutes({
          holds,
          courtId: blockCourt,
          date: blockDate,
          start: blockStartMinutes,
          slotMinutes: slot,
          openWindows: windows,
        });
  const blockOptions: number[] = [];
  for (let minutes = slot; minutes <= maxBlock; minutes += slot) blockOptions.push(minutes);
  const chosenBlock = blockOptions.includes(blockDuration) ? blockDuration : blockOptions[0] || 0;

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

  const addCourt = async () => {
    const cleanName = name.trim();
    const hourlyRate = Number(rate);
    if (!cleanName || !Number.isFinite(hourlyRate) || hourlyRate < 0) {
      alert("Escribe el nombre y un costo por hora válido.");
      return;
    }
    setCourtBusy(true);
    try {
      const order = courts.reduce((max, court) => Math.max(max, court.order), 0) + 1;
      await addDoc(courtsCol(), {
        name: cleanName,
        description: description.trim(),
        hourlyRate,
        active: true,
        order,
      });
      setName("");
      setDescription("");
      setRate("");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la cancha.");
    } finally {
      setCourtBusy(false);
    }
  };

  const addBlock = async () => {
    if (!blockCourt || !blockStart || !blockDay || !chosenBlock) return;
    const start = Number(blockStart);
    setBlockBusy(true);
    try {
      await addDoc(courtHoldsCol(), {
        courtId: blockCourt,
        date: blockDate,
        startTime: fromMinutes(start),
        endTime: fromMinutes(start + chosenBlock),
        source: "manual",
        note: blockNote.trim(),
      });
      setBlockNote("");
      setBlockStart("");
      setBlockDuration(0);
    } catch (err) {
      console.error(err);
      alert("No se pudo bloquear ese horario.");
    } finally {
      setBlockBusy(false);
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

      <SectionCard title="Canchas" icon={<MapPin size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {courts.map((court) => (
            <div
              key={court.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.6rem",
                alignItems: "center",
                border: `1px solid ${C.gray200}`,
                borderRadius: 10,
                padding: "0.65rem 0.75rem",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ color: C.navy900 }}>{court.name}</strong>
                <div style={{ fontSize: "0.75rem", color: C.gray500 }}>
                  ${court.hourlyRate} / hora
                  {court.active ? "" : " · oculta"}
                  {court.description ? ` · ${court.description}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                <SecondaryButton
                  type="button"
                  onClick={() =>
                    void updateDoc(courtRef(court.id), { active: !court.active }).catch(() =>
                      alert("No se pudo actualizar la cancha."),
                    )
                  }
                >
                  {court.active ? "Ocultar" : "Mostrar"}
                </SecondaryButton>
                <button
                  type="button"
                  aria-label="Eliminar cancha"
                  onClick={() => {
                    if (!window.confirm(`¿Eliminar ${court.name}?`)) return;
                    void deleteDoc(courtRef(court.id)).catch(() =>
                      alert("No se pudo eliminar la cancha."),
                    );
                  }}
                  style={{ border: "none", background: "transparent", color: C.gray500, cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <Field label="Nombre">
            <FormInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Cancha 1" />
          </Field>
          <Field label="Descripción">
            <FormInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pasto sintético, iluminación"
            />
          </Field>
          <Field label="Costo por hora">
            <FormInput
              type="number"
              min={0}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="400"
            />
          </Field>
          <PrimaryButton type="button" disabled={courtBusy} onClick={() => void addCourt()}>
            {courtBusy ? "Guardando…" : "Agregar cancha"}
          </PrimaryButton>
        </div>
      </SectionCard>

      <SectionCard title="Apartados manuales" icon={<MapPin size={16} />}>
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: C.gray500 }}>
          Marca ocupado el tramo que se apartó por WhatsApp. Puede ser una hora o varias horas seguidas. Los partidos se liberan al reprogramarlos.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <Field label="Fecha">
            <FormInput type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          </Field>
          <Field label="Cancha">
            <FormSelect value={blockCourt} onChange={(e) => setBlockCourt(e.target.value)}>
              <option value="">Elige una cancha</option>
              {activeCourts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Inicio">
            <FormSelect
              value={blockStart}
              onChange={(e) => {
                setBlockStart(e.target.value);
                setBlockDuration(0);
              }}
            >
              <option value="">
                {freeStarts.length ? "Elige un horario libre" : "No hay slots libres ese día"}
              </option>
              {freeStarts.map((start) => (
                <option key={start} value={start}>
                  {formatFriendlyTime(fromMinutes(start))}
                </option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Duración" hint="Hasta donde la cancha siga libre y abierta.">
            <FormSelect
              value={chosenBlock ? String(chosenBlock) : ""}
              disabled={!blockOptions.length}
              onChange={(e) => setBlockDuration(Number(e.target.value))}
            >
              {blockOptions.length === 0 ? (
                <option value="">Elige el inicio primero</option>
              ) : (
                blockOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))
              )}
            </FormSelect>
          </Field>
          <Field label="Nota">
            <FormInput
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              placeholder="Apartado por WhatsApp"
            />
          </Field>
          <PrimaryButton
            type="button"
            disabled={blockBusy || !blockCourt || !blockStart || !chosenBlock}
            onClick={() => void addBlock()}
          >
            {blockBusy ? "Guardando…" : "Bloquear horario"}
          </PrimaryButton>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {holds
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
              .map((hold) => {
                const court = courts.find((item) => item.id === hold.courtId);
                return (
                  <div
                    key={hold.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.8rem",
                      color: C.gray700,
                    }}
                  >
                    <span>
                      {formatFriendlyDate(hold.date)} · {formatFriendlyTime(hold.startTime)}–{formatFriendlyTime(hold.endTime)} · {court?.name || "Cancha"} · {hold.source === "match" ? "Partido" : hold.note || "Manual"}
                    </span>
                    {hold.source === "manual" && (
                      <button
                        type="button"
                        aria-label="Quitar bloqueo"
                        onClick={() => void deleteDoc(courtHoldRef(hold.id))}
                        style={{ border: "none", background: "transparent", color: C.gray500, cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
