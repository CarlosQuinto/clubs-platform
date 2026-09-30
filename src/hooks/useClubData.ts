import { useCallback, useEffect, useState } from "react";
import { onSnapshot, type QuerySnapshot } from "firebase/firestore";
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
  presidentPhone?: string;
  active?: boolean;
  createdAt?: any;
}

export interface FirestoreDoc {
  id: string;
  [key: string]: any;
}

export type ClubSlice =
  | "players"
  | "events"
  | "transactions"
  | "inventory"
  | "gallery"
  | "goals";

const SLICES: ClubSlice[] = [
  "players",
  "events",
  "transactions",
  "inventory",
  "gallery",
  "goals",
];

interface SliceEntry {
  docs: FirestoreDoc[];
  ready: boolean;
  refs: number;
  unsub?: () => void;
  subscribers: Set<() => void>;
}

interface ClubEntry {
  info: ClubInfo | null;
  exists: boolean | null;
  refs: number;
  unsub?: () => void;
  subscribers: Set<() => void>;
}

const sliceCache = new Map<string, SliceEntry>();
const clubCache = new Map<string, ClubEntry>();

function sliceKey(clubId: string, name: ClubSlice) {
  return `${clubId}:${name}`;
}

function mapDocs(snapshot: QuerySnapshot): FirestoreDoc[] {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreDoc);
}

function sortSlice(name: ClubSlice, docs: FirestoreDoc[]) {
  if (name === "transactions") {
    docs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } else if (name === "players" || name === "inventory") {
    docs.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  } else if (name === "events") {
    docs.sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );
  } else if (name === "gallery") {
    docs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  } else if (name === "goals") {
    docs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return docs;
}

function readClub(data: Record<string, any>, id: string): ClubInfo {
  const images =
    data.heroImages?.length > 0
      ? data.heroImages
      : data.heroImage
        ? [data.heroImage]
        : [DEFAULT_HERO_IMAGE];
  return {
    id,
    slug: data.slug || id,
    name: data.name || "",
    description: data.description || DEFAULT_CLUB_DESCRIPTION,
    location: data.location,
    localityId: data.localityId,
    heroImages: images,
    defaultLineups: data.defaultLineups || {},
    logoUrl: data.logoUrl,
    presidentPhone: data.presidentPhone || "",
    active: data.active !== false,
    createdAt: data.createdAt,
  };
}

function watchClub(clubId: string, onChange: () => void) {
  let entry = clubCache.get(clubId);
  if (!entry) {
    entry = {
      info: null,
      exists: null,
      refs: 0,
      subscribers: new Set(),
    };
    clubCache.set(clubId, entry);
  }
  entry.refs += 1;
  entry.subscribers.add(onChange);
  if (!entry.unsub) {
    const current = entry;
    current.unsub = onSnapshot(
      clubDocRef(clubId),
      (docSnap) => {
        if (!docSnap.exists()) {
          current.info = null;
          current.exists = false;
        } else {
          current.info = readClub(docSnap.data(), docSnap.id);
          current.exists = true;
        }
        current.subscribers.forEach((fn) => fn());
      },
      (err) => {
        console.error("Firestore Error:", err);
        current.exists = false;
        current.subscribers.forEach((fn) => fn());
      },
    );
  }
  return () => {
    const current = clubCache.get(clubId);
    if (!current) return;
    current.subscribers.delete(onChange);
    current.refs -= 1;
    if (current.refs <= 0) {
      current.unsub?.();
      current.unsub = undefined;
      current.refs = 0;
    }
  };
}

function watchSlice(clubId: string, name: ClubSlice, onChange: () => void) {
  const key = sliceKey(clubId, name);
  let entry = sliceCache.get(key);
  if (!entry) {
    entry = { docs: [], ready: false, refs: 0, subscribers: new Set() };
    sliceCache.set(key, entry);
  }
  entry.refs += 1;
  entry.subscribers.add(onChange);
  if (!entry.unsub) {
    const current = entry;
    current.unsub = onSnapshot(
      clubCol(clubId, name),
      (snapshot) => {
        current.docs = sortSlice(name, mapDocs(snapshot));
        current.ready = true;
        current.subscribers.forEach((fn) => fn());
      },
      (err) => {
        console.error("Firestore Error:", err);
        current.ready = true;
        current.subscribers.forEach((fn) => fn());
      },
    );
  }
  return () => {
    const current = sliceCache.get(key);
    if (!current) return;
    current.subscribers.delete(onChange);
    current.refs -= 1;
    if (current.refs <= 0) {
      current.unsub?.();
      current.unsub = undefined;
      current.refs = 0;
    }
  };
}

function emptyReady(): Record<ClubSlice, boolean> {
  return {
    players: false,
    events: false,
    transactions: false,
    inventory: false,
    gallery: false,
    goals: false,
  };
}

export function useClubData(clubId: string, requested: ClubSlice[] = []) {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const requestKey = [...requested].sort().join("|");

  const cachedClub = clubCache.get(clubId);
  const [clubState, setClubState] = useState(() => ({
    id: clubId,
    info: cachedClub?.info ?? null,
    exists: cachedClub?.exists ?? null,
  }));

  if (clubState.id !== clubId) {
    const hit = clubCache.get(clubId);
    setClubState({
      id: clubId,
      info: hit?.info ?? null,
      exists: hit?.exists ?? null,
    });
  }

  useEffect(() => {
    return watchClub(clubId, () => {
      const hit = clubCache.get(clubId);
      setClubState({
        id: clubId,
        info: hit?.info ?? null,
        exists: hit?.exists ?? null,
      });
    });
  }, [clubId]);

  useEffect(() => {
    const names = requestKey ? (requestKey.split("|") as ClubSlice[]) : [];
    const stops = names.map((name) => watchSlice(clubId, name, refresh));
    refresh();
    return () => stops.forEach((stop) => stop());
  }, [clubId, requestKey, refresh]);

  const ready = emptyReady();
  const docs: Record<ClubSlice, FirestoreDoc[]> = {
    players: [],
    events: [],
    transactions: [],
    inventory: [],
    gallery: [],
    goals: [],
  };
  for (const name of SLICES) {
    const entry = sliceCache.get(sliceKey(clubId, name));
    if (!entry) continue;
    ready[name] = entry.ready;
    docs[name] = entry.docs;
  }

  const showingThisClub = clubState.id === clubId;

  return {
    clubInfo: showingThisClub ? clubState.info : (cachedClub?.info ?? null),
    clubExists: showingThisClub ? clubState.exists : (cachedClub?.exists ?? null),
    transactions: docs.transactions,
    players: docs.players,
    inventory: docs.inventory,
    events: docs.events,
    gallery: docs.gallery,
    goals: docs.goals,
    ready,
    loading: (showingThisClub ? clubState.exists : cachedClub?.exists ?? null) === null,
  };
}
