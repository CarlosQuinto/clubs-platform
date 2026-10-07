import { useMemo, useRef, useState } from "react";
import { CalendarRange, Trash2 } from "lucide-react";
import { addSeason, closeSeason, removeSeason } from "../../../domains/competition/competitionCommands";
import ConfirmModal from "../../../shared/ConfirmModal";
import { isIsoDate } from "../../../domains/courts/courts";
import type { Season } from "../../../shared/types";
import { isSeasonLabel, seasonLabel } from "../../../shared/textLimits";
import Field from "../Field";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";

interface Props {
  seasons: Season[];
  /** Torneos con su estado SQL: los que no están FINISHED impiden cerrar la temporada sin forzar. */
  tournaments: { seasonId: string; status: string }[];
  onChange: () => void;
}

function closeMessage(season: Season, openTournaments: number) {
  if (openTournaments > 0) {
    const n = openTournaments;
    return `Hay ${n} torneo${n === 1 ? "" : "s"} abierto${n === 1 ? "" : "s"} en ${season.name}. Ciérralos uno a uno desde su ficha o fuerza el cierre: la temporada no podrá reabrirse, los torneos quedarán finalizados y sus partidos programados se desprogramarán liberando las canchas.`;
  }
  return `La temporada ${season.name} quedará cerrada y no podrá reabrirse.`;
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

export default function SeasonsAdmin({ seasons, tournaments, onChange }: Props) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);
  const [closing, setClosing] = useState<Season | null>(null);
  const [forceOpen, setForceOpen] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeError, setCloseError] = useState("");
  const datesReady = isIsoDate(startDate) && isIsoDate(endDate);
  const endBeforeStart = datesReady && endDate <= startDate;
  const canCreate = isSeasonLabel(name) && datesReady && endDate > startDate && !busy;

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
    if (creating.current || !canCreate) return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      await addSeason({
        name,
        startDate,
        endDate,
        active: true,
      });
      onChange();
      setName("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la temporada.");
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };

  const openTournamentsOf = (season: Season) =>
    tournaments.filter((t) => t.seasonId === season.id && t.status !== "FINISHED").length;

  const startClose = (season: Season) => {
    setCloseError("");
    setForceOpen(openTournamentsOf(season) > 0);
    setClosing(season);
  };

  const cancelClose = () => {
    if (closeBusy) return;
    setClosing(null);
    setForceOpen(false);
    setCloseError("");
  };

  const confirmClose = async () => {
    if (!closing) return;
    setCloseBusy(true);
    setCloseError("");
    try {
      const result = await closeSeason(closing.id, forceOpen);
      if (!result.closed) {
        // Alguien abrió un torneo mientras tanto: se pide forzar
        setForceOpen(true);
        return;
      }
      setClosing(null);
      setForceOpen(false);
      onChange();
    } catch (err) {
      console.error(err);
      setCloseError("No se pudo cerrar la temporada.");
    } finally {
      setCloseBusy(false);
    }
  };

  const handleDelete = async (season: Season) => {
    const used = tournaments.filter((t) => t.seasonId === season.id).length;
    if (used > 0) {
      alert(`Hay ${used} torneo(s) en ${season.name}. Elimínalos primero.`);
      return;
    }
    if (!window.confirm(`¿Eliminar la temporada ${season.name}?`)) return;
    await removeSeason(season.id);
    onChange();
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
            maxLength={11}
            onChange={(e) => {
              setName(seasonLabel(e.target.value));
              setError("");
            }}
            placeholder="Ej. 2026-2027"
            required
          />
        </Field>
        <div className="seasons-form__dates">
          <Field label="Inicio">
            <FormInput
              type="date"
              required
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => {
                setStartDate(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Field label="Fin">
            <FormInput
              type="date"
              required
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setError("");
              }}
            />
          </Field>
        </div>
        {endBeforeStart && (
          <p style={{ margin: 0, color: C.red, fontSize: "0.72rem" }}>
            La fecha de fin tiene que ser posterior a la de inicio.
          </p>
        )}
        {error && (
          <p style={{ margin: 0, color: C.red, fontSize: "0.72rem" }}>{error}</p>
        )}
        <PrimaryButton
          type="submit"
          disabled={!canCreate}
          className="seasons-form__submit"
          style={{ alignSelf: "end" }}
        >
          {busy ? "Creando..." : "Crear"}
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
                {s.active ? (
                  <SecondaryButton
                    onClick={() => startClose(s)}
                    style={{
                      padding: "0.45rem 0.7rem",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Cerrar
                  </SecondaryButton>
                ) : null}
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
      <ConfirmModal
        open={closing !== null}
        title={closing ? `Cerrar la temporada ${closing.name}` : ""}
        message={closing ? closeMessage(closing, forceOpen ? openTournamentsOf(closing) : 0) : ""}
        confirmLabel={forceOpen ? "Forzar cierre" : "Cerrar temporada"}
        cancelLabel="Volver"
        danger
        busy={closeBusy}
        confirmHint={closeError || undefined}
        onConfirm={() => void confirmClose()}
        onCancel={cancelClose}
      />
    </SectionCard>
  );
}
