import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Crown } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import CoverAdminView from "./cover/CoverAdminView";
import AdsAdmin from "./ads/AdsAdmin";
import InboxAdmin from "./inbox/InboxAdmin";
import SuperAdminsAdmin from "./admins/SuperAdminsAdmin";
import PlayersAdmin from "./players/PlayersAdmin";
import CourtsAdmin from "./courts/CourtsAdmin";
import FinancesAdmin from "./finances/FinancesAdmin";
import { useAuth } from "../../domains/auth/AuthContext";
import { C, SectionCard } from "../../shared/ui";

type Tab = "inbox" | "players" | "cover" | "ads" | "admins" | "courts" | "finances";

/**
 * /admin?tab=: lo que no tiene página pública propia. Los clubes se registran y administran en /equipos y en la
 * página de cada club; los torneos y las temporadas, en /torneos.
 */
export default function SuperAdmin() {
  const { user, loading, isSuperAdmin, sqlAdmin } = useAuth();
  const [params] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab =
    tabParam === "players" ||
    tabParam === "cover" ||
    tabParam === "ads" ||
    tabParam === "admins" ||
    tabParam === "courts" ||
    tabParam === "finances"
      ? tabParam
      : "inbox";

  if (loading || (user && sqlAdmin === null)) {
    return (
      <PlatformLayout>
        <p style={{ color: C.gray500 }}>Cargando...</p>
      </PlatformLayout>
    );
  }
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (!isSuperAdmin) {
    return (
      <PlatformLayout maxWidth="560px">
        <SectionCard
          title="Acceso restringido"
          icon={<Crown size={16} color={C.amber} />}
        >
          <p style={{ margin: 0, color: C.gray600, fontSize: "0.9rem" }}>
            Esta sección es solo para super administradores de la plataforma.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              color: C.navy900,
              fontWeight: 700,
            }}
          >
            ← Volver al inicio
          </Link>
        </SectionCard>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="admin-page-head">
        <h1>
          <Crown size={16} color={C.amber} />
          Administración de la plataforma
        </h1>
      </div>

      {tab === "inbox" && <InboxAdmin />}

      {tab === "players" && <PlayersAdmin />}

      {tab === "courts" && <CourtsAdmin />}

      {tab === "finances" && <FinancesAdmin />}

      {tab === "ads" && <AdsAdmin />}

      {tab === "cover" && <CoverAdminView />}

      {tab === "admins" && <SuperAdminsAdmin />}
    </PlatformLayout>
  );
}
