import imageCompression from "browser-image-compression";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/** Comprime y sube una imagen con contentType explícito (evita 403 en Storage). */
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
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, compressed, {
    contentType,
    cacheControl: "public,max-age=31536000",
  });
  return getDownloadURL(fileRef);
}
