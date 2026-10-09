import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, RotateCcw } from "lucide-react";
import { C, RADIUS, SectionCard, FormInput, Badge } from "../../../shared/ui";
import { calculateAge } from "../../../shared/helpers";
import { personName } from "../../../shared/textLimits";
import { DEFAULT_CLUB_LOGO } from "../../../domains/clubs/clubDefaults";
import { findPlayers } from "../../../domains/players/playerCommands";
import type { SearchPlayerHit } from "../../../infrastructure/dataconnect";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_LETTERS = 3;

interface ExistingPlayerSearchProps {
  clubId: string;
  /** El usuario eligió a alguien: el formulario pide dorsal y posición y lo suma (o lo restaura). */
  onPick: (hit: SearchPlayerHit) => void;
}

/** Buscador de jugadores de toda la liga para sumar a la plantilla a uno que ya existe (0010). */
export default function ExistingPlayerSearch({ clubId, onPick }: ExistingPlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchPlayerHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);
  const cache = useRef(new Map<string, SearchPlayerHit[]>());
  const term = query.trim();
  const searching = term.length >= MIN_LETTERS;

  useEffect(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setFailed(false);
    if (!searching) {
      setHits(null);
      setBusy(false);
      return;
    }
    const key = term.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setHits(cached);
      setBusy(false);
      return;
    }
    setBusy(true);
    const timer = window.setTimeout(() => {
      void findPlayers(clubId, term)
        .then((found) => {
          if (ticket !== request.current) return;
          cache.current.set(key, found);
          setHits(found);
        })
        .catch((err: unknown) => {
          console.error(err);
          if (ticket !== request.current) return;
          setHits(null);
          setFailed(true);
        })
        .finally(() => {
          if (ticket === request.current) setBusy(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [clubId, searching, term]);

  const pick = (hit: SearchPlayerHit) => {
    cache.current.clear();
    setQuery("");
    onPick(hit);
  };

  return (
    <SectionCard className="compact-form-card" title="¿Ya juega en otro club?" icon={<Search size={14} />}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: C.gray500, lineHeight: 1.4 }}>
        Busca al jugador por nombre y súmalo con el dorsal y la posición de este equipo: su nombre, foto y
        estadísticas de cada club se conservan. Si no aparece, fíchalo abajo.
      </p>
      <div style={{ position: "relative" }}>
        <Search size={16} color={C.gray400} style={{ position: "absolute", top: "50%", left: "0.75rem", transform: "translateY(-50%)" }} />
        <FormInput
          value={query}
          maxLength={50}
          onChange={(e) => setQuery(personName(e.target.value, 50))}
          placeholder="Nombre del jugador (mínimo 3 letras)"
          aria-label="Buscar jugador en la liga"
          style={{ paddingLeft: "2.25rem", width: "100%" }}
        />
      </div>
      {searching && (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {failed && <p style={{ margin: 0, fontSize: "0.75rem", color: C.red }}>No se pudo buscar. Inténtalo de nuevo.</p>}
          {!failed && busy && hits === null && <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>Buscando…</p>}
          {!failed && !busy && hits?.length === 0 && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: C.gray500 }}>Nadie en la liga se llama así. Fíchalo abajo como jugador nuevo.</p>
          )}
          {hits?.map((hit) => (
            <HitRow key={hit.id} hit={hit} onPick={() => pick(hit)} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function HitRow({ hit, onPick }: { hit: SearchPlayerHit; onPick: () => void }) {
  const restoring = hit.inThisClub === "DELETED";
  const age = hit.birthDate ? calculateAge(hit.birthDate) : "";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.5rem 0.65rem",
        border: `1px solid ${C.gray200}`,
        borderRadius: RADIUS.md,
        backgroundColor: C.white,
      }}
    >
      <img
        src={hit.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(hit.name)}&background=102a43&color=fff&size=80`}
        alt=""
        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, backgroundColor: C.gray100 }}
      />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: C.navy900 }}>{hit.name}</span>
          {age !== "" && <span style={{ fontSize: "0.72rem", color: C.gray500 }}>{age} años</span>}
          {restoring && <Badge color="amber">Estuvo en este club</Badge>}
          {hit.conflict && (
            <Badge color="amber" style={{ textTransform: "none", letterSpacing: 0 }}>
              Juega {hit.conflict.tournamentName} con {hit.conflict.clubName}
            </Badge>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {hit.clubs_on_player.length === 0 && (
            <span style={{ fontSize: "0.7rem", color: C.gray400 }}>Sin club actual</span>
          )}
          {hit.clubs_on_player.map((club) => (
            <span
              key={club.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.7rem",
                color: C.gray600,
                backgroundColor: C.gray100,
                borderRadius: RADIUS.full,
                padding: "0.1rem 0.5rem 0.1rem 0.2rem",
              }}
            >
              <img src={club.logoUrl || DEFAULT_CLUB_LOGO} alt="" style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
              {club.name}
              {!club.active && " (baja)"}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onPick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          border: "none",
          borderRadius: RADIUS.md,
          padding: "0.4rem 0.65rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          cursor: "pointer",
          color: C.white,
          backgroundColor: restoring ? C.amber : C.green,
          flexShrink: 0,
        }}
      >
        {restoring ? <RotateCcw size={14} /> : <UserPlus size={14} />}
        {restoring ? "Restaurar" : "Agregar"}
      </button>
    </div>
  );
}
