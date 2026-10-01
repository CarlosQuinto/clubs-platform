import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { C, RADIUS, SHADOWS } from "../ui";
import type { Tournament } from "../../lib/types";
import { footballTypeLabel } from "../../lib/types";
import { formatShortDate } from "../../utils/helpers";
import { deleteTournament, previewTournamentDelete } from "../../lib/deleteTournament";
import { useAuth } from "../../context/AuthContext";
import { useTournamentEdit } from "../admin/TournamentEditModal";
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
  const { isSuperAdmin } = useAuth();
  const { openEdit } = useTournamentEdit();
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
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: C.white,
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.sm,
        overflow: "hidden",
      }}
    >
      <Link
        to={`/torneos/${tournament.id}`}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "1rem",
          textDecoration: "none",
          color: C.gray800,
        }}
      >
      <div style={{ fontWeight: 800 }}>{tournament.name}</div>
      <div style={{ fontSize: "0.75rem", color: C.gray500, marginTop: 4 }}>
        {[
          seasonName || "Temporada",
          footballTypeLabel(tournament.footballType),
          tournament.clubIds.length > 0
            ? `${tournament.clubIds.length} clubes`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
      {showStart && (
        <div style={{ fontSize: "0.72rem", color: C.gray500, marginTop: 4, fontWeight: 700 }}>
          Inicia {formatShortDate(begins)}
        </div>
      )}
      {categoryName && (
        <div style={{ marginTop: "auto", paddingTop: "0.7rem" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.6875rem",
              fontWeight: 800,
              padding: "0.2rem 0.6rem",
              borderRadius: RADIUS.full,
              backgroundColor: tone.bg,
              color: tone.text,
              border: `1px solid ${tone.border}`,
              letterSpacing: "0.02em",
            }}
          >
            {categoryName}
          </span>
        </div>
      )}
      </Link>
      {isSuperAdmin ? (
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${C.gray200}`,
            backgroundColor: C.gray50,
          }}
        >
          <button
            type="button"
            onClick={() => openEdit(tournament.id)}
            style={cardAction(canDelete)}
          >
            <Pencil size={13} /> Editar
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => void askDelete()}
              style={{ ...cardAction(false), color: C.red }}
            >
              <Trash2 size={13} /> Eliminar
            </button>
          ) : null}
        </div>
      ) : null}
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

const cardAction = (split: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.3rem",
  flex: 1,
  padding: "0.45rem 0.75rem",
  border: "none",
  borderRight: split ? `1px solid ${C.gray200}` : "none",
  backgroundColor: "transparent",
  color: C.navy900,
  fontWeight: 800,
  fontSize: "0.72rem",
  cursor: "pointer",
});

export function TournamentGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "0.75rem",
        alignItems: "stretch",
      }}
    >
      {children}
    </div>
  );
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

  return (
    <section style={{ marginBottom: "1.35rem" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.15rem 0 0.5rem",
          background: "none",
          border: "none",
          borderBottom: `1px solid ${C.gray200}`,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            color: C.gray600,
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.02em",
          }}
        >
          <ChevronDown
            size={14}
            color={C.gray400}
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s ease",
            }}
          />
          {title}
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: C.gray400,
          }}
        >
          {count}
        </span>
      </button>
      {open && (
        <div style={{ paddingTop: "0.75rem" }}>
          {count === 0 ? (
            <p style={{ margin: 0, color: C.gray400, fontSize: "0.85rem" }}>
              No hay elementos en esta lista.
            </p>
          ) : (
            children
          )}
        </div>
      )}
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
