import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { C, RADIUS, SHADOWS } from "../../components/ui";
import { formatCurrency } from "../finances/helpers";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  balance,
}: SummaryCardsProps) {
  const isHealthy = balance >= 0;

  // Cálculo de cuánto nos hemos gastado respecto a los ingresos
  const spendPercentage =
    totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* CABECERA */}
      <div style={{ marginBottom: "0.75rem" }}>
        <h2
          style={{
            fontSize: "0.85rem",
            fontWeight: "800",
            color: C.gray500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Resumen Financiero
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* ── 1. BALANCE PRINCIPAL (BÓVEDA) ── */}
        <div
          style={{
            background: isHealthy
              ? `linear-gradient(135deg, ${C.navy900} 0%, #0f172a 100%)`
              : `linear-gradient(135deg, ${C.red} 0%, #991b1b 100%)`,
            borderRadius: RADIUS.xl,
            padding: "1.25rem 1.5rem",
            color: C.white,
            boxShadow: SHADOWS.md,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <Wallet
            size={100}
            color={C.white}
            style={{
              position: "absolute",
              right: "-20px",
              top: "50%",
              transform: "translateY(-50%) rotate(-15deg)",
              opacity: 0.05,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Fondo del Club
            </span>
            {isHealthy ? (
              <CheckCircle2 size={14} color={C.green} />
            ) : (
              <AlertCircle size={14} color={C.amber} />
            )}
          </div>

          <span
            style={{
              fontSize: "2.25rem",
              fontWeight: "900",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              position: "relative",
              zIndex: 1,
            }}
          >
            {formatCurrency(balance)}
          </span>

          {/* 👇 BARRA DE CONSUMO DE INGRESOS 👇 */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "4px",
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div
              title={`Has gastado el ${spendPercentage.toFixed(0)}% de los ingresos`}
              style={{
                height: "100%",
                width: `${spendPercentage}%`,
                backgroundColor: C.amber,
                transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
        </div>

        {/* ── 2. SUB-TARJETAS (INGRESOS Y GASTOS) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderBottom: `3px solid ${C.green}`,
              borderRadius: RADIUS.lg,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.25rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(16,185,129,0.1)",
                  padding: "4px",
                  borderRadius: "50%",
                }}
              >
                <TrendingUp size={14} color={C.green} />
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Ingresos
              </span>
            </div>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: "800",
                color: C.navy900,
                marginTop: "0.25rem",
              }}
            >
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <div
            style={{
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderBottom: `3px solid ${C.red}`,
              borderRadius: RADIUS.lg,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.25rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(239,68,68,0.1)",
                  padding: "4px",
                  borderRadius: "50%",
                }}
              >
                <TrendingDown size={14} color={C.red} />
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: C.gray500,
                  textTransform: "uppercase",
                }}
              >
                Gastos
              </span>
            </div>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: "800",
                color: C.navy900,
                marginTop: "0.25rem",
              }}
            >
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
