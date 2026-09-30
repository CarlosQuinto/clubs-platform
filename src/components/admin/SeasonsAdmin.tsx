import { useMemo, useState } from "react";
import { CalendarRange, Trash2 } from "lucide-react";
import { addDoc, deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { seasonRef, seasonsCol } from "../../lib/paths";
import type { Season } from "../../lib/types";
import Field from "./Field";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../ui";

interface Props {
  seasons: Season[];
  tournaments: { seasonId: string }[];
}

function formatSeasonRange(start?: string, end?: string) {
  const fmt = (value?: string) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };
  const from = fmt(start);
  const to = fmt(end);
  if (from && to) return `${from} – ${to}`;
  return from || to || "Sin fechas";
}

export default function SeasonsAdmin({ seasons, tournaments }: Props) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const ordered = useMemo(
    () =>
      [...seasons].sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          (b.startDate || "").localeCompare(a.startDate || "") ||
          a.name.localeCompare(b.name),
      ),
    [seasons],
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    await addDoc(seasonsCol(), {
      name: clean,
      startDate: startDate || null,
      endDate: endDate || null,
      active: true,
      createdAt: serverTimestamp(),
    });
    setName("");
    setStartDate("");
    setEndDate("");
  };

  const handleDelete = async (season: Season) => {
    const used = tournaments.filter((t) => t.seasonId === season.id).length;
    if (used > 0) {
      alert(`Hay ${used} torneo(s) en ${season.name}. Elimínalos primero.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la temporada ${season.name}?`)) return;
    await deleteDoc(seasonRef(season.id));
  };

  return (
    <SectionCard
      title="Temporadas"
      icon={<CalendarRange size={16} color={C.amber} />}
    >
      <form onSubmit={handleAdd} className="seasons-form">
        <Field label="Nombre">
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. 2026-2027"
            required
          />
        </Field>
        <div className="seasons-form__dates">
          <Field label="Inicio">
            <FormInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Fin">
            <FormInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
        <PrimaryButton
          type="submit"
          className="seasons-form__submit"
          style={{ alignSelf: "end" }}
        >
          Crear
        </PrimaryButton>
      </form>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {ordered.length === 0 && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Crea una temporada para poder abrir torneos.
          </p>
        )}
        {ordered.map((s) => {
          const count = tournaments.filter((t) => t.seasonId === s.id).length;
          return (
            <div
              key={s.id}
              className="season-item"
              style={{
                padding: "0.75rem 0.85rem",
                border: `1px solid ${C.gray200}`,
                borderRadius: RADIUS.md,
                backgroundColor: s.active ? C.gray50 : C.gray100,
              }}
            >
              <div className="season-item__info">
                <div className="season-item__name">{s.name}</div>
                <div className="season-item__dates">
                  {formatSeasonRange(s.startDate, s.endDate)}
                </div>
              </div>
              <div className="season-item__meta">
                <Badge color={s.active ? "green" : "gray"}>
                  {s.active ? "Activa" : "Cerrada"}
                </Badge>
                <Badge color="gray">
                  {count} {count === 1 ? "torneo" : "torneos"}
                </Badge>
              </div>
              <div className="season-item__actions">
                <SecondaryButton
                  onClick={() =>
                    updateDoc(seasonRef(s.id), { active: !s.active })
                  }
                  style={{
                    padding: "0.45rem 0.7rem",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.active ? "Cerrar" : "Reactivar"}
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => handleDelete(s)}
                  aria-label={`Eliminar ${s.name}`}
                  style={{
                    padding: "0.45rem 0.55rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={14} />
                </SecondaryButton>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
