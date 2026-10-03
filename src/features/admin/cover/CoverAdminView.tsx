import HeroAdmin from "./HeroAdmin";
import type { PlatformCover } from "../../../shared/types";
import { loadCover } from "../../../domains/platform/platformCommands";
import { useAdminQuery } from "../useAdminQuery";

export default function CoverAdminView() {
  const screen = useAdminQuery(loadCover);
  const settings = screen.data?.platformSettings;
  const config: PlatformCover | null = settings
    ? {
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
