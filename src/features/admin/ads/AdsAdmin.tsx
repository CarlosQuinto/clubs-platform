import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Megaphone,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { platformStoragePath } from "../../../shared/paths";
import {
  orderAds,
  removeAd,
  saveAdStatus,
  upsertAd,
} from "../../../domains/platform/adsCommands";
import { loadAds } from "../../../domains/platform/adsCommands";
import { TO_SQL_PLACEMENT, toAds } from "./adsMapper";
import { useAdminQuery } from "../useAdminQuery";
import { deleteStoredImage, uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import {
  AD_PLACEMENTS,
  AD_STATUS_LABEL,
  addDaysIso,
  canonicalPlacements,
  isPlatformAdImageUrl,
  placementLabel,
  statusForSave,
  statusOnOpen,
  todayIso,
  type Ad,
  type AdPlacement,
  type AdStatus,
} from "../../../domains/platform/ads";
import {
  brandName,
  canonicalWebUrl,
  isBrandName,
  isMoneyText,
  isPayerContact,
  isPayerName,
  isWebUrl,
  moneyText,
  payerContact,
  payerName,
  webUrl,
} from "../../../shared/textLimits";
import { IMAGE_ACCEPT, isAllowedImage } from "../../../shared/imageFile";
import ConfirmModal from "../../../shared/ConfirmModal";
import AdImageCropper from "./AdImageCropper";
import Field from "../Field";
import {
  Badge,
  C,
  FormInput,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";

interface Draft {
  id?: string;
  brand: string;
  imageUrl: string;
  /** La imagen salió de "Subir imagen": la URL queda de solo lectura. */
  uploaded: boolean;
  href: string;
  placements: AdPlacement[];
  startsAt: string;
  endsAt: string;
  order: number;
  /** Lo que la liga cobra por el anuncio (finanzas); vacío = sin cobro. */
  price: string;
  advertiserName: string;
  advertiserContact: string;
}

type InventoryStatus = AdStatus;
type AdField = "brand" | "startsAt" | "endsAt" | "href" | "placements" | "image" | "price" | "advertiser" | "contact";

const STATUS_COLOR: Record<InventoryStatus, "red" | "amber" | "gray" | "green"> = {
  EXPIRADO: "red",
  PROGRAMADO: "amber",
  PAUSADO: "gray",
  EN_CURSO: "green",
};

const BRAND_MAX = 50;
const HREF_MAX = 500;
const IMAGE_URL_MAX = 2000;
/** Tope del archivo original. Se recorta a 1200×300 y se comprime antes de Storage. */
const AD_FILE_MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_ERROR = "La imagen tiene que ser JPG, PNG o WEBP de hasta 10 MB.";
const ORDER_DEBOUNCE_MS = 600;

function emptyDraft(order: number): Draft {
  return {
    brand: "",
    imageUrl: "",
    uploaded: false,
    href: "",
    placements: AD_PLACEMENTS.map((item) => item.id),
    startsAt: todayIso(),
    endsAt: addDaysIso(30),
    order,
    price: "",
    advertiserName: "",
    advertiserContact: "",
  };
}

function nextDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return todayIso(new Date(y, m - 1, d + 1));
}

function draftTips(draft: Draft, editing: boolean, today: string): Record<AdField, string> {
  return {
    brand: isBrandName(draft.brand)
      ? ""
      : draft.brand.trim()
        ? "Usa de 2 a 50 letras o números."
        : "Escribe la marca.",
    startsAt: !draft.startsAt
      ? "Elige la fecha de inicio."
      : !editing && draft.startsAt < today
        ? "El inicio no puede ser antes de hoy."
        : "",
    endsAt: !draft.endsAt
      ? "Elige la fecha de fin."
      : draft.startsAt && draft.endsAt <= draft.startsAt
        ? "El fin tiene que ser después del inicio."
        : "",
    href:
      !draft.href || isWebUrl(draft.href, HREF_MAX)
        ? ""
        : "Usa una URL que empiece con http:// o https://.",
    placements: draft.placements.length > 0 ? "" : "Elige al menos una ubicación.",
    image: !draft.imageUrl
      ? "Sube una imagen o pega su URL."
      : isWebUrl(draft.imageUrl, IMAGE_URL_MAX)
        ? ""
        : "Usa una URL de imagen que empiece con http:// o https://.",
    price: !draft.price || isMoneyText(draft.price) ? "" : "Escribe el precio con hasta dos decimales.",
    advertiser:
      !draft.advertiserName.trim() || isPayerName(draft.advertiserName) ? "" : "Usa de 3 a 50 letras, números o comas.",
    contact: isPayerContact(draft.advertiserContact) ? "" : "Teléfono o correo, hasta 100 caracteres.",
  };
}

/** Aviso, sin bloquear, si la imagen no se parece a una banda ancha de 1200×300. */
function sizeWarning(width: number, height: number) {
  if (!width || !height) return "";
  if (width < 1000) return "La imagen es pequeña: podría verse borrosa. Lo ideal es 1200×300.";
  if (width / height < 2) return "La imagen es casi cuadrada: el anuncio es una banda ancha de 1200×300.";
  return "";
}

function imageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
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
  await deleteStoredImage(url);
}

