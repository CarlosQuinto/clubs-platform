import type { ReactNode } from "react";
import { ChevronRight, Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import type { PlatformSocial } from "../../lib/types";
import {
  facebookUrl,
  hasAnySocial,
  instagramUrl,
  whatsappUrl,
  xUrl,
  youtubeUrl,
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
    social?.x?.trim()
      ? {
          key: "x",
          href: xUrl(social.x || ""),
          label: "X",
          icon: <XMark size={compact ? 16 : 18} />,
        }
      : null,
    social?.youtube?.trim()
      ? {
          key: "youtube",
          href: youtubeUrl(social.youtube || ""),
          label: "YouTube",
          icon: <Youtube size={compact ? 16 : 18} />,
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
          data-network={item.key}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
          <ChevronRight className="social-links__chevron" size={16} />
        </a>
      ))}
    </div>
  );
}

function XMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
