import { useMemo, useState } from "react";
import { useFinancesData } from "./useFinancesData";
import { FinancesProps, Transaction } from "../../../domains/finances/types";

export function useFinancesPage({
  transactions,
  players,
  goals: externalGoals,
  perms,
}: FinancesProps) {
  const [date] = useState(new Date().toISOString().split("T")[0]);
  // Misma referencia entre renders: useFinancesData copia las metas en un efecto.
  const goalsWithDate = useMemo(
    () =>
      externalGoals?.map((goal) => ({
        ...goal,
        createdAt: goal.createdAt || "",
      })),
    [externalGoals],
  );

  const {
    allTransactions,
    activePlayers,
    totalIncome,
    totalExpense,
    balance,
    goals,
    addTransaction,
    deleteTransaction,
    addGoal,
    completeGoal,
    deleteGoal,
    updateGoalContribution,
  } = useFinancesData(transactions, players, date, goalsWithDate);

  // ── CREACIÓN DE META CON CÁLCULO DE CUOTA ──
  const handleAddGoal = () => {
    const title = window.prompt(
      "Nombre de la nueva meta:\n(Ej. Uniformes Nuevos, Arbitraje Liguilla)",
    );
    if (!title?.trim()) return;

    const amountStr = window.prompt(
      `¿Cuánto dinero se necesita en total para "${title}"?\n(Ej. 3000)`,
    );
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Monto total inválido.");

    // Cálculo sugerido
    const suggestedQuota = Math.ceil(amount / activePlayers.length);
    const quotaStr = window.prompt(
      `Hay ${activePlayers.length} jugadores activos.\n¿De a cuánto nos tocaría a cada uno?\n\n(Sugerencia basada en el total: $${suggestedQuota})`,
      suggestedQuota.toString(),
    );
    if (!quotaStr) return;
    const quotaPerPlayer = parseFloat(quotaStr) || suggestedQuota;

    void addGoal(title, amount, quotaPerPlayer).catch((err: unknown) => {
      console.error(err);
      alert("No se pudo guardar.");
    });
  };

  // ── REGISTRO DE APORTACIÓN ──
  const handleUpdateContribution = (
    goalId: string,
    playerId: string,
    currentAmount: number,
    playerName: string,
    goalTitle: string,
    suggestedQuota: number, // 👈 Recibimos la cuota sugerida para mostrarla
  ) => {
    const input = window.prompt(
      `¿Cuánto ha aportado ${playerName} para "${goalTitle}"?\n\n(Cuota acordada: $${suggestedQuota} c/u)`,
      (currentAmount || 0).toString(),
    );
    if (input === null || input.trim() === "") return;

    const newAmount = parseFloat(input);
    if (isNaN(newAmount) || newAmount < 0) {
      alert("Por favor ingresa una cantidad numérica válida.");
      return;
    }
    void updateGoalContribution(goalId, playerId, newAmount).catch((err: unknown) => {
      console.error(err);
      alert("No se pudo guardar.");
    });
  };

  const handleSubmitTransaction = (data: Omit<Transaction, "id">) => {
    return addTransaction(data);
  };

  return {
    allTransactions,
    activePlayers,
    totalIncome,
    totalExpense,
    balance,
    goals,
    deleteTransaction,
    completeGoal,
    deleteGoal,
    handleAddGoal,
    handleUpdateContribution,
    handleSubmitTransaction,
    perms,
  };
}
