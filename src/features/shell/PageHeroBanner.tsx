import type { ReactNode } from "react";
import HeroCarousel from "./HeroCarousel";
import { usePlatformBanner } from "./usePlatformBanner";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
} from "../../domains/clubs/clubDefaults";

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
  const banner = usePlatformBanner();
  const images =
    imagesOverride && imagesOverride.length > 0
      ? imagesOverride
      : banner.images.length > 0
        ? banner.images
        : DEFAULT_PLATFORM_HERO_IMAGES;
  const headline = headlineOverride?.trim() || banner.headline || PLATFORM_HEADLINE;
  const tagline =
    taglineOverride === null
      ? ""
      : taglineOverride?.trim() || banner.tagline || PLATFORM_DESCRIPTION;

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
