import { C } from "../../shared/ui";

export default function Field({
  label,
  hint,
  tip,
  count,
  children,
}: {
  label: string;
  hint?: string;
  /** Aviso flotante que apunta al campo sin mover el formulario. Pásalo siempre (vacío si no hay aviso) para no remontar el input. */
  tip?: string;
  /** Contador de caracteres abajo a la derecha, p. ej. "25/35". */
  count?: string;
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
      {tip === undefined ? (
        children
      ) : (
        <span className={tip ? "field-tip-anchor is-invalid" : "field-tip-anchor"}>
          {children}
          {tip ? (
            <span className="field-tip" role="tooltip">
              {tip}
            </span>
          ) : null}
        </span>
      )}
      {(hint || count) && (
        <span style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem", color: C.gray400 }}>
          <span style={{ flex: 1 }}>{hint}</span>
          {count && <span aria-live="polite">{count}</span>}
        </span>
      )}
    </label>
  );
}
