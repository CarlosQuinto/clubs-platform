import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Share2,
  Shield,
  Trash2,
  UploadCloud,
  X as XIcon,
} from "lucide-react";
import { platformStoragePath } from "../../../shared/paths";
import {
  MAX_HERO_IMAGES,
  replaceHeroImages,
  saveCoverText,
  saveHeader,
  saveSocial,
} from "../../../domains/platform/platformCommands";
import { uploadImageFile } from "../../../infrastructure/storage/uploadImage";
import type { PlatformCover } from "../../../shared/types";
import {
  DEFAULT_PLATFORM_HERO_IMAGES,
  PLATFORM_DESCRIPTION,
  PLATFORM_HEADLINE,
  PLATFORM_NAME,
} from "../../../domains/clubs/clubDefaults";
import {
  canonicalWebUrl,
  coverHeadline,
  coverTagline,
  isCoverHeadline,
  isCoverTagline,
  isFacebook,
  isInstagram,
  isPlatformMotto,
  isPlatformName,
  isWebUrl,
  isWhatsapp,
  isX,
  isYoutube,
  platformMotto,
  platformName,
  socialHandle,
  webUrl,
  whatsappText,
} from "../../../shared/textLimits";
import { IMAGE_ACCEPT, isAllowedImage } from "../../../shared/imageFile";
import ConfirmModal from "../../../shared/ConfirmModal";
import Field from "../Field";
import { invalidatePlatformBanner } from "../../shell/usePlatformBanner";
import { invalidatePlatformChrome } from "../../shell/usePlatformChrome";
import {
  C,
  FormInput,
  FormTextarea,
  PrimaryButton,
  RADIUS,
  SecondaryButton,
  SectionCard,
} from "../../../shared/ui";

interface Props {
  config?: PlatformCover | null;
  onSaved?: () => void;
}

type Area = "header" | "cover" | "social";

const LIMIT = {
  name: 30,
  motto: 50,
  logoUrl: 1000,
  headline: 35,
  tagline: 120,
  imageUrl: 2000,
  social: 150,
  whatsapp: 13,
} as const;

/** Topes del archivo original; se comprime antes de llegar a Storage. */
const LOGO_FILE_MAX_BYTES = 10 * 1024 * 1024;
const CAROUSEL_FILE_MAX_BYTES = 50 * 1024 * 1024;
const URL_TIP = "Usa una URL que empiece con http:// o https://, sin espacios.";

function isStoredImage(url: string) {
  return url.includes("firebasestorage.googleapis.com");
}

/** Valores guardados, ya limpios, contra los que se compara cada formulario. */
function savedValues(config?: PlatformCover | null) {
  return {
    name: config?.name || PLATFORM_NAME,
    motto: config?.motto || "",
    logoUrl: config?.logoUrl || "",
    headline: config?.headline || PLATFORM_HEADLINE,
    tagline: config?.tagline || PLATFORM_DESCRIPTION,
    instagram: config?.social?.instagram || "",
    facebook: config?.social?.facebook || "",
    x: config?.social?.x || "",
    youtube: config?.social?.youtube || "",
    whatsapp: whatsappText(config?.social?.whatsapp || ""),
  };
}

