import type { ReactNode } from "react";
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
  /** Aviso junto al botón de confirmar. El botón sigue recibiendo el clic. */
  confirmHint?: string;
  /** Oculta confirmar y la acción de peligro. Cancelar sigue cerrando. */
  readOnly?: boolean;
  dangerAction?: { label: string; onClick: () => void };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useModalLock(open ? onCancel : null);
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
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
          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
            <PrimaryButton
              type="button"
              variant={danger ? "red" : "navy"}
              disabled={busy || (confirmDisabled && !confirmHint)}
              onClick={onConfirm}
            >
              {busy ? "…" : confirmLabel}
            </PrimaryButton>
            {confirmHint ? (
              <span
                role="tooltip"
                style={{
                  position: "relative",
                  marginTop: "0.55rem",
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
                    top: -4,
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
    </div>
  );
}
