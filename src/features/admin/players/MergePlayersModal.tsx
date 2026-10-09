import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { findAdminPlayers, mergePlayers, playerErrorMessage } from "../../../domains/players/playerCommands";
import type { AdminPlayerHit } from "../../../infrastructure/dataconnect";
import { deleteStoredImage, isStoredImageUrl } from "../../../infrastructure/storage/uploadImage";
import ConfirmModal from "../../../shared/ConfirmModal";
import { playerFullName } from "../../../shared/textLimits";
import { C, FormError, FormInput } from "../../../shared/ui";
import { usePlayerProfile } from "../../playerProfile/usePlayerProfile";
import { avatarFallback } from "../../tournament/TournamentScorers";
import Field from "../Field";

/**
 * Une dos fichas de la misma persona (admin_merge_players): se elige el duplicado, se comparan lado a lado y se
 * decide cuál se conserva. Todo lo del otro (clubes, goles, tarjetas, MVP, asistencia, aportes) pasa al que queda y
 * el otro se borra. No se puede deshacer: se confirma escribiendo el nombre del que se conserva.
 */
export default function MergePlayersModal({
  player,
  onClose,
  onMerged,
}: {
  player: { id: string; name: string };
  onClose: () => void;
  /** Id del jugador que quedó. */
  onMerged: (keptId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminPlayerHit[]>([]);
  const [other, setOther] = useState<AdminPlayerHit | null>(null);
  const [keepOther, setKeepOther] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 3) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void findAdminPlayers(term, false)
        .then((rows) => {
          if (!cancelled) setHits(rows.filter((r) => r.id !== player.id));
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, player.id]);

  const kept = keepOther && other ? { id: other.id, name: other.name } : player;
  const dropped = keepOther && other ? player : other;

  const confirm = async () => {
    if (!other || !dropped || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const merged = await mergePlayers(dropped.id, kept.id);
      if (merged.orphanImageUrl && isStoredImageUrl(merged.orphanImageUrl)) {
        void deleteStoredImage(merged.orphanImageUrl).catch(() => undefined);
      }
      onMerged(merged.id);
    } catch (err) {
      console.error(err);
      setError(playerErrorMessage(err, "No se pudieron unir los jugadores."));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      open
      title="Unir jugador duplicado"
      message={
        other
          ? `Todo lo de ${dropped?.name} pasa a ${kept.name} y la ficha de ${dropped?.name} se borra. No se puede deshacer.`
          : "Busca la otra ficha de la misma persona (por ejemplo, la que creó otro club)."
      }
      confirmLabel="Unir jugadores"
      danger
      busy={busy}
      confirmDisabled={!other || confirmText.trim() !== kept.name}
      onCancel={onClose}
      onConfirm={() => void confirm()}
    >
      {!other ? (
        <div className="admin-merge__search">
          <div className="admin-players__search">
            <Search size={14} color={C.gray400} aria-hidden />
            <FormInput
              type="search"
              value={query}
              maxLength={50}
              autoFocus
              onChange={(e) => setQuery(playerFullName(e.target.value))}
              placeholder="Nombre del duplicado"
              aria-label="Buscar el duplicado"
            />
          </div>
          {term.length >= 3 && hits.length === 0 ? <p className="admin-players__hint">Nadie más con ese nombre.</p> : null}
          <ul className="admin-players__list">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button type="button" className="admin-players__item" onClick={() => setOther(hit)}>
                  <img src={hit.imageUrl || avatarFallback(hit.name)} alt="" />
                  <span className="admin-players__who">
                    <strong>{hit.name}</strong>
                    <span>{hit.clubs_on_player.map((c) => c.name).join(", ") || "Sin club"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="admin-merge">
          <div className="admin-merge__sides">
            <MergeSide id={player.id} chosen={!keepOther} onChoose={() => setKeepOther(false)} />
            <MergeSide id={other.id} chosen={keepOther} onChoose={() => setKeepOther(true)} />
          </div>
          <p className="admin-players__hint">
            Se conservan nombre, nacimiento y foto del que elijas; lo que le falte se completa con el otro. Las tarjetas
            mantienen el nombre con que se capturaron para no alterar las multas.
          </p>
          <Field label={`Escribe «${kept.name}» para confirmar`}>
            <FormInput value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </Field>
          <button
            type="button"
            className="admin-player-form__link"
            onClick={() => {
              setOther(null);
              setKeepOther(false);
              setConfirmText("");
            }}
          >
            Elegir otro duplicado
          </button>
          {error ? <FormError>{error}</FormError> : null}
        </div>
      )}
    </ConfirmModal>
  );
}

/** Una de las dos fichas: foto, clubes y totales, y el botón para conservarla. */
function MergeSide({ id, chosen, onChoose }: { id: string; chosen: boolean; onChoose: () => void }) {
  const { view, loading } = usePlayerProfile(id);
  const stat = (key: string) => view?.stats.find((s) => s.key === key)?.value ?? "0";
  return (
    <button type="button" className={`admin-merge__side${chosen ? " is-chosen" : ""}`} onClick={onChoose} aria-pressed={chosen}>
      <span className="admin-merge__keep">{chosen ? "Se conserva" : "Se borra"}</span>
      {!view ? (
        <span className="admin-players__hint">{loading ? "Cargando…" : "No disponible"}</span>
      ) : (
        <>
          <img src={view.imageUrl || avatarFallback(view.name)} alt="" />
          <strong>{view.name}</strong>
          <span>{view.subtitle}</span>
          <span>
            {[...view.currentClubs, ...view.formerClubs].map((c) => c.name).join(", ") || "Sin club"}
          </span>
          <span>
            {stat("matches")} PJ · {stat("goals")} G · {stat("assists")} A · {stat("mvps")} MVP
          </span>
        </>
      )}
    </button>
  );
}
