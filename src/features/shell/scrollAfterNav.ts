/** Sobrevive al remonte del layout al cambiar de ruta. */
let scrollTopAfterNav = false;

/** Los enlaces fuera del pie marcan el tope antes de navegar. */
export function markScrollTopAfterNav() {
  scrollTopAfterNav = true;
}

export const shouldScrollTopAfterNav = () => scrollTopAfterNav;

export function clearScrollTopAfterNav() {
  scrollTopAfterNav = false;
}
