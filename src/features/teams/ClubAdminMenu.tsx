import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2, UserCog } from "lucide-react";
import ConfirmModal from "../../shared/ConfirmModal";
import Field from "../admin/Field";
import EditClubModal from "../club/EditClubModal";
import MembersModal from "../club/MembersModal";
import { ClubProvider } from "../../domains/clubs/ClubContext";
import { removeClub, setClubVisible } from "../../domains/clubs/clubCommands";
import { disableReason, isDisableReason } from "../../shared/textLimits";
import { C, FormInput, RADIUS, SHADOWS } from "../../shared/ui";

type Action = "hide" | "show" | "delete";

export type AdminClub = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  logoUrl?: string | null;
  presidentPhone?: string | null;
};

/**
 * Menú «⋯» del superadmin en cada tarjeta de /equipos: editar la información del club, sus administradores,
 * desactivarlo (con motivo visible en su página) o activarlo, y eliminarlo (escribiendo la URL). Después de
 * cualquier cambio llama a `onChanged` para recargar el directorio.
 */
export default function ClubAdminMenu({ club, onChanged }: { club: AdminClub; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [editing, setEditing] = useState(false);
  const [members, setMembers] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState("");
  const [hideReason, setHideReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  // El panel va en un portal con position: fixed, bajo el botón: así no lo recorta ni lo tapa nada de la página.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: Math.round(rect.bottom + 6),
        right: Math.max(8, Math.round(window.innerWidth - rect.right)),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
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
      } else {
        await setClubVisible(club.id, action === "show", hideReason);
      }
      setAction(null);
      onChanged();
    } catch (err) {
      console.error(err);
      setError("No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="teams-card__menu">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Administrar ${club.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Administrar club"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid var(--sand-border)",
          background: open ? "var(--sand-light)" : "#fff",
          color: "var(--ink)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              style={{
                position: "fixed",
                top: anchor.top,
                right: anchor.right,
                zIndex: 1000,
                minWidth: 210,
                padding: "0.35rem",
                background: C.white,
                border: `1px solid ${C.gray200}`,
                borderRadius: RADIUS.lg,
                boxShadow: SHADOWS.md,
              }}
            >
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  setEditing(true);
                }}
              >
                <Pencil size={14} /> Editar información
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpen(false);
                  setMembers(true);
                }}
              >
                <UserCog size={14} /> Administradores
              </MenuItem>
              <MenuItem onClick={() => start(club.active ? "hide" : "show")}>
                {club.active ? <EyeOff size={14} /> : <Eye size={14} />}
                {club.active ? "Desactivar club" : "Activar club"}
              </MenuItem>
              <MenuItem onClick={() => start("delete")} danger>
                <Trash2 size={14} /> Eliminar club
              </MenuItem>
            </div>,
            document.body,
          )
        : null}

      {editing ? (
        <EditClubModal club={club} onClose={() => setEditing(false)} onSaved={onChanged} />
      ) : null}

      {members ? (
        <ClubProvider clubId={club.id}>
          <MembersModal clubName={club.name} onClose={() => setMembers(false)} />
        </ClubProvider>
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
              ? `${club.name} dejará de aparecer como equipo activo y no se podrá inscribir en torneos nuevos. Puedes volver a activarlo desde «Equipos ocultos», al final de esta página.`
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
