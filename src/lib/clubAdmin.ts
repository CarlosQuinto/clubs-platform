import { deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { clubCol, clubDocRef, type ClubCollection } from "./paths";

const SUBCOLLECTIONS: ClubCollection[] = [
  "players",
  "events",
  "transactions",
  "inventory",
  "gallery",
  "goals",
  "members",
  "invites",
];

/**
 * Elimina un club y todas sus subcolecciones conocidas (Firestore no borra
 * subcolecciones en cascada). Los partidos de torneo conservan el id del club
 * para no romper tablas históricas.
 */
export async function deleteClubDeep(clubId: string) {
  for (const name of SUBCOLLECTIONS) {
    const snap = await getDocs(clubCol(clubId, name));
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteDoc(clubDocRef(clubId));
}
