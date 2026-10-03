export interface ContactTopicView {
  value: string;
  label: string;
}

export interface ContactFormView {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
  busy: boolean;
  sent: boolean;
  error: string | null;
  topics: ContactTopicView[];
  whatsapp: string | null;
}
