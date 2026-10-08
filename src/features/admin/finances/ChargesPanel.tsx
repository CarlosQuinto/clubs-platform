import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, Plus, Wallet, X } from "lucide-react";
import type {
  AdminFinanceSetupData,
  LeagueCharge,
  LeagueChargeStatus,
  LeagueFeeKind,
  LeaguePaymentMethod,
} from "../../../infrastructure/api/types";
import {
  addPayment,
  changeChargeStatus,
  generateMonth,
  generateSeason,
  loadLeagueCharges,
  removePayment,
} from "../../../domains/finances/leagueCommands";
import {
  ALL_FEE_KINDS,
  CHARGE_STATUS_COLOR,
  CHARGE_STATUS_LABEL,
  FEE_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  payerLabel,
} from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { formatShortDate, isoDate } from "../../../shared/helpers";
import { financeText, isFinanceNote, isMoneyText, moneyText } from "../../../shared/textLimits";
import ConfirmModal from "../../../shared/ConfirmModal";
import {
  Badge,
  C,
  FormError,
  FormInput,
  FormSelect,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";
import Field from "../Field";
import ChargeForm from "./ChargeForm";

type Pending =
  | { type: "condone"; charge: LeagueCharge }
  | { type: "cancel"; charge: LeagueCharge }
  | { type: "reactivate"; charge: LeagueCharge }
  | { type: "deletePayment"; charge: LeagueCharge; paymentId: string }
  | { type: "season" };

/** Cargos de la liga: filtros, pagos, condonar/cancelar, cargo manual y cobros de temporada o del mes. */
export default function ChargesPanel({ setup }: { setup: AdminFinanceSetupData }) {
  const [seasonId, setSeasonId] = useState(setup.seasonId ?? "");
  const [clubId, setClubId] = useState("");
  const [status, setStatus] = useState<LeagueChargeStatus | "">("");
  const [kind, setKind] = useState<LeagueFeeKind | "">("");
  const [charges, setCharges] = useState<LeagueCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [month, setMonth] = useState(() => isoDate().slice(0, 7));
  const busyRef = useRef(false);
  const ticket = useRef(0);

  const reload = useCallback(() => {
    const current = ++ticket.current;
    setLoading(true);
    setError("");
    loadLeagueCharges({
      seasonId: seasonId || null,
      clubId: clubId || null,
      status: status || null,
      kind: kind || null,
    })
      .then((next) => {
        if (current === ticket.current) setCharges(next);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudieron cargar los cargos.");
      })
      .finally(() => {
        if (current === ticket.current) setLoading(false);
      });
  }, [seasonId, clubId, status, kind]);

  useEffect(() => {
    reload();
  }, [reload]);

  const seasonName = setup.seasons.find((s) => s.id === seasonId)?.name ?? "";
  const totals = useMemo(
    () => ({
      amount: charges.reduce((sum, c) => sum + (c.status === "CANCELADO" ? 0 : c.amount), 0),
      balance: charges.reduce((sum, c) => sum + c.balance, 0),
    }),
    [charges],
  );

  /** Ejecuta una acción con guardia de doble clic. */
  const run = async (action: () => Promise<string | void>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setConfirmError("");
    try {
      const message = await action();
      if (message) setNotice(message);
      reload();
      return true;
    } catch (err) {
      console.error(err);
      setConfirmError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    if ((pending.type === "condone" || pending.type === "cancel") && !isFinanceNote(note)) {
      setConfirmError("El motivo lleva hasta 30 letras, números o comas.");
      return;
    }
    const ok = await run(async () => {
      if (pending.type === "condone") await changeChargeStatus({ id: pending.charge.id, action: "CONDONAR", note: note.trim() });
      else if (pending.type === "cancel") await changeChargeStatus({ id: pending.charge.id, action: "CANCELAR", note: note.trim() });
      else if (pending.type === "reactivate") await changeChargeStatus({ id: pending.charge.id, action: "REACTIVAR" });
      else if (pending.type === "deletePayment") await removePayment(pending.paymentId);
      else if (pending.type === "season") {
        const created = await generateSeason(seasonId);
        return created === 0 ? "No había cobros nuevos: ya estaban generados." : `Se crearon ${created} cargos.`;
      }
    });
    if (ok) {
      setPending(null);
      setNote("");
    }
  };

  const runMonth = () =>
    run(async () => {
      if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mes inválido");
      const result = await generateMonth(month);
      if (!result.configured) return "La página del club no se cobra por mes en esa temporada. Actívalo en Tarifas.";
      return result.created === 0 ? "Esa mensualidad ya estaba generada." : `Se crearon ${result.created} cargos.`;
    });

  return (
    <SectionCard title="Cargos" icon={<Wallet size={16} color={C.amber} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <PrimaryButton type="button" onClick={() => setCreating((open) => !open)}>
            <Plus size={14} /> Nuevo cargo
          </PrimaryButton>
          <SecondaryButton type="button" disabled={!seasonId || busy} onClick={() => setPending({ type: "season" })}>
            <CalendarPlus size={14} /> Cobros de temporada
          </SecondaryButton>
          <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
            <FormInput
              type="month"
              value={month}
              aria-label="Mes de la mensualidad"
              onChange={(e) => setMonth(e.target.value)}
              style={{ width: "auto" }}
            />
            <SecondaryButton type="button" disabled={busy} onClick={() => void runMonth()}>
              Generar mensualidad
            </SecondaryButton>
          </span>
        </div>
        {notice ? (
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.green }} role="status">
            {notice}
          </p>
        ) : null}
        {!pending && confirmError ? <FormError>{confirmError}</FormError> : null}

        {creating && (
          <ChargeForm
            setup={setup}
            seasonId={seasonId}
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              setNotice("Cargo creado.");
              reload();
            }}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.6rem" }}>
          <Field label="Temporada">
            <FormSelect value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              <option value="">Todas</option>
              {setup.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Club">
            <FormSelect value={clubId} onChange={(e) => setClubId(e.target.value)}>
              <option value="">Todos</option>
              {setup.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Estado">
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value as LeagueChargeStatus | "")}>
              <option value="">Todos</option>
              {(Object.keys(CHARGE_STATUS_LABEL) as LeagueChargeStatus[]).map((s) => (
                <option key={s} value={s}>
                  {CHARGE_STATUS_LABEL[s]}
                </option>
              ))}
            </FormSelect>
          </Field>
          <Field label="Concepto">
            <FormSelect value={kind} onChange={(e) => setKind(e.target.value as LeagueFeeKind | "")}>
              <option value="">Todos</option>
              {ALL_FEE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {FEE_KIND_LABEL[k]}
                </option>
              ))}
            </FormSelect>
          </Field>
        </div>

        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          {loading ? "Cargando…" : `${charges.length} cargos · ${formatCurrency(totals.amount)} en total · ${formatCurrency(totals.balance)} por cobrar`}
          {charges.length === 500 ? " (se muestran los 500 más recientes)" : ""}
        </p>
        {error ? <FormError>{error}</FormError> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {charges.map((charge) => (
            <ChargeRow
              key={charge.id}
              charge={charge}
              paying={paying === charge.id}
              busy={busy}
              onPay={() => setPaying(paying === charge.id ? null : charge.id)}
              onPaid={() => {
                setPaying(null);
                setNotice("Pago registrado.");
                reload();
              }}
              onAction={(type) => {
                setNote("");
                setConfirmError("");
                setPending({ type, charge });
              }}
              onDeletePayment={(paymentId) => {
                setConfirmError("");
                setPending({ type: "deletePayment", charge, paymentId });
              }}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={pending !== null}
        title={confirmTitle(pending)}
        message={confirmMessage(pending, seasonName)}
        confirmLabel={pending?.type === "season" ? "Generar" : "Confirmar"}
        cancelLabel="Volver"
        danger={pending?.type === "cancel" || pending?.type === "deletePayment" || pending?.type === "condone"}
        busy={busy}
        confirmHint={confirmError || undefined}
        onConfirm={() => void confirm()}
        onCancel={() => {
          if (busy) return;
          setPending(null);
          setConfirmError("");
        }}
      >
        {pending?.type === "condone" || pending?.type === "cancel" ? (
          <Field label="Motivo (opcional)" count={`${note.length}/30`}>
            <FormInput value={note} maxLength={30} onChange={(e) => setNote(financeText(e.target.value))} />
          </Field>
        ) : null}
      </ConfirmModal>
    </SectionCard>
  );
}

function confirmTitle(pending: Pending | null) {
  switch (pending?.type) {
    case "condone":
      return "Condonar cargo";
    case "cancel":
      return "Cancelar cargo";
    case "reactivate":
      return "Reactivar cargo";
    case "deletePayment":
      return "Borrar pago";
    case "season":
      return "Cobros de temporada";
    default:
      return "";
  }
}

function confirmMessage(pending: Pending | null, seasonName: string) {
  if (!pending) return "";
  if (pending.type === "season") {
    return `Se cobrará la inscripción a la temporada, el registro del club y la página por temporada (lo que esté activo en Tarifas de ${seasonName}) a cada club activo. Lo que ya se generó no se repite.`;
  }
  const what = `${pending.charge.concept} (${payerLabel(pending.charge)}, ${formatCurrency(pending.charge.amount)})`;
  if (pending.type === "condone") return `${what}: lo que falta por pagar se perdona y cuenta como pérdida.`;
  if (pending.type === "cancel") return `${what}: el cargo fue un error y deja de contar en las finanzas.`;
  if (pending.type === "reactivate") return `${what} vuelve a quedar por cobrar.`;
  return `Se borra el pago de ${what} y el saldo vuelve a subir.`;
}

function ChargeRow({
  charge,
  paying,
  busy,
  onPay,
  onPaid,
  onAction,
  onDeletePayment,
}: {
  charge: LeagueCharge;
  paying: boolean;
  busy: boolean;
  onPay: () => void;
  onPaid: () => void;
  onAction: (type: "condone" | "cancel" | "reactivate") => void;
  onDeletePayment: (paymentId: string) => void;
}) {
  const open = charge.status === "PENDIENTE" || charge.status === "PARCIAL";
  return (
    <div style={{ border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, padding: "0.65rem 0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ fontWeight: 800, fontSize: "0.85rem", color: C.navy900, overflowWrap: "anywhere" }}>{charge.concept}</div>
          <div style={{ fontSize: "0.75rem", color: C.gray500 }}>
            {payerLabel(charge)}
            {charge.club ? "" : charge.payerContact ? ` · ${charge.payerContact}` : " · externo"}
            {" · "}
            {formatShortDate(charge.chargedOn)}
            {charge.dueDate ? ` · vence ${formatShortDate(charge.dueDate)}` : ""}
            {charge.tournament ? ` · ${charge.tournament.name}` : ""}
            {charge.automatic ? " · automático" : ""}
          </div>
          {charge.note ? <div style={{ fontSize: "0.72rem", color: C.gray400 }}>Motivo: {charge.note}</div> : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, fontSize: "0.9rem" }}>{formatCurrency(charge.amount)}</div>
          {charge.paid > 0 && charge.status !== "PAGADO" ? (
            <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
              Pagado {formatCurrency(charge.paid)}
              {open ? ` · debe ${formatCurrency(charge.balance)}` : ""}
            </div>
          ) : null}
          <Badge color={CHARGE_STATUS_COLOR[charge.status]}>{CHARGE_STATUS_LABEL[charge.status]}</Badge>
        </div>
      </div>

      {charge.payments.length > 0 && (
        <ul style={{ listStyle: "none", margin: "0.45rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {charge.payments.map((payment) => (
            <li key={payment.id} style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.75rem", color: C.gray600 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                {formatShortDate(payment.paidOn)} · {PAYMENT_METHOD_LABEL[payment.method]} · {formatCurrency(payment.amount)}
                {payment.note ? ` · ${payment.note}` : ""}
              </span>
              <button
                type="button"
                aria-label="Borrar pago"
                disabled={busy}
                onClick={() => onDeletePayment(payment.id)}
                style={{ border: "none", background: "none", color: C.gray400, cursor: "pointer", padding: "0.1rem" }}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
        {open && (
          <SecondaryButton type="button" onClick={onPay} disabled={busy} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
            {paying ? "Cerrar" : "Registrar pago"}
          </SecondaryButton>
        )}
        {open && (
          <SecondaryButton type="button" onClick={() => onAction("condone")} disabled={busy} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
            Condonar
          </SecondaryButton>
        )}
        {charge.status === "PENDIENTE" && charge.paid === 0 && (
          <SecondaryButton type="button" onClick={() => onAction("cancel")} disabled={busy} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
            Cancelar
          </SecondaryButton>
        )}
        {(charge.status === "CONDONADO" || charge.status === "CANCELADO") && (
          <SecondaryButton type="button" onClick={() => onAction("reactivate")} disabled={busy} style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}>
            Reactivar
          </SecondaryButton>
        )}
      </div>
      {paying && open && <PaymentForm charge={charge} onSaved={onPaid} />}
    </div>
  );
}

function PaymentForm({ charge, onSaved }: { charge: LeagueCharge; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(charge.balance));
  const [paidOn, setPaidOn] = useState(() => isoDate());
  const [method, setMethod] = useState<LeaguePaymentMethod>("EFECTIVO");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const value = parseFloat(amount);
    if (!isMoneyText(amount) || !(value > 0) || value > charge.balance) {
      setError(`El pago va de 0.01 a ${formatCurrency(charge.balance)}.`);
      return;
    }
    if (!paidOn || paidOn > isoDate()) {
      setError("La fecha del pago no puede ser futura.");
      return;
    }
    if (!isFinanceNote(note)) {
      setError("La nota lleva hasta 30 letras, números o comas.");
      return;
    }
    setError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await addPayment({ id: crypto.randomUUID(), chargeId: charge.id, amount: value, paidOn, method, note: note.trim() });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el pago. Revisa el monto y la fecha.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      style={{ marginTop: "0.6rem", padding: "0.65rem", background: C.gray50, borderRadius: RADIUS.md, display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
        <Field label="Monto">
          <FormInput inputMode="decimal" value={amount} onChange={(e) => setAmount(moneyText(e.target.value))} />
        </Field>
        <Field label="Fecha">
          <FormInput type="date" value={paidOn} max={isoDate()} onChange={(e) => setPaidOn(e.target.value)} />
        </Field>
        <Field label="Método">
          <FormSelect value={method} onChange={(e) => setMethod(e.target.value as LeaguePaymentMethod)}>
            {(Object.keys(PAYMENT_METHOD_LABEL) as LeaguePaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </FormSelect>
        </Field>
        <Field label="Nota (opcional)">
          <FormInput value={note} maxLength={30} onChange={(e) => setNote(financeText(e.target.value))} />
        </Field>
      </div>
      <FormError>{error}</FormError>
      <PrimaryButton type="submit" disabled={saving} style={{ alignSelf: "flex-start" }}>
        {saving ? "Guardando…" : "Guardar pago"}
      </PrimaryButton>
    </form>
  );
}
