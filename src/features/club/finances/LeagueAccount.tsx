import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Landmark } from "lucide-react";
import type { ClubLeagueAccountData } from "../../../infrastructure/api/types";
import { loadClubLeagueAccount } from "../../../domains/finances/leagueCommands";
import { CHARGE_STATUS_COLOR, CHARGE_STATUS_LABEL, PAYMENT_METHOD_LABEL, monthName } from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { formatShortDate } from "../../../shared/helpers";
import { Badge, C, FormSelect, RADIUS, SecondaryButton, SectionCard } from "../../../shared/ui";
import { usePlatformChrome } from "../../shell/usePlatformChrome";

type Account = NonNullable<ClubLeagueAccountData["account"]>;

/** Cobros que se ven antes de «Ver todos». */
const PREVIEW = 3;

const LABEL: CSSProperties = { fontSize: "0.68rem", fontWeight: 700, color: C.gray500, textTransform: "uppercase" };

/** Lo que el club debe y ha pagado a la liga (arbitraje, inscripciones, multas…). Solo lectura. */
export function LeagueAccount({ clubId }: { clubId: string }) {
  const title = `Cuenta con ${usePlatformChrome(true).brandName}`;
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  // Filtro por la fecha del cobro ("" = todos); el mes solo se elige con un año
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [expanded, setExpanded] = useState(false);
  const ticket = useRef(0);

  useEffect(() => {
    const current = ++ticket.current;
    setError("");
    setYear("");
    setMonth("");
    setExpanded(false);
    loadClubLeagueAccount(clubId)
      .then((next) => {
        if (current === ticket.current) setAccount(next);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudo cargar la cuenta.");
      });
  }, [clubId]);

  // Años y meses que tienen cobros, para no ofrecer periodos vacíos
  const years = useMemo(
    () => [...new Set((account?.charges ?? []).map((charge) => charge.chargedOn.slice(0, 4)))].sort().reverse(),
    [account],
  );
  const activeYear = years.includes(year) ? year : "";
  const months = useMemo(
    () =>
      activeYear
        ? [
            ...new Set(
              (account?.charges ?? [])
                .filter((charge) => charge.chargedOn.startsWith(`${activeYear}-`))
                .map((charge) => charge.chargedOn.slice(5, 7)),
            ),
          ].sort()
        : [],
    [account, activeYear],
  );
  const activeMonth = months.includes(month) ? month : "";
  const prefix = activeYear ? `${activeYear}-${activeMonth ? `${activeMonth}-` : ""}` : "";
  const filtered = useMemo(
    () => (account?.charges ?? []).filter((charge) => charge.chargedOn.startsWith(prefix)),
    [account, prefix],
  );
  const shown = expanded ? filtered : filtered.slice(0, PREVIEW);

  if (error) {
    return (
      <SectionCard title={title} icon={<Landmark size={16} color={C.navy900} />}>
        <p style={{ margin: 0, color: C.red, fontSize: "0.85rem" }}>{error}</p>
      </SectionCard>
    );
  }
  // Sin cargos de la liga no se muestra nada: la liga aún no cobra o el club está al corriente desde siempre
  if (!account || account.charges.length === 0) return null;

  return (
    <SectionCard title={title} icon={<Landmark size={16} color={C.navy900} />}>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
        <div>
          <div style={LABEL}>Debe</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: account.pending > 0 ? C.red : C.green }}>
            {formatCurrency(account.pending)}
          </div>
        </div>
        <div>
          <div style={LABEL}>Pagado</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: C.navy900 }}>{formatCurrency(account.paid)}</div>
        </div>
      </div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: C.gray500 }}>
        Los pagos los registra la administración de la liga. Si pagaste y no aparece, avísale.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.6rem", marginBottom: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
          <span style={LABEL}>Año</span>
          <FormSelect
            value={activeYear}
            onChange={(e) => {
              setYear(e.target.value);
              setMonth("");
              setExpanded(false);
            }}
          >
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </FormSelect>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
          <span style={LABEL}>Mes</span>
          <FormSelect
            value={activeMonth}
            disabled={!activeYear}
            title={activeYear ? undefined : "Elige primero un año"}
            onChange={(e) => {
              setMonth(e.target.value);
              setExpanded(false);
            }}
            style={activeYear ? undefined : { cursor: "not-allowed", color: C.gray500 }}
          >
            <option value="">Todos</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthName(Number(m))}
              </option>
            ))}
          </FormSelect>
        </label>
      </div>
      {filtered.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>No hay cobros en ese periodo.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {shown.map((charge) => (
            <div key={charge.id} style={{ border: `1px solid ${C.gray200}`, borderRadius: RADIUS.md, padding: "0.55rem 0.7rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", overflowWrap: "anywhere" }}>{charge.concept}</div>
                  <div style={{ fontSize: "0.72rem", color: C.gray500 }}>
                    {formatShortDate(charge.chargedOn)}
                    {charge.dueDate ? ` · vence ${formatShortDate(charge.dueDate)}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{formatCurrency(charge.amount)}</div>
                  {charge.status === "PARCIAL" ? (
                    <div style={{ fontSize: "0.7rem", color: C.gray500 }}>Debe {formatCurrency(charge.balance)}</div>
                  ) : null}
                  <Badge color={CHARGE_STATUS_COLOR[charge.status]}>{CHARGE_STATUS_LABEL[charge.status]}</Badge>
                </div>
              </div>
              {charge.payments.length > 0 && (
                <div style={{ fontSize: "0.7rem", color: C.gray500, marginTop: "0.3rem" }}>
                  {charge.payments
                    .map((p) => `${formatShortDate(p.paidOn)} · ${PAYMENT_METHOD_LABEL[p.method]} · ${formatCurrency(p.amount)}`)
                    .join("  |  ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {filtered.length > PREVIEW && (
        <div style={{ marginTop: "0.6rem" }}>
          <SecondaryButton
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem" }}
          >
            {expanded ? "Ver menos" : `Ver todos (${filtered.length})`}
          </SecondaryButton>
        </div>
      )}
    </SectionCard>
  );
}
