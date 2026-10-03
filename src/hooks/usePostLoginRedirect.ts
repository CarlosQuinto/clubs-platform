import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  resolveUserDestinations,
  type LoginDestination,
} from "../lib/destinations";

/** Tras el login, elige destino o abre el selector si hay más de uno. */
export function usePostLoginRedirect({
  enabled,
  fallback = "/",
}: {
  enabled: boolean;
  fallback?: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [choices, setChoices] = useState<LoginDestination[] | null>(null);
  const [resolving, setResolving] = useState(false);
  const userRef = useRef(user);
  userRef.current = user;

  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) {
      setChoices(null);
      setResolving(false);
    }
  }, [uid]);

  useEffect(() => {
    const current = userRef.current;
    if (!enabled || loading || !current) return;

    let cancelled = false;
    setResolving(true);
    void resolveUserDestinations(current)
      .then((dests) => {
        if (cancelled) return;
        if (fallback.startsWith("/invitar")) {
          navigate(fallback, { replace: true });
          return;
        }
        if (dests.length > 1) setChoices(dests);
        else if (dests.length === 1) navigate(dests[0].path, { replace: true });
        else navigate(fallback, { replace: true });
      })
      .catch((err) => {
        console.error("No se pudieron resolver los destinos:", err);
        if (!cancelled) navigate(fallback, { replace: true });
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, loading, uid, fallback, navigate]);

  const go = (path: string) => {
    setChoices(null);
    navigate(path, { replace: true });
  };

  return { choices, resolving, go };
}
