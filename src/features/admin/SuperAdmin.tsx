import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Crown } from "lucide-react";
import PlatformLayout from "../shell/PlatformLayout";
import ContentAdminView, { type ContentSection } from "./content/ContentAdminView";
import InboxAdmin from "./inbox/InboxAdmin";
import SuperAdminsAdmin from "./admins/SuperAdminsAdmin";
import PlayersAdmin from "./players/PlayersAdmin";
import CourtsAdmin from "./courts/CourtsAdmin";
import FinancesAdmin from "./finances/FinancesAdmin";
import { useAuth } from "../../domains/auth/AuthContext";
import { C, SectionCard } from "../../shared/ui";

type Tab = "inbox" | "players" | "content" | "admins" | "courts" | "finances";

/** Pestaña y sección de /admin a partir de la URL. `tab=cover` y `tab=ads` siguen valiendo como atajos a Contenido. */
export function adminTabFromParams(params: URLSearchParams): { tab: Tab; section: ContentSection } {
  const tab = params.get("tab");
  if (tab === "cover" || tab === "ads") return { tab: "content", section: tab };
  if (tab === "content") {
    return { tab, section: params.get("seccion") === "publicidad" ? "ads" : "cover" };
  }
  return {
    tab:
      tab === "players" || tab === "admins" || tab === "courts" || tab === "finances" ? tab : "inbox",
    section: "cover",
  };
}

/**
 * /admin?tab=: lo que no tiene página pública propia. Los clubes se registran y administran en /equipos y en la
 * página de cada club; los torneos y las temporadas, en /torneos.
 */
export default function SuperAdmin() {
  const { user, loading, isSuperAdmin, sqlAdmin } = useAuth();
  const [params] = useSearchParams();
  const { tab, section } = adminTabFromParams(params);

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

      {tab === "content" && <ContentAdminView section={section} />}

      {tab === "admins" && <SuperAdminsAdmin />}
    </PlatformLayout>
  );
}
