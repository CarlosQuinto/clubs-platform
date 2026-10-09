import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { validateLocality } from "../admin/clubsAdminMapper";
import { addLocality, DATA_REVIEW_MESSAGE } from "../../domains/clubs/clubCommands";
import { localityLabel, titleCase } from "../../shared/textLimits";
import { C, FormInput, PrimaryButton } from "../../shared/ui";

type Option = { id: string; name: string };

/**
 * «+ Nueva localidad» debajo del select de localidad (solo superadmin): abre un campo, crea la localidad con
 * create_locality y la entrega al padre para que la sume a su lista y la deje elegida. Las localidades no
 * tienen pantalla propia: se crean donde se usan (alta de club y aprobar solicitud).
 */
export default function NewLocalityInline({
  localities,
  disabled = false,
  onCreated,
}: {
  localities: Option[];
  disabled?: boolean;
  onCreated: (locality: Option) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);

  const close = () => {
    if (creating.current) return;
    setOpen(false);
    setName("");
    setError("");
  };

  const create = async () => {
    if (creating.current) return;
    const result = validateLocality(name);
    if (typeof result === "string") {
      setError(result);
      return;
    }
    if (localities.some((item) => item.name.toLowerCase() === result.name.toLowerCase())) {
      setError("Esa localidad ya existe.");
      return;
    }
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      const id = await addLocality(result.name);
      onCreated({ id, name: titleCase(result.name) });
      creating.current = false;
      setBusy(false);
      close();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && err.message === DATA_REVIEW_MESSAGE
          ? DATA_REVIEW_MESSAGE
          : "No se pudo crear la localidad.",
      );
      creating.current = false;
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="club-form__retry"
        disabled={disabled}
        onClick={() => setOpen(true)}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
      >
        <Plus size={12} /> Nueva localidad
      </button>
    );
  }

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <span style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
        <FormInput
          value={name}
          autoFocus
          disabled={busy}
          maxLength={50}
          placeholder="Ej. Guaymas, Sonora"
          aria-label="Nueva localidad"
          onChange={(event) => {
            setName(localityLabel(event.target.value));
            setError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void create();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
          }}
        />
        <PrimaryButton
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void create()}
          style={{ whiteSpace: "nowrap", padding: "0.45rem 0.7rem" }}
        >
          {busy ? "Creando..." : "Añadir"}
        </PrimaryButton>
        <button
          type="button"
          aria-label="Cancelar"
          disabled={busy}
          onClick={close}
          style={{ border: 0, background: "none", color: C.gray500, cursor: "pointer", padding: "0.2rem" }}
        >
          <X size={14} />
        </button>
      </span>
      {error ? (
        <span style={{ color: C.red, fontSize: "0.72rem" }}>{error}</span>
      ) : null}
    </span>
  );
}
