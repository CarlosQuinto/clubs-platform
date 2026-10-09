import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trophy } from "lucide-react";
import SeasonsAdmin from "./SeasonsAdmin";
import CreateTournamentModal from "../../tournament/CreateTournamentModal";
import { loadCompetition } from "../../../domains/competition/competitionCommands";
import { useAdminQuery } from "../useAdminQuery";
import type { Season } from "../../../shared/types";
import { C, PrimaryButton, SectionCard } from "../../../shared/ui";

/** Temporadas y el acceso a crear torneos: el alta es el mismo modal de /torneos, donde también se editan. */
export default function CompetitionAdminView() {
  const screen = useAdminQuery(loadCompetition);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const seasons: Season[] = (screen.data?.seasons ?? []).map((season) => ({
    id: season.id,
    name: season.name,
    startDate: season.startDate || undefined,
    endDate: season.endDate || undefined,
    active: season.active,
  }));
  const tournaments = (screen.data?.tournaments ?? []).map((tournament) => ({
    seasonId: tournament.season.id,
    status: tournament.status,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {screen.error ? <p style={{ color: "#b42318" }}>{screen.error}</p> : null}
      {screen.loading && !screen.data ? (
        <p style={{ color: "#6b7280" }}>Cargando…</p>
      ) : (
        <>
          <SeasonsAdmin seasons={seasons} tournaments={tournaments} onChange={screen.reload} />
          <SectionCard title="Torneos" icon={<Trophy size={16} color={C.amber} />}>
            <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
              Los torneos se crean, editan, cierran y borran desde{" "}
              <Link to="/torneos" style={{ color: C.navy900, fontWeight: 700 }}>
                /torneos
              </Link>
              . Un mismo torneo se puede abrir en varias divisiones: se crea una liga por cada una.
            </p>
            <PrimaryButton
              type="button"
              onClick={() => setCreating(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                width: "100%",
                maxWidth: 280,
              }}
            >
              <Plus size={14} /> Crear torneo
            </PrimaryButton>
          </SectionCard>
        </>
      )}
      {creating ? (
        <CreateTournamentModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            screen.reload();
            navigate("/torneos");
          }}
        />
      ) : null}
    </div>
  );
}
