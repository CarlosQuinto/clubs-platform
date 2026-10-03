import { useEffect, useState } from "react";
import {
  AdPlacementKind,
  dataConnect,
  liveAds,
  type LiveAdsData,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { safeAdHref, type AdPlacement } from "../../domains/platform/ads";
import { isoDate } from "../../shared/helpers";

const ROTATE_MS = 5000;

interface Props {
  placement: AdPlacement;
  /** `band` alinea la franja con las secciones del inicio. `top` la pega bajo el header. `club` la centra en la ficha del club. */
  layout?: "band" | "inset" | "club" | "top";
}

const PLACEMENT_KIND: Record<AdPlacement, AdPlacementKind> = {
  home: AdPlacementKind.HOME,
  tournament: AdPlacementKind.TOURNAMENT,
  club: AdPlacementKind.CLUB,
  teams: AdPlacementKind.TEAMS,
};

function toBanners(data: LiveAdsData) {
  return data.adPlacements.flatMap((row) => {
    const imageUrl = row.ad.imageUrl.trim();
    if (!imageUrl) return [];
    return [{
      id: row.ad.id,
      brand: row.ad.brand,
      imageUrl,
      href: row.ad.href,
    }];
  });
}

export default function AdSlot({ placement, layout = "inset" }: Props) {
  const [live, setLive] = useState<ReturnType<typeof toBanners>>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void liveAds(
      dataConnect,
      { today: isoDate(), placement: PLACEMENT_KIND[placement] },
      { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
    )
      .then((result) => {
        if (!cancelled) setLive(result.data ? toBanners(result.data) : []);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) setLive([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);
  const signature = live.map((ad) => ad.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    if (live.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % live.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [signature, live.length]);

  const ad = live[index] ?? live[0];
  if (!ad) return null;

  const href = safeAdHref(ad.href);
  const image = (
    <img src={ad.imageUrl} alt={ad.brand} className="ad-slot__image" />
  );

  const card = (
    <div className="ad-slot__card">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="ad-slot__frame"
        >
          {image}
        </a>
      ) : (
        <div className="ad-slot__frame">{image}</div>
      )}
    </div>
  );

  if (layout === "band") {
    return (
      <section className="ad-slot-band">
        <div className="landing-band__inner">{card}</div>
      </section>
    );
  }

  const frame =
    layout === "club"
      ? "ad-slot ad-slot--club"
      : layout === "top"
        ? "ad-slot ad-slot--top"
        : "ad-slot";

  return <div className={frame}>{card}</div>;
}
