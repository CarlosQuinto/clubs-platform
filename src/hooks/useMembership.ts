import { useEffect, useState } from "react";
import {
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { clubItemRef, emailKey } from "../lib/paths";
import { Role } from "../lib/roles";

/**
 * Resuelve el rol del usuario actual dentro de un club.
 *
 * Si el usuario no es miembro pero existe una invitación para su email
 * (clubs/{clubId}/invites/{emailKey}), la reclama automáticamente: crea
 * clubs/{clubId}/members/{uid} con el rol invitado y borra la invitación.
 * Las reglas de Firestore validan que el rol coincida con el de la invitación.
 */
export function useMembership(clubId: string | null) {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRole(null);
    if (!clubId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const memberRef = clubItemRef(clubId, "members", user.uid);
    let claimAttempted = false;

    const unsub = onSnapshot(
      memberRef,
      async (snap) => {
        if (snap.exists()) {
          setRole((snap.data().role as Role) || null);
          setLoading(false);
          return;
        }

        if (!claimAttempted && user.email) {
          claimAttempted = true;
          try {
            const inviteRef = clubItemRef(
              clubId,
              "invites",
              emailKey(user.email),
            );
            const invite = await getDoc(inviteRef);
            if (invite.exists() && invite.data().kind !== "accept") {
              await setDoc(memberRef, {
                role: invite.data().role,
                email: user.email.toLowerCase(),
                displayName: user.displayName || "",
                joinedAt: serverTimestamp(),
              });
              await deleteDoc(inviteRef).catch(() => {});
              return; // el snapshot volverá a disparar con el nuevo documento
            }
          } catch (err) {
            console.error("No se pudo reclamar la invitación:", err);
          }
        }
        setRole(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error leyendo membresía:", err);
        setRole(null);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [clubId, user]);

  return { role, loading };
}
