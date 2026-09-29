import type { ReactNode } from "react";
import HeroCarousel from "./HeroCarousel";
import { useAuth } from "../../context/AuthContext";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../../lib/clubDefaults";

/** Carrusel de portada a todo el ancho, pegado al header. */
export default function PageHeroBanner({
  children,
  size = "full",
}: {
  children?: ReactNode;
  size?: "full" | "short";
}) {
  const { platformConfig } = useAuth();
  const images =
    platformConfig?.heroImages && platformConfig.heroImages.length > 0
      ? platformConfig.heroImages
      : DEFAULT_PLATFORM_HERO_IMAGES;
  const headline = platformConfig?.headline?.trim() || PLATFORM_HEADLINE;
  const tagline = platformConfig?.tagline?.trim() || PLATFORM_DESCRIPTION;

  return (
    <div className="landing-hero">
      <HeroCarousel images={images} variant="full" size={size} arrows={false}>
        <div
          className={
            size === "short"
              ? "landing-hero__copy is-short"
              : "landing-hero__copy"
          }
        >
          <h1>{headline}</h1>
          <p>{tagline}</p>
          {children}
        </div>
      </HeroCarousel>
    </div>
  );
}
