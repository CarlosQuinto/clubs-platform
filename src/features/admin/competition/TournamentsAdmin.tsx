import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trophy } from "lucide-react";
import { clampIsoDate, todayIso } from "../../../domains/courts/courts";
import { lettersAndNumbers } from "../../../shared/textLimits";
import { addCategory, addTournament } from "../../../domains/competition/competitionCommands";
import {
  FOOTBALL_TYPES,
  MATCH_DURATIONS,
  asFootballType,
  asMatchDuration,
  type Category,
  type FootballType,
  type MatchDurationMinutes,
  type Season,
} from "../../../shared/types";
import Field from "../Field";
import {
  C,
  FormInput,
  FormSelect,
  FormTextarea,
  PrimaryButton,
  RADIUS,
  SectionCard,
  SegmentedControl,
} from "../../../shared/ui";

interface Props {
  seasons: Season[];
  categories: Category[];
  onChange: () => void;
}

export default function TournamentsAdmin({
  seasons,
  categories,
  onChange,
}: Props) {
  const [name, setName] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [footballType, setFootballType] = useState<FootballType>(7);
  const [duration, setDuration] = useState<MatchDurationMinutes>(60);
  const [startDate, setStartDate] = useState(todayIso);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const activeSeasons = useMemo(
    () => seasons.filter((s) => s.active),
    [seasons],
  );

  const selectedSeason = activeSeasons.find((s) => s.id === seasonId);
  const startMin = selectedSeason?.startDate || undefined;
  const startMax = selectedSeason?.endDate || undefined;

  useEffect(() => {
    if (seasonId && !activeSeasons.some((s) => s.id === seasonId)) {
      setSeasonId("");
    }
  }, [seasonId, activeSeasons]);

  useEffect(() => {
    if (!selectedSeason) return;
    setStartDate((current) =>
      clampIsoDate(current || todayIso(), selectedSeason.startDate, selectedSeason.endDate),
    );
  }, [selectedSeason]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || !seasonId || selectedCats.length === 0) {
      alert("Nombre, temporada y al menos una categoría.");
      return;
    }
    if (!startDate) {
      alert("Elige la fecha de inicio del torneo.");
      return;
    }
    if ((startMin && startDate < startMin) || (startMax && startDate > startMax)) {
      alert("La fecha de inicio tiene que estar dentro de la temporada.");
      return;
    }
    if (!activeSeasons.some((s) => s.id === seasonId)) {
      alert("Elige una temporada activa.");
      return;
    }
    try {
      setBusy(true);
      const groupId = crypto.randomUUID();
      const football =
        footballType === 7 ? "FUT_7" : footballType === 9 ? "FUT_9" : "FUT_11";
      for (const categoryId of selectedCats) {
        await addTournament({
          name: clean,
          seasonId,
          categoryId,
          groupId,
          footballType: football,
          durationMinutes: duration,
          startDate,
          description: description.trim() || "",
        });
      }
      onChange();
      setName("");
      setDescription("");
      setSelectedCats([]);
      setStartDate(
        clampIsoDate(todayIso(), selectedSeason?.startDate, selectedSeason?.endDate),
      );
      setDuration(60);
      setFootballType(7);
      navigate("/torneos");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear el torneo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title="Nuevo torneo" icon={<Trophy size={16} color={C.amber} />}>
      <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
        Un mismo torneo se puede abrir en varias divisiones (Primera, Segunda…).
        Se crea una liga por cada una. Después inscribes a cualquier club;
        un equipo puede jugar en más de una división.
      </p>
      <form
        onSubmit={handleCreate}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <div className="admin-grid-2">
          <Field label="Nombre">
            <FormInput
              value={name}
              maxLength={20}
              onChange={(e) => setName(lettersAndNumbers(e.target.value, 20))}
              placeholder="Ej. Liga Municipal"
              required
            />
          </Field>
          <Field label="Temporada">
            <FormSelect
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              required
            >
              <option value="">Selecciona...</option>
              {activeSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </Field>
        </div>
        <div className="admin-grid-2">
          <Field label="Tipo de fútbol" hint="Jugadores por lado.">
            <div style={{ maxWidth: 420 }}>
              <SegmentedControl
                value={String(footballType)}
                onChange={(v) => setFootballType(asFootballType(Number(v)))}
                options={FOOTBALL_TYPES.map((n) => ({
                  label: `Fútbol ${n}`,
                  value: String(n),
                }))}
              />
            </div>
          </Field>
          <Field label="Duración del partido" hint="Minutos que ocupa la cancha.">
            <div style={{ maxWidth: 420 }}>
              <SegmentedControl
                value={String(duration)}
                onChange={(v) => setDuration(asMatchDuration(Number(v)))}
                options={MATCH_DURATIONS.map((minutes) => ({
                  label: `${minutes} min`,
                  value: String(minutes),
                }))}
              />
            </div>
          </Field>
          <Field label="Fecha de inicio" hint="Cuando arranca este torneo.">
            <FormInput
              type="date"
              value={startDate}
              min={startMin}
              max={startMax}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Categorías">
          <CategoryPicker
            categories={categories}
            selectedIds={selectedCats}
            onChange={setSelectedCats}
            onCreated={onChange}
          />
        </Field>
        <Field label="Descripción (opcional)">
          <FormTextarea
            rows={2}
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(lettersAndNumbers(e.target.value, 100))}
          />
        </Field>
        <PrimaryButton
          type="submit"
          disabled={busy}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            width: "100%",
            maxWidth: 280,
          }}
        >
          <Plus size={14} /> {busy ? "Creando..." : "Crear torneo"}
        </PrimaryButton>
      </form>
    </SectionCard>
  );
}

