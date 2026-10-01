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
  images: imagesOverride,
  headline: headlineOverride,
  tagline: taglineOverride,
}: {
  children?: ReactNode;
  size?: "full" | "short";
  images?: string[];
  headline?: string;
  tagline?: string | null;
}) {
  const { platformConfig } = useAuth();
  const images =
    imagesOverride && imagesOverride.length > 0
      ? imagesOverride
      : platformConfig?.heroImages && platformConfig.heroImages.length > 0
        ? platformConfig.heroImages
        : DEFAULT_PLATFORM_HERO_IMAGES;
  const headline = headlineOverride?.trim() || platformConfig?.headline?.trim() || PLATFORM_HEADLINE;
  const tagline =
    taglineOverride === null
      ? ""
      : taglineOverride?.trim() || platformConfig?.tagline?.trim() || PLATFORM_DESCRIPTION;

  return (
    <div className="landing-hero">
      <HeroCarousel images={images} variant="full" size={size} arrows={false}>
        <div
          className={
            [
              "landing-hero__copy",
              size === "short" ? "is-short" : "",
              headlineOverride ? "is-legend" : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
        >
          <h1>{headline}</h1>
          {tagline ? <p>{tagline}</p> : null}
          {children}
        </div>
      </HeroCarousel>
    </div>
  );
}
