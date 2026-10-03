import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Trophy } from "lucide-react";
import {
  ArchiveSection,
  PageTitle,
  TournamentGrid,
} from "../shell/ArchiveUI";
import { markScrollTopAfterNav } from "../shell/PlatformLayout";
import PlatformLayout from "../shell/PlatformLayout";
import { useTournamentEdit } from "./TournamentEditModal";
import ConfirmModal from "../../shared/ConfirmModal";
import { C } from "../../shared/ui";
import { useAuth } from "../../domains/auth/AuthContext";
import { dataConnect, deleteUnplayedTournament } from "../../infrastructure/dataconnect";
import { useTournamentArchive } from "./useTournamentArchive";
import type { TournamentCardView } from "./tournamentArchiveViewState";

const DIVISION_TONE = [
  { bg: C.amberLight, text: C.navy900, border: C.amber },
  { bg: C.navy100, text: C.navy900, border: C.navy400 },
  { bg: C.greenLight, text: C.green, border: C.greenBorder },
  { bg: C.gray100, text: C.gray800, border: C.gray300 },
];

export default function TournamentArchiveView() {
  const { loading, error, view, onRefresh } = useTournamentArchive();
  const { isSuperAdmin } = useAuth();

  return (
    <PlatformLayout>
      <PageTitle icon={<Trophy size={22} color="#cd9a40" />}>Torneos</PageTitle>
      {error ? (
        <p style={{ color: C.red, fontSize: "0.9rem" }}>
          {error}{" "}
          <button type="button" onClick={onRefresh} style={retryButton}>
            Reintentar
          </button>
        </p>
      ) : null}
      {loading && !view ? (
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Cargando torneos…</p>
      ) : view ? (
        <>
          <ArchiveSection title="En curso" count={view.active.length}>
            <TournamentGrid>
              {view.active.map((card) => (
                <ArchiveCard key={card.href} card={card} admin={isSuperAdmin} onDeleted={onRefresh} />
              ))}
            </TournamentGrid>
          </ArchiveSection>
          <ArchiveSection title="Próximos" count={view.upcoming.length}>
            <TournamentGrid>
              {view.upcoming.map((card) => (
                <ArchiveCard key={card.href} card={card} admin={isSuperAdmin} onDeleted={onRefresh} />
              ))}
            </TournamentGrid>
          </ArchiveSection>
          <ArchiveSection title="Finalizados" count={view.finished.length} collapsed>
            <TournamentGrid>
              {view.finished.map((card) => (
                <ArchiveCard key={card.href} card={card} admin={isSuperAdmin} onDeleted={onRefresh} />
              ))}
            </TournamentGrid>
          </ArchiveSection>
        </>
      ) : null}
    </PlatformLayout>
  );
}

function ArchiveCard({
  card,
  admin,
  onDeleted,
}: {
  card: TournamentCardView;
  admin: boolean;
  onDeleted: () => void;
}) {
  const { openEdit } = useTournamentEdit();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tone = DIVISION_TONE[card.toneIndex] ?? DIVISION_TONE[0];
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
    <article className="tour-card">
      <Link className="tour-card__main" to={card.href} onClick={markScrollTopAfterNav}>
        <span className="tour-card__copy">
          <strong>{card.name}</strong>
          <span className="tour-card__meta">{card.meta}</span>
          {card.startLabel ? <span className="tour-card__start">{card.startLabel}</span> : null}
        </span>
      </Link>
      {card.categoryName ? (
        <div className="tour-card__row">
          <span
            className="tour-card__division"
            style={{ background: tone.bg, color: tone.text, borderColor: tone.border }}
          >
            {card.categoryName}
          </span>
        </div>
      ) : null}
      {admin ? (
        <div className="tour-card__actions">
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
      ) : null}
      {!admin && card.joinHref ? (
        <a className="tour-card__join" href={card.joinHref} target="_blank" rel="noreferrer">
          Quiero participar
        </a>
      ) : null}
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

const retryButton = {
  color: C.navy900,
  fontWeight: 700,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
} as const;
