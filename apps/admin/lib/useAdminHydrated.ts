"use client";

import { useEffect, useState } from "react";

import { useAdminStore } from "./store";

export function useAdminHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAdminStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useAdminStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    return unsub;
  }, []);

  return hydrated;
}
