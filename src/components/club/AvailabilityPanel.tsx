import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { clearClubAvailability, insertClubAvailability } from "../../../dataconnect/generated";
import { dataConnect } from "../../lib/sqlConnect";
import { requestClubRefresh } from "../../features/club/useClubScreen";
import { savedRow } from "../../features/club/saved";
import WindowsEditor from "../courts/WindowsEditor";
import { C, PrimaryButton, SectionCard } from "../ui";
import { readWindows } from "../../lib/courts";
import type { TimeWindow } from "../../lib/types";

export default function AvailabilityPanel({
  clubId,
  windows,
}: {
  clubId: string;
  windows: TimeWindow[];
}) {
  const [draft, setDraft] = useState<TimeWindow[]>(windows);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(windows);
  }, [windows]);

  const save = async () => {
    setBusy(true);
    try {
      const next = readWindows(draft);
      await clearClubAvailability(dataConnect, { clubId });
      if (next.length > 0) {
        const saved = await insertClubAvailability(dataConnect, {
          clubId,
          windows: next,
        });
        savedRow(saved.data.window);
      }
      requestClubRefresh();
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
          <WindowsEditor windows={draft} onChange={setDraft} />
          <PrimaryButton type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Guardando…" : "Guardar disponibilidad"}
          </PrimaryButton>
        </div>
      </SectionCard>
    </div>
  );
}
