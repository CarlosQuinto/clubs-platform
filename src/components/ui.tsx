import React from "react";

// ── Design tokens ──
export const C = {
  white: "#FFFFFF",
  gray50: "#fcfaf8",
  gray100: "#f5f0e6",
  gray200: "#e5dfd3",
  gray300: "#d4ccbc",
  gray400: "#a39c90",
  gray500: "#736d63",
  gray600: "#524e46",
  gray700: "#3f3b33",
  gray800: "#292621",
  gray900: "#14120f",

  navy50: "#fafafa",
  navy100: "#f4f4f5", // <-- Faltaban estos, por eso no se veían los textos
  navy200: "#e4e4e7",
  navy300: "#d4d4d8",
  navy400: "#a1a1aa",
  navy500: "#71717a",
  navy600: "#52525b",
  navy700: "#3f3f46",
  navy800: "#27272a",
  navy900: "#121212",
  navy950: "#09090b",

  green: "#059669",
  greenLight: "#ecfdf5",
  greenBorder: "#bbf7d0",
  red: "#dc2626",
  redLight: "#fef2f2",
  redBorder: "#fecaca",
  amber: "#cd9a40",
  amberLight: "#fdf8eb",
  blueAccent: "#cd9a40",
  blueLight: "#fdf8eb",
};

export const SHADOWS = {
  sm: "0 1px 2px rgba(0,0,0,0.04)",
  md: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
  xl: "0 25px 50px -12px rgba(0,0,0,0.25)",
};

export const RADIUS = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

// ── Reusable UI atoms ──
export const SectionCard: React.FC<{
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, icon, children, style }) => (
  <div
    style={{
      backgroundColor: C.white,
      borderRadius: RADIUS.lg,
      padding: "1.5rem",
      boxShadow: SHADOWS.md,
      border: `1px solid ${C.gray200}`,
      ...style,
    }}
  >
    {title && (
      <h2
        style={{
          fontSize: "0.875rem",
          fontWeight: "700",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: C.navy900,
          letterSpacing: "-0.01em",
        }}
      >
        {icon}
        {title}
      </h2>
    )}
    {children}
  </div>
);

export const SegmentedControl: React.FC<{
  options: { label: string; value: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div
    style={{
      display: "flex",
      backgroundColor: C.gray100,
      borderRadius: RADIUS.md,
      padding: "3px",
      gap: "2px",
    }}
  >
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          padding: "0.5rem 0.75rem",
          borderRadius: RADIUS.sm,
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "0.8125rem",
          backgroundColor: value === opt.value ? C.white : "transparent",
          color: value === opt.value ? C.navy900 : C.gray500,
          boxShadow: value === opt.value ? SHADOWS.sm : "none",
          transition: "all 0.2s ease",
        }}
      >
        {opt.icon}
        {opt.label}
      </button>
    ))}
  </div>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  color?: "green" | "red" | "amber" | "blue" | "gray";
  style?: React.CSSProperties;
}> = ({ children, color = "gray", style }) => {
  const styles: Record<string, { bg: string; text: string }> = {
    green: { bg: C.greenLight, text: C.green },
    red: { bg: C.redLight, text: C.red },
    amber: { bg: C.amberLight, text: C.amber },
    blue: { bg: C.blueLight, text: C.blueAccent },
    gray: { bg: C.gray100, text: C.gray600 },
  };
  const s = styles[color];
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        fontWeight: "700",
        padding: "0.2rem 0.6rem",
        borderRadius: RADIUS.full,
        backgroundColor: s.bg,
        color: s.text,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const FormInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = (props) => (
  <input
    {...props}
    style={{
      width: "100%",
      padding: "0.625rem 0.75rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray300}`,
      backgroundColor: C.white,
      fontSize: "0.875rem",
      color: C.gray800,
      boxSizing: "border-box",
      ...props.style,
    }}
  />
);

export const FormSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement>
> = (props) => (
  <select
    {...props}
    style={{
      width: "100%",
      padding: "0.625rem 0.75rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray300}`,
      backgroundColor: C.white,
      fontSize: "0.875rem",
      color: C.gray800,
      boxSizing: "border-box",
      cursor: "pointer",
      ...props.style,
    }}
  />
);

export const FormTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    {...props}
    style={{
      width: "100%",
      padding: "0.625rem 0.75rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray300}`,
      backgroundColor: C.white,
      fontSize: "0.875rem",
      color: C.gray800,
      boxSizing: "border-box",
      fontFamily: "inherit",
      ...props.style,
    }}
  />
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "navy" | "green" | "red";
  }
> = ({ variant = "navy", children, ...props }) => {
  const bg =
    variant === "green" ? C.green : variant === "red" ? C.red : C.navy900;
  return (
    <button
      {...props}
      style={{
        padding: "0.625rem 1.5rem",
        borderRadius: RADIUS.md,
        border: "none",
        backgroundColor: bg,
        color: C.white,
        fontWeight: "600",
        fontSize: "0.8125rem",
        cursor: "pointer",
        letterSpacing: "0.01em",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
};

export const SecondaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      padding: "0.625rem 1.5rem",
      borderRadius: RADIUS.md,
      border: `1px solid ${C.gray300}`,
      backgroundColor: C.white,
      color: C.gray600,
      fontWeight: "600",
      fontSize: "0.8125rem",
      cursor: "pointer",
      ...props.style,
    }}
  >
    {children}
  </button>
);

export const StatBox = ({
  icon,
  label,
  value,
  valueColor = C.navy900,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueColor?: string;
}) => (
  <div
    style={{
      backgroundColor: C.gray50,
      borderRadius: RADIUS.md,
      padding: "0.875rem",
      textAlign: "center",
      border: `1px solid ${C.gray200}`,
    }}
  >
    <div
      style={{
        marginBottom: "0.25rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div
      style={{
        fontSize: "1.5rem",
        fontWeight: "800",
        color: valueColor,
        lineHeight: "1",
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.625rem",
        fontWeight: "600",
        color: C.gray500,
        textTransform: "uppercase",
        marginTop: "0.25rem",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
  </div>
);
