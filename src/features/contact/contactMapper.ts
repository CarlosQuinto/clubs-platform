import { type ContactPageData } from "../../infrastructure/dataconnect";
import { isCellPhone, isContactMessage, isPersonName, isRegisterEmail } from "../../shared/textLimits";
import type { ContactTopicView } from "./contactViewState";

export const CONTACT_TOPICS: ContactTopicView[] = [
  { value: "Torneos", label: "Torneos" },
  { value: "Renta de canchas", label: "Renta de canchas" },
  { value: "Disponibilidad", label: "Disponibilidad" },
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

export function toContactCourtsEnabled(data: ContactPageData): boolean {
  return data.platformSettings?.courtsEnabled === true;
}

/** Temas del formulario; «Renta de canchas» solo cuando el módulo de canchas está activo. */
export function contactTopics(courtsEnabled: boolean): ContactTopicView[] {
  return courtsEnabled ? CONTACT_TOPICS : CONTACT_TOPICS.filter((topic) => topic.value !== "Renta de canchas");
}

export function validateContact(draft: ContactDraft): string | ContactPayload {
  const name = draft.name.trim();
  const email = draft.email.trim().toLowerCase();
  const phone = draft.phone.trim();
  const topic = CONTACT_TOPICS.find((item) => item.value === draft.topic)?.value || "";
  const message = draft.message.trim().replace(/ {2,}/g, " ");
  if (!isPersonName(name)) return "Escribe tu nombre.";
  if (!isCellPhone(phone)) return "El teléfono no es válido.";
  if (!isRegisterEmail(email)) return "El correo no es válido.";
  if (!topic) return "Selecciona un tema.";
  if (!isContactMessage(message)) return "Escribe un mensaje.";
  if (!draft.consent) return "Debes aceptar los términos y la política de privacidad.";
  return { name, email, phone, topic, message };
}
