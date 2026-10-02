import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { C } from "../ui";
import type { Tournament } from "../../lib/types";
import { footballTypeLabel } from "../../lib/types";
import { formatShortDate } from "../../utils/helpers";
import { deleteTournament, previewTournamentDelete } from "../../lib/deleteTournament";
import { whatsappUrl } from "../../lib/social";
import { useAuth } from "../../context/AuthContext";
import { useTournamentEdit } from "../admin/TournamentEditModal";
import { markScrollTopAfterNav } from "./PlatformLayout";
import ConfirmModal from "../ConfirmModal";

const DIVISION_TONE = [
  { bg: C.amberLight, text: C.navy900, border: C.amber },
  { bg: C.navy100, text: C.navy900, border: C.navy400 },
  { bg: C.greenLight, text: C.green, border: C.greenBorder },
  { bg: C.gray100, text: C.gray800, border: C.gray300 },
];

export function TournamentCard({
  tournament,
  seasonName,
  categoryName,
  categoryOrder = 1,
  startDate,
  canDelete = false,
}: {
  tournament: Tournament;
  seasonName?: string;
  categoryName?: string;
  categoryOrder?: number;
  startDate?: string;
  /** Superadmin y sin partidos jugados. Mientras carga la lista, queda en falso. */
  canDelete?: boolean;
}) {
  const tone = DIVISION_TONE[(Math.max(1, categoryOrder) - 1) % DIVISION_TONE.length];
  const begins = tournament.startDate || startDate || "";
  const showStart = tournament.status === "upcoming" && Boolean(begins);
  const { isSuperAdmin, platformConfig } = useAuth();
  const { openEdit } = useTournamentEdit();
  const clubs = tournament.clubIds.length;
  const meta = [
    seasonName || "Temporada",
    footballTypeLabel(tournament.footballType),
    clubs === 1 ? "1 club" : `${clubs} clubes`,
  ].join(" · ");
  const joinHref = isSuperAdmin
    ? ""
    : whatsappUrl(
        platformConfig?.social?.whatsapp || "",
        `Hola, me gustaría participar con mi equipo o con un equipo en el torneo ${tournament.name}. ¿Me podría dar más información? Gracias.`,
      );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [busy, setBusy] = useState(false);

  const askDelete = async () => {
    try {
      const preview = await previewTournamentDelete(tournament.id);
      if (preview.blocked) {
        window.alert("No se puede eliminar: ya tiene partidos jugados.");
        return;
      }
      setPendingMatches(preview.pending);
      setConfirmOpen(true);
    } catch (err) {
      console.error(err);
      window.alert("No se pudo revisar el torneo.");
    }
  };

  const confirmDelete = async () => {
    try {
      setBusy(true);
      await deleteTournament(tournament.id);
      setConfirmOpen(false);
    } catch (err) {
      console.error(err);
      const played = err instanceof Error && err.message === "played";
      window.alert(
        played
          ? "No se puede eliminar: ya tiene partidos jugados."
          : "No se pudo eliminar el torneo.",
      );
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const pendingLabel =
    pendingMatches === 0
      ? "No tiene partidos."
      : pendingMatches === 1
        ? "También se eliminará 1 partido que aún no se juega."
        : `También se eliminarán ${pendingMatches} partidos que aún no se juegan.`;

  return (
    <article className="tour-card">
      <Link
        className="tour-card__main"
        to={`/torneos/${tournament.id}`}
        onClick={markScrollTopAfterNav}
      >
        <span className="tour-card__copy">
          <strong>{tournament.name}</strong>
          <span className="tour-card__meta">{meta}</span>
          {showStart && <span className="tour-card__start">Inicia {formatShortDate(begins)}</span>}
        </span>
      </Link>
      {categoryName && (
        <div className="tour-card__row">
          <span
            className="tour-card__division"
            style={{ background: tone.bg, color: tone.text, borderColor: tone.border }}
          >
            {categoryName}
          </span>
        </div>
      )}
      {isSuperAdmin && (
        <div className="tour-card__actions">
          <button type="button" onClick={() => openEdit(tournament.id)}>
            Editar
          </button>
          {canDelete && (
            <button type="button" className="is-danger" onClick={() => void askDelete()}>
              Eliminar
            </button>
          )}
        </div>
      )}
      {joinHref && (
        <a className="tour-card__join" href={joinHref} target="_blank" rel="noreferrer">
          Quiero participar
        </a>
      )}
      <ConfirmModal
        open={confirmOpen}
        title={`Eliminar ${tournament.name}`}
        message={`Se eliminará ${tournament.name}. ${pendingLabel} Esta acción no se puede deshacer.`}
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

export function TournamentGrid({ children }: { children: React.ReactNode }) {
  return <div className="tour-grid">{children}</div>;
}

export function ArchiveSection({
  title,
  count,
  collapsed = false,
  children,
}: {
  title: string;
  count: number;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!collapsed);
  const label = count === 1 ? "1 torneo" : `${count} torneos`;
  const heading = (
    <>
      {collapsed && <ChevronDown size={16} className={open ? "is-open" : ""} />}
      <span className="tour-band__title">{title}</span>
      <span className="tour-band__count">{label}</span>
    </>
  );

  return (
    <section className="tour-band">
      {collapsed ? (
        <button
          type="button"
          className="tour-band__head"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {heading}
        </button>
      ) : (
        <div className="tour-band__head">{heading}</div>
      )}
      {open &&
        (count === 0 ? (
          <p className="tour-band__empty">No hay elementos en esta lista.</p>
        ) : (
          children
        ))}
    </section>
  );
}

export function SectionRule({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        padding: "0.15rem 0 0.5rem",
        margin: "0.15rem 0 1.1rem",
        borderBottom: `1px solid ${C.gray200}`,
        color: C.gray600,
        fontWeight: 700,
        fontSize: "0.78rem",
        letterSpacing: "0.02em",
      }}
    >
      {title}
    </div>
  );
}

export function PageTitle({
  icon,
  children,
  subtitle,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <header style={{ margin: "0 0 1.5rem" }}>
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1.6rem",
          fontWeight: 900,
          color: C.navy900,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {icon} {children}
      </h1>
      {subtitle && (
        <p style={{ margin: "0.4rem 0 0", color: C.gray500, fontSize: "0.9rem" }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
