import { SummaryCards } from "./SummaryCards";
import { GoalsList } from "./GoalsList";
import { TransactionForm } from "./TransactionForm";
import { TransactionHistory } from "./TransactionHistory";
import { FinancesProps } from "../../../domains/finances/types";
import { useFinancesPage } from "./useFinancesPage";
import { LeagueAccount } from "./LeagueAccount";
import { useClub } from "../../../domains/clubs/ClubContext";

export default function Finances(props: FinancesProps) {
  const {
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
  } = useFinancesPage(props);
  const { clubId } = useClub();

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

      {perms.canEditFinanzas && <LeagueAccount clubId={clubId} />}

      <GoalsList
        goals={goals}
        players={activePlayers}
        canEdit={perms.canEditFinanzas}
        onAddGoal={handleAddGoal}
        onCompleteGoal={(id) => {
          void completeGoal(id).catch((err: unknown) => {
            console.error(err);
            alert("No se pudo guardar.");
          });
        }}
        onDeleteGoal={(id) => {
          void deleteGoal(id).catch((err: unknown) => {
            console.error(err);
            alert("No se pudo guardar.");
          });
        }}
        onUpdateContribution={handleUpdateContribution}
      />

      {perms.canEditFinanzas && (
        <TransactionForm onSubmit={handleSubmitTransaction} />
      )}

      <TransactionHistory
        transactions={allTransactions}
        canEdit={perms.canEditFinanzas}
        onDelete={(id) => {
          void deleteTransaction(id).catch((err: unknown) => {
            console.error(err);
            alert("No se pudo guardar.");
          });
        }}
      />
    </div>
  );
}
