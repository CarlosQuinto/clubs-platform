import { useEffect, useState } from "react";
import { QueryFetchPolicy, dataConnect, platformBanner } from "../../infrastructure/dataconnect";

export interface PlatformBannerView {
  headline: string;
  tagline: string;
  images: string[];
}

const EMPTY_BANNER: PlatformBannerView = { headline: "", tagline: "", images: [] };

let pending: Promise<PlatformBannerView> | null = null;

export function invalidatePlatformBanner() {
  pending = null;
}

function loadBanner() {
  if (!pending) {
    pending = platformBanner(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => ({
        headline: result.data.platformSettings?.headline.trim() || "",
        tagline: result.data.platformSettings?.tagline.trim() || "",
        images: result.data.platformHeroImages.map((image) => image.url).filter(Boolean),
      }))
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

/** Titular, lema e imágenes de la portada de la plataforma. Vacío mientras carga. */
export function usePlatformBanner(): PlatformBannerView {
  const [view, setView] = useState<PlatformBannerView>(EMPTY_BANNER);

  useEffect(() => {
    let alive = true;
    void loadBanner()
      .then((next) => {
        if (alive) setView(next);
      })
      .catch((err: unknown) => console.error(err));
    return () => {
      alive = false;
    };
  }, []);

  return view;
}
