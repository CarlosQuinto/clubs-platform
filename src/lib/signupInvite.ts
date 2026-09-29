import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { emailKey } from "./paths";

export const signupInvitesCol = () => collection(db, "signupInvites");
export const signupInviteRef = (inviteKey: string) =>
  doc(db, "signupInvites", inviteKey);

export const signupPath = (email?: string) => {
  const clean = email?.trim().toLowerCase();
  return clean ? `/registro?email=${encodeURIComponent(clean)}` : "/registro";
};

export const signupUrl = (email?: string) =>
  `${window.location.origin}${signupPath(email)}`;

export async function markSignupInvite(
  email: string,
  extra: { clubId?: string; platform?: boolean } = {},
) {
  const clean = email.trim().toLowerCase();
  await setDoc(
    signupInviteRef(emailKey(clean)),
    {
      email: clean,
      ...extra,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearSignupInvite(email: string) {
  await deleteDoc(signupInviteRef(emailKey(email.trim().toLowerCase())));
}
