import { createContext, useContext, useMemo } from "react";
import { clubStoragePath } from "../../shared/paths";

interface ClubContextValue {
  clubId: string;
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
