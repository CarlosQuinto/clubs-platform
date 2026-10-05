/** Balón para goles en la cronología, la cancha y el marcador en vivo. */
export function BallIcon({ size = 14, own = false }: { size?: number; own?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={own ? "match-ball match-ball--own" : "match-ball"}
    >
      <circle cx="12" cy="12" r="10.5" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill="currentColor" />
      <path
        d="M12 7.2V2.2M15.6 9.8l4.6-1.7M14.2 14l2.9 4.1M9.8 14l-2.9 4.1M8.4 9.8L3.8 8.1"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

/** Tarjeta amarilla o roja. */
export function CardIcon({ color }: { color: "yellow" | "red" }) {
  return <span className={`match-card-icon match-card-icon--${color}`} aria-hidden />;
}
