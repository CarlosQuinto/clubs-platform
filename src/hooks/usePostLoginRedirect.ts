import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatformCatalog } from "./usePlatformCatalog";
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
  const { user, loading, platformConfig } = useAuth();
  const catalog = usePlatformCatalog();
  const navigate = useNavigate();
  const [choices, setChoices] = useState<LoginDestination[] | null>(null);
  const [resolving, setResolving] = useState(false);
  const userRef = useRef(user);
  const clubsRef = useRef(catalog.clubs);
  userRef.current = user;
  clubsRef.current = catalog.clubs;

  const uid = user?.uid ?? null;
  const configReady = platformConfig !== null;
  const catalogReady = !catalog.loading;

  useEffect(() => {
    if (!uid) {
      setChoices(null);
      setResolving(false);
    }
  }, [uid]);

  useEffect(() => {
    const current = userRef.current;
    if (!enabled || loading || !current || !catalogReady || !configReady) {
      return;
    }

    let cancelled = false;
    setResolving(true);
    void resolveUserDestinations(current, clubsRef.current)
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
  }, [enabled, loading, uid, catalogReady, configReady, fallback, navigate]);

  const go = (path: string) => {
    setChoices(null);
    navigate(path, { replace: true });
  };

  return { choices, resolving, go };
}
