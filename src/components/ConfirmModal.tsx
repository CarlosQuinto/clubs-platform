import type { ReactNode } from "react";
import { useModalLock } from "../hooks/useModalLock";
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
          <SecondaryButton type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            type="button"
            variant={danger ? "red" : "navy"}
            disabled={busy || confirmDisabled}
            onClick={onConfirm}
          >
            {busy ? "…" : confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
