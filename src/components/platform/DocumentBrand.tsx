import { useEffect } from "react";
import { usePlatformChrome } from "../../features/shell/usePlatformChrome";

const DEFAULT_ICON = "/icon.svg";

function iconMime(url: string): string | undefined {
  let path = url;
  try {
    path = decodeURIComponent(new URL(url, window.location.origin).pathname);
  } catch {
    path = url.split("?")[0] || url;
  }
  const ext = path.toLowerCase().split(".").pop();
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "ico":
      return "image/x-icon";
    default:
      return undefined;
  }
}

function upsertIcon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  const mime = iconMime(href);
  if (mime) link.type = mime;
  else link.removeAttribute("type");
  link.href = href;
}

/** Título de la pestaña y favicon según el Header guardado en HeroAdmin. */
export default function DocumentBrand() {
  const chrome = usePlatformChrome(true);

  useEffect(() => {
    document.title = chrome.brandName;
    upsertIcon(chrome.logoUrl || DEFAULT_ICON);
  }, [chrome]);

  return null;
}
