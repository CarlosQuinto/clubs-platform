import imageCompression from "browser-image-compression";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

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

/** Borra el archivo de Storage que corresponde a una URL de descarga o a una ruta. */
export async function deleteStoredImage(urlOrPath: string) {
  await deleteObject(ref(storage, urlOrPath));
}
