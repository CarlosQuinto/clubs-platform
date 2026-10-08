import { useState } from "react";
import { Share2 } from "lucide-react";

/** Comparte la página actual con el menú nativo del teléfono o, si no hay, copia el enlace (partido y resumen de temporada). */
export default function ShareButton({ text, className = "match-hero__share" }: { text: string; className?: string }) {
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
    <button type="button" className={className} onClick={() => void share()}>
      <Share2 size={14} />
      {copied ? "Enlace copiado" : "Compartir"}
    </button>
  );
}
