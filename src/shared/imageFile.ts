export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Lee la cabecera real del archivo: JPEG, PNG o WEBP. La extensión y el tipo del navegador no cuentan. */
export async function isAllowedImage(file: File) {
  if (file.size === 0 || file.size >= IMAGE_MAX_BYTES) return false;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const png =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a;
  const text = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  const webp = text(0, 4) === "RIFF" && text(8, 12) === "WEBP";
  return jpeg || png || webp;
}
