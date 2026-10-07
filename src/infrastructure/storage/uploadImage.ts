import imageCompression from "browser-image-compression";
import { env } from "../env";
import { supabase } from "../supabase";

/** Bucket público de imágenes (db/migrations/0004_storage.sql). */
const BUCKET = "media";

/** Comprime y sube una imagen; devuelve su URL pública. */
export async function uploadImageFile(
  path: string,
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    initialQuality?: number;
  },
) {
  const compressed = await imageCompression(file, {
    maxSizeMB: options?.maxSizeMB ?? 0.8,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
    initialQuality: options?.initialQuality,
  });
  const contentType =
    (compressed.type?.startsWith("image/") && compressed.type) ||
    (file.type?.startsWith("image/") && file.type) ||
    "image/jpeg";
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType,
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw new Error(error.message || "No se pudo subir la imagen.");
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** true si la URL apunta a un archivo de nuestro bucket (y no a una imagen externa). */
export function isStoredImageUrl(url: string | null | undefined) {
  return Boolean(url && url.startsWith(env.mediaPublicBase));
}

/** Ruta dentro del bucket a partir de una URL pública o de una ruta. */
export function storedImagePath(urlOrPath: string) {
  if (!urlOrPath.startsWith(env.mediaPublicBase)) return urlOrPath;
  return decodeURIComponent(urlOrPath.slice(env.mediaPublicBase.length).split("?")[0]);
}

/** Borra el archivo del bucket que corresponde a una URL pública o a una ruta. */
export async function deleteStoredImage(urlOrPath: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([storedImagePath(urlOrPath)]);
  if (error) throw new Error(error.message || "No se pudo borrar la imagen.");
}
