import { useState } from "react";
import { Calendar, Clock, Plus, Trash2 } from "lucide-react";
import type { TimeWindow, Weekday } from "../../lib/types";

const DAYS: { value: Weekday; short: string; letter: string; label: string }[] = [
  { value: 1, short: "Lun", letter: "L", label: "Lunes" },
  { value: 2, short: "Mar", letter: "M", label: "Martes" },
  { value: 3, short: "Mié", letter: "M", label: "Miércoles" },
  { value: 4, short: "Jue", letter: "J", label: "Jueves" },
  { value: 5, short: "Vie", letter: "V", label: "Viernes" },
  { value: 6, short: "Sáb", letter: "S", label: "Sábado" },
  { value: 7, short: "Dom", letter: "D", label: "Domingo" },
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
    <div className="windows-editor">
      {rows.length === 0 && (
        <p className="windows-editor__empty">Sin horarios. Agrega un rango y enciende los días.</p>
      )}
      {rows.map((group, index) => (
        <ScheduleRow
          key={index < groupWindows(windows).length ? `saved-${index}` : `draft-${index - groupWindows(windows).length}`}
          group={group}
          onChange={(next) => updateRow(index, next)}
          onRemove={() => removeRow(index)}
        />
      ))}
      <button
        type="button"
        className="windows-add"
        onClick={() => setDrafts([...drafts, { start: "10:00", end: "22:00", days: [] }])}
      >
        <Plus size={15} />
        Agregar horario
      </button>
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
    <div className="windows-card">
      <header className="windows-card__head">
        <Clock size={16} />
        <strong>Días y horario de apertura</strong>
        <button type="button" aria-label="Quitar horario" onClick={onRemove}>
          <Trash2 size={15} />
        </button>
      </header>
      <div className="windows-time">
        <input
          type="time"
          aria-label="Desde"
          value={group.start}
          onChange={(e) => onChange({ ...group, start: e.target.value })}
        />
        <input
          type="time"
          aria-label="Hasta"
          value={group.end}
          onChange={(e) => onChange({ ...group, end: e.target.value })}
        />
      </div>
      <div className="windows-days">
        {DAYS.map((day) => {
          const on = group.days.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={on}
              aria-label={day.label}
              className={on ? "is-on" : ""}
              onClick={() => toggle(day.value)}
            >
              <span className="windows-day__full">{day.short}</span>
              <span className="windows-day__letter">{day.letter}</span>
            </button>
          );
        })}
      </div>
      <div className="windows-shortcuts">
        <button type="button" onClick={() => setDays(WEEKDAYS)}>
          <Plus size={14} />
          Entre semana
        </button>
        <button type="button" onClick={() => setDays(ALL_DAYS)}>
          <Calendar size={14} />
          Toda la semana
        </button>
      </div>
    </div>
  );
}
