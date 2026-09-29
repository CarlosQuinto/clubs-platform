import { C } from "../ui";

export const AdminField = ({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", ...style }}>
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 700,
        color: C.gray500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
    {children}
    {hint && <span style={{ fontSize: "0.7rem", color: C.gray400 }}>{hint}</span>}
  </label>
);

export const EmptyHint = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>{children}</p>
);

export const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border: `1px solid ${C.gray200}`,
  backgroundColor: C.gray50,
  flexWrap: "wrap",
};

export const smallBtn: React.CSSProperties = {
  padding: "0.4rem 0.75rem",
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
  fontSize: "0.75rem",
};
