import type { ReactNode } from "react";

/** Cabecera de sección «Carbón y Oro»: icono dorado, título en mayúsculas y subtítulo (portada y ficha de torneo). */
export default function SectionHead({
  icon,
  title,
  subtitle,
  live,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  live?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="home-section__head">
      <div className="home-section__title">
        <span className="home-section__icon" aria-hidden>
          {icon}
        </span>
        <div>
          <h2>
            {live ? <span className="home-live-dot" aria-hidden /> : null}
            {title}
          </h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {action ? <div className="home-section__action">{action}</div> : null}
    </header>
  );
}
