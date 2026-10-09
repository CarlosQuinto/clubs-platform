# Sanity: Clubs Platform

## Contexto

Este plan es una revisión rápida, de unos 45 minutos, para confirmar después de cada despliegue que lo esencial funciona:
- entrar a la aplicación;
- que cada rol vea lo suyo y nada más;
- que se puedan crear datos;
- que salgan los correos;
- que se suban imágenes;
- que la parte pública esté bien.

No sustituye una regresión completa. Se hace en https://orincofutbol7.duckdns.org.

Ese servidor no tiene datos de demo (`DB_SEED=false`), así que el plan **crea sus propios datos** en orden: cada bloque usa lo que dejó el anterior. Usa nombres con el prefijo `QA` para reconocerlos y limpiarlos al final.

Lo que ya verifica el smoke automático (`npm run docker:smoke`, 39 comprobaciones) no se repite a mano:
- permisos de tablas y funciones;
- login correcto y contraseña incorrecta;
- token de recuperación de un solo uso;
- subida y rechazo en Storage;
- que `/fn` exija sesión.

Este plan se concentra en lo que el smoke no cubre: la interfaz, los correos reales, el marcador en vivo, la programación de partidos, finanzas, canchas, anuncios y la PWA.

**Qué necesitas:**
- Un navegador de escritorio y un celular.
- Una ventana de incógnito.
- Cuatro correos a los que tengas acceso. Con Gmail sirven los alias `tucorreo+pres@gmail.com`, `+dt`, `+tes` y `+prensa`.

**Leyenda:**
- **[C]** crítico: si falla, no se da por bueno el despliegue.
- **[M]** importante: se anota y se arregla.

---

## 0. Antes de empezar (2 min)
1. **[C]** Lo que se reporta en `/desplegar`:
   - CI en verde;
   - todos los servicios `Up` o `healthy`;
   - sitio, auth y rpc responden 200, y studio 401.
2. **[C]** Recarga dura (Ctrl+Shift+R) y abre la consola del navegador (F12). Durante todo el plan no debería aparecer ningún error rojo, aparte de los 401 esperados cuando no hay sesión.

## 1. Público sin sesión (incógnito) (5 min)
1. **[C]** `/` carga con carrusel, temporada, sección «Próximos partidos» y torneos, sin pantallas en blanco.
2. **[C]** Navega por `/torneos`, `/equipos`, `/partidos`, `/contacto` y `/registrar-equipo`. Ninguno da error.
3. **[M]** `/canchas` aparece en la barra solo si el módulo está activo; si no, ahí está «Contacto».
4. **[M]** `/terminos` y `/aviso-de-privacidad` cargan.
5. **[M]** Una ruta inexistente como `/xyz-no-existe` muestra «Club no encontrado». `/a/b/c` redirige al inicio.
6. **[C]** `/admin` sin sesión lleva a `/login?next=/admin`.

## 2. Cuentas y superadmin (6 min)
1. **[C]** Solo si la base está vacía: regístrate en `/registro` y quedas como superadmin, con acceso a `/admin`. Si ya hay cuenta, entra con ella.
2. **[C]** Cierra sesión desde el selector de espacios y vuelve a entrar.
3. **[C]** Una contraseña incorrecta muestra «Correo o contraseña incorrectos».
4. **[C]** Restablecer contraseña:
   - «Olvidé mi contraseña» envía el correo;
   - el enlace abre `/restablecer` y guarda la contraseña nueva;
   - entras con ella;
   - el mismo enlace, abierto otra vez, dice que venció o ya se usó.
5. **[C]** En incógnito, `/registro` con un correo sin invitación muestra «Necesitas una invitación para registrarte».
6. **[M]** Recién corregido: en `/admin`, empieza a llenar un formulario (por ejemplo, «Nuevo jugador» en `?tab=players`). Cambia a WhatsApp o a otra pestaña unos 30 segundos y vuelve. Lo escrito sigue ahí.

## 3. Datos base (8 min)
1. **[C]** En `/torneos`:
   - con **Temporadas**, crea la temporada `QA 2026`;
   - con **Crear torneo**, crea el torneo `QA Copa` con una categoría nueva.
2. **[C]** En `/equipos` → **Registrar equipo**:
   - crea `QA Club A` con slug, una localidad nueva («+ Nueva localidad») y el correo de presidente `+pres`;
   - aparece el enlace de registro;
   - crea también `QA Club B`, sin presidente.
3. **[C]** El buscador de `/equipos` encuentra `QA` (con 3 letras o más).
4. **[M]** La tarjeta lleva a la página del club.
5. **[M]** En `/equipos`, el «⋯» de la tarjeta de `QA Club B` → **Desactivar club**, dando un motivo de 5 caracteres o más:
   - en incógnito se ve el banner con el motivo y el club no sale en `/equipos`;
   - como superadmin aparece al final de `/equipos` en «Equipos ocultos»;
   - desde su «⋯» ahí mismo, actívalo de nuevo;
   - con «⋯» → **Editar información**, cambia el teléfono del presidente: se ve en la tarjeta.
6. **[M]** En **Contenido → Portada**, cambia el eslogan y sube una imagen al carrusel. Se ven en `/`.
7. **[M]** En **Administradores**:
   - invita a otro correo y llega el correo;
   - cancela la invitación.

## 4. Invitaciones y roles del club (8 min)
1. **[C]** En incógnito, abre el enlace de registro de `+pres`:
   - registro con nombre y contraseña;
   - entra como Presidente de `QA Club A`;
   - el selector de espacios lo muestra.
