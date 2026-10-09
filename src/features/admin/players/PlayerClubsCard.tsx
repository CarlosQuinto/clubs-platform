import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, RotateCcw, Shield, Trash2 } from "lucide-react";
import {
  addExistingPlayer,
  playerErrorMessage,
  removeFromClub,
  tournamentConflictMessage,
  updateMembership,
  type AdminPlayer,
} from "../../../domains/players/playerCommands";
import { clubPlayerFieldsError, PLAYER_POSITIONS } from "../../../domains/players/playerRules";
import type { AdminPlayerMembership } from "../../../infrastructure/dataconnect";
import ConfirmModal from "../../../shared/ConfirmModal";
import { isShirtNumber, playerVariant, shirtNumber } from "../../../shared/textLimits";
import { Badge, C, FormError, FormInput, FormSelect, PrimaryButton, SecondaryButton, SectionCard } from "../../../shared/ui";
import Field from "../Field";

/** Botón chico de las filas (los de ui.tsx traen su padding en línea). */
const SMALL = { padding: "0.4rem 0.7rem", fontSize: "0.75rem" };

type Draft =
  | { mode: "edit"; membership: AdminPlayerMembership; number: string; position: string; variant: string; active: boolean }
  | { mode: "add"; clubId: string; number: string; position: string; variant: string };

/**
 * Fichas del jugador en cada club: editar dorsal, posición, variante y el activo; quitarlo de una plantilla
 * (borrado lógico: sus números ahí se conservan), restaurarlo o sumarlo a otro club. Usa las mismas funciones que la
 * plantilla del club (save_player, delete_player, add_existing_player): el superadmin tiene rol en todos.
 */
