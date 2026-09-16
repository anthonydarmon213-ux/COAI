"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { localCalendarDay } from "@/lib/suivi/calendar-day";

// Le serveur ne connaît pas le fuseau du téléphone. On lui transmet le jour
// civil seulement si nécessaire, sans cookie ni chargement de tout l'historique.
export function NutritionLocalDay({ day, children }: { day: string; children: ReactNode }) {
  const router = useRouter();
  const [localDay, setLocalDay] = useState<string | null>(null);

  useEffect(() => {
    function syncDay() {
      const current = localCalendarDay();
      setLocalDay(current);
      if (current !== day) {
        const url = new URL(window.location.href);
        url.searchParams.set("jour", current);
        router.replace(url.pathname + url.search + url.hash, { scroll: false });
      }
    }
    syncDay();
    const interval = window.setInterval(syncDay, 60_000);
    window.addEventListener("focus", syncDay);
    document.addEventListener("visibilitychange", syncDay);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncDay);
      document.removeEventListener("visibilitychange", syncDay);
    };
  }, [day, router]);

  if (localDay !== day) return <p role="status" className="text-sm text-graphite-300">Mise à jour de ta journée…</p>;
  return <>{children}</>;
}
