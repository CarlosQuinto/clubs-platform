import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CalendarRange, Medal, Plus, Trophy, X } from "lucide-react";
import { CategoryPicker } from "../admin/competition/TournamentsAdmin";
import { addTournament, loadCompetition } from "../../domains/competition/competitionCommands";
import { todayIso } from "../../domains/courts/courts";
import { tournamentName, tournamentPrize } from "../../shared/textLimits";
import {
  FOOTBALL_TYPES,
  MATCH_DURATIONS,
  type Category,
  type FootballType,
  type MatchDurationMinutes,
  type Season,
} from "../../shared/types";
import { FormInput, FormSelect, PrimaryButton, SegmentedControl } from "../../shared/ui";
import { useModalLock } from "../../shared/useModalLock";
import { outsideSeason, toCompetitionOptions, validateNewTournament } from "./newTournamentMapper";

/** Alta de torneo desde /torneos (solo superadmin). Mismas reglas que «Nuevo torneo» en /admin. */
export default function CreateTournamentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [footballType, setFootballType] = useState<FootballType>(7);
  const [duration, setDuration] = useState<MatchDurationMinutes>(60);
  const [startDate, setStartDate] = useState(todayIso);
  const [prize, setPrize] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);
  const request = useRef(0);

  const close = useCallback(() => {
    if (!creating.current) onClose();
  }, [onClose]);
  useModalLock(close);

  // `quiet`: recarga tras crear una categoría sin ocultar el formulario.
  const load = useCallback((quiet = false) => {
    const ticket = request.current + 1;
    request.current = ticket;
    if (!quiet) {
      setLoading(true);
      setLoadError("");
    }
    void loadCompetition()
      .then((data) => {
        if (ticket !== request.current) return;
        const options = toCompetitionOptions(data);
        setSeasons(options.seasons);
        setCategories(options.categories);
        setSeasonId((current) =>
          options.seasons.some((season) => season.id === current)
            ? current
            : options.seasons.length === 1
              ? options.seasons[0].id
              : "",
        );
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket === request.current && !quiet) {
          setLoadError("No se pudieron cargar las temporadas.");
        }
      })
      .finally(() => {
        if (ticket === request.current && !quiet) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      request.current += 1;
    };
  }, [load]);

  const season = seasons.find((item) => item.id === seasonId);
  const checked = validateNewTournament(
    { name, seasonId, categoryIds, footballType, duration, startDate, prize },
    season,
  );
  const missing = typeof checked === "string" ? checked : "";
  const saveHint = error || (touched ? missing : "");
  const ready = !missing && !busy && !loading && !loadError;
  const dateOutside = outsideSeason(startDate, season);

  const edit = (apply: () => void) => {
    apply();
    setTouched(true);
    setError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creating.current || !ready || typeof checked === "string") return;
    creating.current = true;
    setBusy(true);
    setError("");
    // Una liga por categoría, todas en el mismo grupo (igual que /admin).
    const groupId = crypto.randomUUID();
    let done = 0;
    try {
      for (const categoryId of checked.categoryIds) {
        await addTournament({
          name: checked.name,
          seasonId: checked.seasonId,
          categoryId,
          groupId,
          footballType: checked.footballType,
          durationMinutes: checked.durationMinutes,
          startDate: checked.startDate,
          prize: checked.prize,
        });
        done += 1;
      }
      creating.current = false;
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      const total = checked.categoryIds.length;
      if (done > 0) {
        onCreated();
        setCategoryIds(checked.categoryIds.slice(done));
        setError(`Se crearon ${done} de ${total} categorías; las demás no se pudieron crear.`);
      } else {
        setError("No se pudo crear el torneo.");
      }
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };

  // Portal al body para que la cabecera (backdrop-filter) no recorte el `position: fixed`.
  return createPortal(
    <div
      className="court-form club-form tour-form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-form-title"
      onClick={close}
    >
      <form
        className="court-form__panel"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        noValidate
      >
        <header className="court-form__head">
          <span className="club-form__icon" aria-hidden="true">
            <Trophy size={20} />
          </span>
          <div>
            <h3 id="tour-form-title">Crear torneo</h3>
            <p>Se abre una liga por cada categoría que elijas. Después inscribes a los clubes.</p>
          </div>
          <button
            type="button"
            className="court-form__close"
            aria-label="Cerrar"
            disabled={busy}
            onClick={close}
          >
            <X size={18} />
          </button>
        </header>

        {loading ? (
          <div className="court-form__body">
            <p className="club-form__note">Cargando temporadas…</p>
          </div>
        ) : loadError ? (
          <div className="court-form__body">
            <p className="club-form__note is-error">
              {loadError}{" "}
              <button type="button" className="club-form__retry" onClick={() => load()}>
                Reintentar
              </button>
            </p>
          </div>
        ) : seasons.length === 0 ? (
          <div className="court-form__body">
            <p className="club-form__note">
              No hay temporadas activas. Crea una en Administración.
            </p>
          </div>
        ) : (
          <div className="court-form__body club-form__grid">
            <label className="court-form__label">
              Nombre
              <span className="court-form__field">
                <Trophy size={16} aria-hidden="true" />
                <FormInput
                  value={name}
                  autoFocus
                  disabled={busy}
                  maxLength={50}
                  placeholder="Ej. Liga Municipal"
                  onChange={(event) => edit(() => setName(tournamentName(event.target.value)))}
                />
              </span>
            </label>
            <label className="court-form__label">
              Temporada
              <span className="court-form__field">
                <CalendarRange size={16} aria-hidden="true" />
                <FormSelect
                  value={seasonId}
                  disabled={busy}
                  onChange={(event) => edit(() => setSeasonId(event.target.value))}
                >
                  <option value="">Selecciona...</option>
                  {seasons.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </FormSelect>
              </span>
            </label>
            <div className="court-form__label tour-form__wide" role="group" aria-label="Tipo de fútbol">
              Tipo de fútbol
              <SegmentedControl
                value={String(footballType)}
                onChange={(value) => {
                  const next = Number(value);
                  if (next === 7 || next === 9 || next === 11) edit(() => setFootballType(next));
                }}
                options={FOOTBALL_TYPES.map((players) => ({
                  label: `Fútbol ${players}`,
                  value: String(players),
                }))}
              />
            </div>
            <div className="court-form__label tour-form__wide" role="group" aria-label="Duración del partido">
              Duración del partido
              <SegmentedControl
                value={String(duration)}
                onChange={(value) => {
                  const next = Number(value);
                  if (next === 30 || next === 60 || next === 90 || next === 120) {
                    edit(() => setDuration(next));
                  }
                }}
                options={MATCH_DURATIONS.map((minutes) => ({
                  label: `${minutes} min`,
                  value: String(minutes),
                }))}
              />
              <small className="club-form__hint">Minutos que ocupa la cancha.</small>
            </div>
            <label className="court-form__label">
              Fecha de inicio
              <span className="court-form__field">
                <CalendarDays size={16} aria-hidden="true" />
                <FormInput
                  type="date"
                  value={startDate}
                  min={season?.startDate}
                  max={season?.endDate}
                  disabled={busy}
                  onChange={(event) => edit(() => setStartDate(event.target.value))}
                />
              </span>
              {dateOutside ? (
                <small className="club-form__hint is-error">
                  Tiene que estar dentro de la temporada.
                </small>
              ) : null}
            </label>
            <label className="court-form__label">
              Premio al campeón (opcional)
              <span className="court-form__field">
                <Medal size={16} aria-hidden="true" />
                <FormInput
                  value={prize}
                  disabled={busy}
                  maxLength={60}
                  placeholder="Ej. $25,000 MXN"
                  onChange={(event) => edit(() => setPrize(tournamentPrize(event.target.value)))}
                />
              </span>
            </label>
            <div className="court-form__label tour-form__wide" role="group" aria-label="Categorías">
              Categorías
              <CategoryPicker
                categories={categories}
                selectedIds={categoryIds}
                onChange={(ids) => edit(() => setCategoryIds(ids))}
                onCreated={() => load(true)}
              />
              <small className="club-form__hint">
                Elige una o varias divisiones (Primera, Segunda…) o crea una nueva con «+».
              </small>
            </div>
          </div>
        )}

        <footer className="court-form__foot">
          <span />
          <div className="court-form__actions">
            <button type="button" className="court-form__ghost" disabled={busy} onClick={close}>
              Cancelar
            </button>
            <span className="court-form__save">
              {saveHint ? (
                <span className="court-form__hint" role="tooltip">
                  {saveHint}
                </span>
              ) : null}
              <PrimaryButton type="submit" variant="green" disabled={!ready}>
                <Plus size={15} />
                {busy ? "Creando..." : "Crear torneo"}
              </PrimaryButton>
            </span>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
