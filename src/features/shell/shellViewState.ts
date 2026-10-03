import type { PlatformSocial } from "../../lib/types";

export interface PlatformChromeView {
  brandName: string;
  logoUrl: string | null;
  motto: string;
  courtsEnabled: boolean;
  social: PlatformSocial | null;
}
