import { useMemo, useState, useEffect } from "react";
import {
  addTransaction as insertTransaction,
  dataConnect,
  deleteFinancialGoal as removeFinancialGoal,
  deleteTransaction as removeTransaction,
  saveFinancialGoal,
  setFinancialGoalStatus,
  setGoalContribution,
} from "../../../infrastructure/dataconnect";
import { requestClubRefresh } from "../useClubScreen";
import { savedRow } from "../../../shared/saved";
import { useClub } from "../../../domains/clubs/ClubContext";
import { Transaction, Player } from "../../../domains/finances/types";

export interface Goal {
  id: string;
  title: string;
  amount: number;
  quotaPerPlayer?: number; // 👈 NUEVO: Cuota sugerida por jugador
  status: "active" | "completed";
  contributions: Record<string, number>;
  createdAt: string;
}

export function useFinancesData(
  transactions: Transaction[],
  players: Player[],
  date: string,
  externalGoals?: Goal[],
) {
  const { clubId } = useClub();
  const [goals, setGoals] = useState<Goal[]>(externalGoals || []);

  useEffect(() => {
    setGoals(externalGoals || []);
  }, [externalGoals]);

  const activePlayers = useMemo(
    () => players.filter((p) => p.active !== false),
    [players],
  );

  const allTransactions = useMemo(() => {
    const legacyPayments = activePlayers
      .filter((p) => (p.amount_paid || 0) > 0)
      .map(
        (p): Transaction => ({
          id: `legacy-${p.id}`,
          type: "ingreso",
          description: `Aportación Anterior: ${p.name}`,
          category: "Aportaciones",
          amount: p.amount_paid!,
          date: p.payment_timestamp ? p.payment_timestamp.split("T")[0] : date,
        }),
      );

    const goalPayments: Transaction[] = [];
    goals.forEach((goal) => {
      Object.entries(goal.contributions || {}).forEach(([playerId, amount]) => {
        if (amount > 0) {
          const player = players.find((p) => p.id === playerId);
          goalPayments.push({
            id: `goal-${goal.id}-pago-${playerId}`,
            type: "ingreso",
            description: `Aportación a ${goal.title}: ${player?.name || "Baja"}`,
            category: "Metas",
            amount,
            date: goal.createdAt.split("T")[0],
          });
        }
      });
    });

    return [...transactions, ...legacyPayments, ...goalPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions, activePlayers, goals, players, date]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    return allTransactions.reduce(
      (acc, curr) => {
        if (curr.type === "ingreso") {
          acc.totalIncome += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.totalExpense += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 },
    );
  }, [allTransactions]);

  const addTransaction = async (data: Omit<Transaction, "id">) => {
    const saved = await insertTransaction(dataConnect, {
      id: crypto.randomUUID(),
      clubId,
      type: data.type === "ingreso" ? "INGRESO" : "GASTO",
      description: data.description,
      category: data.category,
      amount: data.amount,
      txnDate: data.date,
    });
    savedRow(saved.data.transaction);
    requestClubRefresh();
  };

  const deleteTransaction = async (id: string) => {
    if (id.startsWith("legacy-") || id.startsWith("goal-")) return;
    if (window.confirm("¿Seguro que deseas eliminar este movimiento?")) {
      const removed = await removeTransaction(dataConnect, { id, clubId });
      savedRow(removed.data.deleted);
      requestClubRefresh();
    }
  };

  // 👇 NUEVO: addGoal ahora recibe la cuota por jugador
  const addGoal = async (
    title: string,
    amount: number,
    quotaPerPlayer: number,
  ) => {
    const saved = await saveFinancialGoal(dataConnect, {
      id: crypto.randomUUID(),
      clubId,
      title,
      amount,
      quotaPerPlayer,
    });
    savedRow(saved.data.goal);
    requestClubRefresh();
  };

  const completeGoal = async (id: string) => {
    if (window.confirm("¿Estás seguro de marcar esta meta como completada?")) {
      const saved = await setFinancialGoalStatus(dataConnect, { id, clubId, status: "COMPLETED" });
      savedRow(saved.data.goal);
      requestClubRefresh();
    }
  };

  const deleteGoal = async (id: string) => {
    if (
      window.confirm(
        "¿Seguro que deseas ELIMINAR esta meta? (Se restará del balance todo lo recaudado para ella)",
      )
    ) {
      const removed = await removeFinancialGoal(dataConnect, { id, clubId });
      savedRow(removed.data.deleted);
      requestClubRefresh();
    }
  };

  const updateGoalContribution = async (
    goalId: string,
    playerId: string,
    amount: number,
  ) => {
    const saved = await setGoalContribution(dataConnect, { goalId, playerId, amount });
    savedRow(saved.data.contribution);
    requestClubRefresh();
  };

  return {
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
  };
}
