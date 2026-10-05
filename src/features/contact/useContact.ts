import { useCallback, useEffect, useRef, useState } from "react";
import {
  contactPage,
  dataConnect,
  QueryFetchPolicy,
  submitInquiry,
} from "../../infrastructure/dataconnect";
import { cellPhone, contactMessage, emailText, personName } from "../../shared/textLimits";
import { CONTACT_TOPICS, toContactWhatsapp, validateContact } from "./contactMapper";
import type { ContactFormView } from "./contactViewState";

const EMPTY: ContactFormView = {
  name: "",
  phone: "",
  email: "",
  topic: "",
  message: "",
  consent: false,
  busy: false,
  sent: false,
  error: null,
  topics: CONTACT_TOPICS,
  whatsapp: null,
};

export function useContact() {
  const [form, setForm] = useState<ContactFormView>(EMPTY);
  const request = useRef(0);
  const sending = useRef(false);

  const load = useCallback(() => {
    const ticket = request.current + 1;
    request.current = ticket;
    void contactPage(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        if (ticket !== request.current) return;
        setForm((current) => ({ ...current, whatsapp: toContactWhatsapp(result.data) }));
      })
      .catch((err: unknown) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (
    field: "name" | "phone" | "email" | "topic" | "message",
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value, error: null }));
  };

  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (sending.current) return;
    const result = validateContact(form);
    if (typeof result === "string") {
      setForm((current) => ({ ...current, error: result }));
      return;
    }
    sending.current = true;
    setForm((current) => ({ ...current, busy: true, error: null }));
    void submitInquiry(dataConnect, { id: crypto.randomUUID(), ...result })
      .then((response) => {
        if (!response.data.inquiry) {
          setForm((current) => ({
            ...EMPTY,
            whatsapp: current.whatsapp,
            error: "Los datos no pasaron la revisión. Vuelve a llenar el formulario.",
          }));
          return;
        }
        setForm((current) => ({
          ...EMPTY,
          whatsapp: current.whatsapp,
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
    ready: typeof validateContact(form) !== "string",
    onName: (value: string) => setField("name", personName(value)),
    onPhone: (value: string) => setField("phone", cellPhone(value)),
    onEmail: (value: string) => setField("email", emailText(value)),
    onTopic: (value: string) =>
      setField("topic", CONTACT_TOPICS.some((item) => item.value === value) ? value : ""),
    onMessage: (value: string) => setField("message", contactMessage(value)),
    onConsent: (value: boolean) =>
      setForm((current) => ({ ...current, consent: value, error: null })),
    onSubmit,
  };
}
