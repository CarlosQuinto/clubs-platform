import { useState } from "react";
import {
  Target,
  CheckCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Award,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  C,
  RADIUS,
  SHADOWS,
  SectionCard,
  PrimaryButton,
} from "../../components/ui";
import { formatCurrency } from "../finances/helpers";
import { Player } from "../finances/types";
import { Goal } from "./hooks/useFinancesData";

interface GoalsListProps {
  goals: Goal[];
  players: Player[];
  canEdit: boolean;
  onAddGoal: () => void;
  onCompleteGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateContribution: (
    goalId: string,
    playerId: string,
    currentAmount: number,
    playerName: string,
    goalTitle: string,
    suggestedQuota: number,
  ) => void;
}

export function GoalsList({
  goals,
  players,
  canEdit,
  onAddGoal,
  onCompleteGoal,
  onDeleteGoal,
  onUpdateContribution,
}: GoalsListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SectionCard
      title="Metas y Campañas"
      icon={<Target size={16} color={C.navy600} />}
    >
      {canEdit && (
        <PrimaryButton
          onClick={onAddGoal}
          style={{
            width: "100%",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <Plus size={16} /> Crear Nueva Meta de Recaudación
        </PrimaryButton>
      )}

      {goals.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            color: C.gray400,
            fontStyle: "italic",
            margin: "1rem 0",
          }}
        >
          No hay metas activas. ¡Crea la primera para empezar a recaudar!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {goals.map((goal) => {
            const totalRecaudado = Object.values(
              goal.contributions || {},
            ).reduce((sum, val) => sum + val, 0);
            const progress = Math.min(
              (totalRecaudado / goal.amount) * 100,
              100,
            );
            const isCompleted = goal.status === "completed";
            // ✅ CAMBIO: ahora inicia colapsado siempre (false)
            const isExpanded = expanded[goal.id] ?? false;
            const quota = goal.quotaPerPlayer || 0;

            const paidPlayers = players
              .filter((p) => (goal.contributions?.[p.id] || 0) > 0)
              .sort((a, b) => a.name.localeCompare(b.name));
            const pendingPlayers = players
              .filter((p) => !((goal.contributions?.[p.id] || 0) > 0))
              .sort((a, b) => a.name.localeCompare(b.name));

            return (
              <div
                key={goal.id}
                style={{
                  border: `1px solid ${isCompleted ? C.greenBorder : C.gray200}`,
                  borderRadius: RADIUS.lg,
                  overflow: "hidden",
                  boxShadow: SHADOWS.sm,
                }}
              >
                <div
                  onClick={() => toggle(goal.id)}
                  style={{
                    padding: "1rem",
                    backgroundColor: isCompleted ? C.greenLight : C.white,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.2rem",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: "800",
                        color: isCompleted ? C.green : C.navy900,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      {isCompleted ? <Award size={18} /> : <Target size={18} />}{" "}
                      {goal.title}
                    </h3>
                    <div style={{ color: C.gray400 }}>
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: "0 0 0.75rem 0",
                      fontSize: "0.75rem",
                      color: C.gray500,
                      fontWeight: "600",
                    }}
                  >
                    {quota > 0
                      ? `Cuota acordada: ${formatCurrency(quota)} c/u`
                      : "Sin cuota fija"}
                  </p>

                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: isCompleted
                        ? "rgba(16, 185, 129, 0.2)"
                        : C.gray100,
                      borderRadius: RADIUS.full,
                      overflow: "hidden",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        backgroundColor: isCompleted ? C.green : C.amber,
                        transition: "width 1s",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                    }}
                  >
                    <span style={{ color: C.gray600 }}>
                      Recaudado:{" "}
                      <span
                        style={{ color: isCompleted ? C.green : C.navy900 }}
                      >
                        {formatCurrency(totalRecaudado)}
                      </span>
                    </span>
                    <span style={{ color: C.gray600 }}>
                      Objetivo:{" "}
                      <span
                        style={{ color: isCompleted ? C.green : C.navy900 }}
                      >
                        {formatCurrency(goal.amount)}
                      </span>
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      padding: "1rem",
                      borderTop: `1px solid ${C.gray200}`,
                      backgroundColor: C.gray50,
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    {canEdit && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "1rem",
                          marginBottom: "1.5rem",
                        }}
                      >
                        {!isCompleted && (
                          <button
                            onClick={() => onCompleteGoal(goal.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: C.green,
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            <CheckCircle size={14} /> Marcar Completada
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteGoal(goal.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: C.red,
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          <Trash2 size={14} /> Borrar Meta
                        </button>
                      </div>
                    )}

                    {paidPlayers.length > 0 && (
                      <div
                        style={{
                          marginBottom:
                            pendingPlayers.length > 0 ? "1.5rem" : "0",
                        }}
                      >
                        <h4
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.8125rem",
                            color: C.green,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <UserCheck size={16} /> Ya aportaron (
                          {paidPlayers.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {paidPlayers.map((player) => {
                            const amountPaid = goal.contributions[player.id];
                            return (
                              <div
                                key={player.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.5rem 0.75rem",
                                  border: `1px solid ${C.greenBorder}`,
                                  borderRadius: RADIUS.md,
                                  backgroundColor: C.greenLight,
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontWeight: "600",
                                    color: C.navy900,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {player.name}
                                </p>
                                <button
                                  disabled={!canEdit || isCompleted}
                                  onClick={() =>
                                    onUpdateContribution(
                                      goal.id,
                                      player.id,
                                      amountPaid,
                                      player.name,
                                      goal.title,
                                      quota,
                                    )
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    border: "none",
                                    background: "none",
                                    cursor:
                                      canEdit && !isCompleted
                                        ? "pointer"
                                        : "default",
                                    fontWeight: "700",
                                    fontSize: "0.75rem",
                                    color: C.green,
                                  }}
                                >
                                  <CheckCircle size={14} />{" "}
                                  {formatCurrency(amountPaid)}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {pendingPlayers.length > 0 && (
                      <div>
                        <h4
                          style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.8125rem",
                            color: C.gray500,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <UserX size={16} /> Faltan por aportar (
                          {pendingPlayers.length})
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                          }}
                        >
                          {pendingPlayers.map((player) => (
                            <div
                              key={player.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                border: `1px solid ${C.gray200}`,
                                borderRadius: RADIUS.md,
                                backgroundColor: C.white,
                              }}
                            >
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: "600",
                                  color: C.navy900,
                                  fontSize: "0.8rem",
                                }}
                              >
                                {player.name}
                              </p>
                              {canEdit && !isCompleted ? (
                                <button
                                  onClick={() =>
                                    onUpdateContribution(
                                      goal.id,
                                      player.id,
                                      0,
                                      player.name,
                                      goal.title,
                                      quota,
                                    )
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    border: `1px solid ${C.gray300}`,
                                    borderRadius: RADIUS.full,
                                    padding: "0.2rem 0.6rem",
                                    background: C.white,
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.7rem",
                                    color: C.navy700,
                                  }}
                                >
                                  <Plus size={12} /> Registrar pago
                                </button>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: C.gray400,
                                    fontWeight: "600",
                                  }}
                                >
                                  Sin aporte
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
