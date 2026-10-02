# ⚽ Clubs Platform

> Plataforma web moderna para la gestión integral de clubes deportivos organizados por localidad

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

## 🎯 Descripción

**Clubs Platform** es una solución todo-en-uno para administrar múltiples clubes deportivos desde una única plataforma. Un **super administrador** centraliza la creación de clubes, categorías y temporadas, mientras que cada club gestiona su propia información con acceso granular por roles.

La plataforma es pública: cualquiera puede ver torneos, standings, calendarios y fichas de clubes. Los miembros del club acceden con credenciales para administrar agenda, jugadores, finanzas e inventario.

**Inspirada en:** [Sports-Club-Management-Platform](https://github.com/CarlosQuinto/Sports-Club-Management-Platform)  
**Demo en vivo:** [clubs-platform-aem9u.web.app](https://clubs-platform-aem9u.web.app)

---

## ✨ Características principales

### 🏢 Gestión multi-club
- **Super administrador** centraliza clubes, categorías, localidades y temporadas
- Cada club tiene su propia URL pública: `/jogabonitofc`, `/atleticomadrid`, etc.
- URLs normalizadas (sin mayúsculas, sin acentos)
- Datos completamente aislados por club

### 📅 Agenda y calendario
- Entrenamientos, partidos amistosos y oficiales
- Calendario público e histórico de eventos
- Notificaciones a miembros del club

### 🏆 Torneos y estadísticas
- Crear torneos por temporada y categoría
- Tablas de posiciones, goleadores, tarjetas
- Podio automático al cerrar torneos
- Estadísticas filtradas por temporada, categoría o histórico

### 👥 Gestión de miembros
- Roles con permisos granulares: admin, D. Técnico, Tesorero, Prensa
- Invitaciones por correo
- Control de acceso por sección (Portada, Agenda, Finanzas, etc.)

### 💰 Módulo de finanzas
- Registro de transacciones y tesorería
- Control de arbitraje (solo D. Técnico)
- Historial e informes

### 🎽 Gestión de jugadores
- Perfiles con estadísticas (goles, asistencias, tarjetas)
- Alineaciones predeterminadas
- Galería de fotos y eventos

### 📦 Inventario
- Control de material deportivo
- Registro de equipamiento

### 🎨 Portada y galería
- Banner personalizado por club
- Galería de fotos
- Carrusel de portada global de la plataforma

### 📱 Progressive Web App (PWA)
- Funciona offline
- Instalable en dispositivos móviles
- Actualizaciones automáticas

---

## 🗂️ Estructura de datos (Cloud Firestore)

```
platform/config                     { superAdmins: [uid], heroImages }
├── localities/{id}                 { name }
├── categories/{id}                 { name, order }
├── seasons/{id}                    { name, startDate, endDate, active }
├── tournaments/{id}                { name, seasonId, categoryId, clubIds, status, podium }
├── matches/{id}                    { tournamentId, seasonId, categoryId, homeClubId, awayClubId,
│                                     clubIds, date, time, status, homeScore, awayScore, sides }
├── users/{uid}                     { email, displayName }
└── clubs/{slug}/
    ├── data                        { slug, name, localityId, categoryId, location, description,
    │                                 logoUrl, heroImages, defaultLineups, active }
    ├── members/{uid}               { role, email, displayName }
    ├── invites/{emailKey}          { email, role }
    ├── players
    ├── events
    ├── transactions
    ├── inventory
    ├── gallery
    └── goals
```

**Almacenamiento (Storage):**
- `clubs/{slug}/{logos|portada|gallery|players|events}/`
- `platform/carousel/`

---

## 🔐 Roles y permisos

| Rol | Portada | Agenda | Finanzas | Inventario | Miembros |
|-----|:-------:|:------:|:--------:|:----------:|:--------:|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Presidente (`admin`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| D. Técnico (`dt`) | ❌ | ✅ | 🔶 arbitraje | ✅ | ❌ |
| Tesorero | ❌ | ❌ | ✅ | ✅ | ❌ |
| Prensa | ✅ | ❌ | ❌ | ❌ | ❌ |

*Matriz de permisos:* `src/lib/roles.ts` → replicada en `firestore.rules` y `storage.rules`

---

## 🛣️ Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública: carrusel, próximos partidos, torneos, temporadas, clubes por categoría |
| `/login` | Autenticación: login, registro, recuperar contraseña. Soporta `?next=/ruta` |
| `/admin` | Panel de superadmin: clubes, categorías, temporadas, torneos, partidos, portada |
| `/torneos/:id` | Ficha pública: tabla, goleadores, calendario, podio |
| `/temporadas/:id` | Torneos de una temporada |
| `/:slug` | Página del club: agenda, jugadores, finanzas, inventario, galería, portada |

---

## 🚀 Flujo de uso

1. **Inicio:** La primera persona que se registra ve en `/` el botón *"Reclamar administración"*. Al aceptar, se convierte en super administrador.

2. **Setup inicial:** El super admin crea categorías (Primera, Segunda, etc.), temporadas, localidades y clubes en `/admin`.

3. **Torneos:** Se crean por temporada y categoría. El super admin inscribe clubes y programa partidos. Al cerrar, genera automáticamente podio.

4. **Administradores de club:** El presidente accede con correo invitado en `/login`. Desde *Miembros* invita al cuerpo técnico. Solo crean entrenamientos y amistosos; los partidos oficiales salen de torneos.

5. **Estadísticas:** Goles, asistencias, tarjetas y récords se generan de los partidos de torneo. Se filtran por temporada, categoría o se ven históricos. Los amistosos cuentan como partidos de club.

6. **Visitantes:** Cualquiera accede a landing, torneos y fichas de clubes activos sin login.

---

## 🛠️ Stack técnico

**Frontend:**
- **React 18** – UI moderna y reactiva
- **TypeScript** – Tipado estático para mayor seguridad
- **Vite** – Build ultrarrápido
- **React Router v7** – Navegación SPA
- **Lucide React** – Iconos ligeros y consistentes
- **CSS Modules** – Estilos scoped

**Backend & Datos:**
- **Firebase Auth** – Autenticación email/contraseña
- **Cloud Firestore** – Base de datos NoSQL en tiempo real
- **Firebase Storage** – Almacenamiento de imágenes
- **Firebase Hosting** – Despliegue automático

**Funciones & Email:**
- **Cloud Functions (Node.js 20)** – Lógica backend, triggers
- **Nodemailer** – Envío de correos (invitaciones, recuperación)

**DevOps:**
- **GitHub Actions** – CI/CD automático (build, deploy, preview channels)
- **PWA (Workbox)** – Soporte offline y instalable

---

## 📦 Instalación local

### Requisitos
- **Node.js 20+**
- **npm** o **yarn**
- Cuenta de **Firebase** con proyecto web

### Pasos

1. **Clonar repositorio:**
   ```bash
   git clone https://github.com/CarlosQuinto/clubs-platform.git
   cd clubs-platform
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Rellena con tu configuración de Firebase (obtén los valores en **Firebase Console → Project Settings → Web**):

   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=proyecto-123456
   VITE_FIREBASE_STORAGE_BUCKET=proyecto-123456.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc...
   VITE_FIREBASE_MEASUREMENT_ID=G-XYZ...
   ```

4. **Ejecutar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Accede en `http://localhost:5173`

---

## 🔧 Configuración de Firebase

### 1. Crear proyecto y app web
- Ve a [Firebase Console](https://console.firebase.google.com/)
- Crea un nuevo proyecto
- Registra una app web y copia la configuración al `.env`

### 2. Habilitar Authentication
- **Authentication → Sign-in method → Email/Password → Activar**
- O despliega `firebase.json` que incluye la configuración automática

### 3. Crear Cloud Firestore
- **Firestore Database → Create Database**
- Modo de inicio: Producción (después aplica las reglas)

### 4. Configurar Storage (opcional)
- Necesario para subir imágenes desde la app
- **Storage → Get Started**
- En proyectos nuevos requiere plan **Blaze**
- Sin Storage la app funciona pegando URLs de terceros

### 5. Desplegar reglas de seguridad
```bash
npm run build
firebase deploy --only firestore:rules
firebase deploy --only storage:rules  # si Storage está activo
firebase deploy --only hosting
```

---

## 📝 Scripts disponibles

```bash
npm run dev            # Inicia servidor de desarrollo (Vite)
npm run build          # Compilación de producción en dist/
npm run preview        # Previsualiza la compilación localmente
npm run seed           # Carga datos de prueba (opcional)
```

**En `functions/`:**
```bash
cd functions
npm run build          # Compila TypeScript → JavaScript
```

---

## 🚀 Despliegue automático (GitHub Actions)

Los workflows en `.github/workflows/` hacen:
- 🟢 **Push a `main`:** Despliega automáticamente a Firebase Hosting
- 🔵 **Pull Request:** Crea un canal de preview para revisar cambios

### Configuración necesaria

En **Settings → Secrets and variables → Actions**, añade:

**Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` – Obtenlo con `firebase init hosting:github`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

**Variables (no secrets):**
- `FIREBASE_PROJECT_ID`

*Sin `FIREBASE_SERVICE_ACCOUNT`, el workflow compila pero omite el despliegue.*

---

## 📂 Estructura del proyecto

```
clubs-platform/
├── src/
│   ├── components/
│   │   ├── club/          MembersModal, ClubHeader, etc.
│   │   ├── platform/      PlatformLayout, Nav, Header
│   │   ├── forms/         LoginForm, TournamentForm, etc.
│   │   ├── agenda/        AgendaView, EventCard, etc.
│   │   ├── players/       PlayersTable, PlayerCard, etc.
│   │   ├── finance/       TransactionList, TesoreroView, etc.
│   │   ├── inventory/     InventoryTable, etc.
│   │   ├── gallery/       GalleryGrid, etc.
│   │   └── ...
│   ├── pages/
│   │   ├── Landing.tsx    Landing pública
│   │   ├── Login.tsx      Autenticación
│   │   ├── Admin.tsx      Panel de superadmin
│   │   ├── ClubPage.tsx   Página del club
│   │   ├── Agenda.tsx
│   │   ├── Players.tsx
│   │   ├── Finance.tsx
│   │   ├── Inventory.tsx
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.tsx    Sesión y super admin
│   │   └── ClubContext.tsx    Club activo y datos
│   ├── hooks/
│   │   ├── useClubData.ts     Fetch datos del club
│   │   ├── useMembership.ts   Permisos del usuario
│   │   ├── useAuth.ts         Autenticación
│   │   └── ...
│   ├── lib/
│   │   ├── firebase.ts        Configuración y helpers
│   │   ├── paths.ts           Rutas Firestore/Storage
│   │   ├── roles.ts           Matriz de permisos (buildPerms)
│   │   └── clubDefaults.ts    Valores por defecto
│   ├── styles/
│   │   └── globals.css        Estilos globales
│   ├── App.tsx                Router principal
│   └── main.tsx               Punto de entrada
├── functions/
│   ├── src/
│   │   └── index.ts           Cloud Functions (email, triggers)
│   ├── lib/                   Compilado JS
│   └── package.json
├── public/
│   └── manifest.json          PWA
├── .github/workflows/
│   ├── deploy.yml             Deploy automático a Hosting
│   └── preview.yml            Preview en PRs
├── firebase.json              Configuración Firebase (auth, rules, etc.)
├── firestore.rules            Reglas de lectura/escritura Firestore
├── storage.rules              Reglas de acceso Storage
├── vite.config.ts             Configuración Vite + PWA
├── tsconfig.json              TypeScript
├── .env.example               Variables de entorno de ejemplo
└── package.json               Dependencias
```

---

## 🔐 Seguridad

### Reglas de Firestore
- Cada usuario solo ve sus propios datos y los de su club
- Super admin accede a todo
- Las reglas en `firestore.rules` replican la matriz de `roles.ts`

### Reglas de Storage
- Las imágenes de un club solo se pueden subir/borrar con role adecuado
- Las reglas en `storage.rules` protegen carpetas por club y rol

### Secretos
- Variables de entorno en `.env` (nunca en Git)
- Usa **GitHub Secrets** para CI/CD
- Firebase Hosting revisa autenticación automáticamente

---

## 🤝 Cómo contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Commits descriptivos: `git commit -m "Agregar módulo X"`
4. Push a tu fork: `git push origin feature/mi-feature`
5. Abre un Pull Request en `main`

---

## 📚 Recursos útiles

- 📖 [Documentación de React](https://react.dev)
- 🔥 [Firebase Docs](https://firebase.google.com/docs)
- ⚡ [Vite Guide](https://vitejs.dev/guide/)
- 🛣️ [React Router](https://reactrouter.com/)
- 🎨 [Lucide Icons](https://lucide.dev)

---

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**. Ver [LICENSE](LICENSE) para más detalles.

---

## 👤 Autor

**Carlos Quinto**  
🔗 [GitHub](https://github.com/CarlosQuinto) | 🌐 [Web](https://clubs-platform-aem9u.web.app)

---

## 💡 Ideas futuras

- [ ] Estadísticas avanzadas (gráficos, análisis de rendimiento)
- [ ] Sistema de notificaciones por email/SMS
- [ ] App móvil nativa (React Native)
- [ ] Integración con pago online (cuotas, entradas)
- [ ] Chat en vivo entre miembros
- [ ] Reserva de canchas/instalaciones
- [ ] Reporte de faltas automático

---

**¿Preguntas?** Abre un [issue](https://github.com/CarlosQuinto/clubs-platform/issues) o contacta directamente.

✨ **¡Gracias por usar Clubs Platform!**
