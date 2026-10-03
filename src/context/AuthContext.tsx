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
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../lib/firebase";
import {
  adminAdmins,
  bootstrapPlatformAdmin,
  claimPlatformAdminInvite,
  ensureMyProfile,
  platformAdminById,
  platformClaimOpen,
} from "../../dataconnect/generated";
import { dataConnect } from "../lib/sqlConnect";
import { emailKey, platformConfigRef } from "../lib/paths";
import type { CourtSlotMinutes, PlatformSocial, TimeWindow } from "../lib/types";

export type { PlatformSocial };

export interface PlatformConfig {
  superAdmins: string[];
  /** uid → correo, para mostrar la lista de superadmins. */
  superAdminEmails?: Record<string, string>;
  heroImages?: string[];
  name?: string;
  logoUrl?: string;
  /** Frase corta bajo el nombre en el pie. */
  motto?: string;
  headline?: string;
  tagline?: string;
  social?: PlatformSocial;
  /** Módulo público de canchas. Si falta, está apagado. */
  courtsEnabled?: boolean;
  /** Rejilla del apartado: 30 o 60. Si falta, 60. */
  courtSlotMinutes?: CourtSlotMinutes;
  /** Días y horas en que las canchas abren. */
  courtOpenWindows?: TimeWindow[];
  /** La disponibilidad ya se copió de cada torneo al club. */
  availabilityMigrated?: boolean;
}

interface AuthContextValue {
  user: User | null;
  /** true mientras Firebase resuelve la sesión inicial. */
  loading: boolean;
  /** null = todavía no cargado; undefined = el documento no existe. */
  platformConfig: PlatformConfig | null | undefined;
  /** null mientras se consulta; true si platform_admins está vacía. */
  platformUnclaimed: boolean | null;
  isSuperAdmin: boolean;
  /** null mientras se consulta platform_admins. */
  sqlAdmin: boolean | null;
  /** El documento de Firestore todavía lista a este usuario. Sirve para el alta inicial en SQL. */
  firestoreIsSuperAdmin: boolean;
  bootstrapPlatformRole: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Primer usuario: se convierte en superadministrador si nadie lo ha reclamado. */
  claimPlatformAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformConfig, setPlatformConfig] = useState<
    PlatformConfig | null | undefined
  >(null);
  const [sqlAdmin, setSqlAdmin] = useState<boolean | null>(null);
  const [platformUnclaimed, setPlatformUnclaimed] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClaim = async () => {
      try {
        if (auth.currentUser) {
          const listed = await adminAdmins(dataConnect);
          if (cancelled) return;
          const open = (listed.data.platformAdmins || []).length === 0;
          setPlatformUnclaimed(open);
          return;
        }
        const result = await platformClaimOpen(dataConnect);
        if (cancelled) return;
        const open = result.data.platformClaimStates[0]?.open !== false;
        setPlatformUnclaimed(open);
      } catch (err: unknown) {
        console.error(err);
        if (!cancelled) setPlatformUnclaimed(false);
      }
    };
    void loadClaim();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // platform/config sigue alimentando la portada del superadministrador.
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

  const firestoreIsSuperAdmin = useMemo(
    () =>
      !!user &&
      !!platformConfig &&
      (platformConfig.superAdmins || []).includes(user.uid),
    [user, platformConfig],
  );

  const refreshSqlAdmin = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setSqlAdmin(false);
      return false;
    }
    const result = await platformAdminById(dataConnect, { id: uid });
    const yes = Boolean(result.data.platformAdmin);
    setSqlAdmin(yes);
    return yes;
  }, []);

  useEffect(() => {
    if (!user) {
      setSqlAdmin(false);
      return;
    }
    setSqlAdmin(null);
    void refreshSqlAdmin().catch((err: unknown) => {
      console.error(err);
      setSqlAdmin(false);
    });
  }, [user, refreshSqlAdmin]);

  const isSuperAdmin = sqlAdmin === true || (sqlAdmin === null && firestoreIsSuperAdmin);

  const claimPlatformInvite = useCallback(async (u: User) => {
    if (!u.email) return;
    const email = u.email.toLowerCase();
    await ensureMyProfile(dataConnect, {
      email,
      displayName: u.displayName || "",
    });
    await claimPlatformAdminInvite(dataConnect, { emailKey: emailKey(email) });
    await refreshSqlAdmin();
  }, [refreshSqlAdmin]);

  useEffect(() => {
    if (!user || isSuperAdmin) return;
    void claimPlatformInvite(user).catch((err) => {
      console.error("No se pudo reclamar la invitación de superadmin:", err);
    });
  }, [user, isSuperAdmin, claimPlatformInvite]);

  const login = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureMyProfile(dataConnect, {
        email: (cred.user.email || email).trim().toLowerCase(),
        displayName: cred.user.displayName || "",
      });
      await claimPlatformInvite(cred.user).catch((err) => {
        console.error("No se pudo reclamar la invitación de superadmin:", err);
      });
    },
    [claimPlatformInvite],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const name = displayName.trim();
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      const profileEmail = email.trim().toLowerCase();
      await ensureMyProfile(dataConnect, {
        email: profileEmail,
        displayName: name,
      });
      const admin = await bootstrapPlatformAdmin(dataConnect, {
        userId: cred.user.uid,
        email: profileEmail,
        displayName: name,
      });
      if (admin.data.admin) {
        setPlatformUnclaimed(false);
        await refreshSqlAdmin();
      }
      await claimPlatformInvite(cred.user).catch((err) => {
        console.error("No se pudo reclamar la invitación de superadmin:", err);
      });
    },
    [claimPlatformInvite, refreshSqlAdmin],
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const fn = httpsCallable<{ email: string }, { ok: boolean }>(
      functions,
      "requestPasswordReset",
    );
    await fn({ email: email.trim().toLowerCase() });
  }, []);

  const bootstrapPlatformRole = useCallback(async () => {
    if (!user?.email) return false;
    await ensureMyProfile(dataConnect, {
      email: user.email.toLowerCase(),
      displayName: user.displayName || "",
    });
    const result = await bootstrapPlatformAdmin(dataConnect, {
      userId: user.uid,
      email: user.email.toLowerCase(),
      displayName: user.displayName || "",
    });
    if (!result.data.admin) return false;
    setPlatformUnclaimed(false);
    await refreshSqlAdmin();
    return true;
  }, [user, refreshSqlAdmin]);

  const claimPlatformAdmin = useCallback(async () => {
    if (!user?.email) throw new Error("Debes iniciar sesión.");
    const claimed = await bootstrapPlatformRole();
    if (!claimed) throw new Error("La plataforma ya tiene administrador.");
  }, [user, bootstrapPlatformRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      platformConfig,
      platformUnclaimed,
      isSuperAdmin,
      sqlAdmin,
      firestoreIsSuperAdmin,
      bootstrapPlatformRole,
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
      platformUnclaimed,
      isSuperAdmin,
      sqlAdmin,
      firestoreIsSuperAdmin,
      bootstrapPlatformRole,
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
