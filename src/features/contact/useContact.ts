import { useCallback, useEffect, useRef, useState } from "react";
import {
  contactPage,
  dataConnect,
  QueryFetchPolicy,
  submitInquiry,
} from "../../infrastructure/dataconnect";
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
    const result = validateContact(form);
    if (typeof result === "string") {
      setForm((current) => ({ ...current, error: result }));
      return;
    }
    setForm((current) => ({ ...current, busy: true, error: null }));
    void submitInquiry(dataConnect, { id: crypto.randomUUID(), ...result })
      .then((response) => {
        if (!response.data.inquiry) {
          setForm((current) => ({
            ...current,
            busy: false,
            error: "No se pudo enviar. Inténtalo de nuevo.",
          }));
          return;
        }
        setForm((current) => ({ ...current, busy: false, sent: true }));
      })
      .catch((err: unknown) => {
        console.error(err);
        setForm((current) => ({
          ...current,
          busy: false,
          error: "No se pudo enviar. Inténtalo de nuevo.",
        }));
      });
  };

  return {
    ...form,
    onName: (value: string) => setField("name", value),
    onPhone: (value: string) => setField("phone", value),
    onEmail: (value: string) => setField("email", value),
    onTopic: (value: string) => setField("topic", value),
    onMessage: (value: string) => setField("message", value),
    onConsent: (value: boolean) =>
      setForm((current) => ({ ...current, consent: value, error: null })),
    onSubmit,
  };
}
