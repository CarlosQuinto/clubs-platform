import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { adRef, adsCol, platformStoragePath } from "../../lib/paths";
import { uploadImageFile } from "../../lib/uploadImage";
import {
  AD_PLACEMENTS,
  addDaysIso,
  adWindow,
  canonicalPlacements,
  isPlatformAdImageUrl,
  placementLabel,
  safeAdHref,
  safeAdImageUrl,
  todayIso,
  type Ad,
  type AdPlacement,
} from "../../lib/ads";
import { useAds } from "../../hooks/useAds";
import Field from "./Field";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../ui";

interface Draft {
  id?: string;
  brand: string;
  imageUrl: string;
  href: string;
  placements: AdPlacement[];
  startsAt: string;
  endsAt: string;
  order: number;
}

type InventoryStatus = "ended" | "scheduled" | "paused" | "current";

const STATUS_LABEL: Record<InventoryStatus, string> = {
  ended: "Vencido",
  scheduled: "Programado",
  paused: "Pausado",
  current: "En curso",
};

const STATUS_COLOR: Record<InventoryStatus, "red" | "amber" | "gray" | "green"> = {
  ended: "red",
  scheduled: "amber",
  paused: "gray",
  current: "green",
};

function inventoryStatus(ad: Ad): InventoryStatus {
  const windowState = adWindow(ad);
  if (windowState === "ended") return "ended";
  if (windowState === "scheduled") return "scheduled";
  if (!ad.active) return "paused";
  return "current";
}

function emptyDraft(order: number): Draft {
  return {
    brand: "",
    imageUrl: "",
    href: "",
    placements: AD_PLACEMENTS.map((item) => item.id),
    startsAt: todayIso(),
    endsAt: addDaysIso(30),
    order,
  };
}

