import type { ReactNode } from "react";
import { Facebook, Instagram, MessageCircle } from "lucide-react";
import type { PlatformSocial } from "../../lib/types";
import {
  facebookUrl,
  hasAnySocial,
  instagramUrl,
  whatsappUrl,
} from "../../lib/social";

export default function SocialLinks({
  social,
  compact = false,
  tone = "light",
}: {
  social?: PlatformSocial | null;
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  if (!hasAnySocial(social)) return null;

  const items = [
    social?.instagram?.trim()
      ? {
          key: "instagram",
          href: instagramUrl(social.instagram || ""),
          label: "Instagram",
          icon: <Instagram size={compact ? 16 : 18} />,
        }
      : null,
    social?.facebook?.trim()
      ? {
          key: "facebook",
          href: facebookUrl(social.facebook || ""),
          label: "Facebook",
          icon: <Facebook size={compact ? 16 : 18} />,
        }
      : null,
    social?.whatsapp?.trim()
      ? {
          key: "whatsapp",
          href: whatsappUrl(social.whatsapp || ""),
          label: "WhatsApp",
          icon: <MessageCircle size={compact ? 16 : 18} />,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    href: string;
    label: string;
    icon: ReactNode;
  }[];

  return (
    <div
      className={[
        "social-links",
        compact ? "is-compact" : "",
        tone === "dark" ? "is-dark" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="social-links__item"
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}
