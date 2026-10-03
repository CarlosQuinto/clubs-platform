import { useEffect, useState } from "react";
import { dataConnect, platformChrome, QueryFetchPolicy } from "../../infrastructure/dataconnect";
import { EMPTY_CHROME, toPlatformChrome } from "./shellMapper";
import type { PlatformChromeView } from "./shellViewState";

let cached: PlatformChromeView | null = null;
let pending: Promise<PlatformChromeView> | null = null;
const listeners = new Set<(view: PlatformChromeView) => void>();

function loadChrome(): Promise<PlatformChromeView> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = platformChrome(dataConnect, { fetchPolicy: QueryFetchPolicy.SERVER_ONLY })
      .then((result) => {
        cached = toPlatformChrome(result.data);
        return cached;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

export function invalidatePlatformChrome() {
  cached = null;
  pending = null;
  void loadChrome()
    .then((next) => {
      listeners.forEach((listener) => listener(next));
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

export function usePlatformChrome(enabled: boolean): PlatformChromeView {
  const [view, setView] = useState<PlatformChromeView>(cached ?? EMPTY_CHROME);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const listener = (next: PlatformChromeView) => {
      if (alive) setView(next);
    };
    listeners.add(listener);
    void loadChrome()
      .then((next) => {
        if (alive) setView(next);
      })
      .catch((err: unknown) => {
        console.error(err);
      });
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, [enabled]);

  return view;
}
