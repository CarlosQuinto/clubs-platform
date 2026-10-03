import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { signupUrl } from "../../domains/clubs/signupInvite";
import { C, RADIUS } from "../../shared/ui";

export function CopySignupUrlButton({
  email,
  url,
}: {
  email?: string;
  url?: string;
}) {
  const href = url || signupUrl(email);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia esta URL:", href);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copiar URL"
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${C.gray300}`,
        background: C.white,
        color: C.navy900,
        borderRadius: RADIUS.md,
        width: 32,
        height: 32,
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function InviteSignupLink({
  email,
  url,
  label,
}: {
  email?: string;
  url?: string;
  label?: string;
}) {
  const href = url || signupUrl(email);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia esta URL:", href);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        marginTop: "0.75rem",
        padding: "0.65rem 0.7rem",
        borderRadius: RADIUS.md,
        border: `1px dashed ${C.gray300}`,
        backgroundColor: C.gray50,
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 800,
          color: C.gray500,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label || "URL para crear cuenta"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
        <code
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "0.72rem",
            color: C.navy900,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {href}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          title="Copiar"
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: `1px solid ${C.gray300}`,
            background: C.white,
            color: C.navy900,
            borderRadius: RADIUS.md,
            padding: "0.28rem 0.5rem",
            fontSize: "0.7rem",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
