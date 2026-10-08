import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import type {
  AdminFinanceSetupData,
  LeagueCharge,
  LeagueChargeStatus,
  LeagueFeeKind,
} from "../../../infrastructure/api/types";
import { changeChargeStatus, loadLeagueCharges } from "../../../domains/finances/leagueCommands";
import { CHARGE_KINDS, CHARGE_STATUS_LABEL, FEE_KIND_LABEL, isRental, payerLabel } from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { financeText, isFinanceNote } from "../../../shared/textLimits";
import ConfirmModal from "../../../shared/ConfirmModal";
import { C, FormError, FormInput, FormSelect, PrimaryButton, SecondaryButton, SectionCard } from "../../../shared/ui";
import Field from "../Field";
import ChargeForm from "./ChargeForm";
import ChargeItem from "./ChargeItem";

type Action = "condone" | "cancel" | "reactivate";

/** Todos los cobros de la liga con filtros. Se registran solos; aquí se marcan como pagados o se corrigen. */
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
  const [pending, setPending] = useState<{ type: Action; charge: LeagueCharge } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmError, setConfirmError] = useState("");
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
        if (current === ticket.current) setError("No se pudieron cargar los cobros.");
      })
      .finally(() => {
        if (current === ticket.current) setLoading(false);
      });
  }, [seasonId, clubId, status, kind]);

  useEffect(() => {
    reload();
  }, [reload]);

  const totals = useMemo(
    () => ({
      amount: charges.reduce((sum, c) => sum + (c.status === "CANCELADO" ? 0 : c.amount), 0),
      balance: charges.reduce((sum, c) => sum + c.balance, 0),
    }),
    [charges],
  );

  const confirm = async () => {
    if (!pending || busyRef.current) return;
    if (pending.type !== "reactivate" && !isFinanceNote(note)) {
      setConfirmError("El motivo lleva hasta 30 letras, números o comas.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setConfirmError("");
    try {
      const action = pending.type === "condone" ? "CONDONAR" : pending.type === "cancel" ? "CANCELAR" : "REACTIVAR";
      await changeChargeStatus({ id: pending.charge.id, action, note: pending.type === "reactivate" ? undefined : note.trim() });
      setPending(null);
      setNote("");
      reload();
    } catch (err) {
      console.error(err);
      setConfirmError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const ask = (type: Action, charge: LeagueCharge) => {
    setNote("");
    setConfirmError("");
    setPending({ type, charge });
  };

  return (
    <SectionCard title="Cobros" icon={<Wallet size={16} color={C.amber} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          Los cobros se registran solos: inscripciones, partidos jugados, tarjetas, rentas de cancha (con lo pagado al
          apartar) y anuncios con precio. Aquí marcas si el equipo ya lo cubrió.
        </p>
        <div>
          <PrimaryButton type="button" onClick={() => setCreating((open) => !open)}>
            <Plus size={14} /> Otro cobro
          </PrimaryButton>
        </div>
        {notice ? (
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.green }} role="status">
            {notice}
          </p>
        ) : null}
        {creating && (
          <ChargeForm
            setup={setup}
            seasonId={seasonId}
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              setNotice("Cobro registrado.");
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
              {CHARGE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {FEE_KIND_LABEL[k]}
                </option>
              ))}
            </FormSelect>
          </Field>
        </div>

        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          {loading ? "Cargando…" : `${charges.length} cobros · ${formatCurrency(totals.amount)} en total · ${formatCurrency(totals.balance)} por cobrar`}
          {charges.length === 500 ? " (se muestran los 500 más recientes)" : ""}
        </p>
        {error ? <FormError>{error}</FormError> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {charges.map((charge) => {
            const open = charge.status === "PENDIENTE" || charge.status === "PARCIAL";
            const small = { padding: "0.3rem 0.65rem", fontSize: "0.75rem" };
            return (
              <ChargeItem
                key={charge.id}
                charge={charge}
                onChanged={reload}
                actions={
                  <>
                    {open && (
                      <SecondaryButton type="button" onClick={() => ask("condone", charge)} style={small}>
                        Condonar
                      </SecondaryButton>
                    )}
                    {charge.status === "PENDIENTE" && charge.paid === 0 && (
                      <SecondaryButton type="button" onClick={() => ask("cancel", charge)} style={small}>
                        Cancelar
                      </SecondaryButton>
                    )}
                    {(charge.status === "CONDONADO" || (charge.status === "CANCELADO" && !isRental(charge))) && (
                      <SecondaryButton type="button" onClick={() => ask("reactivate", charge)} style={small}>
                        Reactivar
                      </SecondaryButton>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={pending !== null}
        title={pending?.type === "condone" ? "Condonar cobro" : pending?.type === "cancel" ? "Cancelar cobro" : "Reactivar cobro"}
        message={
          !pending
            ? ""
            : `${pending.charge.concept} (${payerLabel(pending.charge)}, ${formatCurrency(pending.charge.amount)}): ${
                pending.type === "condone"
                  ? "lo que falta por pagar se perdona y cuenta como pérdida."
                  : pending.type === "cancel"
                    ? "el cobro fue un error y deja de contar en las finanzas."
                    : "vuelve a quedar por cobrar."
              }`
        }
        confirmLabel="Confirmar"
        cancelLabel="Volver"
        danger={pending?.type !== "reactivate"}
        busy={busy}
        confirmHint={confirmError || undefined}
        onConfirm={() => void confirm()}
        onCancel={() => {
          if (busy) return;
          setPending(null);
          setConfirmError("");
        }}
      >
        {pending && pending.type !== "reactivate" ? (
          <Field label="Motivo (opcional)" count={`${note.length}/30`}>
            <FormInput value={note} maxLength={30} onChange={(e) => setNote(financeText(e.target.value))} />
          </Field>
        ) : null}
      </ConfirmModal>
    </SectionCard>
  );
}
