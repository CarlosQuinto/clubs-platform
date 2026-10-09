import { useState } from "react";
import { CalendarRange, PlusCircle, Trophy } from "lucide-react";
import { ArchiveSection } from "../shell/ArchiveUI";
import PlatformLayout from "../shell/PlatformLayout";
import { useAuth } from "../../domains/auth/AuthContext";
import CreateTournamentModal from "./CreateTournamentModal";
import SeasonsModal from "./SeasonsModal";
import TournamentTile from "./TournamentTile";
import { useTournamentArchive } from "./useTournamentArchive";
import type { TournamentTileView } from "./tournamentArchiveViewState";

export default function TournamentArchiveView() {
  const { loading, error, view, onRefresh } = useTournamentArchive();
  const { isSuperAdmin } = useAuth();
  const [creating, setCreating] = useState(false);
  const [seasonsOpen, setSeasonsOpen] = useState(false);

  return (
    <PlatformLayout>
      <div className="tour-page">
        <header className="teams-head">
          <span className="teams-head__icon" aria-hidden="true">
            <Trophy size={24} />
          </span>
          <div className="teams-head__copy">
            <h1>Torneos</h1>
            <p>Ligas y copas de cada temporada</p>
          </div>
          {isSuperAdmin ? (
            <div className="teams-head__actions">
              <button
                type="button"
                className="home-btn teams-head__cta teams-head__cta--soft"
                onClick={() => setSeasonsOpen(true)}
              >
                <CalendarRange size={18} />
                Temporadas
              </button>
              <button
                type="button"
                className="home-btn home-btn--gold teams-head__cta"
                onClick={() => setCreating(true)}
              >
                <PlusCircle size={18} />
                Crear torneo
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <p className="teams-error">
            {error}{" "}
            <button type="button" onClick={onRefresh}>
              Reintentar
            </button>
          </p>
        ) : null}
        {loading && !view ? (
          <p className="teams-loading">Cargando torneos…</p>
        ) : view ? (
          <>
            <ArchiveSection title="En curso" count={view.active.length}>
              <TournamentCards cards={view.active} admin={isSuperAdmin} onDeleted={onRefresh} />
            </ArchiveSection>
            <ArchiveSection title="Próximos" count={view.upcoming.length}>
              <TournamentCards cards={view.upcoming} admin={isSuperAdmin} onDeleted={onRefresh} />
            </ArchiveSection>
            <ArchiveSection title="Finalizados" count={view.finished.length} collapsed>
              <TournamentCards cards={view.finished} admin={isSuperAdmin} onDeleted={onRefresh} />
            </ArchiveSection>
          </>
        ) : null}
      </div>

      {creating ? (
        <CreateTournamentModal onClose={() => setCreating(false)} onCreated={onRefresh} />
      ) : null}
      {seasonsOpen ? <SeasonsModal onClose={() => setSeasonsOpen(false)} onChanged={onRefresh} /> : null}
    </PlatformLayout>
  );
}

function TournamentCards({
  cards,
  admin,
  onDeleted,
}: {
  cards: TournamentTileView[];
  admin: boolean;
  onDeleted: () => void;
}) {
  return (
    <div className="home-grid">
      {cards.map((card) => (
        <TournamentTile key={card.href} card={card} admin={admin} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
