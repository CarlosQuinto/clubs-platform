import SeasonsAdmin from "../../../components/admin/SeasonsAdmin";
import TournamentsAdmin from "../../../components/admin/TournamentsAdmin";
import { loadCompetition } from "../commands";
import { useAdminQuery } from "../useAdminQuery";
import type { Category, Season } from "../../../lib/types";

export default function CompetitionAdminView() {
  const screen = useAdminQuery(loadCompetition);
  const seasons: Season[] = (screen.data?.seasons ?? []).map((season) => ({
    id: season.id,
    name: season.name,
    startDate: season.startDate || undefined,
    endDate: season.endDate || undefined,
    active: season.active,
  }));
  const categories: Category[] = (screen.data?.categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    order: category.sortOrder,
  }));
  const tournaments = (screen.data?.tournaments ?? []).map((tournament) => ({
    seasonId: tournament.season.id,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {screen.error ? <p style={{ color: "#b42318" }}>{screen.error}</p> : null}
      {screen.loading && !screen.data ? (
        <p style={{ color: "#6b7280" }}>Cargando…</p>
      ) : (
        <>
          <SeasonsAdmin seasons={seasons} tournaments={tournaments} onChange={screen.reload} />
          <TournamentsAdmin
            seasons={seasons}
            categories={categories}
            onChange={screen.reload}
          />
        </>
      )}
    </div>
  );
}
