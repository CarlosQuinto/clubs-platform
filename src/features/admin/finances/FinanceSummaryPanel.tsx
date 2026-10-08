import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import type {
  AdminFinanceSetupData,
  AdminFinanceSummaryData,
  AdminFinanceSummaryVariables,
  LeagueSummaryScope,
} from "../../../infrastructure/api/types";
import { loadFinanceSummary } from "../../../domains/finances/leagueCommands";
import { EXPENSE_CATEGORY_LABEL, FEE_KIND_LABEL, monthName } from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { C, FormSelect, RADIUS, SectionCard, SegmentedControl } from "../../../shared/ui";
import Field from "../Field";

const SCOPES: { value: LeagueSummaryScope; label: string }[] = [
  { value: "TOTAL", label: "Total" },
  { value: "YEAR", label: "Año" },
  { value: "MONTH", label: "Mes" },
  { value: "SEASON", label: "Temporada" },
  { value: "TOURNAMENT", label: "Torneo" },
];

/** Resumen por periodo: total, año, mes, temporada o torneo. */
export default function FinanceSummaryPanel({ setup }: { setup: AdminFinanceSetupData }) {
  const now = new Date();
  const [scope, setScope] = useState<LeagueSummaryScope>("SEASON");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [seasonId, setSeasonId] = useState(setup.seasonId ?? setup.seasons[0]?.id ?? "");
  const seasonTournaments = useMemo(
    () => setup.tournaments.filter((t) => t.seasonId === seasonId),
    [setup.tournaments, seasonId],
  );
  const [tournamentId, setTournamentId] = useState("");
  const [data, setData] = useState<AdminFinanceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ticket = useRef(0);

  const years = useMemo(() => {
    const list = new Set<number>([new Date().getFullYear()]);
    for (const season of setup.seasons) {
      if (season.startDate) list.add(Number(season.startDate.slice(0, 4)));
    }
    return [...list].sort((a, b) => b - a);
  }, [setup.seasons]);

  const activeTournament = tournamentId || seasonTournaments[0]?.id || "";

  useEffect(() => {
    const vars: AdminFinanceSummaryVariables | null =
      scope === "TOTAL"
        ? { scope }
        : scope === "YEAR"
          ? { scope, year }
          : scope === "MONTH"
            ? { scope, year, month }
            : scope === "SEASON"
              ? seasonId ? { scope, seasonId } : null
              : activeTournament ? { scope, tournamentId: activeTournament } : null;
    const current = ++ticket.current;
    if (!vars) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    loadFinanceSummary(vars)
      .then((next) => {
        if (current === ticket.current) setData(next);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudo cargar el resumen.");
      })
      .finally(() => {
        if (current === ticket.current) setLoading(false);
      });
  }, [scope, year, month, seasonId, activeTournament]);

  const summary = data?.summary;
  const seriesTitle =
    scope === "TOTAL" ? "Año por año" : scope === "TOURNAMENT" ? "Por jornada" : scope === "MONTH" ? "" : "Mes a mes";

  return (
    <SectionCard title="Resumen financiero" icon={<BarChart3 size={16} color={C.amber} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <SegmentedControl options={SCOPES} value={scope} onChange={(value) => setScope(value as LeagueSummaryScope)} />
        <div className="admin-grid-2">
          {(scope === "YEAR" || scope === "MONTH") && (
            <Field label="Año">
              <FormSelect value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </FormSelect>
            </Field>
          )}
          {scope === "MONTH" && (
            <Field label="Mes">
              <FormSelect value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {monthName(m)}
                  </option>
                ))}
              </FormSelect>
            </Field>
          )}
          {(scope === "SEASON" || scope === "TOURNAMENT") && (
            <Field label="Temporada">
              <FormSelect
                value={seasonId}
                onChange={(e) => {
                  setSeasonId(e.target.value);
                  setTournamentId("");
                }}
              >
                {setup.seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                    {season.active ? "" : " (cerrada)"}
                  </option>
                ))}
              </FormSelect>
            </Field>
          )}
          {scope === "TOURNAMENT" && (
            <Field label="Torneo">
              <FormSelect value={activeTournament} onChange={(e) => setTournamentId(e.target.value)}>
                {seasonTournaments.length === 0 && <option value="">Sin torneos</option>}
                {seasonTournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
          )}
        </div>

        {error ? <p style={{ color: C.red, margin: 0, fontSize: "0.85rem" }}>{error}</p> : null}
        {!summary ? (
          <p style={{ color: C.gray500, margin: 0, fontSize: "0.85rem" }}>
            {loading ? "Calculando…" : scope === "TOURNAMENT" ? "Esta temporada no tiene torneos." : "Sin datos."}
          </p>
        ) : (
          <div style={{ opacity: loading ? 0.6 : 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
              <Stat label="Cobrado" value={summary.collected} tone="green" hint="Pagos recibidos en el periodo" />
              <Stat label="Gastos" value={summary.expenses} tone="red" />
              <Stat
                label="Pérdidas"
                value={summary.losses}
                tone="red"
                hint={`Condonado ${formatCurrency(summary.condoned)} · Devoluciones ${formatCurrency(summary.refunds)} · Daños ${formatCurrency(summary.damages)}`}
              />
              <Stat
                label="Resultado"
                value={summary.result}
                tone={summary.result >= 0 ? "green" : "red"}
                hint="Cobrado − gastos − devoluciones − daños"
              />
              <Stat label="Generado" value={summary.generated} hint="Cargos del periodo" />
              <Stat label="Por cobrar" value={summary.pending} tone="amber" hint="De los cargos del periodo" />
            </div>

            {(data?.byKind?.length ?? 0) > 0 && (
              <Table
                title="Por concepto"
                head={["Concepto", "Generado", "Cobrado", "Pendiente"]}
                rows={(data?.byKind ?? []).map((row) => [
                  FEE_KIND_LABEL[row.kind] ?? row.kind,
                  formatCurrency(row.generated),
                  formatCurrency(row.collected),
                  formatCurrency(row.pending),
                ])}
              />
            )}
            {(data?.byCategory?.length ?? 0) > 0 && (
              <Table
                title="Gastos y pérdidas por categoría"
                head={["Categoría", "Monto"]}
                rows={(data?.byCategory ?? []).map((row) => [
                  EXPENSE_CATEGORY_LABEL[row.category] ?? row.category,
                  formatCurrency(row.amount),
                ])}
              />
            )}
            {seriesTitle && (data?.series?.length ?? 0) > 0 && (
              <Table
                title={seriesTitle}
                head={["Periodo", "Generado", "Cobrado", "Gastos", "Pérdidas"]}
                rows={(data?.series ?? []).map((row) => [
                  row.label,
                  formatCurrency(row.generated),
                  formatCurrency(row.collected),
                  formatCurrency(row.expenses),
                  formatCurrency(row.losses),
                ])}
              />
            )}
            <Table
              title="Clubes con adeudo (hoy)"
              head={["Club", "Cargos", "Debe"]}
              empty="Ningún club debe dinero a la liga."
              rows={(data?.debtors ?? []).map((row) => [row.club.name, String(row.charges), formatCurrency(row.pending)])}
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: "green" | "red" | "amber" }) {
  const color = tone === "green" ? C.green : tone === "red" ? C.red : tone === "amber" ? C.amber : C.navy900;
  return (
    <div style={{ border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, padding: "0.65rem 0.75rem", minWidth: 0 }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.05rem", fontWeight: 900, color, overflowWrap: "anywhere" }}>{formatCurrency(value)}</div>
      {hint ? <div style={{ fontSize: "0.68rem", color: C.gray400, marginTop: "0.15rem" }}>{hint}</div> : null}
    </div>
  );
}

function Table({ title, head, rows, empty }: { title: string; head: string[]; rows: string[][]; empty?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: C.navy900, marginBottom: "0.35rem" }}>{title}</div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>{empty ?? "Sin datos."}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr>
                {head.map((cell, i) => (
                  <th
                    key={cell}
                    style={{
                      textAlign: i === 0 ? "left" : "right",
                      padding: "0.35rem 0.5rem",
                      color: C.gray500,
                      fontWeight: 700,
                      borderBottom: `1px solid ${C.gray200}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      style={{
                        textAlign: i === 0 ? "left" : "right",
                        padding: "0.35rem 0.5rem",
                        borderBottom: `1px solid ${C.gray100}`,
                        whiteSpace: i === 0 ? "normal" : "nowrap",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
