import { useMemo, useRef, useState } from "react";
import type { AdminFinanceSetupData, LeagueFeeKind } from "../../../infrastructure/api/types";
import { createCharge } from "../../../domains/finances/leagueCommands";
import { ALL_FEE_KINDS, FEE_KIND_LABEL } from "../../../domains/finances/league";
import { isoDate } from "../../../shared/helpers";
import {
  financeText,
  isFinanceText,
  isMoneyText,
  isPayerContact,
  isPayerName,
  moneyText,
  payerContact,
  payerName,
} from "../../../shared/textLimits";
import { C, FormError, FormInput, FormSelect, PrimaryButton, RADIUS, SecondaryButton, SegmentedControl } from "../../../shared/ui";
import Field from "../Field";

/** Cargo manual: a un club o a un externo (patrocinador, quien renta), con el precio de la tarifa como sugerencia. */
export default function ChargeForm({
  setup,
  seasonId,
  onClose,
  onSaved,
}: {
  setup: AdminFinanceSetupData;
  seasonId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const feeAmount = (kind: LeagueFeeKind) => {
    const fee = setup.fees.find((f) => f.kind === kind);
    return fee && fee.amount > 0 ? String(fee.amount) : "";
  };
  const [debtor, setDebtor] = useState<"club" | "external">("club");
  const [clubId, setClubId] = useState(setup.clubs.find((c) => c.active)?.id ?? "");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [kind, setKind] = useState<LeagueFeeKind>("PROTEST");
  const [concept, setConcept] = useState(FEE_KIND_LABEL.PROTEST);
  const [amount, setAmount] = useState(feeAmount("PROTEST"));
  const [chargedOn, setChargedOn] = useState(() => isoDate());
  const [dueDate, setDueDate] = useState("");
  const [tournamentId, setTournamentId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const tournaments = useMemo(
    () => setup.tournaments.filter((t) => !seasonId || t.seasonId === seasonId),
    [setup.tournaments, seasonId],
  );

  const pickKind = (next: LeagueFeeKind) => {
    // El concepto y el monto siguen al tipo mientras no se hayan tocado a mano
    if (concept === FEE_KIND_LABEL[kind]) setConcept(FEE_KIND_LABEL[next]);
    if (amount === feeAmount(kind)) setAmount(feeAmount(next));
    setKind(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (debtor === "club" && !clubId) return setError("Elige el club.");
    if (debtor === "external" && !isPayerName(name)) return setError("El nombre lleva de 3 a 50 letras, números o comas.");
    if (debtor === "external" && !isPayerContact(contact)) return setError("El contacto lleva hasta 100 caracteres (teléfono o correo).");
    if (!isFinanceText(concept)) return setError("El concepto lleva de 3 a 30 letras, números o comas.");
    if (!isMoneyText(amount) || !(parseFloat(amount) > 0)) return setError("Escribe el monto del cargo.");
    if (!chargedOn) return setError("Elige la fecha del cargo.");
    if (dueDate && dueDate < chargedOn) return setError("El vencimiento no puede ser antes de la fecha del cargo.");
    setError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await createCharge({
        id: crypto.randomUUID(),
        kind,
        clubId: debtor === "club" ? clubId : null,
        payerName: debtor === "external" ? name.trim() : null,
        payerContact: debtor === "external" ? contact.trim() : null,
        concept: concept.trim(),
        amount: parseFloat(amount),
        chargedOn,
        dueDate: dueDate || null,
        tournamentId: tournamentId || null,
        seasonId: tournamentId ? null : seasonId || null,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el cargo. Revisa los datos e inténtalo de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      style={{ padding: "0.75rem", border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, display: "flex", flexDirection: "column", gap: "0.6rem" }}
    >
      <SegmentedControl
        value={debtor}
        onChange={(value) => setDebtor(value as "club" | "external")}
        options={[
          { value: "club", label: "A un club" },
          { value: "external", label: "A un externo" },
        ]}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.6rem" }}>
        {debtor === "club" ? (
          <Field label="Club">
            <FormSelect value={clubId} onChange={(e) => setClubId(e.target.value)}>
              {setup.clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.active ? "" : " (inactivo)"}
                </option>
              ))}
            </FormSelect>
          </Field>
        ) : (
          <>
            <Field label="Nombre" count={`${name.length}/50`}>
              <FormInput value={name} maxLength={50} placeholder="Ej. Refresquera del Valle" onChange={(e) => setName(payerName(e.target.value))} />
            </Field>
            <Field label="Contacto (opcional)">
              <FormInput value={contact} maxLength={100} placeholder="Teléfono o correo" onChange={(e) => setContact(payerContact(e.target.value))} />
            </Field>
          </>
        )}
        <Field label="Tipo de cobro">
          <FormSelect value={kind} onChange={(e) => pickKind(e.target.value as LeagueFeeKind)}>
            {ALL_FEE_KINDS.map((k) => (
              <option key={k} value={k}>
                {FEE_KIND_LABEL[k]}
              </option>
            ))}
          </FormSelect>
        </Field>
        <Field label="Concepto" count={`${concept.length}/30`}>
          <FormInput value={concept} maxLength={30} onChange={(e) => setConcept(financeText(e.target.value))} />
        </Field>
        <Field label="Monto">
          <FormInput inputMode="decimal" value={amount} placeholder="0.00" onChange={(e) => setAmount(moneyText(e.target.value))} />
        </Field>
        <Field label="Fecha">
          <FormInput type="date" value={chargedOn} onChange={(e) => setChargedOn(e.target.value)} />
        </Field>
        <Field label="Vence (opcional)">
          <FormInput type="date" value={dueDate} min={chargedOn} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Torneo (opcional)">
          <FormSelect value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
            <option value="">Sin torneo</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </FormSelect>
        </Field>
      </div>
      <FormError>{error}</FormError>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Crear cargo"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onClose} disabled={saving}>
          Cancelar
        </SecondaryButton>
      </div>
    </form>
  );
}
