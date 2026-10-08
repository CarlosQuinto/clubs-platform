import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Receipt, Trash2 } from "lucide-react";
import type { AdminFinanceSetupData, LeagueExpense, LeagueExpenseCategory } from "../../../infrastructure/api/types";
import { loadLeagueExpenses, removeExpense, saveExpense } from "../../../domains/finances/leagueCommands";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL } from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { formatShortDate, isoDate } from "../../../shared/helpers";
import { financeText, isFinanceText, isMoneyText, moneyText } from "../../../shared/textLimits";
import ConfirmModal from "../../../shared/ConfirmModal";
import { Badge, C, FormError, FormInput, FormSelect, PrimaryButton, RADIUS, SectionCard } from "../../../shared/ui";
import Field from "../Field";

/** Gastos de la liga y pérdidas (devoluciones, daños y robos). */
export default function ExpensesPanel({ setup }: { setup: AdminFinanceSetupData }) {
  const [seasonId, setSeasonId] = useState(setup.seasonId ?? "");
  const [expenses, setExpenses] = useState<LeagueExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<LeagueExpenseCategory>("ARBITROS");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState(() => isoDate());
  const [tournamentId, setTournamentId] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<LeagueExpense | null>(null);
  const [removeError, setRemoveError] = useState("");
  const savingRef = useRef(false);
  const ticket = useRef(0);

  const reload = useCallback(() => {
    const current = ++ticket.current;
    setLoading(true);
    setError("");
    loadLeagueExpenses(seasonId || null)
      .then((next) => {
        if (current === ticket.current) setExpenses(next);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudieron cargar los gastos.");
      })
      .finally(() => {
        if (current === ticket.current) setLoading(false);
      });
  }, [seasonId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const tournaments = useMemo(
    () => setup.tournaments.filter((t) => !seasonId || t.seasonId === seasonId),
    [setup.tournaments, seasonId],
  );
  const totals = useMemo(() => {
    const loss = new Set(EXPENSE_CATEGORIES.filter((c) => c.loss).map((c) => c.id));
    return {
      spent: expenses.filter((e) => !loss.has(e.category)).reduce((sum, e) => sum + e.amount, 0),
      lost: expenses.filter((e) => loss.has(e.category)).reduce((sum, e) => sum + e.amount, 0),
    };
  }, [expenses]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    if (!isFinanceText(description)) return setFormError("La descripción lleva de 3 a 30 letras, números o comas.");
    if (!isMoneyText(amount) || !(parseFloat(amount) > 0)) return setFormError("Escribe el monto.");
    if (!spentOn || spentOn > isoDate()) return setFormError("La fecha no puede ser futura.");
    setFormError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await saveExpense({
        id: crypto.randomUUID(),
        category,
        description: description.trim(),
        amount: parseFloat(amount),
        spentOn,
        tournamentId: tournamentId || null,
        seasonId: tournamentId ? null : seasonId || null,
      });
      setDescription("");
      setAmount("");
      reload();
    } catch (err) {
      console.error(err);
      setFormError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setRemoveError("");
    try {
      await removeExpense(removing.id);
      setRemoving(null);
      reload();
    } catch (err) {
      console.error(err);
      setRemoveError("No se pudo borrar.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Gastos y pérdidas" icon={<Receipt size={16} color={C.amber} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        <form
          onSubmit={(e) => void submit(e)}
          style={{ padding: "0.75rem", border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, display: "flex", flexDirection: "column", gap: "0.6rem" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.6rem" }}>
            <Field label="Categoría">
              <FormSelect value={category} onChange={(e) => setCategory(e.target.value as LeagueExpenseCategory)}>
                <optgroup label="Gastos">
                  {EXPENSE_CATEGORIES.filter((c) => !c.loss).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Pérdidas">
                  {EXPENSE_CATEGORIES.filter((c) => c.loss).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              </FormSelect>
            </Field>
            <Field label="Descripción" count={`${description.length}/30`}>
              <FormInput value={description} maxLength={30} placeholder="Ej. Arbitros jornada 5" onChange={(e) => setDescription(financeText(e.target.value))} />
            </Field>
            <Field label="Monto">
              <FormInput inputMode="decimal" value={amount} placeholder="0.00" onChange={(e) => setAmount(moneyText(e.target.value))} />
            </Field>
            <Field label="Fecha">
              <FormInput type="date" value={spentOn} max={isoDate()} onChange={(e) => setSpentOn(e.target.value)} />
            </Field>
            <Field label="Torneo (opcional)">
              <FormSelect value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
                <option value="">Sin torneo</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
          </div>
          <FormError>{formError}</FormError>
          <PrimaryButton type="submit" disabled={saving} style={{ alignSelf: "flex-start" }}>
            {saving ? "Guardando…" : "Registrar"}
          </PrimaryButton>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "flex-end" }}>
          <Field label="Temporada">
            <FormSelect value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
              <option value="">Todas</option>
              {setup.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </Field>
          <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
            {loading ? "Cargando…" : `Gastos ${formatCurrency(totals.spent)} · Pérdidas ${formatCurrency(totals.lost)}`}
          </p>
        </div>
        {error ? <FormError>{error}</FormError> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {expenses.map((expense) => {
            const loss = EXPENSE_CATEGORIES.find((c) => c.id === expense.category)?.loss;
            return (
              <div
                key={expense.id}
                style={{ display: "flex", gap: "0.5rem", alignItems: "center", border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, padding: "0.5rem 0.65rem" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", overflowWrap: "anywhere" }}>{expense.description}</div>
                  <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
                    {formatShortDate(expense.spentOn)}
                    {expense.tournament ? ` · ${expense.tournament.name}` : ""}
                  </div>
                </div>
                <Badge color={loss ? "red" : "gray"}>{EXPENSE_CATEGORY_LABEL[expense.category]}</Badge>
                <span style={{ fontWeight: 800, fontSize: "0.85rem", whiteSpace: "nowrap" }}>{formatCurrency(expense.amount)}</span>
                <button
                  type="button"
                  aria-label="Borrar"
                  onClick={() => {
                    setRemoveError("");
                    setRemoving(expense);
                  }}
                  style={{ border: "none", background: "none", color: C.gray400, cursor: "pointer" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <ConfirmModal
        open={removing !== null}
        title="Borrar registro"
        message={removing ? `Se borra «${removing.description}» (${formatCurrency(removing.amount)}).` : ""}
        confirmLabel="Borrar"
        cancelLabel="Volver"
        danger
        busy={saving}
        confirmHint={removeError || undefined}
        onConfirm={() => void confirmRemove()}
        onCancel={() => {
          if (!saving) setRemoving(null);
        }}
      />
    </SectionCard>
  );
}
