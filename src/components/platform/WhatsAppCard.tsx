import { whatsappUrl } from "../../lib/social";

function displayPhone(value: string) {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (/^https?:\/\//i.test(trimmed)) {
    const match = trimmed.match(/wa\.me\/(\d+)/i);
    digits = match?.[1] || "";
  }
  if (digits.length === 12 && digits.startsWith("52")) digits = digits.slice(2);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return trimmed;
}

function WhatsAppGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.4c0-.1-.6-1.5-.8-2s-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c.6.2 1.1.4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c-.1-.2-.3-.2-.6-.3z"
      />
    </svg>
  );
}

export default function WhatsAppCard({ phone }: { phone: string }) {
  const href = whatsappUrl(phone);
  if (!href) return null;
  const label = displayPhone(phone);

  return (
    <a
      className="whatsapp-card"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <span className="whatsapp-card__mark">
        <WhatsAppGlyph size={28} />
      </span>
      <span className="whatsapp-card__copy">
        <span className="whatsapp-card__kicker">¿Prefieres WhatsApp?</span>
        <span className="whatsapp-card__title">Escríbenos directamente</span>
        <span className="whatsapp-card__phone">
          <WhatsAppGlyph size={14} />
          {label}
        </span>
      </span>
      <span className="whatsapp-card__action">Chatear en WhatsApp →</span>
    </a>
  );
}
