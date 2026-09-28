import React, { useState } from "react";
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  CalendarDays,
} from "lucide-react";
import {
  C,
  SectionCard,
  SegmentedControl,
  FormInput,
  FormSelect,
  PrimaryButton,
  RADIUS,
} from "../../components/ui";
import { CATEGORIAS_INGRESO, CATEGORIAS_GASTO } from "../finances/constants";

interface TransactionFormProps {
  onSubmit: (data: {
    type: "ingreso" | "gasto";
    description: string;
    category: string;
    amount: number;
    date: string;
  }) => void;
}

export function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"ingreso" | "gasto">("ingreso");
  const [category, setCategory] = useState("Cuotas");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(parseFloat(amount))) return;

    onSubmit({
      type,
      description,
      category,
      amount: parseFloat(amount),
      date,
    });

    // Reseteo rápido
    setDescription("");
    setAmount("");
  };

  // Color dinámico según el tipo de movimiento
  const themeColor = type === "ingreso" ? C.green : C.red;
  const themeBg =
    type === "ingreso" ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)";

  return (
    <SectionCard
      title="Nuevo Movimiento"
      icon={<PlusCircle size={16} color={C.navy900} />}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        {/* 1. SELECTOR TIPO DE MOVIMIENTO */}
        <SegmentedControl
          options={[
            {
              label: "Ingreso",
              value: "ingreso",
              icon: <TrendingUp size={14} />,
            },
            {
              label: "Gasto",
              value: "gasto",
              icon: <TrendingDown size={14} />,
            },
          ]}
          value={type}
          onChange={(v) => {
            setType(v as "ingreso" | "gasto");
            setCategory(v === "ingreso" ? "Cuotas" : "Equipo/Balones");
          }}
        />

        {/* 2. ZONA HEROICA DEL MONTO (Diseño tipo CashApp/Venmo) */}
        <div
          style={{
            backgroundColor: themeBg,
            border: `1px solid ${themeColor}40`,
            borderRadius: RADIUS.lg,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "all 0.3s ease",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "700",
              color: themeColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
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
                fontSize: "2rem",
                fontWeight: "800",
                color: themeColor,
                marginRight: "0.2rem",
              }}
            >
              $
            </span>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                fontSize: "3rem",
                fontWeight: "900",
                color: C.navy900,
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                maxWidth: "200px",
                textAlign: "center",
                padding: 0,
                letterSpacing: "-0.03em",
              }}
            />
          </div>
        </div>

        {/* 3. DETALLES (Categoría y Descripción) */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div style={{ position: "relative" }}>
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
          </div>

          <FormInput
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿De qué fue este movimiento? Ej. Arbitraje..."
            style={{ width: "100%", backgroundColor: C.gray50 }}
          />
        </div>

        {/* 4. FECHA Y BOTÓN DE CONFIRMACIÓN */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.25rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 130px" }}>
            <CalendarDays
              size={16}
              color={C.gray400}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <FormInput
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "2.25rem",
                color: C.gray600,
                fontWeight: "600",
              }}
            />
          </div>

          <PrimaryButton
            type="submit"
            variant={type === "ingreso" ? "green" : "red"}
            style={{
              flex: "2 1 200px",
              padding: "0.875rem",
              fontSize: "0.95rem",
            }}
          >
            {type === "ingreso" ? "Ingresar Dinero" : "Registrar Gasto"}
          </PrimaryButton>
        </div>
      </form>
    </SectionCard>
  );
}
