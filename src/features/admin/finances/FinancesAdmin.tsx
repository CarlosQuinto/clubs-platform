import { useState } from "react";
import { BarChart3, Receipt, Settings2, Wallet } from "lucide-react";
import { useAdminQuery } from "../useAdminQuery";
import { loadFinanceSetup } from "../../../domains/finances/leagueCommands";
import { C, SegmentedControl } from "../../../shared/ui";
import FinanceSummaryPanel from "./FinanceSummaryPanel";
import ChargesPanel from "./ChargesPanel";
import ExpensesPanel from "./ExpensesPanel";
import FeesPanel from "./FeesPanel";

type Section = "summary" | "charges" | "expenses" | "fees";

/** /admin?tab=finances: dinero de la liga (cobros a clubes y terceros, pagos, gastos, pérdidas y tarifas). */
export default function FinancesAdmin() {
  const [section, setSection] = useState<Section>("summary");
  const setup = useAdminQuery(() => loadFinanceSetup());

  if (setup.loading && !setup.data) {
    return <p style={{ color: C.gray500 }}>Cargando finanzas…</p>;
  }
  if (setup.error || !setup.data) {
    return <p style={{ color: C.red }}>{setup.error ?? "No se pudo cargar esta sección."}</p>;
  }
  if (setup.data.seasons.length === 0) {
    return (
      <p style={{ color: C.gray500 }}>
        Crea una temporada («Temporadas» en /torneos) para empezar a registrar cobros y gastos.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <SegmentedControl
        value={section}
        onChange={(value) => setSection(value as Section)}
        options={[
          { value: "summary", label: "Resumen", icon: <BarChart3 size={14} /> },
          { value: "charges", label: "Cobros", icon: <Wallet size={14} /> },
          { value: "expenses", label: "Gastos", icon: <Receipt size={14} /> },
          { value: "fees", label: "Tarifas", icon: <Settings2 size={14} /> },
        ]}
      />
      {section === "summary" && <FinanceSummaryPanel setup={setup.data} />}
      {section === "charges" && <ChargesPanel setup={setup.data} />}
      {section === "expenses" && <ExpensesPanel setup={setup.data} />}
      {section === "fees" && <FeesPanel setup={setup.data} onSaved={setup.reload} />}
    </div>
  );
}
