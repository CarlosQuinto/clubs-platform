import { registerSW } from "virtual:pwa-register";

const RELOADED_AT_KEY = "pwa-reloaded-at";
const MIN_RELOAD_GAP_MS = 60_000;

/**
 * Registra el service worker de la PWA (modo autoUpdate). Tras un despliegue, el service worker nuevo
 * toma el control al instante, pero la pestaña ya abierta seguiría con el bundle anterior del precache:
 * por eso, al activarse una versión nueva, recargamos la página.
 *
 * Con freno: una recarga por minuto como máximo. Justo después de un despliegue el CDN puede entregar
 * alternadamente el `sw.js` viejo y el nuevo; sin el freno cada cambio recargaría la pestaña y la página
 * se vería unos milisegundos antes de volver a cargarse, una y otra vez. Si toca frenar, la pestaña se
 * queda con la versión que ya tiene (completa y coherente) y la siguiente navegación carga la definitiva.
 */
export function registerPwa() {
  registerSW({
    immediate: true,
    onNeedReload() {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOADED_AT_KEY)) || 0;
      } catch {
        /* sin sessionStorage (modo privado estricto): recargamos igual */
      }
      if (Date.now() - last < MIN_RELOAD_GAP_MS) return;
      try {
        sessionStorage.setItem(RELOADED_AT_KEY, String(Date.now()));
      } catch {
        /* idem */
      }
      window.location.reload();
    },
  });
}
