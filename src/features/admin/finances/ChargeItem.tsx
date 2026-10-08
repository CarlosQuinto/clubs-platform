import { useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import type { LeagueCharge } from "../../../infrastructure/api/types";
import { markChargePaid } from "../../../domains/finances/leagueCommands";
import {
  CHARGE_STATUS_COLOR,
  CHARGE_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  isPaidOnBooking,
  payerLabel,
} from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { formatShortDate } from "../../../shared/helpers";
import { Badge, C, FormError, RADIUS, SecondaryButton } from "../../../shared/ui";

/** Un registro (cargo) con «Marcar como pagado / no pagado». Lo usan el resumen y la lista de cargos. */
export default function ChargeItem({
  charge,
  onChanged,
  actions,
}: {
  charge: LeagueCharge;
  /** Se llama después de marcar o desmarcar, para recargar. */
  onChanged: () => void;
  /** Acciones extra (condonar, cancelar…), solo en la lista de cargos. */
  actions?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const busyRef = useRef(false);
  const open = charge.status === "PENDIENTE" || charge.status === "PARCIAL";
  const rental = isPaidOnBooking(charge);
  const canToggle = !rental && (open || charge.status === "PAGADO");

  const toggle = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await markChargePaid(charge.id, charge.status !== "PAGADO");
      onChanged();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, padding: "0.6rem 0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: C.navy900, overflowWrap: "anywhere" }}>
            {payerLabel(charge)}
          </div>
          <div style={{ fontSize: "0.78rem", color: C.gray600, overflowWrap: "anywhere" }}>{charge.concept}</div>
          <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
            {formatShortDate(charge.chargedOn)}
            {!charge.club && charge.payerContact ? ` · ${charge.payerContact}` : ""}
            {charge.dueDate ? ` · vence ${formatShortDate(charge.dueDate)}` : ""}
            {charge.tournament ? ` · ${charge.tournament.name}` : ""}
          </div>
          {charge.note ? <div style={{ fontSize: "0.72rem", color: C.gray400 }}>Motivo: {charge.note}</div> : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, fontSize: "0.9rem" }}>{formatCurrency(charge.amount)}</div>
          {charge.status === "PARCIAL" ? (
            <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
              Pagado {formatCurrency(charge.paid)} · debe {formatCurrency(charge.balance)}
            </div>
          ) : null}
          <Badge color={CHARGE_STATUS_COLOR[charge.status]}>{CHARGE_STATUS_LABEL[charge.status]}</Badge>
        </div>
      </div>

      {charge.payments.length > 0 && !rental && (
        <div style={{ fontSize: "0.72rem", color: C.gray500, marginTop: "0.35rem" }}>
          {charge.payments
            .map((p) => `${formatShortDate(p.paidOn)} · ${PAYMENT_METHOD_LABEL[p.method]} · ${formatCurrency(p.amount)}`)
            .join("  |  ")}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem", alignItems: "center" }}>
        {rental && charge.status === "PAGADO" ? (
          <span style={{ fontSize: "0.75rem", color: C.green, display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
            <Check size={14} /> Pagada al apartar
          </span>
        ) : null}
        {canToggle && (
          <SecondaryButton
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
          >
            {busy ? "Guardando…" : charge.status === "PAGADO" ? "Marcar como no pagado" : "Marcar como pagado"}
          </SecondaryButton>
        )}
        {actions}
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}
