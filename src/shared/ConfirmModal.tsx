import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalLock } from "./useModalLock";
import { C, PrimaryButton, RADIUS, SecondaryButton, SHADOWS } from "./ui";

export default function ConfirmModal({
  open,
  title,
  message,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  confirmDisabled = false,
  confirmHint,
  dangerAction,
  readOnly = false,
  zIndex = 10100,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  /** Aviso junto al botón de confirmar. Sin `confirmDisabled`, el botón sigue recibiendo el clic. */
  confirmHint?: string;
  /** Oculta confirmar y la acción de peligro. Cancelar sigue cerrando. */
  readOnly?: boolean;
  dangerAction?: { label: string; onClick: () => void };
  zIndex?: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModalLock(open ? onCancel : null);
  if (!open) return null;

  // Portal al body: un ancestro con transform o backdrop-filter (la cabecera, una tarjeta
  // con hover) volvería relativo a él el `position: fixed` y el modal quedaría fuera de pantalla.
  // Al no vivir dentro del modal que lo abre, su z-index compite con todos los overlays de la
  // app: el valor por defecto debe superar al mayor que anide una confirmación (hoja del
  // marcador en vivo y modales de club, 10000).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        backgroundColor: "rgba(20, 18, 15, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          // Un formulario largo (el apartado con su pago) se desplaza dentro del modal en pantallas bajas
          maxHeight: "calc(100vh - 2.5rem)",
          overflowY: "auto",
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          border: `1px solid ${C.gray200}`,
          boxShadow: SHADOWS.xl,
          padding: "1.25rem 1.35rem 1.15rem",
        }}
      >
        <h3
          id="confirm-title"
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 800,
            color: C.navy900,
          }}
        >
          {title}
        </h3>
        {message && (
          <p
            style={{
              margin: "0.65rem 0 0",
              fontSize: "0.85rem",
              color: C.gray600,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </p>
        )}
        {children && <div style={{ marginTop: "0.85rem" }}>{children}</div>}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.15rem",
          }}
        >
          {!readOnly && dangerAction && (
            <PrimaryButton
              type="button"
              variant="red"
              disabled={busy}
              onClick={dangerAction.onClick}
              style={{ marginRight: "auto" }}
            >
              {dangerAction.label}
            </PrimaryButton>
          )}
          <SecondaryButton type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </SecondaryButton>
          {!readOnly && (
          <span style={{ position: "relative", display: "inline-flex" }}>
            <PrimaryButton
              type="button"
              variant={danger ? "red" : "navy"}
              disabled={busy || confirmDisabled}
              onClick={onConfirm}
            >
              {busy ? "…" : confirmLabel}
            </PrimaryButton>
            {confirmHint ? (
              <span
                role="tooltip"
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: "calc(100% + 0.5rem)",
                  zIndex: 2,
                  width: "max-content",
                  maxWidth: 220,
                  padding: "0.4rem 0.6rem",
                  borderRadius: RADIUS.md,
                  backgroundColor: C.navy900,
                  color: C.white,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  boxShadow: SHADOWS.lg,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    right: 18,
                    bottom: -4,
                    width: 8,
                    height: 8,
                    backgroundColor: C.navy900,
                    transform: "rotate(45deg)",
                  }}
                />
                {confirmHint}
              </span>
            ) : null}
          </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
