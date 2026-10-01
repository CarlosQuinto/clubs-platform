import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { C, FormInput, SecondaryButton } from "../ui";
import type { TimeWindow, Weekday } from "../../lib/types";

const DAYS: { value: Weekday; short: string; label: string }[] = [
  { value: 1, short: "Lun", label: "Lunes" },
  { value: 2, short: "Mar", label: "Martes" },
  { value: 3, short: "Mié", label: "Miércoles" },
  { value: 4, short: "Jue", label: "Jueves" },
  { value: 5, short: "Vie", label: "Viernes" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 7, short: "Dom", label: "Domingo" },
];

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
const ALL_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

type Group = { start: string; end: string; days: Weekday[] };

export function dayLabel(day: number) {
  return DAYS.find((item) => item.value === day)?.label || "Día";
}

function groupWindows(windows: TimeWindow[]): Group[] {
  const map = new Map<string, Group>();
  for (const window of windows) {
    const key = `${window.start}|${window.end}`;
    const group = map.get(key) || { start: window.start, end: window.end, days: [] };
    if (!group.days.includes(window.day)) group.days.push(window.day);
    map.set(key, group);
  }
  return [...map.values()].map((group) => ({
    ...group,
    days: [...group.days].sort((a, b) => a - b),
  }));
}

function flatten(groups: Group[]): TimeWindow[] {
  return groups.flatMap((group) =>
    group.days.map((day) => ({ day, start: group.start, end: group.end })),
  );
}

export default function WindowsEditor({
  windows,
  onChange,
}: {
  windows: TimeWindow[];
  onChange: (next: TimeWindow[]) => void;
}) {
  const [drafts, setDrafts] = useState<Group[]>([]);
  const rows = [...groupWindows(windows), ...drafts];

  const writeSaved = (nextSaved: Group[]) => {
    onChange(flatten(nextSaved.filter((group) => group.days.length > 0)));
  };

  const updateRow = (index: number, next: Group) => {
    const savedCount = groupWindows(windows).length;
    if (index < savedCount) {
      const saved = groupWindows(windows).filter((_, i) => i !== index);
      if (next.days.length === 0) {
        writeSaved(saved);
        setDrafts([...drafts, next]);
        return;
      }
      writeSaved([...saved.slice(0, index), next, ...saved.slice(index)]);
      return;
    }
    const draftIndex = index - savedCount;
    if (next.days.length === 0) {
      setDrafts(drafts.map((group, i) => (i === draftIndex ? next : group)));
      return;
    }
    writeSaved([...groupWindows(windows), next]);
    setDrafts(drafts.filter((_, i) => i !== draftIndex));
  };

  const removeRow = (index: number) => {
    const savedCount = groupWindows(windows).length;
    if (index < savedCount) {
      writeSaved(groupWindows(windows).filter((_, i) => i !== index));
      return;
    }
    setDrafts(drafts.filter((_, i) => i !== index - savedCount));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {rows.length === 0 && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          Sin horarios. Agrega un rango y enciende los días.
        </p>
      )}
      {rows.map((group, index) => (
        <ScheduleRow
          key={index < groupWindows(windows).length ? `saved-${index}` : `draft-${index - groupWindows(windows).length}`}
          group={group}
          onChange={(next) => updateRow(index, next)}
          onRemove={() => removeRow(index)}
        />
      ))}
      <SecondaryButton
        type="button"
        onClick={() => setDrafts([...drafts, { start: "10:00", end: "22:00", days: [] }])}
        style={{ alignSelf: "flex-start", display: "inline-flex", gap: "0.3rem" }}
      >
        <Plus size={14} /> Agregar horario
      </SecondaryButton>
    </div>
  );
}

function ScheduleRow({
  group,
  onChange,
  onRemove,
}: {
  group: Group;
  onChange: (next: Group) => void;
  onRemove: () => void;
}) {
  const toggle = (day: Weekday) => {
    const days = group.days.includes(day)
      ? group.days.filter((item) => item !== day)
      : [...group.days, day].sort((a, b) => a - b);
    onChange({ ...group, days });
  };

  const setDays = (days: Weekday[]) => onChange({ ...group, days });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        border: `1px solid ${C.gray200}`,
        borderRadius: 10,
        padding: "0.65rem",
      }}
    >
      <div className="windows-time">
        <FormInput
          type="time"
          aria-label="Desde"
          value={group.start}
          onChange={(e) => onChange({ ...group, start: e.target.value })}
        />
        <FormInput
          type="time"
          aria-label="Hasta"
          value={group.end}
          onChange={(e) => onChange({ ...group, end: e.target.value })}
        />
        <button
          type="button"
          aria-label="Quitar horario"
          onClick={onRemove}
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "0.25rem",
        }}
      >
        {DAYS.map((day) => {
          const on = group.days.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={on}
              aria-label={day.label}
              onClick={() => toggle(day.value)}
              style={{
                border: `1px solid ${on ? C.navy900 : C.gray300}`,
                background: on ? C.navy900 : C.white,
                color: on ? C.white : C.gray600,
                borderRadius: 8,
                padding: "0.35rem 0",
                fontSize: "0.68rem",
                fontWeight: 800,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              {day.short}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        <Chip label="Entre semana" onClick={() => setDays(WEEKDAYS)} />
        <Chip label="Toda la semana" onClick={() => setDays(ALL_DAYS)} />
      </div>
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${C.gray300}`,
        background: C.gray50,
        color: C.navy900,
        fontSize: "0.72rem",
        fontWeight: 700,
        cursor: "pointer",
        borderRadius: 999,
        padding: "0.28rem 0.6rem",
      }}
    >
      {label}
    </button>
  );
}
