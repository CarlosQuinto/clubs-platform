import { useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Comparte la página actual con el menú nativo del teléfono o, si no hay, copia el enlace (partido y resumen de temporada).
 * `iconOnly` deja solo el ícono; el texto aparece únicamente para avisar «Enlace copiado».
 */
export default function ShareButton({
  text,
  className = "match-hero__share",
  iconOnly = false,
}: {
  text: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Cancelar el menú de compartir no es un error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
    }
  };
  return (
    <button
      type="button"
      className={className}
      onClick={() => void share()}
      aria-label={iconOnly ? "Compartir" : undefined}
      title={iconOnly ? "Compartir" : undefined}
    >
      <Share2 size={iconOnly ? 18 : 14} />
      {copied ? "Enlace copiado" : iconOnly ? null : "Compartir"}
    </button>
  );
}
