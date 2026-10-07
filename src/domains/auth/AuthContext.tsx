import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  currentUser,
  signIn,
  signOutSession,
  signUp,
  watchSession,
  type User,
} from "../../infrastructure/auth";
import { requestPasswordReset } from "../../infrastructure/functions/callables";
import {
  adminAdmins,
  bootstrapPlatformAdmin,
  claimPlatformAdminInvite,
  dataConnect,
  ensureMyProfile,
  platformAdminById,
  platformClaimOpen,
  QueryFetchPolicy,
} from "../../infrastructure/dataconnect";
import { emailKey } from "../../shared/paths";

interface AuthContextValue {
  user: User | null;
  /** true mientras se resuelve la sesión inicial. */
  loading: boolean;
  /** null mientras se consulta; true si platform_admins está vacía. */
  platformUnclaimed: boolean | null;
  isSuperAdmin: boolean;
  /** null mientras se consulta platform_admins. */
  sqlAdmin: boolean | null;
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
  const [sqlAdmin, setSqlAdmin] = useState<boolean | null>(null);
  const [platformUnclaimed, setPlatformUnclaimed] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = watchSession((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClaim = async () => {
      try {
        if (currentUser()) {
          const listed = await adminAdmins(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
          if (cancelled) return;
          const open = (listed.data.platformAdmins || []).length === 0;
          setPlatformUnclaimed(open);
          return;
        }
        const result = await platformClaimOpen(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY });
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

  const refreshSqlAdmin = useCallback(async () => {
    const uid = currentUser()?.uid;
    if (!uid) {
      setSqlAdmin(false);
      return false;
    }
    const result = await platformAdminById(
      dataConnect,
      { id: uid },
      { fetchPolicy: QueryFetchPolicy.SERVER_ONLY },
    );
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

  const isSuperAdmin = sqlAdmin === true;

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
      const cred = await signIn(email, password);
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
      const name = displayName.trim();
      const created = await signUp(email, password, name);
      const profileEmail = email.trim().toLowerCase();
      await ensureMyProfile(dataConnect, {
        email: profileEmail,
        displayName: name,
      });
      const admin = await bootstrapPlatformAdmin(dataConnect, {
        userId: created.uid,
        email: profileEmail,
        displayName: name,
      });
      if (admin.data.admin) {
        setPlatformUnclaimed(false);
        await refreshSqlAdmin();
      }
      await claimPlatformInvite(created).catch((err) => {
        console.error("No se pudo reclamar la invitación de superadmin:", err);
      });
    },
    [claimPlatformInvite, refreshSqlAdmin],
  );

  const logout = useCallback(async () => {
    await signOutSession();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await requestPasswordReset(email.trim().toLowerCase());
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
      platformUnclaimed,
      isSuperAdmin,
      sqlAdmin,
      login,
      register,
      logout,
      resetPassword,
      claimPlatformAdmin,
    }),
    [
      user,
      loading,
      platformUnclaimed,
      isSuperAdmin,
      sqlAdmin,
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

/** Traduce los códigos de error de la sesión (auth/*, ver src/infrastructure/auth.ts) a mensajes legibles. */
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
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/user-disabled":
      return "Esta cuenta está desactivada.";
    case "auth/operation-not-allowed":
      return "Necesitas una invitación para registrarte.";
    case "auth/expired-action-code":
    case "auth/invalid-action-code":
      return "Este enlace venció o ya se usó. Pide uno nuevo desde iniciar sesión.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
    default:
      return "Ocurrió un error. Inténtalo de nuevo.";
  }
}
