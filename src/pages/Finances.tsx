import { useState } from "react";
import { useFinancesData } from "../components/finances/hooks/useFinancesData";
import { SummaryCards } from "../components/finances/SummaryCards";
import { GoalsList } from "../components/finances/GoalsList";
import { TransactionForm } from "../components/finances/TransactionForm";
import { TransactionHistory } from "../components/finances/TransactionHistory";
import { FinancesProps, Transaction } from "../components/finances/types";

export default function Finances({
  transactions,
  players,
  perms,
}: FinancesProps) {
  const [date] = useState(new Date().toISOString().split("T")[0]);

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
  } = useFinancesData(transactions, players, date);

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

    addGoal(title, amount, quotaPerPlayer);
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
    updateGoalContribution(goalId, playerId, newAmount);
  };

  const handleSubmitTransaction = (data: Omit<Transaction, "id">) => {
    addTransaction(data);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <SummaryCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />

      <GoalsList
        goals={goals}
        players={activePlayers}
        canEdit={perms.canEditFinanzas}
        onAddGoal={handleAddGoal}
        onCompleteGoal={completeGoal}
        onDeleteGoal={deleteGoal}
        onUpdateContribution={handleUpdateContribution}
      />

      {perms.canEditFinanzas && (
        <TransactionForm onSubmit={handleSubmitTransaction} />
      )}

      <TransactionHistory
        transactions={allTransactions}
        canEdit={perms.canEditFinanzas}
        onDelete={deleteTransaction}
      />
    </div>
  );
}
