import { type ContactPageData } from "../../infrastructure/dataconnect";
import { EMAIL_RE } from "../../domains/platform/social";
import type { ContactTopicView } from "./contactViewState";

export const CONTACT_TOPICS: ContactTopicView[] = [
  { value: "torneos", label: "Torneos y ligas" },
  { value: "renta", label: "Renta de cancha" },
  { value: "disponibilidad", label: "Consulta de disponibilidad" },
  { value: "otro", label: "Otro" },
];

export interface ContactDraft {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

export function toContactWhatsapp(data: ContactPageData): string | null {
  const phone = data.platformSettings?.whatsapp?.trim() || "";
  return phone || null;
}

export function validateContact(draft: ContactDraft): string | ContactPayload {
  const name = draft.name.trim().slice(0, 119);
  const email = draft.email.trim().toLowerCase();
  const phone = draft.phone.trim();
  const topic = CONTACT_TOPICS.find((item) => item.value === draft.topic)?.label || "";
  const message = draft.message.trim();
  if (name.length < 2) return "Escribe tu nombre.";
  if (phone.replace(/\D/g, "").length < 7) return "El teléfono no es válido.";
  if (!EMAIL_RE.test(email)) return "El correo no es válido.";
  if (!topic) return "Selecciona un tema.";
  if (message.length < 3) return "Escribe un mensaje.";
  if (!draft.consent) return "Debes aceptar los términos y la política de privacidad.";
  return { name, email, phone, topic, message };
}
