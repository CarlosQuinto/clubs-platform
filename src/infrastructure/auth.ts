import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export type { User };

export const watchSession = (listener: (user: User | null) => void) =>
  onAuthStateChanged(auth, listener);

export const currentUser = () => auth.currentUser;

/** Uid de la sesión; falla si no hay nadie dentro. */
export function sessionUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Debes iniciar sesión.");
  return uid;
}

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export async function signUp(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred.user;
}

export const signOutSession = () => signOut(auth);

export const checkResetCode = (code: string) => verifyPasswordResetCode(auth, code);

export const applyNewPassword = (code: string, password: string) =>
  confirmPasswordReset(auth, code, password);
