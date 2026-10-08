import { useCallback, useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import type {
  AdminFinanceSetupData,
  LeagueFee,
  LeagueFeeKind,
  LeagueFeePeriod,
  LeagueSplitMode,
} from "../../../infrastructure/api/types";
import { loadFinanceSetup, saveFee } from "../../../domains/finances/leagueCommands";
import {
  AMOUNT_FROM_SOURCE,
  FEE_GROUPS,
  FEE_KIND_HINT,
  FEE_KIND_LABEL,
  defaultFee,
} from "../../../domains/finances/league";
import { isMoneyText, moneyText } from "../../../shared/textLimits";
import { C, FormError, FormInput, FormSelect, PrimaryButton, RADIUS, SectionCard } from "../../../shared/ui";
import Field from "../Field";

/** Qué se cobra y cuánto en cada temporada. */
export default function FeesPanel({ setup, onSaved }: { setup: AdminFinanceSetupData; onSaved: () => void }) {
  const [seasonId, setSeasonId] = useState(setup.seasonId ?? setup.seasons[0]?.id ?? "");
  const [fees, setFees] = useState<LeagueFee[] | null>(seasonId === setup.seasonId ? setup.fees : null);
  const [error, setError] = useState("");
  const ticket = useRef(0);

  const reload = useCallback(() => {
    const current = ++ticket.current;
    setError("");
    loadFinanceSetup(seasonId)
      .then((next) => {
        if (current === ticket.current) setFees(next.fees);
      })
      .catch((err) => {
        console.error(err);
        if (current === ticket.current) setError("No se pudieron cargar las tarifas.");
      });
  }, [seasonId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <SectionCard title="Tarifas" icon={<Settings2 size={16} color={C.amber} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: C.gray500 }}>
          Activa lo que la liga cobra en la temporada y pon su precio. Los cobros se generan desde que activas la tarifa;
          desactivarla no borra lo ya cobrado.
        </p>
        <Field label="Temporada">
          <FormSelect value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
            {setup.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.active ? "" : " (cerrada)"}
              </option>
            ))}
          </FormSelect>
        </Field>
        {error ? <FormError>{error}</FormError> : null}
        {!fees ? (
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.85rem" }}>Cargando…</p>
        ) : (
          FEE_GROUPS.map((group) => (
            <div key={group.title}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: C.navy900, marginBottom: "0.4rem" }}>{group.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {group.kinds.map((kind) => (
                  <FeeRow
                    key={`${seasonId}-${kind}`}
                    seasonId={seasonId}
                    fee={fees.find((f) => f.kind === kind) ?? defaultFee(kind)}
                    onSaved={() => {
                      reload();
                      onSaved();
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

function FeeRow({ seasonId, fee, onSaved }: { seasonId: string; fee: LeagueFee; onSaved: () => void }) {
  const kind: LeagueFeeKind = fee.kind;
  const fromSource = AMOUNT_FROM_SOURCE.includes(kind);
  const [enabled, setEnabled] = useState(fee.enabled);
  const [amount, setAmount] = useState(fee.amount > 0 ? String(fee.amount) : "");
  const [period, setPeriod] = useState<LeagueFeePeriod>(fee.period);
  const [splitMode, setSplitMode] = useState<LeagueSplitMode>(fee.splitMode);
  const [includes, setIncludes] = useState(fee.includesRegistration);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const dirty =
    enabled !== fee.enabled ||
    (amount || "0") !== String(fee.amount) ||
    period !== fee.period ||
    splitMode !== fee.splitMode ||
    includes !== fee.includesRegistration;

  const save = async () => {
    if (savingRef.current) return;
    const value = fromSource ? 0 : amount === "" ? 0 : parseFloat(amount);
    if (!fromSource && (!isMoneyText(amount || "0") || (enabled && !(value > 0)))) {
      setError("Pon el precio para activar este cobro.");
      return;
    }
    setError("");
    savingRef.current = true;
    setSaving(true);
    try {
      await saveFee({ seasonId, kind, enabled, amount: value, period, splitMode, includesRegistration: includes });
      setSaved(true);
      onSaved();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${enabled ? C.amber : C.gray200}`,
        borderRadius: RADIUS.md,
        padding: "0.6rem 0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
      }}
    >
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setSaved(false);
          }}
        />
        {FEE_KIND_LABEL[kind]}
      </label>
      <span style={{ fontSize: "0.72rem", color: C.gray500 }}>{FEE_KIND_HINT[kind]}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end" }}>
        {!fromSource && (
          <Field label="Precio">
            <FormInput
              inputMode="decimal"
              value={amount}
              placeholder="0.00"
              style={{ width: "8rem" }}
              onChange={(e) => {
                setAmount(moneyText(e.target.value));
                setSaved(false);
              }}
            />
          </Field>
        )}
        {kind === "CLUB_PAGE" && (
          <Field label="Cobro">
            <FormSelect value={period} onChange={(e) => { setPeriod(e.target.value as LeagueFeePeriod); setSaved(false); }}>
              <option value="SEASON">Por temporada</option>
              <option value="MONTH">Por mes</option>
            </FormSelect>
          </Field>
        )}
        {(kind === "MATCH_REFEREE" || kind === "MATCH_COURT") && (
          <Field label="Reparto">
            <FormSelect value={splitMode} onChange={(e) => { setSplitMode(e.target.value as LeagueSplitMode); setSaved(false); }}>
              <option value="EACH">Cada club paga el precio</option>
              <option value="HALF">Se reparte entre los dos</option>
            </FormSelect>
          </Field>
        )}
        {(kind === "SEASON_ENROLLMENT" || kind === "TOURNAMENT_ENROLLMENT") && (
          <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.78rem", color: C.gray600, paddingBottom: "0.5rem" }}>
            <input type="checkbox" checked={includes} onChange={(e) => { setIncludes(e.target.checked); setSaved(false); }} />
            Incluye el registro del club
          </label>
        )}
        <PrimaryButton type="button" disabled={!dirty || saving} onClick={() => void save()} style={{ padding: "0.45rem 0.8rem", fontSize: "0.78rem" }}>
          {saving ? "Guardando…" : saved && !dirty ? "Guardado" : "Guardar"}
        </PrimaryButton>
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}
