import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { C } from "../../shared/ui";

export function TournamentGrid({ children }: { children: React.ReactNode }) {
  return <div className="tour-grid">{children}</div>;
}

export function ArchiveSection({
  title,
  count,
  collapsed = false,
  children,
}: {
  title: string;
  count: number;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!collapsed);
  const label = count === 1 ? "1 torneo" : `${count} torneos`;
  const heading = (
    <>
      {collapsed && <ChevronDown size={16} className={open ? "is-open" : ""} />}
      <span className="tour-band__title">{title}</span>
      <span className="tour-band__count">{label}</span>
    </>
  );

  return (
    <section className="tour-band">
      {collapsed ? (
        <button
          type="button"
          className="tour-band__head"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {heading}
        </button>
      ) : (
        <div className="tour-band__head">{heading}</div>
      )}
      {open &&
        (count === 0 ? (
          <p className="tour-band__empty">No hay elementos en esta lista.</p>
        ) : (
          children
        ))}
    </section>
  );
}

export function SectionRule({ title }: { title: string }) {
  return (
    <div
      style={{
        width: "100%",
        padding: "0.15rem 0 0.5rem",
        margin: "0.15rem 0 1.1rem",
        borderBottom: `1px solid ${C.gray200}`,
        color: C.gray600,
        fontWeight: 700,
        fontSize: "0.78rem",
        letterSpacing: "0.02em",
      }}
    >
      {title}
    </div>
  );
}

export function PageTitle({
  icon,
  children,
  subtitle,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <header style={{ margin: "0 0 1.5rem" }}>
      <h1
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "1.6rem",
          fontWeight: 900,
          color: C.navy900,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {icon} {children}
      </h1>
      {subtitle && (
        <p style={{ margin: "0.4rem 0 0", color: C.gray500, fontSize: "0.9rem" }}>
          {subtitle}
        </p>
      )}
    </header>
  );
}
