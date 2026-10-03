import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, RADIUS } from "../../shared/ui";

export default function HeroCarousel({
  images,
  children,
  variant = "card",
  size = "full",
  arrows = true,
}: {
  images: string[];
  children?: ReactNode;
  variant?: "card" | "full";
  size?: "full" | "short";
  arrows?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const full = variant === "full";
  const short = full && size === "short";
  const height = full
    ? short
      ? "min(30vh, 300px)"
      : "min(56vh, 520px)"
    : "min(420px, 56vw)";
  const minHeight = full ? (short ? 190 : 340) : undefined;

  useEffect(() => {
    if (total < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 6000);
    return () => window.clearInterval(id);
  }, [total]);

  if (total === 0) return null;

  return (
    <section
      className={full ? "hero-carousel is-full" : "hero-carousel"}
      style={{
        position: "relative",
        borderRadius: full ? 0 : RADIUS.xl,
        overflow: "hidden",
        height,
        minHeight,
        marginBottom: full ? 0 : "2rem",
        backgroundColor: C.navy900,
      }}
    >
      {images.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: full
            ? "linear-gradient(180deg, rgba(10,12,20,0.28) 0%, rgba(10,12,20,0.62) 55%, rgba(10,12,20,0.78) 100%)"
            : "linear-gradient(180deg, rgba(10,12,20,0.15) 0%, rgba(10,12,20,0.72) 100%)",
        }}
      />
      {children}
      {total > 1 && arrows && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            style={navBtn("left")}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => setIndex((i) => (i + 1) % total)}
            style={navBtn("right")}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </section>
  );
}

const navBtn = (side: "left" | "right"): React.CSSProperties => ({
  position: "absolute",
  top: "50%",
  [side]: 12,
  transform: "translateY(-50%)",
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(0,0,0,0.4)",
  color: C.white,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3,
});
