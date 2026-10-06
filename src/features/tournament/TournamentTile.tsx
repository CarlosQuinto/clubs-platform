import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Medal, Pencil, Trash2, Users } from "lucide-react";
import { useTournamentEdit } from "./TournamentEditModal";
import ConfirmModal from "../../shared/ConfirmModal";
import { markScrollTopAfterNav } from "../shell/PlatformLayout";
import { dataConnect, deleteUnplayedTournament } from "../../infrastructure/dataconnect";
import type { TournamentTileView } from "./tournamentArchiveViewState";

const STATUS = {
  active: { className: "is-active", label: "En curso" },
  upcoming: { className: "is-soon", label: "Próximamente" },
  finished: { className: "is-done", label: "Finalizado" },
} as const;

export default function TournamentTile({
  card,
  admin,
  onDeleted,
}: {
  card: TournamentTileView;
  admin: boolean;
  onDeleted: () => void;
}) {
  const { openEdit } = useTournamentEdit();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDelete = admin && card.playedMatches === 0;
  const status = STATUS[card.phase];

  const confirmDelete = async () => {
    try {
      setBusy(true);
      const result = await deleteUnplayedTournament(dataConnect, { id: card.id });
      if (!result.data.tournament) {
        window.alert("No se puede eliminar: ya tiene partidos jugados.");
        setConfirmOpen(false);
        return;
      }
      setConfirmOpen(false);
      onDeleted();
    } catch (err) {
      console.error(err);
      window.alert("No se pudo eliminar el torneo.");
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="home-card home-tour">
      <div className="home-tour__body">
        <div className="home-tour__top">
          {card.categoryName ? (
            <span className="home-chip home-chip--round" title={card.categoryName}>
              {card.categoryName}
            </span>
          ) : (
            <span />
          )}
          <span className={`home-status ${status.className}`}>
            <span className="home-status__dot" aria-hidden />
            {status.label}
          </span>
        </div>
        <h3>
          <Link to={card.href} onClick={markScrollTopAfterNav}>
            {card.name}
          </Link>
        </h3>
        {card.meta ? <p className="home-tour__meta">{card.meta}</p> : null}
        <dl className="home-tour__facts">
          {card.startLabel && card.startDate ? (
            <div>
              <dt>
                <CalendarDays size={16} aria-hidden />
                {card.startLabel}:
              </dt>
              <dd>{card.startDate}</dd>
            </div>
          ) : null}
          <div>
            <dt>
              <Users size={16} aria-hidden />
              Equipos inscritos:
            </dt>
            <dd>{card.clubsLabel}</dd>
          </div>
          {card.prize ? (
            <div>
              <dt>
                <Medal size={16} aria-hidden />
                Premio al campeón:
              </dt>
              <dd className="is-gold">{card.prize}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      {admin ? (
        <div className="home-tour__admin">
          <button type="button" onClick={() => openEdit(card.id)}>
            <Pencil size={16} />
            Editar
          </button>
          {canDelete ? (
            <button type="button" className="is-danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={16} />
              Eliminar
            </button>
          ) : null}
        </div>
      ) : card.joinHref ? (
        <a className="home-btn home-btn--gold home-btn--block" href={card.joinHref} target="_blank" rel="noreferrer">
          Quiero participar
          <ArrowRight size={18} aria-hidden />
        </a>
      ) : (
        <Link to={card.href} className="home-btn home-btn--outline home-btn--block" onClick={markScrollTopAfterNav}>
          Ver torneo
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={`Eliminar ${card.name}`}
        message={`Se eliminará ${card.name}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </article>
  );
}
