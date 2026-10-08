import { useCallback, useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import type {
  AdminFinanceSetupData,
  LeagueFee,
  LeagueFeeKind,
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
    setFees(null);
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
          Pon el precio de cada cobro una sola vez por temporada. Desde ahí todo se registra solo, también lo que ya
          pasó en la temporada. Apagar un cobro no borra lo ya registrado.
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
  const [splitMode, setSplitMode] = useState<LeagueSplitMode>(fee.splitMode);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const dirty =
    enabled !== fee.enabled ||
    // El monto no cuenta en los cobros que toman su precio de la cancha o del anuncio
    (!fromSource && parseFloat(amount || "0") !== fee.amount) ||
    splitMode !== fee.splitMode;

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
      const created = await saveFee({ seasonId, kind, enabled, amount: value, splitMode });
      setSaved(
        created === 1
          ? "Guardado. Se registró 1 cobro de lo que ya pasó."
          : created > 1
            ? `Guardado. Se registraron ${created} cobros de lo que ya pasó.`
            : "Guardado.",
      );
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
            setSaved("");
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
                setSaved("");
              }}
            />
          </Field>
        )}
        {(kind === "MATCH_REFEREE" || kind === "MATCH_COURT") && (
          <Field label="Reparto">
            <FormSelect value={splitMode} onChange={(e) => { setSplitMode(e.target.value as LeagueSplitMode); setSaved(""); }}>
              <option value="EACH">{kind === "MATCH_COURT" ? "Cada club paga el costo completo" : "Cada club paga el precio"}</option>
              <option value="HALF">Se reparte entre los dos</option>
            </FormSelect>
          </Field>
        )}
        <PrimaryButton type="button" disabled={!dirty || saving} onClick={() => void save()} style={{ padding: "0.45rem 0.8rem", fontSize: "0.78rem" }}>
          {saving ? "Guardando…" : "Guardar"}
        </PrimaryButton>
      </div>
      {saved && !dirty ? (
        <span style={{ fontSize: "0.75rem", color: C.green }} role="status">
          {saved}
        </span>
      ) : null}
      <FormError>{error}</FormError>
    </div>
  );
}
