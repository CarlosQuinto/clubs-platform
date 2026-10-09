import { useEffect, useRef, useState } from "react";
import { ChevronRight, Search, Users } from "lucide-react";
import { findAdminPlayers } from "../../../domains/players/playerCommands";
import type { AdminPlayerHit } from "../../../infrastructure/dataconnect";
import { calculateAge } from "../../../shared/helpers";
import { playerFullName } from "../../../shared/textLimits";
import { Badge, C, FormInput, SectionCard, SegmentedControl } from "../../../shared/ui";
import { avatarFallback } from "../../tournament/TournamentScorers";

/**
 * Buscador de jugadores de toda la liga (admin_search_players). Sin texto muestra los creados más recientemente;
 * «Sin club» deja solo a los jugadores libres. El servidor devuelve hasta 30.
 */
export default function PlayerSearchPanel({
  onOpen,
  refreshKey,
}: {
  onOpen: (id: string) => void;
  /** Cambia tras crear o unir jugadores para volver a buscar. */
  refreshKey: number;
}) {
  const [query, setQuery] = useState("");
  const [free, setFree] = useState(false);
  const [hits, setHits] = useState<AdminPlayerHit[] | null>(null);
  const [error, setError] = useState("");
  const request = useRef(0);
  const term = query.trim();
  const ready = term.length === 0 || term.length >= 3;

  useEffect(() => {
    if (!ready) return;
    const ticket = request.current + 1;
    request.current = ticket;
    const timer = window.setTimeout(
      () => {
        void findAdminPlayers(term, free)
          .then((rows) => {
            if (ticket !== request.current) return;
            setHits(rows);
            setError("");
          })
          .catch((err: unknown) => {
            console.error(err);
            if (ticket !== request.current) return;
            setError("No se pudo buscar. Intenta de nuevo.");
          });
      },
      term ? 400 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [ready, term, free, refreshKey]);

  return (
    <SectionCard className="compact-form-card" title="Jugadores" icon={<Users size={14} color={C.amber} />}>
      <div className="admin-players__filters">
        <div className="admin-players__search">
          <Search size={14} color={C.gray400} aria-hidden />
          <FormInput
            type="search"
            value={query}
            maxLength={50}
            onChange={(e) => setQuery(playerFullName(e.target.value))}
            placeholder="Buscar por nombre"
            aria-label="Buscar jugador por nombre"
          />
        </div>
        <SegmentedControl
          options={[
            { label: "Todos", value: "all" },
            { label: "Sin club", value: "free" },
          ]}
          value={free ? "free" : "all"}
          onChange={(v) => setFree(v === "free")}
        />
      </div>
      {!ready || term ? (
        <p className="admin-players__hint">
          {!ready ? "Escribe al menos 3 letras." : "Coincidencias sin importar acentos (hasta 30)."}
        </p>
      ) : null}
      {error ? <p className="admin-players__error">{error}</p> : null}
      {hits === null && !error ? (
        <p className="admin-players__hint">Cargando…</p>
      ) : hits && hits.length === 0 ? (
        <p className="admin-players__hint">{term ? `Nadie coincide con «${term}».` : "Todavía no hay jugadores."}</p>
      ) : (
        <ul className="admin-players__list">
          {(hits ?? []).map((hit) => {
            const age = hit.birthDate ? calculateAge(hit.birthDate) : null;
            return (
              <li key={hit.id}>
                <button type="button" className="admin-players__item" onClick={() => onOpen(hit.id)}>
                  <img
                    src={hit.imageUrl || avatarFallback(hit.name)}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = avatarFallback(hit.name);
                    }}
                  />
                  <span className="admin-players__who">
                    <strong>{hit.name}</strong>
                    <span>
                      {[age != null ? `${age} años` : null, hit.clubs_on_player.map((c) => c.name).join(", ") || null]
                        .filter(Boolean)
                        .join(" · ") || "Sin datos"}
                    </span>
                  </span>
                  {hit.clubs_on_player.length === 0 ? <Badge color="amber">Sin club</Badge> : null}
                  <ChevronRight size={16} color={C.gray400} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
