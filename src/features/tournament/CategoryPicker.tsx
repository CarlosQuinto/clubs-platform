import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { addCategory } from "../../domains/competition/competitionCommands";
import { categoryName, isCategoryName } from "../../shared/textLimits";
import type { Category } from "../../shared/types";
import { C, FormInput, PrimaryButton, RADIUS } from "../../shared/ui";

/** Categorías del torneo nuevo: fichas de las elegidas y un panel para sumar existentes o crear una (solo superadmin). */
export function CategoryPicker({
  categories,
  selectedIds,
  onChange,
  onCreated,
}: {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const creatingRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  const selected = categories.filter((c) => selectedIds.includes(c.id));
  const pendingIds = selectedIds.filter(
    (id) => !categories.some((c) => c.id === id),
  );
  const available = categories.filter((c) => !selectedIds.includes(c.id));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boxRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    // ESC cierra solo el panel, no el modal que lo contiene (useModalLock escucha en burbuja).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // Panel flotante (fixed, en portal): no estira ni lo recorta el scroll del modal.
  // Abre hacia arriba si abajo no cabe y arriba hay más espacio.
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const fit = () => {
      const rect = toggleRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!rect || !panel) return;
      const height = panel.scrollHeight;
      const below = window.innerHeight - rect.bottom - 14;
      const above = rect.top - 14;
      const up = height > below && above > below;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - panel.offsetWidth - 8));
      setPlace(
        up
          ? { left, bottom: window.innerHeight - rect.top + 6, maxHeight: above }
          : { left, top: rect.bottom + 6, maxHeight: below },
      );
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", fit, true);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", fit, true);
    };
  }, [open, available.length, error]);

  const addId = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
  };

  const removeId = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const createCategory = async () => {
    const clean = newName.trim();
    if (creatingRef.current || !isCategoryName(clean)) return;
    const existing = categories.find(
      (c) => c.name.toLowerCase() === clean.toLowerCase(),
    );
    if (existing) {
      setError("Esa categoría ya existe.");
      return;
    }
    creatingRef.current = true;
    setCreating(true);
    setError("");
    try {
      const nextOrder =
        categories.reduce((max, c) => Math.max(max, c.order ?? 0), 0) + 1;
      const id = await addCategory(clean, nextOrder);
      onCreated();
      addId(id);
      setNewName("");
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la categoría.");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  return (
    <div
      ref={boxRef}
      style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}
    >
      {selected.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => removeId(c.id)}
          title="Quitar"
          style={{
            border: `1px solid ${C.amber}`,
            backgroundColor: C.amberLight,
            color: C.navy900,
            borderRadius: RADIUS.full,
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {c.name} ×
        </button>
      ))}
      {pendingIds.map((id) => (
        <span
          key={id}
          style={{
            border: `1px solid ${C.amber}`,
            backgroundColor: C.amberLight,
            color: C.navy900,
            borderRadius: RADIUS.full,
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          Nueva…
        </span>
      ))}
      <div style={{ position: "relative" }}>
        <button
          ref={toggleRef}
          type="button"
          aria-label="Añadir categoría"
          title="Añadir categoría"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: RADIUS.full,
            border: `1px dashed ${C.amber}`,
            backgroundColor: C.white,
            color: C.amber,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={16} />
        </button>
        {open && createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              zIndex: 1000,
              left: place?.left ?? 0,
              top: place?.top,
              bottom: place?.bottom,
              maxHeight: place?.maxHeight,
              overflowY: "auto",
              boxSizing: "border-box",
              visibility: place ? "visible" : "hidden",
              width: "min(260px, calc(100vw - 16px))",
              padding: "0.75rem",
              backgroundColor: C.white,
              border: `1px solid ${C.gray200}`,
              borderRadius: RADIUS.lg,
              boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Existentes
            </div>
            {available.length === 0 ? (
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.75rem", color: C.gray400 }}>
                {categories.length === 0
                  ? "Aún no hay. Crea una abajo."
                  : "Ya están todas en el torneo."}
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  marginBottom: "0.75rem",
                }}
              >
                {available.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addId(c.id)}
                    style={{
                      border: `1px solid ${C.gray300}`,
                      backgroundColor: C.white,
                      color: C.gray700,
                      borderRadius: RADIUS.full,
                      padding: "0.3rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: C.gray500,
                textTransform: "uppercase",
                marginBottom: "0.4rem",
              }}
            >
              Nueva
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <FormInput
                value={newName}
                maxLength={40}
                onChange={(e) => {
                  setNewName(categoryName(e.target.value));
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void createCategory();
                  }
                }}
                placeholder="Ej. Primera división"
              />
              <PrimaryButton
                type="button"
                disabled={creating || !isCategoryName(newName)}
                onClick={() => void createCategory()}
                style={{ whiteSpace: "nowrap", padding: "0.45rem 0.7rem" }}
              >
                {creating ? "Creando..." : "Crear"}
              </PrimaryButton>
            </div>
            {error && (
              <p style={{ margin: "0.35rem 0 0", color: C.red, fontSize: "0.72rem" }}>
                {error}
              </p>
            )}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
