# Clubs Platform

Plataforma web multi-club para la gestión de clubes deportivos organizados por localidad. Un **super administrador** crea clubes y les asigna una URL pública (`/jogabonitofc`), y cada club administra su propia página (portada, agenda, jugadores, finanzas, inventario y galería) con sus propios usuarios y roles.

Deriva de la plantilla [Sports-Club-Management-Platform](https://github.com/CarlosQuinto/Sports-Club-Management-Platform): misma interfaz y módulos, pero con datos aislados por club, autenticación con Firebase Auth (correo y contraseña) y permisos validados en las reglas de Firestore.

## Rutas

| Ruta      | Descripción                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `/`                 | Home pública: carrusel, próximos partidos, torneos, temporadas y clubes por categoría. |
| `/login`            | Iniciar sesión, crear cuenta y recuperar contraseña. Acepta `?next=/ruta`. |
| `/admin`            | Superadmin: clubes, categorías, temporadas, torneos, partidos y portada. |
| `/torneos/:id`      | Ficha pública del torneo: tabla, goleadores, calendario y podio. |
| `/temporadas/:id`   | Torneos de una temporada. |
| `/:slug`            | Página del club (agenda, jugadores, finanzas…). |

Los slugs se normalizan (`JogaBonitoFC` → `jogabonitofc`), así que la URL no distingue mayúsculas ni acentos.

## Flujo de uso

1. **Arranque de la plataforma.** La primera persona que crea una cuenta ve en `/` el aviso *"Reclamar administración"*. Al aceptarlo se crea `platform/config` con su `uid` como super administrador. Solo puede hacerse una vez (la regla de Firestore impide crear el documento si ya existe).
2. **Categorías, temporadas y clubes.** En `/admin` el superadmin crea categorías (Primera, Segunda…), temporadas, localidades y clubes. Las categorías son de los **torneos**, no de los equipos: un club puede jugar en varias divisiones. Puede activar, desactivar o eliminar clubes.
3. **Torneos.** Un torneo pertenece a una temporada y se abre en una o varias categorías (una liga por división). El superadmin inscribe cualquier club y programa partidos. Al cerrar el torneo se calcula el podio (1º, 2º, 3º) para la vitrina de cada equipo.
4. **Administradores de club.** El presidente entra en `/login` con el correo invitado. Desde **Miembros** invita al cuerpo técnico. En la agenda el club solo crea **entrenamientos** y **amistosos**; los partidos oficiales llegan de los torneos.
5. **Estadísticas.** Goles, asistencias, tarjetas y récord de equipo salen de los partidos de torneo. Se pueden filtrar por temporada, categoría o ver el histórico. Los amistosos cuentan como entrenamiento.
6. **Visitantes.** Cualquiera ve la home, los torneos y la página de un club activo.

## Roles y permisos

| Rol                 | Portada y galería | Agenda y jugadores | Finanzas | Inventario | Miembros |
| ------------------- | :---------------: | :----------------: | :------: | :--------: | :------: |
| Super administrador |         ✔         |          ✔         |     ✔    |      ✔     |     ✔    |
| Presidente (`admin`)|         ✔         |          ✔         |     ✔    |      ✔     |     ✔    |
| D. Técnico (`dt`)   |         –         |          ✔         | arbitraje |      ✔     |     –    |
| Tesorero            |         –         |          –         |     ✔    |      ✔     |     –    |
| Prensa              |         ✔         |          –         |     –    |      –     |     –    |

La matriz vive en `src/lib/roles.ts` (`buildPerms`) y se replica en `firestore.rules` y `storage.rules`.

## Modelo de datos (Cloud Firestore)

```text
platform/config                     { superAdmins: [uid], heroImages }
localities/{id}                     { name }
categories/{id}                     { name, order }
seasons/{id}                        { name, startDate, endDate, active }
tournaments/{id}                    { name, seasonId, categoryId, clubIds, status, podium }
matches/{id}                        { tournamentId, seasonId, categoryId, homeClubId, awayClubId,
                                      clubIds, date, time, status, homeScore, awayScore, sides }
users/{uid}                         { email, displayName }
clubs/{slug}                        { slug, name, localityId, categoryId, location, description,
                                      logoUrl, heroImages, defaultLineups, active }
clubs/{slug}/members/{uid}          { role, email, displayName }
clubs/{slug}/invites/{emailKey}     { email, role }
clubs/{slug}/players|events|transactions|inventory|gallery|goals
```

Las imágenes de club van en `clubs/{slug}/{logos|portada|gallery|players|events}/`. El carrusel de portada en `platform/carousel/`.

## Tecnologías

React 18 · TypeScript · Vite · React Router · Firebase (Auth, Firestore, Storage, Hosting) · Lucide React · PWA (`vite-plugin-pwa`).

## Instalación

```bash
npm install
cp .env.example .env   # rellena con la config de tu app web de Firebase
npm run dev
```

Variables de entorno (`.env`): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

## Configuración de Firebase

1. Crea el proyecto y una app web; copia su configuración al `.env`.
2. Habilita **Authentication → Correo/contraseña** (o despliega `firebase.json`, que incluye el bloque `auth`).
3. Crea la base de datos de **Cloud Firestore**.
4. **Storage** (opcional, para subir imágenes desde la app): en la consola, Storage → *Comenzar*. En proyectos nuevos requiere el plan Blaze. Sin Storage la app sigue funcionando pegando URLs de imágenes.
5. Despliega reglas y hosting:

   ```bash
   npm run build
   firebase deploy --only hosting,firestore:rules,auth      # + ",storage" cuando Storage esté activo
   ```

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # compilación de producción en dist/
npm run preview   # sirve la compilación localmente
```

## Despliegue automático (GitHub Actions)

`.github/workflows/` despliega a Hosting en cada push a `main` y crea canales de vista previa en cada pull request. Configura en el repositorio (Settings → Secrets and variables → Actions):

- Secret `FIREBASE_SERVICE_ACCOUNT` (lo genera `firebase init hosting:github`).
- Secrets `VITE_FIREBASE_*` con los valores de tu `.env`.
- Variable `FIREBASE_PROJECT_ID`.

Sin `FIREBASE_SERVICE_ACCOUNT` el workflow compila pero omite el despliegue.

## Estructura

```text
src/
├── components/
│   ├── club/        MembersModal (miembros e invitaciones)
│   ├── platform/    PlatformLayout (cabecera de landing/login/admin)
│   └── ...          módulos de agenda, finanzas, portada, jugadores
├── context/         AuthContext (sesión, superadmin) · ClubContext (club activo)
├── hooks/           useClubData(clubId) · useMembership(clubId)
├── lib/             firebase.ts · paths.ts (rutas Firestore/Storage) · roles.ts · clubDefaults.ts
└── pages/           Landing · Login · SuperAdmin · ClubPage · Agenda · Players · Inventory
```