function formatRange(start: string, end: string) {
  const fmt = (value: string) => {
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start || end || "Sin fechas";
}

async function removeStoredAdImage(url: string) {
  if (!isPlatformAdImageUrl(url)) return;
  await deleteObject(ref(storage, url));
}

export default function AdsAdmin() {
  const { ads, loading, error: loadError } = useAds();
  const ordered = useMemo(
    () => [...ads].sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand)),
    [ads],
  );
  const needsCleanup = ads.some((ad) => ad.hasLegacyPlacement);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(0));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);
  const legacyAttempted = useRef(false);

  const locked = busy || uploading || needsCleanup;

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const flash = (text: string) => {
    setNotice(text);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => {
      setNotice("");
      noticeTimer.current = null;
    }, 2500);
  };

  useEffect(() => {
    if (loading || legacyAttempted.current) return;
    const stale = ads.filter((ad) => ad.hasLegacyPlacement);
    if (stale.length === 0) return;
    legacyAttempted.current = true;
    const cleaned = stale.map((ad) => ({
      id: ad.id,
      placements: canonicalPlacements(ad.placements),
    }));
    if (cleaned.some((ad) => ad.placements.length === 0)) {
      setError("No se pudieron retirar ubicaciones que ya no se usan.");
      return;
    }
    const batch = writeBatch(db);
    cleaned.forEach((ad) => {
      batch.update(adRef(ad.id), { placements: ad.placements });
    });
    batch.commit().catch((err) => {
      console.error(err);
      setError("No se pudieron retirar ubicaciones que ya no se usan.");
    });
  }, [ads, loading]);

  const editing = Boolean(draft.id);

  const togglePlacement = (id: AdPlacement) => {
    setDraft((current) => {
      const has = current.placements.includes(id);
      return {
        ...current,
        placements: has
          ? current.placements.filter((item) => item !== id)
          : [...current.placements, id],
      };
    });
  };

  const upload = async (file: File) => {
    if (locked) return;
    try {
      setUploading(true);
      setError("");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const download = await uploadImageFile(
        platformStoragePath("ads", `${Date.now()}.${ext}`),
        file,
        { maxSizeMB: 0.8, maxWidthOrHeight: 1600 },
      );
      const replaced = draft.imageUrl;
      setDraft((current) => ({ ...current, imageUrl: download }));
      const persisted = draft.id
        ? ads.find((ad) => ad.id === draft.id)?.imageUrl
        : "";
      if (replaced && replaced !== download && replaced !== persisted) {
        try {
          await removeStoredAdImage(replaced);
        } catch (err) {
          console.error(err);
          flash("La imagen nueva quedó lista. No se pudo borrar la anterior.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Revisa que hayas iniciado sesión.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const brand = draft.brand.trim();
    const imageInput = draft.imageUrl.trim();
    const hrefInput = draft.href.trim();
    const href = hrefInput ? safeAdHref(hrefInput) : "";
    const imageUrl = imageInput ? safeAdImageUrl(imageInput) : "";
    const placements = canonicalPlacements(draft.placements);
    if (!brand || brand.length >= 80) {
      setError("La marca tiene que tener entre 1 y 79 caracteres.");
      return;
    }
    if (!imageInput) {
      setError("Sube una imagen o pega su URL.");
      return;
    }
    if (!imageUrl) {
      setError("La imagen tiene que ser una URL http o https de 9 a 1999 caracteres.");
      return;
    }
    if (hrefInput && !href) {
      setError("El enlace no es una URL http o https válida.");
      return;
    }
    if (placements.length === 0) {
      setError("Elige al menos una ubicación.");
      return;
    }
    if (!draft.startsAt || !draft.endsAt || draft.endsAt < draft.startsAt) {
      setError("La fecha de fin tiene que ser igual o posterior al inicio.");
      return;
    }
    const existing = draft.id ? ads.find((ad) => ad.id === draft.id) : undefined;
    const payload = {
      brand,
      imageUrl,
      href,
      placements,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      active: existing ? existing.active : true,
    };
    const previousImage = draft.id
      ? ads.find((ad) => ad.id === draft.id)?.imageUrl
      : "";
    try {
      setBusy(true);
      setError("");
      if (draft.id) {
        await updateDoc(adRef(draft.id), payload);
      } else {
        const order =
          ordered.reduce((max, ad) => Math.max(max, ad.order), -1) + 1;
        await addDoc(adsCol(), {
          ...payload,
          order,
          createdAt: serverTimestamp(),
        });
      }
      setDraft(emptyDraft(ordered.length));
      flash("Guardado con éxito.");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
      return;
    } finally {
      setBusy(false);
    }
    if (previousImage && previousImage !== imageUrl) {
      try {
        await removeStoredAdImage(previousImage);
      } catch (err) {
        console.error(err);
        flash("Anuncio guardado. No se pudo borrar la imagen anterior.");
      }
    }
  };

  const startEdit = (ad: Ad) => {
    if (locked) return;
    setError("");
    setDraft({
      id: ad.id,
      brand: ad.brand,
      imageUrl: ad.imageUrl,
      href: ad.href,
      placements: canonicalPlacements(ad.placements),
      startsAt: ad.startsAt,
      endsAt: ad.endsAt,
      order: ad.order,
    });
  };

  const remove = async (ad: Ad) => {
    if (locked) return;
    if (!window.confirm(`¿Eliminar el anuncio de ${ad.brand}?`)) return;
    try {
      setBusy(true);
      setError("");
      await deleteDoc(adRef(ad.id));
      if (draft.id === ad.id) setDraft(emptyDraft(ordered.length));
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el anuncio.");
      return;
    } finally {
      setBusy(false);
    }
    try {
      await removeStoredAdImage(ad.imageUrl);
      flash("Anuncio eliminado.");
    } catch (err) {
      console.error(err);
      flash("Anuncio eliminado. No se pudo borrar la imagen del almacenamiento.");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (locked) return;
    const next = index + dir;
    if (next < 0 || next >= ordered.length) return;
    const copy = [...ordered];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    try {
      setBusy(true);
      setError("");
      const batch = writeBatch(db);
      copy.forEach((ad, i) => batch.update(adRef(ad.id), { order: i }));
      await batch.commit();
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el orden.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    const status = inventoryStatus(ad);
    if (locked || (status !== "current" && status !== "paused")) return;
    try {
      setBusy(true);
      setError("");
      await updateDoc(adRef(ad.id), { active: !ad.active });
    } catch (err) {
      console.error(err);
      setError("No se pudo cambiar el estado del anuncio.");
    } finally {
      setBusy(false);
    }
  };

  const status = error || loadError;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {status && (
        <p style={{ margin: 0, color: C.red, fontSize: "0.8rem" }}>{status}</p>
      )}
      {notice && (
        <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>{notice}</p>
      )}
      <SectionCard
        title={editing ? "Editar anuncio" : "Nuevo anuncio"}
        icon={<Megaphone size={16} color={C.amber} />}
      >
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Imagen ancha, cerca de 1200×300. Actívala cuando el acuerdo esté
          vigente; el cobro se lleva fuera de la plataforma.
        </p>
        <form
          onSubmit={(e) => void save(e)}
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <Field label="Marca">
            <FormInput
              value={draft.brand}
              onChange={(e) =>
                setDraft((current) => ({ ...current, brand: e.target.value }))
              }
              placeholder="Nombre de la marca"
              maxLength={79}
              required
              disabled={locked}
            />
          </Field>
          <div className="seasons-form__dates">
            <Field label="Inicio">
              <FormInput
                type="date"
                value={draft.startsAt}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, startsAt: e.target.value }))
                }
                required
                disabled={locked}
              />
            </Field>
            <Field label="Fin">
              <FormInput
                type="date"
                value={draft.endsAt}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, endsAt: e.target.value }))
                }
                required
                disabled={locked}
              />
            </Field>
          </div>
          <Field label="Enlace" hint="Opcional. Solo una URL http o https. Se abre en otra pestaña.">
            <FormInput
              value={draft.href}
              onChange={(e) =>
                setDraft((current) => ({ ...current, href: e.target.value }))
              }
              placeholder="https://"
              maxLength={499}
              disabled={locked}
            />
          </Field>
          <Field label="Dónde se muestra">
            <div className="ad-placements">
              {AD_PLACEMENTS.map((item) => (
                <label key={item.id} className="ad-placements__item">
                  <input
                    type="checkbox"
                    checked={draft.placements.includes(item.id)}
                    onChange={() => togglePlacement(item.id)}
                    disabled={locked}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </Field>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {draft.imageUrl ? (
              <img
                src={draft.imageUrl}
                alt={draft.brand || "Vista previa del anuncio"}
                style={{
                  width: 180,
                  height: 56,
                  objectFit: "cover",
                  borderRadius: RADIUS.md,
                  border: `1px solid ${C.gray200}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 56,
                  borderRadius: RADIUS.md,
                  border: `1px dashed ${C.gray300}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.gray400,
                  fontSize: "0.75rem",
                }}
              >
                Sin imagen
              </div>
            )}
            <label className="cover-add-row__upload" style={{ width: "auto" }}>
              <UploadCloud size={14} /> {uploading ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                disabled={locked}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <Field label="O pega la URL de la imagen">
            <FormInput
              value={draft.imageUrl}
              onChange={(e) =>
                setDraft((current) => ({ ...current, imageUrl: e.target.value }))
              }
              placeholder="https://..."
              maxLength={1999}
              disabled={locked}
            />
          </Field>
          {error && (
            <p style={{ margin: 0, color: C.red, fontSize: "0.8rem" }}>{error}</p>
          )}
          {notice && (
            <p style={{ margin: 0, color: C.green, fontSize: "0.8rem" }}>{notice}</p>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <PrimaryButton type="submit" disabled={locked}>
              {editing ? "Guardar cambios" : "Crear anuncio"}
            </PrimaryButton>
            {editing && (
              <SecondaryButton
                type="button"
                disabled={locked}
                onClick={() => {
                  setError("");
                  setDraft(emptyDraft(ordered.length));
                }}
              >
                Cancelar
              </SecondaryButton>
            )}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Inventario" icon={<Megaphone size={16} color={C.amber} />}>
        {loading && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Cargando anuncios...
          </p>
        )}
        {!loading && needsCleanup && (
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.8rem" }}>
            Actualizando ubicaciones que ya no se usan...
          </p>
        )}
        {!loading && !loadError && ordered.length === 0 && (
          <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>
            Todavía no hay anuncios.
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {ordered.map((ad, index) => {
            const status = inventoryStatus(ad);
            const muted = status === "paused" || status === "ended";
            return (
              <div
                key={ad.id}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: "0.75rem 0.85rem",
                  border: `1px solid ${C.gray200}`,
                  borderRadius: RADIUS.md,
                  backgroundColor: muted ? C.gray100 : C.gray50,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <SecondaryButton
                    type="button"
                    aria-label={`Subir ${ad.brand}`}
                    disabled={locked || index === 0}
                    onClick={() => void move(index, -1)}
                    style={{ padding: "0.3rem 0.45rem" }}
                  >
                    <ChevronUp size={14} />
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    aria-label={`Bajar ${ad.brand}`}
                    disabled={locked || index === ordered.length - 1}
                    onClick={() => void move(index, 1)}
                    style={{ padding: "0.3rem 0.45rem" }}
                  >
                    <ChevronDown size={14} />
                  </SecondaryButton>
                </div>
                <img
                  src={ad.imageUrl}
                  alt={ad.brand}
                  style={{
                    width: 96,
                    height: 36,
                    objectFit: "cover",
                    borderRadius: RADIUS.sm,
                    flexShrink: 0,
                    background: C.gray200,
                  }}
                />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 800, color: C.navy900 }}>{ad.brand}</div>
                  <div style={{ fontSize: "0.75rem", color: C.gray500 }}>
                    {formatRange(ad.startsAt, ad.endsAt)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.3rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    {ad.placements.map((id) => (
                      <Badge key={id} color="gray">
                        {placementLabel(id)}
                      </Badge>
                    ))}
                    <Badge color={STATUS_COLOR[status]}>
                      {STATUS_LABEL[status]}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  <SecondaryButton
                    type="button"
                    disabled={locked}
                    onClick={() => startEdit(ad)}
                  >
                    Editar
                  </SecondaryButton>
                  {(status === "current" || status === "paused") && (
                    <SecondaryButton
                      type="button"
                      disabled={locked}
                      onClick={() => void toggleActive(ad)}
                    >
                      {status === "current" ? "Pausar" : "Reanudar"}
                    </SecondaryButton>
                  )}
                  <SecondaryButton
                    type="button"
                    aria-label={`Eliminar ${ad.brand}`}
                    disabled={locked}
                    onClick={() => void remove(ad)}
                    style={{ padding: "0.45rem 0.55rem" }}
                  >
                    <Trash2 size={14} />
                  </SecondaryButton>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
