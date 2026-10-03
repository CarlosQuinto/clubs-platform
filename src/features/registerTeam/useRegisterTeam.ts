import { useCallback, useEffect, useRef, useState } from "react";
import { registerTeamPage, submitTeamApplication } from "../../../dataconnect/generated";
import { dataConnect } from "../../lib/sqlConnect";
import { toRegisterTeamClubs, validateRegisterTeam } from "./registerTeamMapper";
import type { RegisterTeamFormView } from "./registerTeamViewState";

const EMPTY: RegisterTeamFormView = {
  captainName: "",
  captainEmail: "",
  captainPhone: "",
  teamName: "",
  consent: false,
  busy: false,
  sent: false,
  error: null,
  clubs: [],
};

export function useRegisterTeam() {
  const [form, setForm] = useState<RegisterTeamFormView>(EMPTY);
  const [clubsLoading, setClubsLoading] = useState(true);
  const request = useRef(0);

  const loadClubs = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setClubsLoading(true);
    void registerTeamPage(dataConnect)
      .then((result) => {
        if (ticket !== request.current) return;
        setForm((current) => ({ ...current, clubs: toRegisterTeamClubs(result.data) }));
      })
      .catch((err: unknown) => {
        console.error(err);
      })
      .finally(() => {
        if (ticket === request.current) setClubsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const setField = (field: "captainName" | "captainEmail" | "captainPhone" | "teamName", value: string) => {
    setForm((current) => ({ ...current, [field]: value, error: null, sent: false }));
  };

  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const result = validateRegisterTeam(form);
    if (typeof result === "string") {
      setForm((current) => ({ ...current, error: result }));
      return;
    }
    setForm((current) => ({ ...current, busy: true, error: null }));
    void submitTeamApplication(dataConnect, {
      id: crypto.randomUUID(),
      ...result,
    })
      .then((response) => {
        if (!response.data.application) {
          setForm((current) => ({
            ...current,
            busy: false,
            error: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
          }));
          return;
        }
        setForm((current) => ({
          ...EMPTY,
          clubs: current.clubs,
          sent: true,
        }));
      })
      .catch((err: unknown) => {
        console.error(err);
        setForm((current) => ({
          ...current,
          busy: false,
          error: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        }));
      });
  };

  return {
    ...form,
    clubsLoading,
    onCaptainName: (value: string) => setField("captainName", value),
    onCaptainEmail: (value: string) => setField("captainEmail", value),
    onCaptainPhone: (value: string) => setField("captainPhone", value),
    onTeamName: (value: string) => setField("teamName", value),
    onConsent: (value: boolean) =>
      setForm((current) => ({ ...current, consent: value, error: null, sent: false })),
    onSubmit,
  };
}
