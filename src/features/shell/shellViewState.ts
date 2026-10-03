import type { PlatformSocial } from "../../shared/types";

export interface PlatformChromeView {
  brandName: string;
  logoUrl: string | null;
  motto: string;
  courtsEnabled: boolean;
  social: PlatformSocial | null;
}
