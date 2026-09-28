import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Configuración de Firebase.
 *
 * Los valores se leen de variables de entorno con prefijo `VITE_` (ver
 * `.env.example`). Copia `.env.example` a `.env` y coloca los datos de tu
 * aplicación web de Firebase (Consola de Firebase → Configuración del
 * proyecto → Tus apps).
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(
    `[firebase] Faltan variables de entorno para: ${missingKeys.join(", ")}. ` +
      "Revisa tu archivo .env (usa .env.example como referencia).",
  );
}

// Inicialización segura: evita crear la app dos veces en recargas en caliente.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
