import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Medal, Pencil, Trash2, Users } from "lucide-react";
import { useTournamentEdit } from "./TournamentEditModal";
import ConfirmModal from "../../shared/ConfirmModal";
import { markScrollTopAfterNav } from "../shell/PlatformLayout";
import { dataConnect, deleteUnplayedTournament } from "../../infrastructure/dataconnect";
import type { TournamentTileView } from "./tournamentArchiveViewState";

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
        {/* Sin estado: la portada (pestañas) y /torneos (secciones) ya agrupan por en curso / próximos. */}
        {card.categoryName ? (
          <div className="home-tour__top">
            <span className="home-chip home-chip--round" title={card.categoryName}>
              {card.categoryName}
            </span>
          </div>
        ) : null}
        <h3>
          {/* Se estira sobre toda la tarjeta (::after); los botones quedan encima con su propia acción. */}
          <Link to={card.href} className="home-tour__link" onClick={markScrollTopAfterNav}>
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
              Inscritos:
            </dt>
            <dd>{card.clubsLabel}</dd>
          </div>
          {card.prize ? (
            <div>
              <dt>
                <Medal size={16} aria-hidden />
                Premio:
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
        message={`Se eliminará ${card.name} con sus partidos programados; las canchas apartadas para ellos quedarán libres. Esta acción no se puede deshacer.`}
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
