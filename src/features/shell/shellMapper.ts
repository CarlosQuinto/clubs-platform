import { type PlatformChromeData } from "../../infrastructure/dataconnect";
import { PLATFORM_NAME } from "../../domains/clubs/clubDefaults";
import { hasAnySocial } from "../../domains/platform/social";
import type { PlatformSocial } from "../../shared/types";
import type { PlatformChromeView } from "./shellViewState";

export const EMPTY_CHROME: PlatformChromeView = {
  brandName: PLATFORM_NAME,
  logoUrl: null,
  motto: "",
  courtsEnabled: false,
  social: null,
};

export function toPlatformChrome(data: PlatformChromeData): PlatformChromeView {
  const settings = data.platformSettings;
  if (!settings) return EMPTY_CHROME;
  const social: PlatformSocial = {
    instagram: settings.instagram?.trim() || "",
    facebook: settings.facebook?.trim() || "",
    x: settings.x?.trim() || "",
    youtube: settings.youtube?.trim() || "",
    whatsapp: settings.whatsapp?.trim() || "",
  };
  return {
    brandName: settings.name.trim() || PLATFORM_NAME,
    logoUrl: settings.logoUrl?.trim() || null,
    motto: settings.motto.trim(),
    courtsEnabled: settings.courtsEnabled,
    social: hasAnySocial(social) ? social : null,
  };
}
