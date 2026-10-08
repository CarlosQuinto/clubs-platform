import { useEffect, useRef, useState } from "react";
import { Landmark } from "lucide-react";
import type { ClubLeagueAccountData } from "../../../infrastructure/api/types";
import { loadClubLeagueAccount } from "../../../domains/finances/leagueCommands";
import { CHARGE_STATUS_COLOR, CHARGE_STATUS_LABEL, PAYMENT_METHOD_LABEL } from "../../../domains/finances/league";
import { formatCurrency } from "../../../domains/finances/helpers";
import { formatShortDate } from "../../../shared/helpers";
import { Badge, C, RADIUS, SectionCard } from "../../../shared/ui";

type Account = NonNullable<ClubLeagueAccountData["account"]>;

/** Lo que el club debe y ha pagado a la liga (arbitraje, inscripciones, multas…). Solo lectura. */
export function LeagueAccount({ clubId }: { clubId: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const ticket = useRef(0);

  useEffect(() => {
    const current = ++ticket.current;
    setError("");
    loadClubLeagueAccount(clubId)
      .then((next) => {
        if (current === ticket.current) setAccount(next);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudo cargar la cuenta con la liga.");
      });
  }, [clubId]);

  if (error) {
    return (
      <SectionCard title="Cuenta con la liga" icon={<Landmark size={16} color={C.navy900} />}>
        <p style={{ margin: 0, color: C.red, fontSize: "0.85rem" }}>{error}</p>
      </SectionCard>
    );
  }
  // Sin cargos de la liga no se muestra nada: la liga aún no cobra o el club está al corriente desde siempre
  if (!account || account.charges.length === 0) return null;

  return (
    <SectionCard title="Cuenta con la liga" icon={<Landmark size={16} color={C.navy900} />}>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.gray500, textTransform: "uppercase" }}>Debe</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: account.pending > 0 ? C.red : C.green }}>
            {formatCurrency(account.pending)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.gray500, textTransform: "uppercase" }}>Pagado</div>
          <div style={{ fontSize: "1.15rem", fontWeight: 900, color: C.navy900 }}>{formatCurrency(account.paid)}</div>
        </div>
      </div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: C.gray500 }}>
        Los pagos los registra la administración de la liga. Si pagaste y no aparece, avísale.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {account.charges.map((charge) => (
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
    </SectionCard>
  );
}
