import { Plus, Trash2 } from "lucide-react";
import { C, FormInput, FormSelect, SecondaryButton } from "../ui";
import type { TimeWindow, Weekday } from "../../lib/types";

const DAYS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export function dayLabel(day: number) {
  return DAYS.find((item) => item.value === day)?.label || "Día";
}

export default function WindowsEditor({
  windows,
  onChange,
}: {
  windows: TimeWindow[];
  onChange: (next: TimeWindow[]) => void;
}) {
  const update = (index: number, patch: Partial<TimeWindow>) => {
    onChange(windows.map((window, i) => (i === index ? { ...window, ...patch } : window)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {windows.length === 0 && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          Sin horarios. Agrega al menos un día y un rango.
        </p>
      )}
      {windows.map((window, index) => (
        <div
          key={index}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) auto",
            gap: "0.4rem",
            alignItems: "center",
          }}
        >
          <FormSelect
            aria-label="Día"
            value={String(window.day)}
            onChange={(e) => update(index, { day: Number(e.target.value) as Weekday })}
          >
            {DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </FormSelect>
          <FormInput
            type="time"
            aria-label="Desde"
            value={window.start}
            onChange={(e) => update(index, { start: e.target.value })}
          />
          <FormInput
            type="time"
            aria-label="Hasta"
            value={window.end}
            onChange={(e) => update(index, { end: e.target.value })}
          />
          <button
            type="button"
            aria-label="Quitar horario"
            onClick={() => onChange(windows.filter((_, i) => i !== index))}
            style={{
              border: "none",
              background: "transparent",
              color: C.gray500,
              cursor: "pointer",
              padding: "0.35rem",
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <SecondaryButton
        type="button"
        onClick={() =>
          onChange([...windows, { day: 1, start: "18:00", end: "22:00" }])
        }
        style={{ alignSelf: "flex-start", display: "inline-flex", gap: "0.3rem" }}
      >
        <Plus size={14} /> Agregar horario
      </SecondaryButton>
    </div>
  );
}
