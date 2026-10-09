import { useRef, useState } from "react";
import { dataConnect, submitTeamApplication } from "../../infrastructure/dataconnect";
import { cellPhone, clubName, emailText, personName } from "../../shared/textLimits";
import { validateRegisterTeam } from "./registerTeamMapper";
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
};

export function useRegisterTeam() {
  const [form, setForm] = useState<RegisterTeamFormView>(EMPTY);
  const sending = useRef(false);

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
          setForm({
            ...EMPTY,
            error: "Los datos no pasaron la revisión. Vuelve a llenar el formulario.",
          });
          return;
        }
        setForm({ ...EMPTY, sent: true });
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
    ready: typeof validateRegisterTeam(form) !== "string",
    onCaptainName: (value: string) => setField("captainName", personName(value)),
    onCaptainEmail: (value: string) => setField("captainEmail", emailText(value)),
    onCaptainPhone: (value: string) => setField("captainPhone", cellPhone(value)),
    onTeamName: (value: string) => setField("teamName", clubName(value)),
    onConsent: (value: boolean) =>
      setForm((current) => ({ ...current, consent: value, error: null, sent: false })),
    onSubmit,
  };
}
