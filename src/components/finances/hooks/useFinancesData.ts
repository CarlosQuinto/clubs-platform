import { useMemo, useState, useEffect } from "react";
import { addDoc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { useClub } from "../../../context/ClubContext";
import { Transaction, Player } from "../types";

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
) {
  const { col, item } = useClub();
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(col("goals"), (snapshot) => {
      const fetchedGoals = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Goal,
      );
      fetchedGoals.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setGoals(fetchedGoals);
    });
    return () => unsub();
  }, [col]);

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
    await addDoc(col("transactions"), {
      ...data,
      timestamp: new Date().toISOString(),
    });
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm("¿Seguro que deseas eliminar este movimiento?")) {
      await deleteDoc(item("transactions", id));
    }
  };

  // 👇 NUEVO: addGoal ahora recibe la cuota por jugador
  const addGoal = async (
    title: string,
    amount: number,
    quotaPerPlayer: number,
  ) => {
    await addDoc(col("goals"), {
      title,
      amount,
      quotaPerPlayer,
      status: "active",
      contributions: {},
      createdAt: new Date().toISOString(),
    });
  };

  const completeGoal = async (id: string) => {
    if (window.confirm("¿Estás seguro de marcar esta meta como completada?")) {
      await updateDoc(item("goals", id), { status: "completed" });
    }
  };

  const deleteGoal = async (id: string) => {
    if (
      window.confirm(
        "¿Seguro que deseas ELIMINAR esta meta? (Se restará del balance todo lo recaudado para ella)",
      )
    ) {
      await deleteDoc(item("goals", id));
    }
  };

  const updateGoalContribution = async (
    goalId: string,
    playerId: string,
    amount: number,
  ) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    // Calculamos la diferencia para sumarla al histórico del jugador
    const oldAmount = goal.contributions[playerId] || 0;
    const diff = amount - oldAmount;

    // 1. Actualizamos la Meta (Finanzas)
    const newContributions = { ...goal.contributions, [playerId]: amount };
    await updateDoc(item("goals", goalId), {
      contributions: newContributions,
    });

    // 2. Actualizamos el récord histórico del Jugador silenciosamente
    const player = players.find((p) => p.id === playerId);
    if (player) {
      const currentTotal =
        player.lifetime_contributions !== undefined
          ? player.lifetime_contributions
          : player.amount_paid || 0;

      await updateDoc(item("players", playerId), {
        lifetime_contributions: currentTotal + diff,
      });
    }
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
