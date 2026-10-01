import { useEffect, useState } from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import { Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import WindowsEditor from "../courts/WindowsEditor";
import { C, PrimaryButton, SectionCard } from "../ui";
import { readWindows } from "../../lib/courts";
import { availabilityRef } from "../../lib/paths";
import type { TimeWindow, Tournament } from "../../lib/types";

export default function AvailabilityPanel({
  clubId,
  tournaments,
}: {
  clubId: string;
  tournaments: Tournament[];
}) {
  const open = tournaments.filter(
    (tournament) =>
      tournament.clubIds.includes(clubId) && tournament.status !== "finished",
  );

  return (
    <div id="disponibilidad">
      <SectionCard title="Disponibilidad" icon={<Calendar size={16} />}>
        {open.length === 0 ? (
          <p style={{ margin: 0, color: C.gray500, fontSize: "0.85rem" }}>
            Cuando inscriban al equipo en un torneo, aquí eliges los días y horas en que pueden jugar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, color: C.gray500, fontSize: "0.8rem" }}>
              Días y rango de horas en que el equipo puede jugar. Puedes poner más de un rango por día.
            </p>
            {open.map((tournament) => (
              <TournamentWindows
                key={tournament.id}
                clubId={clubId}
                tournament={tournament}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function TournamentWindows({
  clubId,
  tournament,
}: {
  clubId: string;
  tournament: Tournament;
}) {
  const { user } = useAuth();
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReady(false);
    const unsub = onSnapshot(
      availabilityRef(tournament.id, clubId),
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
  }, [tournament.id, clubId]);

  const save = async () => {
    setBusy(true);
    try {
      await setDoc(availabilityRef(tournament.id, clubId), {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      <strong style={{ fontSize: "0.85rem", color: C.navy900 }}>{tournament.name}</strong>
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
  );
}
