import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, GitMerge, Pencil, UserPlus } from "lucide-react";
import { loadClubs } from "../../../domains/clubs/clubCommands";
import { loadAdminPlayer } from "../../../domains/players/playerCommands";
import { playerPath } from "../../../shared/paths";
import { C, PrimaryButton, SecondaryButton } from "../../../shared/ui";
import { PlayerProfileBody } from "../../playerProfile/PlayerProfileView";
import { usePlayerProfile } from "../../playerProfile/usePlayerProfile";
import { useAdminQuery } from "../useAdminQuery";
import AdminPlayerForm from "./AdminPlayerForm";
import MergePlayersModal from "./MergePlayersModal";
import PlayerClubsCard from "./PlayerClubsCard";
import PlayerSearchPanel from "./PlayerSearchPanel";

/**
 * /admin?tab=players: buscar a cualquier jugador de la liga, darlo de alta (con club o libre) y, con
 * &jugador=<id>, ver su ficha con las acciones del superadmin: editar sus datos, sus fichas por club y unir duplicados.
 */
export default function PlayersAdmin() {
  const [params, setParams] = useSearchParams();
  const playerId = params.get("jugador") ?? "";
  const clubsQuery = useAdminQuery(loadClubs);
  const clubs = (clubsQuery.data?.clubs ?? []).map((c) => ({ id: c.id, name: c.name }));
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const open = useCallback(
    (id: string) => {
      setCreating(false);
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("jugador", id);
        else next.delete("jugador");
        return next;
      });
      window.scrollTo({ top: 0 });
    },
    [setParams],
  );

  if (playerId) {
    return <PlayerAdminDetail key={playerId} id={playerId} clubs={clubs} onOpen={open} onListChanged={() => setRefreshKey((k) => k + 1)} />;
  }

  return (
    <div className="admin-players">
      {creating ? (
        <AdminPlayerForm
          initial={null}
          clubs={clubs}
          onCancel={() => setCreating(false)}
          onSaved={(id) => {
            setRefreshKey((k) => k + 1);
            open(id);
          }}
          onOpenPlayer={open}
        />
      ) : (
        <div className="admin-players__toolbar">
          <PrimaryButton type="button" onClick={() => setCreating(true)}>
            <UserPlus size={14} /> Nuevo jugador
          </PrimaryButton>
        </div>
      )}
      <PlayerSearchPanel onOpen={open} refreshKey={refreshKey} />
    </div>
  );
}

/** Botón chico de las acciones (los de ui.tsx traen su padding en línea). */
const SMALL = { padding: "0.4rem 0.7rem", fontSize: "0.75rem" };

function PlayerAdminDetail({
  id,
  clubs,
  onOpen,
  onListChanged,
}: {
  id: string;
  clubs: { id: string; name: string }[];
  onOpen: (id: string) => void;
  onListChanged: () => void;
}) {
  const admin = useAdminQuery(() => loadAdminPlayer(id));
  const profile = usePlayerProfile(id);
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const player = admin.data;

  const reload = () => {
    admin.reload();
    profile.onRefresh();
    onListChanged();
  };

  const back = (
    <button type="button" className="tour-detail__back player-profile__back" onClick={() => onOpen("")}>
      <ArrowLeft size={16} aria-hidden />
      Jugadores
    </button>
  );

  if (admin.loading && !player) {
    return (
      <div className="admin-players">
        {back}
        <p style={{ color: C.gray500 }}>Cargando jugador…</p>
      </div>
    );
  }
  if (!player) {
    return (
      <div className="admin-players">
        {back}
        <p style={{ color: C.gray500 }}>
          {admin.error ?? "Este jugador ya no existe (puede que se haya unido a otro)."}{" "}
          {admin.error ? (
            <button type="button" className="admin-player-form__link" onClick={admin.reload}>
              Reintentar
            </button>
          ) : null}
        </p>
      </div>
    );
  }

  const actions = (
    <>
      <SecondaryButton type="button" onClick={() => setEditing(true)} className="admin-players__action" style={SMALL}>
        <Pencil size={13} /> Editar datos
      </SecondaryButton>
      <SecondaryButton type="button" onClick={() => setMerging(true)} className="admin-players__action" style={SMALL}>
        <GitMerge size={13} /> Unir duplicado
      </SecondaryButton>
      <Link to={playerPath(player.id)} className="admin-club-item__open admin-players__action">
        Ficha pública <ExternalLink size={12} />
      </Link>
    </>
  );

  return (
    <div className="admin-players tour-detail player-profile">
      {back}
      {editing ? (
        <AdminPlayerForm
          initial={{ id: player.id, name: player.name, birthDate: player.birthDate ?? "", imageUrl: player.imageUrl }}
          clubs={[]}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      ) : null}

      {profile.view ? (
        <PlayerProfileBody
          view={profile.view}
          actions={actions}
          clubs={<PlayerClubsCard player={player} clubs={clubs} onChanged={reload} />}
        />
      ) : (
        <p style={{ color: C.gray500 }}>
          {profile.error ?? "Cargando ficha…"}
        </p>
      )}

      {merging ? (
        <MergePlayersModal
          player={{ id: player.id, name: player.name }}
          onClose={() => setMerging(false)}
          onMerged={(keptId) => {
            setMerging(false);
            onListChanged();
            if (keptId === player.id) reload();
            else onOpen(keptId);
          }}
        />
      ) : null}
    </div>
  );
}
