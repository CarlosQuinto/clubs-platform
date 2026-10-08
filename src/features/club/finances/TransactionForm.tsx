import React, { useRef, useState } from "react";
import { PlusCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  C,
  SectionCard,
  SegmentedControl,
  FormInput,
  FormSelect,
  PrimaryButton,
  RADIUS,
  FormError,
} from "../../../shared/ui";
import { CATEGORIAS_INGRESO, CATEGORIAS_GASTO } from "../../../domains/finances/constants";
import { isoDate } from "../../../shared/helpers";
import { financeText, isFinanceText, isMoneyText, moneyText } from "../../../shared/textLimits";

interface TransactionFormProps {
  onSubmit: (data: {
    type: "ingreso" | "gasto";
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => void | Promise<void>;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"ingreso" | "gasto">("ingreso");
  const [category, setCategory] = useState("Cuotas");
  const [date, setDate] = useState(() => isoDate());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!isMoneyText(amount) || !(parseFloat(amount) > 0)) {
      setError("Escribe el monto del movimiento.");
      return;
    }
    if (!isFinanceText(description)) {
      setError("El concepto lleva de 3 a 30 letras, números o comas.");
      return;
    }
    setError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await onSubmit({
        type,
        description: description.trim(),
        category,
        amount: parseFloat(amount),
        date,
      });
      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Color dinámico según el tipo de movimiento
  const themeColor = type === "ingreso" ? C.green : C.red;
  const themeBg =
    type === "ingreso" ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)";

  return (
    <SectionCard
      className="compact-form-card"
      title="Nuevo Movimiento"
      icon={<PlusCircle size={14} color={C.navy900} />}
    >
      <form
        onSubmit={handleSubmit}
        className="compact-form"
        style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}
      >
        <SegmentedControl
          options={[
            {
              label: "Ingreso",
              value: "ingreso",
              icon: <TrendingUp size={12} />,
            },
            {
              label: "Gasto",
              value: "gasto",
              icon: <TrendingDown size={12} />,
            },
          ]}
          value={type}
          onChange={(v) => {
            setType(v as "ingreso" | "gasto");
            setCategory(v === "ingreso" ? "Cuotas" : "Equipo/Balones");
          }}
        />

        <div
          className="finance-amount"
          style={{
            backgroundColor: themeBg,
            border: `1px solid ${themeColor}40`,
            borderRadius: RADIUS.md,
            padding: "0.55rem 0.65rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "all 0.3s ease",
          }}
        >
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: "700",
              color: themeColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.15rem",
            }}
          >
            {type === "ingreso" ? "Monto a ingresar" : "Monto a gastar"}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: "800",
                color: themeColor,
                marginRight: "0.15rem",
              }}
            >
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(moneyText(e.target.value))}
              placeholder="0.00"
              style={{
                fontSize: "1.45rem",
                fontWeight: "900",
                color: C.navy900,
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                maxWidth: "140px",
                textAlign: "center",
                padding: 0,
                letterSpacing: "-0.03em",
              }}
            />
          </div>
        </div>

        <FormSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "100%",
            fontWeight: "600",
            color: C.navy900,
            backgroundColor: C.gray50,
          }}
        >
          {(type === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO).map(
            (cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ),
          )}
        </FormSelect>

        <FormInput
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Fecha"
          style={{
            width: "100%",
            color: C.gray600,
            fontWeight: "600",
            backgroundColor: C.gray50,
          }}
        />

        <FormInput
          type="text"
          required
          value={description}
          maxLength={30}
          onChange={(e) => setDescription(financeText(e.target.value))}
          placeholder="¿De qué fue este movimiento?"
          style={{ width: "100%", backgroundColor: C.gray50 }}
        />

        <FormError>{error}</FormError>
        <PrimaryButton
          type="submit"
          disabled={saving}
          variant={type === "ingreso" ? "green" : "red"}
          style={{ padding: "0.55rem", fontSize: "0.75rem" }}
        >
          {saving ? "Guardando…" : type === "ingreso" ? "Ingresar Dinero" : "Registrar Gasto"}
        </PrimaryButton>
      </form>
    </SectionCard>
  );
}
