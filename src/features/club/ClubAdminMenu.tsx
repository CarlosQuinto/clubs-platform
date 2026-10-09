import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";
import Field from "../admin/Field";
import { removeClub, setClubVisible } from "../../domains/clubs/clubCommands";
import { disableReason, isDisableReason } from "../../shared/textLimits";
import { C, FormInput, RADIUS, SHADOWS } from "../../shared/ui";
import { requestClubRefresh } from "./useClubScreen";

type Action = "hide" | "show" | "delete";

/**
 * Menú «⋯» del superadmin en la cabecera del club: desactivar (con motivo visible en la página), activar y
 * eliminar (escribiendo la URL). Son las acciones que antes vivían en /admin → Equipos; aquí viven junto al
 * club. Eliminar manda a /equipos; lo demás recarga la página del club.
 */
export default function ClubAdminMenu({
  club,
}: {
  club: { id: string; slug: string; name: string; active: boolean };
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [deleteSlug, setDeleteSlug] = useState("");
  const [hideReason, setHideReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const start = (next: Action) => {
    setOpen(false);
    setDeleteSlug("");
    setHideReason("");
    setError("");
    setAction(next);
  };

  const cancel = () => {
    if (busy) return;
    setAction(null);
  };

  const confirm = async () => {
    if (!action) return;
    if (action === "delete" && deleteSlug !== club.slug) return;
    if (action === "hide" && !isDisableReason(hideReason)) return;
    try {
      setBusy(true);
      setError("");
      if (action === "delete") {
        await removeClub(club.id);
        navigate("/equipos");
        return;
      }
      await setClubVisible(club.id, action === "show", hideReason);
      setAction(null);
      requestClubRefresh();
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Administrar club"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Administrar club"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `1px solid rgba(255,255,255,0.25)`,
          background: open ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
          color: C.white,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            zIndex: 30,
            minWidth: 190,
            padding: "0.35rem",
            background: C.white,
            border: `1px solid ${C.gray200}`,
            borderRadius: RADIUS.lg,
            boxShadow: SHADOWS.md,
          }}
        >
          <MenuItem onClick={() => start(club.active ? "hide" : "show")}>
            {club.active ? <EyeOff size={14} /> : <Eye size={14} />}
            {club.active ? "Desactivar club" : "Activar club"}
          </MenuItem>
          <MenuItem onClick={() => start("delete")} danger>
            <Trash2 size={14} /> Eliminar club
          </MenuItem>
        </div>
      ) : null}

      <ConfirmModal
        open={action !== null}
        title={
          action === "delete"
            ? `Eliminar ${club.name}`
            : action === "hide"
              ? `Desactivar ${club.name}`
              : `Activar ${club.name}`
        }
        message={
          action === "delete"
            ? `${club.name} (/${club.slug}) desaparecerá de la plataforma y sus administradores perderán el acceso. Sus partidos y resultados se conservan en el historial de la liga. La URL queda reservada.`
            : action === "hide"
              ? `${club.name} dejará de aparecer como equipo activo y no se podrá inscribir en torneos nuevos. Puedes volver a activarlo después desde esta página o desde «Equipos ocultos» en /equipos.`
              : `${club.name} volverá a aparecer como equipo activo.`
        }
        confirmLabel={action === "delete" ? "Eliminar club" : action === "hide" ? "Desactivar" : "Activar"}
        danger={action !== "show"}
        busy={busy}
        confirmDisabled={
          (action === "delete" && deleteSlug !== club.slug) ||
          (action === "hide" && !isDisableReason(hideReason))
        }
        confirmHint={error || undefined}
        onCancel={cancel}
        onConfirm={() => void confirm()}
      >
        {action === "delete" ? (
          <Field label={`Escribe "${club.slug}" para confirmar`}>
            <FormInput value={deleteSlug} onChange={(e) => setDeleteSlug(e.target.value)} autoComplete="off" />
          </Field>
        ) : null}
        {action === "hide" ? (
          <Field
            label="Motivo (visible en la página del club)"
            tip={hideReason.trim() && hideReason.trim().length < 5 ? "Escribe al menos 5 caracteres." : ""}
            count={`${hideReason.length}/100`}
          >
            <FormInput
              value={hideReason}
              maxLength={100}
              onChange={(e) => setHideReason(disableReason(e.target.value))}
              autoComplete="off"
            />
          </Field>
        ) : null}
      </ConfirmModal>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        padding: "0.5rem 0.6rem",
        border: 0,
        borderRadius: RADIUS.md,
        background: "none",
        color: danger ? C.red : C.gray800,
        fontSize: "0.8rem",
        fontWeight: 700,
        textAlign: "left",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.gray50)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {children}
    </button>
  );
}