2. **[C]** Como Presidente, en la pestaña **Administradores**, invita a `+dt` (DT), `+tes` (Tesorero) y `+prensa` (Prensa). Llegan los tres correos.
3. **[C]** Registra al menos al DT y al Tesorero desde sus enlaces.
4. **[C]** Cada rol ve solo lo suyo:
   - **DT:** Agenda, Jugadores, Inventario.
   - **Tesorero:** Finanzas e Inventario.
   - **Prensa:** solo Inicio, con portada y galería.
   - **Ninguno de los tres** ve Administradores.
5. **[C]** El visitante en incógnito ve el club, pero Finanzas e Inventario aparecen vacíos y no ve Administradores.
6. **[M]** Un usuario que ya tiene cuenta recibe la invitación con el enlace `/invitar`. Pruébalo:
   - aceptar funciona estando logueado con ese correo;
   - con el enlace `&accion=rechazar` se rechaza sin sesión.

## 5. Jugadores (6 min)
1. **[C]** Como DT de `QA Club A`:
   - agrega 3 jugadores, uno con foto;
   - edita un dorsal;
   - da de baja temporal a uno y luego reactívalo.
2. **[C]** En `/admin?tab=players`:
   - crea `QA Libre` sin club; el filtro «Sin club» lo encuentra;
   - como DT, «¿Ya juega en otro club?» lo encuentra y lo suma.
3. **[M]** En `/admin?tab=players`, crea un duplicado y únelo con «Unir duplicado», confirmando con el nombre. Queda una sola ficha, con todos sus clubes.
4. **[C]** «Ver ficha completa» abre `/jugadores/:id`:
   - funciona también en incógnito;
   - muestra la edad, nunca la fecha de nacimiento.

## 6. Torneo, programación y marcador en vivo (8 min)
1. **[C]** En `/torneos/<QA Copa>`, inscribe `QA Club A` y `QA Club B`:
   - se genera el calendario;
   - llega el correo de inscripción.
2. **[C]** Programa un partido para **ahora mismo** (fecha, hora y cancha). Llega el correo de programación.
3. **[C]** El partido aparece «En vivo» en `/`, y `/partido/:id` en incógnito se actualiza solo en unos 15 s.
4. **[C]** «Marcador en vivo»:
   - agrega un gol con goleador y asistente;
   - agrega una amarilla;
   - borra un gol;
   - «Finalizar partido».
5. **[C]** Después de finalizar:
   - la tabla de posiciones y los goleadores se actualizan;
   - el nombre del goleador lleva a su ficha;
   - en la ficha, la sección de carrera cuenta el partido, el gol y la tarjeta.
6. **[M]** En otro partido, «No se presentó» y después «Deshacer».

## 7. Finanzas, canchas y anuncios (6 min)
1. **[C]** En **Finanzas**:
   - con una tarifa de inscripción y de tarjeta amarilla en `QA 2026`, aparecen los cargos automáticos de `QA Club A`;
   - marca uno como pagado y luego como no pagado.
2. **[M]** El Tesorero ve «Cuenta con la liga» con esos mismos cargos.
3. **[M]** El Tesorero, en **Finanzas** del club, registra un movimiento y una meta con aportes.
4. **[M]** En **Canchas**:
   - crea `QA Cancha` con horario;
   - aparta un bloque con anticipo y llega el correo;
   - cancélalo;
   - en `/canchas`, elegir un horario termina en WhatsApp.
5. **[M]** En **Anuncios**, crea uno en `home` con imagen. Se ve en `/`, y al pausarlo desaparece.

## 8. Formularios públicos y bandeja (3 min)
1. **[C]** En incógnito:
   - envía `/contacto`;
   - envía `/registrar-equipo` con el correo de prueba.
2. **[C]** En **Bandeja** aparecen los dos. Aprueba la solicitud:
   - se crea el club;
   - llega el correo al capitán con el enlace de registro.
3. **[M]** Rechaza otra solicitud, dando el motivo. Llega el correo de rechazo.

## 9. Móvil y PWA (3 min)
1. **[C]** En el celular:
   - inicio, club, torneo y partido se ven sin scroll horizontal;
   - el menú abre y se puede iniciar sesión.
2. **[M]** Instala la PWA («Agregar a pantalla de inicio») y comprueba que abre.
3. **[M]** Tras un despliegue nuevo, la PWA se actualiza sola al recargar, sin quedarse en la versión vieja.
4. **[M]** Llena un formulario, cambia a WhatsApp y vuelve. No se pierde, salvo que el sistema haya cerrado la pestaña.

## 10. Limpieza (2 min)
- Borra `QA Club A`, `QA Club B` y el club creado desde la bandeja desde el «⋯» de su tarjeta en `/equipos`, confirmando con el slug.
- Borra el anuncio y la cancha, o desactívalos.
- Borra el torneo `QA Copa`. Solo se puede si no tiene partidos jugados; si no, déjalo como dato de prueba.
- Las cuentas `+pres`, `+dt`, etc. pueden quedarse para el próximo sanity: así te saltas el bloque 4.1–4.3 y bastan unos 30 minutos.

---

## Criterio de salida
- **Todos los [C] en verde:** el despliegue queda bueno.
- **Algún [C] falla:** rollback con `/desplegar`, volviendo a `PREV`, y tarjeta en Trello.
- **Fallos [M]:** se anotan en Trello y se corrigen en el siguiente ciclo.
