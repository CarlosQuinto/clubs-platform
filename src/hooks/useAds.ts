import { useEffect, useState } from "react";
import { onSnapshot, type DocumentData } from "firebase/firestore";
import { isAdPlacement, statusFromDates, type Ad, type AdStatus } from "../lib/ads";
import { adsCol } from "../lib/paths";

function asAd(id: string, data: DocumentData): Ad | null {
  if (typeof data.brand !== "string" || typeof data.imageUrl !== "string") {
    return null;
  }
  const rawPlacements = Array.isArray(data.placements) ? data.placements : [];
  const placements = rawPlacements.filter(isAdPlacement);
  const startsAt = typeof data.startsAt === "string" ? data.startsAt : "";
  const endsAt = typeof data.endsAt === "string" ? data.endsAt : "";
  const status: AdStatus =
    data.active === true ? statusFromDates(startsAt, endsAt) : "PAUSADO";
  return {
    id,
    brand: data.brand,
    imageUrl: data.imageUrl,
    href: typeof data.href === "string" ? data.href : "",
    placements,
    startsAt,
    endsAt,
    status,
    order: typeof data.order === "number" ? data.order : 0,
    hasLegacyPlacement: rawPlacements.some((item) => !isAdPlacement(item)),
  };
}

/** Lee el inventario completo. El filtro de vigencia ocurre en el cliente. */
export function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      adsCol(),
      (snap) => {
        const next: Ad[] = [];
        snap.forEach((docSnap) => {
          const ad = asAd(docSnap.id, docSnap.data());
          if (ad) next.push(ad);
        });
        next.sort((a, b) => a.order - b.order || a.brand.localeCompare(b.brand));
        setAds(next);
        setError("");
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("No se pudo cargar el inventario.");
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { ads, loading, error };
}
