import { useEffect, useState } from "react";
import { liveAdsFor, safeAdHref, type AdPlacement } from "../../lib/ads";
import { useAds } from "../../hooks/useAds";

const ROTATE_MS = 5000;

interface Props {
  placement: AdPlacement;
  /** `band` alinea la franja con las secciones del inicio. `top` la pega bajo el header. `club` la centra en la ficha del club. */
  layout?: "band" | "inset" | "club" | "top";
}

export default function AdSlot({ placement, layout = "inset" }: Props) {
  const { ads } = useAds();
  const live = liveAdsFor(ads, placement);
  const [index, setIndex] = useState(0);
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