export default function PlayerClubsCard({
  player,
  clubs,
  onChanged,
}: {
  player: AdminPlayer;
  /** Clubes vivos de la liga, para sumarlo. */
  clubs: { id: string; name: string }[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<AdminPlayerMembership | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sending = useRef(false);

  const memberships = player.clubPlayers_on_player;
  const liveClubIds = new Set(memberships.filter((m) => !m.deletedAt).map((m) => m.club.id));
  const addable = clubs.filter((c) => !liveClubIds.has(c.id));

  const run = async (task: () => Promise<string | null>) => {
    if (sending.current) return false;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      setNotice((await task()) ?? "");
      onChanged();
      return true;
    } catch (err) {
      console.error(err);
      setError(playerErrorMessage(err, "No se pudo guardar el cambio."));
      return false;
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const problem = clubPlayerFieldsError(draft.number, draft.variant) || (draft.mode === "add" && !draft.clubId ? "Elige un club." : "");
    if (problem) {
      setError(problem);
      return;
    }
    const ok = await run(async () => {
      const conflict =
        draft.mode === "edit"
          ? await updateMembership(player, draft.membership, {
              shirtNumber: draft.number,
              position: draft.position,
              variant: draft.variant.trim(),
              active: draft.active,
            })
          : await addExistingPlayer({
              clubId: draft.clubId,
              playerId: player.id,
              shirtNumber: draft.number,
              position: draft.position,
              variant: draft.variant.trim(),
            });
      return conflict ? tournamentConflictMessage(conflict) : null;
    });
    if (ok) setDraft(null);
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const ok = await run(async () => {
      await removeFromClub(removing.club.id, player.id);
      return null;
    });
    if (ok) setRemoving(null);
  };

  const startAdd = (membership?: AdminPlayerMembership) => {
    setError("");
    setDraft({
      mode: "add",
      clubId: membership?.club.id ?? "",
      number: membership && isShirtNumber(membership.shirtNumber) ? membership.shirtNumber : "",
      position: membership?.position ?? "Delantero",
      variant: membership?.variant ?? "",
    });
  };

  return (
    <SectionCard className="compact-form-card" title="Clubes y fichas" icon={<Shield size={14} color={C.amber} />}>
      {notice ? (
        <div className="admin-players__notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      ) : null}
      {memberships.length === 0 ? (
        <p className="admin-players__hint">Jugador libre: no está en ninguna plantilla.</p>
      ) : (
        <ul className="admin-players__memberships">
          {memberships.map((m) => {
            const state = m.club.deleted ? "Club borrado" : m.deletedAt ? "Eliminado" : m.active ? "Activo" : "De baja";
            const color = m.club.deleted || m.deletedAt ? "gray" : m.active ? "green" : "amber";
            const role = m.isCoach
              ? "Cuerpo técnico"
              : [isShirtNumber(m.shirtNumber) ? `#${m.shirtNumber}` : null, m.position, m.variant || null].filter(Boolean).join(" · ");
            return (
              <li key={m.club.id} className="admin-club-item">
                <div className="admin-club-item__title">
                  <span>
                    {m.club.deleted ? m.club.name : <Link to={`/${m.club.slug}`}>{m.club.name}</Link>}
                  </span>
                  <Badge color={color}>{state}</Badge>
                </div>
                <div className="admin-club-item__meta">{role}</div>
                {m.club.deleted ? null : (
                  <div className="admin-players__row-actions">
                    {m.deletedAt ? (
                      <SecondaryButton type="button" onClick={() => startAdd(m)} disabled={busy} style={SMALL}>
                        <RotateCcw size={13} /> Restaurar
                      </SecondaryButton>
                    ) : (
                      <>
                        <SecondaryButton
                          type="button"
                          disabled={busy}
                          style={SMALL}
                          onClick={() => {
                            setError("");
                            setDraft({
                              mode: "edit",
                              membership: m,
                              number: isShirtNumber(m.shirtNumber) ? m.shirtNumber : "",
                              position: m.position,
                              variant: m.variant,
                              active: m.active,
                            });
                          }}
                        >
                          <Pencil size={13} /> Editar
                        </SecondaryButton>
                        <SecondaryButton type="button" disabled={busy} onClick={() => setRemoving(m)} style={{ ...SMALL, color: C.red }}>
                          <Trash2 size={13} /> Quitar
                        </SecondaryButton>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {draft ? (
        <form onSubmit={save} className="compact-form admin-player-form admin-players__draft">
          <strong>
            {draft.mode === "edit"
              ? `Ficha en ${draft.membership.club.name}`
              : memberships.some((m) => m.club.id === draft.clubId && m.deletedAt)
                ? "Restaurar en la plantilla"
                : "Sumar a un club"}
          </strong>
          {draft.mode === "add" ? (
            <Field label="Club">
              <FormSelect value={draft.clubId} onChange={(e) => setDraft({ ...draft, clubId: e.target.value })}>
                <option value="">Elige un club</option>
                {addable.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </FormSelect>
            </Field>
          ) : null}
          <div className="admin-player-form__grid admin-player-form__grid--3">
            <Field label="Dorsal">
              <FormInput
                inputMode="numeric"
                required
                value={draft.number}
                maxLength={2}
                onChange={(e) => setDraft({ ...draft, number: shirtNumber(e.target.value) })}
                placeholder="1-99"
              />
            </Field>
            <Field label="Posición">
              <FormSelect value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })}>
                {PLAYER_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </FormSelect>
            </Field>
            <Field label="Variante">
              <FormInput
                value={draft.variant}
                maxLength={30}
                onChange={(e) => setDraft({ ...draft, variant: playerVariant(e.target.value) })}
                placeholder="Ej. Extremo"
              />
            </Field>
          </div>
          {draft.mode === "edit" ? (
            <label className="admin-players__check">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Activo en este club (sin marcar = de baja)
            </label>
          ) : null}
          {error ? <FormError>{error}</FormError> : null}
          <div className="admin-player-form__actions">
            <SecondaryButton type="button" onClick={() => setDraft(null)} disabled={busy}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <>
          {error ? <FormError>{error}</FormError> : null}
          {addable.length > 0 ? (
            <SecondaryButton type="button" className="admin-players__add" onClick={() => startAdd()} disabled={busy} style={SMALL}>
              <Plus size={13} /> Sumar a un club
            </SecondaryButton>
          ) : null}
        </>
      )}

      <ConfirmModal
        open={Boolean(removing)}
        title={`Quitar de ${removing?.club.name ?? ""}`}
        message={`${player.name} sale de la plantilla de ${removing?.club.name ?? ""}. Sus goles, tarjetas y partidos con ese club se conservan, y sigue en sus otros clubes. Se puede restaurar después.`}
        confirmLabel="Quitar"
        danger
        busy={busy}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
      />
    </SectionCard>
  );
}
