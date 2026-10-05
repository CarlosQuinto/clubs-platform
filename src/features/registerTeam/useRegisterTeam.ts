import { useCallback, useEffect, useRef, useState } from "react";
import {
  dataConnect,
  QueryFetchPolicy,
  registerTeamPage,
  submitTeamApplication,
} from "../../infrastructure/dataconnect";
import { cellPhone, emailText, personName, teamLabel } from "../../shared/textLimits";
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
  const sending = useRef(false);

  const loadClubs = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    setClubsLoading(true);
    void registerTeamPage(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
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
    if (sending.current) return;
    const result = validateRegisterTeam(form);
    if (typeof result === "string") {
      setForm((current) => ({ ...current, error: result }));
      return;
    }
    sending.current = true;
    setForm((current) => ({ ...current, busy: true, error: null }));
    void submitTeamApplication(dataConnect, {
      id: crypto.randomUUID(),
      ...result,
    })
      .then((response) => {
        if (!response.data.application) {
          setForm((current) => ({
            ...EMPTY,
            clubs: current.clubs,
            error: "Los datos no pasaron la revisión. Vuelve a llenar el formulario.",
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
      })
      .finally(() => {
        sending.current = false;
      });
  };

  return {
    ...form,
    clubsLoading,
    ready: typeof validateRegisterTeam(form) !== "string",
    onCaptainName: (value: string) => setField("captainName", personName(value)),
    onCaptainEmail: (value: string) => setField("captainEmail", emailText(value)),
    onCaptainPhone: (value: string) => setField("captainPhone", cellPhone(value)),
    onTeamName: (value: string) => setField("teamName", teamLabel(value)),
    onConsent: (value: boolean) =>
      setForm((current) => ({ ...current, consent: value, error: null, sent: false })),
    onSubmit,
  };
}
