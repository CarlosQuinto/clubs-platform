import React, { useRef, useState } from "react";
import { C, FormError, FormInput, PrimaryButton, SecondaryButton } from "../../../shared/ui";
import { financeText, isFinanceText, isMoneyText, moneyText } from "../../../shared/textLimits";

interface GoalFormProps {
  /** Jugadores activos: sirven para sugerir la cuota por jugador. */
  activePlayers: number;
  onSave: (title: string, amount: number, quotaPerPlayer: number) => Promise<void>;
  onClose: () => void;
}

/** Nueva meta de recaudación: título, monto total y cuota por jugador (las reglas de save_financial_goal). */
export function GoalForm({ activePlayers, onSave, onClose }: GoalFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [quota, setQuota] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const total = parseFloat(amount);
  const suggested = activePlayers > 0 && total > 0 ? Math.ceil(total / activePlayers) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!isFinanceText(title)) {
      setError("El nombre lleva de 3 a 30 letras, números o comas.");
      return;
    }
    if (!isMoneyText(amount) || !(total > 0)) {
      setError("Escribe el monto total que se necesita.");
      return;
    }
    if (quota && !isMoneyText(quota)) {
      setError("La cuota por jugador no es válida.");
      return;
    }
    setError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(title.trim(), total, quota ? parseFloat(quota) : suggested);
      onClose();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la meta. Revisa los datos e inténtalo de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const label: React.CSSProperties = { fontSize: "0.7rem", fontWeight: 700, color: C.navy900 };

  return (
    <form
      onSubmit={handleSubmit}
      className="compact-form"
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}
    >
      <label style={label}>
        Nombre de la meta
        <FormInput
          required
          autoFocus
          value={title}
          maxLength={30}
          onChange={(e) => setTitle(financeText(e.target.value))}
          placeholder="Ej. Uniformes nuevos, liguilla"
        />
      </label>
      <label style={label}>
        Monto total
        <FormInput
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(moneyText(e.target.value))}
          placeholder="Ej. 3000"
        />
      </label>
      <label style={label}>
        Cuota por jugador
        <FormInput
          inputMode="decimal"
          value={quota}
          onChange={(e) => setQuota(moneyText(e.target.value))}
          placeholder={suggested ? `Sugerida: ${suggested} (${activePlayers} jugadores activos)` : "Opcional"}
        />
      </label>
      <FormError>{error}</FormError>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <SecondaryButton type="button" onClick={onClose} style={{ flex: 1, padding: "0.55rem" }}>
          Cancelar
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={saving} style={{ flex: 1, padding: "0.55rem" }}>
          {saving ? "Guardando…" : "Crear meta"}
        </PrimaryButton>
      </div>
    </form>
  );
}
