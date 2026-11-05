"use client";

import { useSyncExternalStore } from "react";

export function CopyrightYear() {
  return useSyncExternalStore(
    () => () => {},
    () => String(new Date().getFullYear()),
    () => "2026",
  );
}
