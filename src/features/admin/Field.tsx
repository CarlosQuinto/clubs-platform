import { C } from "../../shared/ui";

export default function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
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
      {hint && (
        <span style={{ fontSize: "0.7rem", color: C.gray400 }}>{hint}</span>
      )}
    </label>
  );
}
