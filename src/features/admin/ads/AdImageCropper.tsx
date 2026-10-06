import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import ConfirmModal from "../../../shared/ConfirmModal";
import { C } from "../../../shared/ui";

/** Tamaño final del anuncio: banda ancha 4:1. */
export const AD_IMAGE_WIDTH = 1200;
export const AD_IMAGE_HEIGHT = 300;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen."));
    img.src = src;
  });
}

async function cropToFile(src: string, area: Area) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = AD_IMAGE_WIDTH;
  canvas.height = AD_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo recortar la imagen.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, AD_IMAGE_WIDTH, AD_IMAGE_HEIGHT);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, AD_IMAGE_WIDTH, AD_IMAGE_HEIGHT);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("No se pudo recortar la imagen.");
  return new File([blob], "anuncio.jpg", { type: "image/jpeg" });
}

/** Recorta la imagen elegida a 1200×300 antes de subirla. */
export default function AdImageCropper({
  file,
  onCancel,
  onDone,
}: {
  file: File | null;
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setSrc("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setError("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const confirm = async () => {
    if (!src || !area || busy) return;
    try {
      setBusy(true);
      onDone(await cropToFile(src, area));
    } catch (err) {
      console.error(err);
      setError("No se pudo recortar la imagen. Prueba con otra.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      open={Boolean(file)}
      title="Recortar imagen"
      message="Arrastra y acerca para encuadrar el anuncio. Se guarda a 1200×300."
      confirmLabel="Usar recorte"
      busy={busy}
      confirmDisabled={!area}
      onConfirm={() => void confirm()}
      onCancel={onCancel}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 180,
          background: C.gray900,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={AD_IMAGE_WIDTH / AD_IMAGE_HEIGHT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        )}
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.75rem",
          fontSize: "0.75rem",
          color: C.gray500,
        }}
      >
        Zoom
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </label>
      {error && <p style={{ margin: "0.5rem 0 0", color: C.red, fontSize: "0.8rem" }}>{error}</p>}
    </ConfirmModal>
  );
}
