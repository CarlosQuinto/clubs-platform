import { createContext, useContext, useMemo } from "react";
import type { CollectionReference, DocumentReference } from "firebase/firestore";
import {
  ClubCollection,
  clubCol,
  clubDocRef,
  clubItemRef,
  clubStoragePath,
} from "../lib/paths";

interface ClubContextValue {
  clubId: string;
  /** Documento clubs/{clubId} (información pública del club). */
  clubRef: DocumentReference;
  /** Subcolección clubs/{clubId}/{name}. */
  col: (name: ClubCollection) => CollectionReference;
  /** Documento clubs/{clubId}/{name}/{id}. */
  item: (name: ClubCollection, id: string) => DocumentReference;
  /** Ruta de Storage clubs/{clubId}/{folder}/{filename}. */
  storagePath: (folder: string, filename: string) => string;
}

const ClubContext = createContext<ClubContextValue | null>(null);

export function ClubProvider({
  clubId,
  children,
}: {
  clubId: string;
  children: React.ReactNode;
}) {
  const value = useMemo<ClubContextValue>(
    () => ({
      clubId,
      clubRef: clubDocRef(clubId),
      col: (name) => clubCol(clubId, name),
      item: (name, id) => clubItemRef(clubId, name, id),
      storagePath: (folder, filename) =>
        clubStoragePath(clubId, folder, filename),
    }),
    [clubId],
  );

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) {
    throw new Error("useClub debe usarse dentro de <ClubProvider>");
  }
  return ctx;
}