export default function AdsAdmin() {
  const screen = useAdminQuery(loadAds);
  const ads = toAds(screen.data);
  const loading = screen.loading;
  const loadError = screen.error;
  // Orden local mientras corre el debounce de las flechas.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  // Pausar / reanudar se ve al instante; se descarta al recargar.
  const [statusOverride, setStatusOverride] = useState<Record<string, AdStatus>>({});
  const ordered = useMemo(() => {
    const sorted = [...ads].sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand));
    const withStatus = sorted.map((ad) =>
      statusOverride[ad.id] ? { ...ad, status: statusOverride[ad.id] } : ad,
    );
    if (!localOrder) return withStatus;
    const rank = new Map(localOrder.map((id, index) => [id, index]));
    return [...withStatus].sort(
      (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
    );
  }, [ads, localOrder, statusOverride]);
  const needsCleanup = ads.some((ad) => ad.hasLegacyPlacement);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(0));
  const [seen, setSeen] = useState<Set<AdField>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [imageWarning, setImageWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Ad | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const orderTimer = useRef<number | null>(null);
  const pendingOrder = useRef<string[] | null>(null);
  const savingAd = useRef(false);
  const statusPending = useRef(new Set<string>());
  const legacyAttempted = useRef(false);
  const reconcileKey = useRef("");

  const locked = busy || uploading || needsCleanup;
  const editing = Boolean(draft.id);
  const today = todayIso();
  const tips = draftTips(draft, editing, today);
  const tipFor = (field: AdField) => (seen.has(field) ? tips[field] : "");
  const valid = Object.values(tips).every((tip) => !tip) && !photoError;
  const ready = valid && !locked;

  const touch = (field: AdField) =>
    setSeen((current) => (current.has(field) ? current : new Set(current).add(field)));

  const resetDraft = (next: Draft) => {
    setDraft(next);
    setSeen(new Set());
    setFormError("");
    setPhotoError("");
    setImageWarning("");
  };

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
      // Si se sale antes del debounce, el último orden igual se guarda.
      if (orderTimer.current !== null) {
        window.clearTimeout(orderTimer.current);
        const ids = pendingOrder.current;
        if (ids) void orderAds(ids).catch((err) => console.error(err));
      }
    };
  }, []);

  useEffect(() => {
    setStatusOverride({});
    if (orderTimer.current === null && pendingOrder.current === null) setLocalOrder(null);
  }, [screen.data]);

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
    void cleaned;
  }, [ads, loading]);

  useEffect(() => {
    if (loading) return;
    const pending = ads.flatMap((ad) => {
      const next = statusOnOpen(ad);
      return next ? [{ id: ad.id, status: next }] : [];
    });
    if (pending.length === 0) return;
    const key = pending.map((item) => `${item.id}:${item.status}`).join("|");
    if (reconcileKey.current === key) return;
    reconcileKey.current = key;
    void (async () => {
      try {
        for (const item of pending) {
          await saveAdStatus(item.id, item.status);
        }
        screen.reload();
      } catch (err) {
        console.error(err);
        setError("No se pudo actualizar el estado de los anuncios.");
      }
    })();
  }, [ads, loading, screen.reload]);

  const togglePlacement = (id: AdPlacement) => {
    touch("placements");
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

  /** Imagen subida en esta edición que todavía no está guardada en ningún anuncio. */
  const unsavedUpload = (url: string) => {
    const persisted = draft.id ? ads.find((ad) => ad.id === draft.id)?.imageUrl : "";
    return url && url !== persisted ? url : "";
  };

  const pickFile = async (file: File) => {
    if (locked) return;
    touch("image");
    if (!(await isAllowedImage(file, AD_FILE_MAX_BYTES))) {
      setPhotoError(PHOTO_ERROR);
      return;
    }
    setPhotoError("");
    const { width, height } = await imageSize(file);
    setImageWarning(sizeWarning(width, height));
    setCropFile(file);
  };

  const upload = async (file: File) => {
    setCropFile(null);
    if (locked) return;
    try {
      setUploading(true);
      setFormError("");
      const download = await uploadImageFile(
        platformStoragePath("ads", `${Date.now()}.jpg`),
        file,
        { maxSizeMB: 0.8, maxWidthOrHeight: 1600 },
      );
      const replaced = unsavedUpload(draft.imageUrl);
      setDraft((current) => ({ ...current, imageUrl: download, uploaded: true }));
      if (replaced && replaced !== download) {
        try {
          await removeStoredAdImage(replaced);
        } catch (err) {
          console.error(err);
          flash("La imagen nueva quedó lista. No se pudo borrar la anterior.");
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("No se pudo subir la imagen. Revisa que hayas iniciado sesión.");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    const replaced = unsavedUpload(draft.imageUrl);
    setDraft((current) => ({ ...current, imageUrl: "", uploaded: false }));
    setImageWarning("");
    setPhotoError("");
    touch("image");
    if (replaced) void removeStoredAdImage(replaced).catch((err) => console.error(err));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingAd.current || !ready) {
      setSeen(new Set<AdField>(["brand", "startsAt", "endsAt", "href", "placements", "image", "price", "advertiser", "contact"]));
      return;
    }
    const existing = draft.id ? ads.find((ad) => ad.id === draft.id) : undefined;
    const brand = draft.brand.trim();
    const imageUrl = canonicalWebUrl(draft.imageUrl);
    const href = draft.href ? canonicalWebUrl(draft.href) : "";
    const placements = canonicalPlacements(draft.placements);
    const status = statusForSave(draft.startsAt, draft.endsAt, existing?.status ?? null);
    const previousImage = existing?.imageUrl || "";
    savingAd.current = true;
    try {
      setBusy(true);
      setFormError("");
      const order = draft.id
        ? existing?.order ?? 0
        : ordered.reduce((max, ad) => Math.max(max, ad.order), -1) + 1;
      await upsertAd({
        id: draft.id || crypto.randomUUID(),
        brand,
        imageUrl,
        href,
        startsOn: draft.startsAt,
        endsOn: draft.endsAt,
        status,
        sortOrder: order,
        price: draft.price ? parseFloat(draft.price) : 0,
        advertiserName: draft.advertiserName.trim(),
        advertiserContact: draft.advertiserContact.trim(),
        placements: placements.map((placement) => TO_SQL_PLACEMENT[placement]),
      });
      screen.reload();
      resetDraft(emptyDraft(ordered.length));
      flash("Guardado con éxito.");
    } catch (err) {
      console.error(err);
      setFormError("No se pudo guardar. Revisa los datos e inténtalo de nuevo.");
      return;
    } finally {
      savingAd.current = false;
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
    resetDraft({
      id: ad.id,
      brand: ad.brand,
      imageUrl: ad.imageUrl,
      uploaded: isPlatformAdImageUrl(ad.imageUrl),
      href: ad.href,
      placements: canonicalPlacements(ad.placements),
      startsAt: ad.startsAt,
      endsAt: ad.endsAt,
      order: ad.order,
      price: ad.price > 0 ? String(ad.price) : "",
      advertiserName: ad.advertiserName,
      advertiserContact: ad.advertiserContact,
    });
  };

  const remove = async (ad: Ad) => {
    if (locked) return;
    try {
      setBusy(true);
      setError("");
      await removeAd(ad.id);
      setPendingDelete(null);
      screen.reload();
      if (draft.id === ad.id) resetDraft(emptyDraft(ordered.length));
    } catch (err) {
      console.error(err);
      setPendingDelete(null);
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

  // Las flechas mueven la lista al instante; solo el último orden llega al servidor.
  const move = (index: number, dir: -1 | 1) => {
    if (locked) return;
    const next = index + dir;
    if (next < 0 || next >= ordered.length) return;
    const ids = ordered.map((ad) => ad.id);
    const [item] = ids.splice(index, 1);
    ids.splice(next, 0, item);
    setLocalOrder(ids);
    setError("");
    pendingOrder.current = ids;
    if (orderTimer.current !== null) window.clearTimeout(orderTimer.current);
    orderTimer.current = window.setTimeout(() => {
      orderTimer.current = null;
      void (async () => {
        try {
          await orderAds(ids);
          if (pendingOrder.current === ids) pendingOrder.current = null;
          screen.reload();
        } catch (err) {
          console.error(err);
          pendingOrder.current = null;
          setLocalOrder(null);
          setError("No se pudo cambiar el orden.");
        }
      })();
    }, ORDER_DEBOUNCE_MS);
  };

  const setStatus = async (ad: Ad, status: AdStatus) => {
    if (locked || statusPending.current.has(ad.id)) return;
    statusPending.current.add(ad.id);
    setStatusOverride((current) => ({ ...current, [ad.id]: status }));
    try {
      setError("");
      await saveAdStatus(ad.id, status);
      screen.reload();
    } catch (err) {
      console.error(err);
      setStatusOverride((current) => {
        const next = { ...current };
        delete next[ad.id];
        return next;
      });
      setError("No se pudo cambiar el estado del anuncio.");
    } finally {
      statusPending.current.delete(ad.id);
    }
  };

  const status = error || loadError;
  const uploadLocked = locked || (!draft.uploaded && Boolean(draft.imageUrl));

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
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <Field label="Marca" tip={tipFor("brand")}>
            <FormInput
              value={draft.brand}
              onChange={(e) => {
                touch("brand");
                setDraft((current) => ({ ...current, brand: brandName(e.target.value) }));
              }}
              onBlur={() => touch("brand")}
              placeholder="Nombre de la marca"
              maxLength={BRAND_MAX}
              aria-invalid={Boolean(tipFor("brand"))}
              disabled={locked}
            />
          </Field>
          <div className="seasons-form__dates">
            <Field label="Inicio" tip={tipFor("startsAt")}>
              <FormInput
                type="date"
                value={draft.startsAt}
                min={editing ? undefined : today}
                onChange={(e) => {
                  touch("startsAt");
                  setDraft((current) => ({ ...current, startsAt: e.target.value }));
                }}
                onBlur={() => touch("startsAt")}
                aria-invalid={Boolean(tipFor("startsAt"))}
                disabled={locked}
              />
            </Field>
            <Field label="Fin" tip={tipFor("endsAt")}>
              <FormInput
                type="date"
                value={draft.endsAt}
                min={draft.startsAt ? nextDay(draft.startsAt) : undefined}
                onChange={(e) => {
                  touch("endsAt");
                  setDraft((current) => ({ ...current, endsAt: e.target.value }));
                }}
                onBlur={() => touch("endsAt")}
                aria-invalid={Boolean(tipFor("endsAt"))}
                disabled={locked}
              />
            </Field>
          </div>
          <Field
            label="Enlace"
            hint="Opcional. Solo una URL http o https. Se abre en otra pestaña."
            tip={tipFor("href")}
          >
            <FormInput
              value={draft.href}
              onChange={(e) => {
                touch("href");
                setDraft((current) => ({ ...current, href: webUrl(e.target.value, HREF_MAX) }));
              }}
              onBlur={() => touch("href")}
              placeholder="https://"
              maxLength={HREF_MAX}
              aria-invalid={Boolean(tipFor("href"))}
              disabled={locked}
            />
          </Field>
          <div className="admin-grid-2">
            <Field label="Precio" hint="Opcional. Lo que la liga cobra por el anuncio (Finanzas)." tip={tipFor("price")}>
              <FormInput
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => {
                  touch("price");
                  setDraft((current) => ({ ...current, price: moneyText(e.target.value) }));
                }}
                placeholder="0.00"
                aria-invalid={Boolean(tipFor("price"))}
                disabled={locked}
              />
            </Field>
            <Field label="Anunciante" hint="Opcional. Si no, se cobra a la marca." tip={tipFor("advertiser")}>
              <FormInput
                value={draft.advertiserName}
                maxLength={50}
                onChange={(e) => {
                  touch("advertiser");
                  setDraft((current) => ({ ...current, advertiserName: payerName(e.target.value) }));
                }}
                onBlur={() => touch("advertiser")}
                aria-invalid={Boolean(tipFor("advertiser"))}
                disabled={locked}
              />
            </Field>
          </div>
          <Field label="Contacto del anunciante" hint="Opcional. Teléfono o correo." tip={tipFor("contact")}>
            <FormInput
              value={draft.advertiserContact}
              maxLength={100}
              onChange={(e) => {
                touch("contact");
                setDraft((current) => ({ ...current, advertiserContact: payerContact(e.target.value) }));
              }}
              aria-invalid={Boolean(tipFor("contact"))}
              disabled={locked}
            />
          </Field>
          <Field label="Dónde se muestra" tip={tipFor("placements")}>
            <div className="vitrina-placements">
              {AD_PLACEMENTS.map((item) => (
                <label key={item.id} className="vitrina-placements__item">
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
            {draft.imageUrl && !tips.image ? (
              <img
                src={draft.imageUrl}
                alt={draft.brand || "Vista previa del anuncio"}
                onLoad={(e) => {
                  if (draft.uploaded) return;
                  const img = e.currentTarget;
                  setImageWarning(sizeWarning(img.naturalWidth, img.naturalHeight));
                }}
                style={{
                  width: 180,
                  height: 45,
                  objectFit: "cover",
                  borderRadius: RADIUS.md,
                  border: `1px solid ${C.gray200}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 45,
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
            <label
              className={
                uploadLocked ? "cover-add-row__upload is-disabled" : "cover-add-row__upload"
              }
              style={{ width: "auto" }}
              title={
                !draft.uploaded && draft.imageUrl
                  ? "Borra la URL de la imagen para subir un archivo."
                  : undefined
              }
            >
              <UploadCloud size={14} /> {uploading ? "Subiendo..." : "Subir imagen"}
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                disabled={uploadLocked}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void pickFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {draft.uploaded && draft.imageUrl && (
              <SecondaryButton type="button" disabled={locked} onClick={clearImage}>
                <X size={14} /> Quitar imagen
              </SecondaryButton>
            )}
          </div>
          {imageWarning && (
            <p style={{ margin: 0, color: C.amber, fontSize: "0.75rem" }}>{imageWarning}</p>
          )}
          <Field
            label="O pega la URL de la imagen"
            hint={draft.uploaded ? "Viene de la imagen subida. Quítala para pegar otra URL." : undefined}
            tip={photoError || tipFor("image")}
          >
            <FormInput
              value={draft.imageUrl}
              onChange={(e) => {
                touch("image");
                setDraft((current) => ({
                  ...current,
                  imageUrl: webUrl(e.target.value, IMAGE_URL_MAX),
                }));
                if (!e.target.value) setImageWarning("");
              }}
              onBlur={() => touch("image")}
              placeholder="https://..."
              maxLength={IMAGE_URL_MAX}
              readOnly={draft.uploaded}
              aria-invalid={Boolean(photoError || tipFor("image"))}
              disabled={locked}
            />
          </Field>
          {formError && (
            <p style={{ margin: 0, color: C.red, fontSize: "0.8rem" }}>{formError}</p>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <PrimaryButton type="submit" disabled={!ready}>
              {busy ? "Guardando..." : editing ? "Guardar cambios" : "Crear anuncio"}
            </PrimaryButton>
            {editing && (
              <SecondaryButton
                type="button"
                disabled={locked}
                onClick={() => resetDraft(emptyDraft(ordered.length))}
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
            const muted = ad.status === "PAUSADO" || ad.status === "EXPIRADO";
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
                    onClick={() => move(index, -1)}
                    style={{ padding: "0.3rem 0.45rem" }}
                  >
                    <ChevronUp size={14} />
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    aria-label={`Bajar ${ad.brand}`}
                    disabled={locked || index === ordered.length - 1}
                    onClick={() => move(index, 1)}
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
                    <Badge color={STATUS_COLOR[ad.status]}>
                      {AD_STATUS_LABEL[ad.status]}
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
                  {(ad.status === "EN_CURSO" || ad.status === "PAUSADO") && (
                    <SecondaryButton
                      type="button"
                      disabled={locked}
                      onClick={() =>
                        void setStatus(ad, ad.status === "EN_CURSO" ? "PAUSADO" : "EN_CURSO")
                      }
                    >
                      {ad.status === "EN_CURSO" ? "Pausar" : "Reanudar"}
                    </SecondaryButton>
                  )}
                  <SecondaryButton
                    type="button"
                    aria-label={`Eliminar ${ad.brand}`}
                    disabled={locked}
                    onClick={() => setPendingDelete(ad)}
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

      <AdImageCropper
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={(cropped) => void upload(cropped)}
      />
      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Eliminar anuncio"
        message={
          pendingDelete
            ? `¿Seguro que quieres eliminar el anuncio de ${pendingDelete.brand}? Dejará de mostrarse de inmediato.`
            : ""
        }
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
