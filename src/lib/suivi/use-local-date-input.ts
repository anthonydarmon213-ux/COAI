"use client";

import { useState, useSyncExternalStore } from "react";
import { localCalendarDay } from "./calendar-day";

const subscribe = () => () => {};
const serverDay = () => "";

/** Jour de l'appareil, initialisé après hydratation, jamais celui du serveur. */
export function useLocalDateInput() {
  const today = useSyncExternalStore(subscribe, localCalendarDay, serverDay);
  const [date, setDate] = useState<string | null>(null);
  return [date ?? today, setDate] as const;
}
