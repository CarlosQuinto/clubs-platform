import HeroAdmin from "../../../components/admin/HeroAdmin";
import type { PlatformConfig } from "../../../context/AuthContext";
import { loadCover } from "../commands";
import { useAdminQuery } from "../useAdminQuery";

export default function CoverAdminView() {
  const screen = useAdminQuery(loadCover);
  const settings = screen.data?.platformSettings;
  const config: PlatformConfig | null = settings
    ? {
        superAdmins: [],
        name: settings.name,
        motto: settings.motto,
        headline: settings.headline,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl || "",
        heroImages: (screen.data?.platformHeroImages ?? []).map((image) => image.url),
        social: {
          instagram: settings.instagram || "",
          facebook: settings.facebook || "",
          x: settings.x || "",
          youtube: settings.youtube || "",
          whatsapp: settings.whatsapp || "",
        },
      }
    : null;

  if (screen.loading && !screen.data) return <p style={{ color: "#6b7280" }}>Cargando…</p>;
  if (screen.error) return <p style={{ color: "#b42318" }}>{screen.error}</p>;
  return <HeroAdmin config={config} onSaved={screen.reload} />;
}
