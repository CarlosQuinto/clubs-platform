import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarRange, X } from "lucide-react";
import SeasonsPanel from "./SeasonsPanel";
import { loadCompetition } from "../../domains/competition/competitionCommands";
import type { Season } from "../../shared/types";
import { useModalLock } from "../../shared/useModalLock";

type TournamentRef = { seasonId: string; status: string };

/**
 * Temporadas de la liga, desde /torneos (solo superadmin): crear, cerrar (forzando si hay torneos abiertos),
 * borrar las vacías y abrir el «Resumen» de las cerradas. Antes era la pestaña Competición de /admin.
 */
export default function SeasonsModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const request = useRef(0);

  useModalLock(onClose);

  // `quiet`: recarga tras crear o cerrar una temporada sin ocultar el panel.
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
        setSeasons(
          data.seasons.map((season) => ({
            id: season.id,
            name: season.name,
            startDate: season.startDate || undefined,
            endDate: season.endDate || undefined,
            active: season.active,
          })),
        );
        setTournaments(
          data.tournaments.map((tournament) => ({ seasonId: tournament.season.id, status: tournament.status })),
        );
      })
      .catch((err: unknown) => {
        console.error(err);
        if (ticket === request.current && !quiet) setLoadError("No se pudieron cargar las temporadas.");
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

  // Portal al body para que la cabecera (backdrop-filter) no recorte el `position: fixed`.
  return createPortal(
    <div
      className="court-form club-form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seasons-title"
      onClick={onClose}
    >
      <div className="court-form__panel" onClick={(event) => event.stopPropagation()}>
        <header className="court-form__head">
          <span className="club-form__icon" aria-hidden="true">
            <CalendarRange size={20} />
          </span>
          <div>
            <h3 id="seasons-title">Temporadas</h3>
            <p>Los torneos se abren dentro de una temporada activa. Cerrarla finaliza la competencia.</p>
          </div>
          <button type="button" className="court-form__close" aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="court-form__body">
          {loading ? (
            <p className="club-form__note">Cargando temporadas…</p>
          ) : loadError ? (
            <p className="club-form__note is-error">
              {loadError}{" "}
              <button type="button" className="club-form__retry" onClick={() => load()}>
                Reintentar
              </button>
            </p>
          ) : (
            <SeasonsPanel
              seasons={seasons}
              tournaments={tournaments}
              onChange={() => {
                load(true);
                onChanged();
              }}
            />
          )}
        </div>

        <footer className="court-form__foot">
          <span />
          <div className="court-form__actions">
            <button type="button" className="court-form__ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