function CategoryPicker({
  categories,
  selectedIds,
  onChange,
  onCreated,
}: {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = categories.filter((c) => selectedIds.includes(c.id));
  const pendingIds = selectedIds.filter(
    (id) => !categories.some((c) => c.id === id),
  );
  const available = categories.filter((c) => !selectedIds.includes(c.id));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const addId = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
  };

  const removeId = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const createCategory = async () => {
    const clean = newName.trim();
    if (!clean || creating) return;
    const existing = categories.find(
      (c) => c.name.toLowerCase() === clean.toLowerCase(),
    );
    if (existing) {
      addId(existing.id);
      setNewName("");
      return;
    }
    try {
      setCreating(true);
      const nextOrder =
        categories.reduce((max, c) => Math.max(max, c.order ?? 0), 0) + 1;
      const id = await addCategory(clean, nextOrder);
      onCreated();
      addId(id);
      setNewName("");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la categoría.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      ref={boxRef}
      style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}
    >
      {selected.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => removeId(c.id)}
          title="Quitar"
          style={{
            border: `1px solid ${C.amber}`,
            backgroundColor: C.amberLight,
            color: C.navy900,
            borderRadius: RADIUS.full,
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {c.name} ×
        </button>
      ))}
      {pendingIds.map((id) => (
        <span
          key={id}
          style={{
            border: `1px solid ${C.amber}`,
            backgroundColor: C.amberLight,
            color: C.navy900,
            borderRadius: RADIUS.full,
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          Nueva…
        </span>
      ))}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Añadir categoría"
          title="Añadir categoría"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.full,
            border: `1px dashed ${C.amber}`,
            backgroundColor: C.white,
            color: C.amber,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={16} />
        </button>
        {open && (
          <div
            style={{
              position: "absolute",
              zIndex: 30,
              top: "calc(100% + 6px)",
              left: 0,
              width: 260,
              padding: "0.75rem",
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: RADIUS.lg,
              boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Existentes
            </div>
            {available.length === 0 ? (
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.75rem", color: C.gray400 }}>
                {categories.length === 0
                  ? "Aún no hay. Crea una abajo."
                  : "Ya están todas en el torneo."}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  marginBottom: "0.75rem",
                }}
              >
                {available.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addId(c.id)}
                    style={{
                      border: `1px solid ${C.gray300}`,
                      backgroundColor: C.white,
                      color: C.gray700,
                      borderRadius: RADIUS.full,
                      padding: "0.3rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Nueva
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <FormInput
                value={newName}
                maxLength={20}
                onChange={(e) => setNewName(lettersAndNumbers(e.target.value, 20))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void createCategory();
                  }
                }}
                placeholder="Ej. Primera división"
              />
              <PrimaryButton
                type="button"
                disabled={creating || !newName.trim()}
                onClick={() => void createCategory()}
                style={{ whiteSpace: "nowrap", padding: "0.45rem 0.7rem" }}
              >
                {creating ? "…" : "Crear"}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
