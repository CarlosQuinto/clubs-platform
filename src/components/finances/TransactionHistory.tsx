import {
  LayoutList,
  Trash2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from "lucide-react";
import { C, SectionCard, RADIUS } from "../../components/ui";
import { formatCurrency, isPlayerPayment } from "../finances/helpers";
import { formatFriendlyDate } from "../../utils/helpers";
import { Transaction } from "../finances/types";

interface TransactionHistoryProps {
  transactions: Transaction[];
  canEdit: boolean;
  onDelete: (id: string) => void;
}

export function TransactionHistory({
  transactions,
  canEdit,
  onDelete,
}: TransactionHistoryProps) {
  return (
    <SectionCard
      title="Historial de Movimientos"
      icon={<LayoutList size={16} color={C.navy900} />}
    >
      {transactions.length === 0 ? (
        <div
          style={{
            padding: "2rem 0",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Receipt size={32} color={C.gray300} />
          <p
            style={{
              color: C.gray500,
              margin: 0,
              fontWeight: "500",
              fontSize: "0.875rem",
            }}
          >
            Aún no hay movimientos registrados.
          </p>
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          {transactions.map((tx, index) => {
            const isIncome = tx.type === "ingreso";
            const isPlayer = isPlayerPayment(tx.id);
            const isLast = index === transactions.length - 1;

            // Lógica del Avatar visual
            let IconComponent = isIncome ? ArrowUpRight : ArrowDownRight;
            let iconColor = isIncome ? C.green : C.navy600;
            let iconBg = isIncome ? "rgba(16, 185, 129, 0.1)" : C.gray100;

            if (isPlayer) {
              IconComponent = Users;
              iconColor = C.navy900;
              iconBg = C.navy50;
            }

            return (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.875rem 0",
                  borderBottom: isLast ? "none" : `1px solid ${C.gray100}`,
                  transition: "background-color 0.2s ease",
                }}
              >
                {/* ── IZQUIERDA: Avatar + Info ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  {/* Avatar del Movimiento */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={18} color={iconColor} />
                  </div>

                  {/* Textos */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.1rem",
                    }}
                  >
                    <span
                      style={{
                        margin: 0,
                        fontWeight: "700",
                        color: C.navy900,
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {tx.description}
                    </span>
                    <span
                      style={{
                        margin: 0,
                        fontSize: "0.7rem",
                        color: C.gray500,
                        fontWeight: "500",
                      }}
                    >
                      {tx.category} • {formatFriendlyDate(tx.date)}
                    </span>
                  </div>
                </div>

                {/* ── DERECHA: Monto + Acción ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "800",
                      fontSize: "0.875rem",
                      color: isIncome ? C.green : C.navy900,
                      fontFamily: "'Inter', monospace",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>

                  {/* Botón de Borrar (Oculto si es pago de jugador) */}
                  {canEdit && !isPlayer && (
                    <button
                      onClick={() => onDelete(tx.id)}
                      title="Eliminar movimiento"
                      style={{
                        background: "rgba(239, 68, 68, 0.05)",
                        border: "none",
                        color: C.red,
                        cursor: "pointer",
                        padding: "0.35rem",
                        borderRadius: RADIUS.md,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Si es un pago de jugador, ponemos un espaciador para alinear los montos */}
                  {canEdit && isPlayer && (
                    <div style={{ width: "26px" }} /> // Mismo ancho que el botón de borrar
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
