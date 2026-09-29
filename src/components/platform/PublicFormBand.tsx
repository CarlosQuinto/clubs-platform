import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Banda gris para formularios públicos (contacto / registrar equipo). */
export default function PublicFormBand({ children }: { children: ReactNode }) {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== "#formulario") return;
    const el = document.getElementById("formulario");
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <section id="formulario" className="public-form-band">
      <div className="public-form-card">{children}</div>
    </section>
  );
}
