import { useEffect, useState } from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import { Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import WindowsEditor from "../courts/WindowsEditor";
import { C, PrimaryButton, SectionCard } from "../ui";
import { readWindows } from "../../lib/courts";
import { availabilityRef } from "../../lib/paths";
import type { TimeWindow } from "../../lib/types";

export default function AvailabilityPanel({ clubId }: { clubId: string }) {
  const { user } = useAuth();
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReady(false);
    const unsub = onSnapshot(
      availabilityRef(clubId),
      (snap) => {
        setWindows(readWindows(snap.data()?.windows));
        setReady(true);
      },
      (err) => {
        console.error(err);
        setReady(true);
      },
    );
    return () => unsub();
  }, [clubId]);

  const save = async () => {
    setBusy(true);
    try {
      await setDoc(availabilityRef(clubId), {
        windows: readWindows(windows),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || "",
      });
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la disponibilidad.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="disponibilidad">
      <SectionCard title="Disponibilidad" icon={<Calendar size={16} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.8rem" }}>
            Días y horas en que el equipo puede jugar. Puedes poner más de un rango por día.
          </p>
          {!ready ? (
            <p style={{ margin: 0, color: C.gray400, fontSize: "0.8rem" }}>Cargando…</p>
          ) : (
            <>
              <WindowsEditor windows={windows} onChange={setWindows} />
              <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
                {busy ? "Guardando…" : "Guardar disponibilidad"}
              </PrimaryButton>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