export default function HeroAdmin({ config, onSaved }: Props) {
  const savedImages = config?.heroImages || [];
  // Clave de texto: el config llega como objeto nuevo en cada carga y no debe borrar lo escrito.
  const savedKey = JSON.stringify(savedValues(config));
  const saved = useMemo(() => JSON.parse(savedKey) as ReturnType<typeof savedValues>, [savedKey]);
  const [name, setName] = useState(saved.name);
  const [motto, setMotto] = useState(saved.motto);
  const [logoUrl, setLogoUrl] = useState(saved.logoUrl);
  const [logoUploaded, setLogoUploaded] = useState(isStoredImage(saved.logoUrl));
  const [headline, setHeadline] = useState(saved.headline);
  const [tagline, setTagline] = useState(saved.tagline);
  const [instagram, setInstagram] = useState(saved.instagram);
  const [facebook, setFacebook] = useState(saved.facebook);
  const [x, setX] = useState(saved.x);
  const [youtube, setYoutube] = useState(saved.youtube);
  const [whatsapp, setWhatsapp] = useState(saved.whatsapp);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<Area | null>(null);
  const [imagesBusy, setImagesBusy] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [carouselError, setCarouselError] = useState("");
  const [confirmGeneric, setConfirmGeneric] = useState(false);
  const savingRef = useRef(false);
  const [notice, setNotice] = useState<{
    area: Area;
    text: string;
    ok: boolean;
  } | null>(null);

  useEffect(() => {
    setName(saved.name);
    setMotto(saved.motto);
    setLogoUrl(saved.logoUrl);
    setLogoUploaded(isStoredImage(saved.logoUrl));
    setHeadline(saved.headline);
    setTagline(saved.tagline);
    setInstagram(saved.instagram);
    setFacebook(saved.facebook);
    setX(saved.x);
    setYoutube(saved.youtube);
    setWhatsapp(saved.whatsapp);
  }, [saved]);

  const flash = (area: Area, text: string, ok = true) => {
    setNotice({ area, text, ok });
    window.setTimeout(() => setNotice(null), 2500);
  };

  const afterSave = () => {
    invalidatePlatformChrome();
    invalidatePlatformBanner();
    onSaved?.();
  };

  const fail = (area: Area, err: unknown) => {
    console.error(err);
    flash(area, "No se pudo guardar. Revisa los datos e inténtalo de nuevo.", false);
  };

  /** Un solo guardado a la vez por pantalla; el ref frena el doble clic antes del render. */
  const run = async (area: Area, task: () => Promise<void>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(area);
    try {
      await task();
    } catch (err) {
      fail(area, err);
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  };

  // Header
  const nameTip = isPlatformName(name)
    ? ""
    : name.trim()
      ? "De 2 a 30 letras o números."
      : "Escribe el nombre.";
  const mottoTip = isPlatformMotto(motto) ? "" : "Hasta 50 caracteres: letras, números y . , ¡! ¿?";
  const logoTip = !logoUrl || isWebUrl(logoUrl, LIMIT.logoUrl) ? "" : URL_TIP;
  const headerDirty =
    name.trim() !== saved.name || motto.trim() !== saved.motto || logoUrl !== saved.logoUrl;
  const headerReady =
    headerDirty && !nameTip && !mottoTip && !logoTip && !saving && !busy;

  const saveHeaderForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerReady) return;
    void run("header", async () => {
      await saveHeader(name.trim(), motto.trim(), logoUrl ? canonicalWebUrl(logoUrl) : "");
      afterSave();
      flash("header", "Header guardado.");
    });
  };

  // Portada
  const headlineTip = isCoverHeadline(headline) ? "" : "Hasta 35 caracteres: letras, números y puntuación.";
  const taglineTip = isCoverTagline(tagline) ? "" : "Hasta 120 caracteres: letras, números y puntuación.";
  const coverDirty =
    (headline.trim() || PLATFORM_HEADLINE) !== saved.headline ||
    (tagline.trim() || PLATFORM_DESCRIPTION) !== saved.tagline;
  const coverReady = coverDirty && !headlineTip && !taglineTip && !saving;

  const saveCover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverReady) return;
    void run("cover", async () => {
      await saveCoverText(
        headline.trim() || PLATFORM_HEADLINE,
        tagline.trim() || PLATFORM_DESCRIPTION,
      );
      afterSave();
      flash("cover", "Portada guardada.");
    });
  };

  // Carrusel
  const carouselFull = savedImages.length >= MAX_HERO_IMAGES;
  const urlTip = url && !isWebUrl(url, LIMIT.imageUrl) ? URL_TIP : "";
  const canAddUrl = Boolean(url) && !urlTip && !carouselFull && !busy && !imagesBusy;

  const saveImages = async (next: string[]) => {
    if (next.length > MAX_HERO_IMAGES) throw new Error(`Máximo ${MAX_HERO_IMAGES} fotos.`);
    setImagesBusy(true);
    try {
      await replaceHeroImages(next);
      afterSave();
    } finally {
      setImagesBusy(false);
    }
  };

  const addUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddUrl) return;
    try {
      await saveImages([...savedImages, canonicalWebUrl(url)]);
      setUrl("");
      flash("cover", "Imagen añadida.");
    } catch (err) {
      fail("cover", err);
    }
  };

  const upload = async (file: File, kind: "carousel" | "logo") => {
    const setError = kind === "logo" ? setLogoError : setCarouselError;
    const maxBytes = kind === "logo" ? LOGO_FILE_MAX_BYTES : CAROUSEL_FILE_MAX_BYTES;
    if (!(await isAllowedImage(file, maxBytes))) {
      setError(`La imagen tiene que ser JPG, PNG o WEBP de hasta ${kind === "logo" ? 10 : 50} MB.`);
      return;
    }
    setError("");
    try {
      setBusy(true);
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const download = await uploadImageFile(
        platformStoragePath(kind, `${Date.now()}.${ext}`),
        file,
        {
          maxSizeMB: kind === "logo" ? 0.2 : 0.8,
          maxWidthOrHeight: kind === "logo" ? 512 : 1920,
        },
      );
      if (kind === "logo") {
        // Solo llena el campo: se guarda con "Guardar header".
        setLogoUrl(download);
        setLogoUploaded(true);
      } else {
        await saveImages([...savedImages, download]);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo subir la imagen. Revisa que hayas iniciado sesión.");
    } finally {
      setBusy(false);
    }
  };

  const moveImage = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= savedImages.length || imagesBusy) return;
    const copy = [...savedImages];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    try {
      await saveImages(copy);
    } catch (err) {
      fail("cover", err);
    }
  };

  const applyGenericImages = async () => {
    setConfirmGeneric(false);
    try {
      await saveImages([...DEFAULT_PLATFORM_HERO_IMAGES]);
      flash("cover", "Se pusieron las fotos genéricas.");
    } catch (err) {
      fail("cover", err);
    }
  };

  // Redes
  const socialTips = {
    instagram: isInstagram(instagram) ? "" : "Usa @usuario o https://instagram.com/usuario.",
    facebook: isFacebook(facebook) ? "" : "Usa el nombre de la página o https://facebook.com/pagina.",
    x: isX(x) ? "" : "Usa @usuario o https://x.com/usuario (también twitter.com).",
    youtube: isYoutube(youtube) ? "" : "Usa @canal o https://youtube.com/@canal, /c/ o /channel/.",
    whatsapp: isWhatsapp(whatsapp) ? "" : "Escribe de 10 a 13 dígitos.",
  };
  const socialDirty =
    instagram !== saved.instagram ||
    facebook !== saved.facebook ||
    x !== saved.x ||
    youtube !== saved.youtube ||
    whatsapp.trim() !== saved.whatsapp.trim();
  const socialReady =
    socialDirty && Object.values(socialTips).every((tip) => !tip) && !saving;

  const saveSocialForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialReady) return;
    void run("social", async () => {
      await saveSocial({
        instagram,
        facebook,
        x,
        youtube,
        whatsapp: whatsapp.replace(/\D/g, ""),
      });
      afterSave();
      flash("social", "Redes guardadas.");
    });
  };

  const displayImages =
    savedImages.length > 0 ? savedImages : DEFAULT_PLATFORM_HERO_IMAGES;
  const logoPreview = logoUrl && !logoTip ? logoUrl : "";
  const logoUploadLocked = busy || (!logoUploaded && Boolean(logoUrl));
  const carouselUploadLocked = busy || imagesBusy || carouselFull;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <SectionCard title="Header" icon={<Shield size={16} color={C.amber} />}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Logo y nombre de la barra superior, en todas las páginas.
        </p>
        <form
          onSubmit={saveHeaderForm}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <div className="header-brand-row">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: RADIUS.lg,
                border: `1px solid ${C.gray200}`,
                overflow: "hidden",
                backgroundColor: C.navy900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ color: C.amber, fontWeight: 800 }}>Logo</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Field
                label="Logo"
                hint={logoUploaded && logoUrl ? "Viene del logo subido. Quítalo para pegar otra URL." : "Opcional."}
                tip={logoError || logoTip}
              >
                <FormInput
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(webUrl(e.target.value, LIMIT.logoUrl))}
                  placeholder="URL del logo o súbelo"
                  maxLength={LIMIT.logoUrl}
                  readOnly={logoUploaded && Boolean(logoUrl)}
                  aria-invalid={Boolean(logoError || logoTip)}
                />
              </Field>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <label
                  title={!logoUploaded && logoUrl ? "Borra la URL del logo para subir un archivo." : undefined}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    width: "fit-content",
                    padding: "0.4rem 0.8rem",
                    borderRadius: RADIUS.md,
                    border: `1px solid ${C.gray300}`,
                    backgroundColor: C.white,
                    color: C.gray600,
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: logoUploadLocked ? "not-allowed" : "pointer",
                    opacity: logoUploadLocked && !busy ? 0.5 : 1,
                  }}
                >
                  <UploadCloud size={14} /> {busy ? "Subiendo..." : "Subir logo"}
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    disabled={logoUploadLocked}
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file, "logo");
                      e.target.value = "";
                    }}
                  />
                </label>
                {logoUploaded && logoUrl && (
                  <SecondaryButton
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setLogoUrl("");
                      setLogoUploaded(false);
                      setLogoError("");
                    }}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    <XIcon size={14} /> Quitar logo
                  </SecondaryButton>
                )}
              </div>
            </div>
          </div>
          <Field label="Nombre" tip={name !== saved.name ? nameTip : ""}>
            <FormInput
              value={name}
              maxLength={LIMIT.name}
              onChange={(e) => setName(platformName(e.target.value))}
              placeholder={PLATFORM_NAME}
              aria-invalid={name !== saved.name && Boolean(nameTip)}
            />
          </Field>
          <Field label="Lema" hint="Opcional." tip={mottoTip}>
            <FormInput
              value={motto}
              maxLength={LIMIT.motto}
              onChange={(e) => setMotto(platformMotto(e.target.value))}
              placeholder="Pasión por el fútbol, comunidad en cada partido."
              aria-invalid={Boolean(mottoTip)}
            />
          </Field>
          {notice?.area === "header" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" disabled={!headerReady} style={{ width: "fit-content" }}>
            {saving === "header" ? "Guardando..." : "Guardar header"}
          </PrimaryButton>
        </form>
      </SectionCard>

      <SectionCard title="Portada" icon={<ImageIcon size={16} color={C.amber} />}>
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Carrusel, título y texto de la página de inicio.
        </p>
        <form
          onSubmit={saveCover}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          <Field label="Título" tip={headlineTip} count={`${headline.length}/${LIMIT.headline}`}>
            <FormInput
              value={headline}
              maxLength={LIMIT.headline}
              onChange={(e) => setHeadline(coverHeadline(e.target.value))}
              placeholder={PLATFORM_HEADLINE}
              aria-invalid={Boolean(headlineTip)}
            />
          </Field>
          <Field
            label="Texto debajo del título"
            tip={taglineTip}
            count={`${tagline.length}/${LIMIT.tagline}`}
          >
            <FormTextarea
              rows={3}
              value={tagline}
              maxLength={LIMIT.tagline}
              onChange={(e) => setTagline(coverTagline(e.target.value))}
              placeholder={PLATFORM_DESCRIPTION}
              aria-invalid={Boolean(taglineTip)}
              style={{ resize: "none" }}
            />
          </Field>
          {notice?.area === "cover" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" disabled={!coverReady} style={{ width: "fit-content" }}>
            {saving === "cover" ? "Guardando..." : "Guardar textos"}
          </PrimaryButton>
        </form>

        <div
          style={{
            margin: "1.25rem 0 0.75rem",
            fontSize: "0.7rem",
            fontWeight: 800,
            color: C.gray500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Fotos del carrusel ({savedImages.length}/{MAX_HERO_IMAGES})
        </div>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.8rem", color: C.gray500 }}>
          Agrega, quita u ordena hasta {MAX_HERO_IMAGES} fotos. Si la lista queda vacía se
          usan imágenes genéricas.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {displayImages.map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                position: "relative",
                borderRadius: RADIUS.lg,
                overflow: "hidden",
                border: `1px solid ${C.gray200}`,
                aspectRatio: "16 / 9",
              }}
            >
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {savedImages.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <OrderBtn
                      label="Subir"
                      disabled={i === 0 || imagesBusy}
                      onClick={() => void moveImage(i, -1)}
                    >
                      <ChevronUp size={14} />
                    </OrderBtn>
                    <OrderBtn
                      label="Bajar"
                      disabled={i === savedImages.length - 1 || imagesBusy}
                      onClick={() => void moveImage(i, 1)}
                    >
                      <ChevronDown size={14} />
                    </OrderBtn>
                  </div>
                  <button
                    type="button"
                    disabled={imagesBusy}
                    onClick={() => {
                      void saveImages(savedImages.filter((_, idx) => idx !== i)).catch((err) =>
                        fail("cover", err),
                      );
                    }}
                    title="Quitar"
                    style={{
                      border: "none",
                      background: "rgba(0,0,0,0.55)",
                      color: C.white,
                      borderRadius: RADIUS.full,
                      width: 28,
                      height: 28,
                      cursor: imagesBusy ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <SecondaryButton
          type="button"
          disabled={imagesBusy || busy}
          onClick={() => {
            if (savedImages.length > 0) setConfirmGeneric(true);
            else void applyGenericImages();
          }}
          style={{ marginBottom: "0.85rem", width: "fit-content" }}
        >
          Empezar con las fotos genéricas
        </SecondaryButton>
        {carouselFull && (
          <p style={{ margin: "0 0 0.6rem", color: C.amber, fontSize: "0.75rem" }}>
            Máximo {MAX_HERO_IMAGES} fotos. Quita una para añadir otra.
          </p>
        )}
        <form onSubmit={addUrl} noValidate className="cover-add-row">
          <Field label="Añadir por URL" tip={carouselError || urlTip}>
            <FormInput
              value={url}
              onChange={(e) => setUrl(webUrl(e.target.value, LIMIT.imageUrl))}
              placeholder="https://..."
              maxLength={LIMIT.imageUrl}
              disabled={carouselFull}
              aria-invalid={Boolean(carouselError || urlTip)}
            />
          </Field>
          <PrimaryButton type="submit" disabled={!canAddUrl} className="cover-add-row__btn">
            Añadir
          </PrimaryButton>
          <label
            className={
              carouselUploadLocked ? "cover-add-row__upload is-disabled" : "cover-add-row__upload"
            }
          >
            <UploadCloud size={14} /> {busy ? "Subiendo..." : "Subir archivo"}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              disabled={carouselUploadLocked}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file, "carousel");
                e.target.value = "";
              }}
            />
          </label>
        </form>
      </SectionCard>

      <SectionCard
        title="Redes sociales"
        icon={<Share2 size={16} color={C.amber} />}
      >
        <p style={{ margin: "0 0 1rem", fontSize: "0.8rem", color: C.gray500 }}>
          Aparecen al pie de la página: «Nos puedes encontrar también en».
        </p>
        <form
          onSubmit={saveSocialForm}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <Field
            label="Instagram"
            hint="Usuario o URL. Ej. @orinco o https://instagram.com/orinco"
            tip={socialTips.instagram}
          >
            <FormInput
              value={instagram}
              maxLength={LIMIT.social}
              onChange={(e) => setInstagram(socialHandle(e.target.value, LIMIT.social))}
              placeholder="@usuario"
              aria-invalid={Boolean(socialTips.instagram)}
            />
          </Field>
          <Field
            label="Facebook"
            hint="Página o URL. Ej. orinco o https://facebook.com/orinco"
            tip={socialTips.facebook}
          >
            <FormInput
              value={facebook}
              maxLength={LIMIT.social}
              onChange={(e) => setFacebook(socialHandle(e.target.value, LIMIT.social))}
              placeholder="https://facebook.com/..."
              aria-invalid={Boolean(socialTips.facebook)}
            />
          </Field>
          <Field
            label="X"
            hint="Usuario o URL. Ej. @orinco o https://x.com/orinco"
            tip={socialTips.x}
          >
            <FormInput
              value={x}
              maxLength={LIMIT.social}
              onChange={(e) => setX(socialHandle(e.target.value, LIMIT.social))}
              placeholder="https://x.com/..."
              aria-invalid={Boolean(socialTips.x)}
            />
          </Field>
          <Field
            label="YouTube"
            hint="Canal o URL. Ej. @orinco o https://youtube.com/@orinco"
            tip={socialTips.youtube}
          >
            <FormInput
              value={youtube}
              maxLength={LIMIT.social}
              onChange={(e) => setYoutube(socialHandle(e.target.value, LIMIT.social))}
              placeholder="https://youtube.com/@..."
              aria-invalid={Boolean(socialTips.youtube)}
            />
          </Field>
          <Field
            label="WhatsApp"
            hint="Número de la empresa. Ej. 622 123 4567"
            tip={socialTips.whatsapp}
          >
            <FormInput
              value={whatsapp}
              maxLength={LIMIT.whatsapp}
              inputMode="numeric"
              onChange={(e) => setWhatsapp(whatsappText(e.target.value))}
              placeholder="622 123 4567"
              aria-invalid={Boolean(socialTips.whatsapp)}
            />
          </Field>
          {notice?.area === "social" && (
            <p style={{ margin: 0, color: notice.ok ? C.green : C.red, fontSize: "0.8rem" }}>
              {notice.text}
            </p>
          )}
          <PrimaryButton type="submit" disabled={!socialReady} style={{ width: "fit-content" }}>
            {saving === "social" ? "Guardando..." : "Guardar redes"}
          </PrimaryButton>
        </form>
      </SectionCard>

      <ConfirmModal
        open={confirmGeneric}
        title="Usar fotos genéricas"
        message="¿Estás seguro? Esto reemplazará tus fotos actuales con las imágenes genéricas."
        confirmLabel="Reemplazar"
        danger
        busy={imagesBusy}
        onConfirm={() => void applyGenericImages()}
        onCancel={() => setConfirmGeneric(false)}
      />
    </div>
  );
}

function OrderBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 26,
        height: 22,
        border: "none",
        borderRadius: RADIUS.sm,
        background: "rgba(0,0,0,0.55)",
        color: C.white,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
