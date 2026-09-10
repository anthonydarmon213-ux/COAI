"use client";

import Script from "next/script";
import { ANALYTICS_READY_EVENT } from "@/lib/analytics/conversion-delivery";

// GA4 gère nativement les paramètres UTM (utm_source, utm_medium,
// utm_campaign...) sur la première page vue — aucun code custom requis
// pour l'attribution de campagne.
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
          window.dispatchEvent(new Event('${ANALYTICS_READY_EVENT}'));
        `}
      </Script>
    </>
  );
}
