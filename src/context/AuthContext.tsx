import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { platformConfigRef, userDocRef } from "../lib/paths";

interface PlatformConfig {
  superAdmins: string[];
}

interface AuthContextValue {
  user: User | null;
  /** true mientras Firebase resuelve la sesión inicial. */
  loading: boolean;
  /** null = todavía no cargado; undefined = el documento no existe (plataforma sin reclamar). */
  platformConfig: PlatformConfig | null | undefined;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Primer usuario: crea platform/config y se convierte en super administrador. */
  claimPlatformAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformConfig, setPlatformConfig] = useState<
    PlatformConfig | null | undefined
  >(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // platform/config es de lectura pública (solo contiene uids); permite a la UI
  // saber si la plataforma ya tiene super administrador.
  useEffect(() => {
    const unsub = onSnapshot(
      platformConfigRef(),
      (snap) => {
        setPlatformConfig(
          snap.exists() ? (snap.data() as PlatformConfig) : undefined,
        );
      },
      (err) => {
        console.error("No se pudo leer platform/config:", err);
        setPlatformConfig(undefined);
      },
    );
    return () => unsub();
  }, []);

  const isSuperAdmin = useMemo(
    () =>
      !!user &&
      !!platformConfig &&
      (platformConfig.superAdmins || []).includes(user.uid),
    [user, platformConfig],
  );

  const ensureUserDoc = useCallback(async (u: User) => {
    await setDoc(
      userDocRef(u.uid),
      {
        email: (u.email || "").toLowerCase(),
        displayName: u.displayName || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user).catch(() => {});
    },
    [ensureUserDoc],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      await ensureUserDoc(cred.user).catch(() => {});
    },
    [ensureUserDoc],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const claimPlatformAdmin = useCallback(async () => {
    if (!user) throw new Error("Debes iniciar sesión.");
    await setDoc(platformConfigRef(), {
      superAdmins: [user.uid],
      createdAt: serverTimestamp(),
    });
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      platformConfig,
      isSuperAdmin,
      login,
      register,
      logout,
      resetPassword,
      claimPlatformAdmin,
    }),
    [
      user,
      loading,
      platformConfig,
      isSuperAdmin,
      login,
      register,
      logout,
      resetPassword,
      claimPlatformAdmin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

/** Traduce códigos de error de Firebase Auth a mensajes legibles. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
    default:
      return "Ocurrió un error. Inténtalo de nuevo.";
  }
}
