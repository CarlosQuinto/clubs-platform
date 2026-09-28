import { useState, useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { clubCol, clubDocRef } from "../lib/paths";
import {
  DEFAULT_CLUB_DESCRIPTION,
  DEFAULT_HERO_IMAGE,
} from "../lib/clubDefaults";

export interface ClubInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  location?: string;
  localityId?: string;
  heroImages: string[];
  defaultLineups: Record<string, any>;
  logoUrl?: string;
  active?: boolean;
  createdAt?: any;
}

export interface FirestoreDoc {
  id: string;
  [key: string]: any;
}

export function useClubData(clubId: string) {
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [clubExists, setClubExists] = useState<boolean | null>(null);
  const [transactions, setTransactions] = useState<FirestoreDoc[]>([]);
  const [players, setPlayers] = useState<FirestoreDoc[]>([]);
  const [inventory, setInventory] = useState<FirestoreDoc[]>([]);
  const [events, setEvents] = useState<FirestoreDoc[]>([]);
  const [gallery, setGallery] = useState<FirestoreDoc[]>([]);
  const [goals, setGoals] = useState<FirestoreDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setClubExists(null);
    setClubInfo(null);

    const handleSnapshotError = (err: any) =>
      console.error("Firestore Error:", err);

    const mapDocs = (snapshot: any) =>
      snapshot.docs.map(
        (d: any) => ({ id: d.id, ...d.data() }) as FirestoreDoc,
      );

    const unsubClub = onSnapshot(
      clubDocRef(clubId),
      (docSnap) => {
        if (!docSnap.exists()) {
          setClubExists(false);
          setLoading(false);
          return;
        }
        const data = docSnap.data();
        const images =
          data.heroImages?.length > 0
            ? data.heroImages
            : data.heroImage
              ? [data.heroImage]
              : [DEFAULT_HERO_IMAGE];
        setClubInfo({
          id: docSnap.id,
          slug: data.slug || docSnap.id,
          name: data.name || "",
          description: data.description || DEFAULT_CLUB_DESCRIPTION,
          location: data.location,
          localityId: data.localityId,
          heroImages: images,
          defaultLineups: data.defaultLineups || {},
          logoUrl: data.logoUrl,
          active: data.active !== false,
          createdAt: data.createdAt,
        });
        setClubExists(true);
      },
      (err) => {
        handleSnapshotError(err);
        setClubExists(false);
        setLoading(false);
      },
    );

    const unsubTx = onSnapshot(
      clubCol(clubId, "transactions"),
      (snapshot) => {
        const txs = mapDocs(snapshot);
        txs.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setTransactions(txs);
        setLoading(false);
      },
      handleSnapshotError,
    );

    const unsubPlayers = onSnapshot(
      clubCol(clubId, "players"),
      (snapshot) => {
        const plys = mapDocs(snapshot);
        plys.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setPlayers(plys);
      },
      handleSnapshotError,
    );

    const unsubInventory = onSnapshot(
      clubCol(clubId, "inventory"),
      (snapshot) => {
        const items = mapDocs(snapshot);
        items.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setInventory(items);
      },
      handleSnapshotError,
    );

    const unsubEvents = onSnapshot(
      clubCol(clubId, "events"),
      (snapshot) => {
        const evts = mapDocs(snapshot);
        evts.sort(
          (a: any, b: any) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
        );
        setEvents(evts);
      },
      handleSnapshotError,
    );

    const unsubGallery = onSnapshot(
      clubCol(clubId, "gallery"),
      (snapshot) => {
        const imgs = mapDocs(snapshot);
        imgs.sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setGallery(imgs);
      },
      handleSnapshotError,
    );

    const unsubGoals = onSnapshot(
      clubCol(clubId, "goals"),
      (snapshot) => {
        const fetched = mapDocs(snapshot);
        fetched.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setGoals(fetched);
      },
      handleSnapshotError,
    );

    return () => {
      unsubClub();
      unsubTx();
      unsubPlayers();
      unsubInventory();
      unsubEvents();
      unsubGallery();
      unsubGoals();
    };
  }, [clubId]);

  return {
    clubInfo,
    clubExists,
    transactions,
    players,
    inventory,
    events,
    gallery,
    goals,
    loading,
  };
}
