"use client";

import type { SelectHTMLAttributes } from "react";

// Native selection keeps keyboard, labels and the iOS picker working without
// a manually positioned portal. The existing value/onChange contract is unchanged.
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-graphite-900 px-4 py-3 text-base text-graphite-50 outline-none transition [color-scheme:dark] hover:border-white/20 focus:border-laiton-400/70 focus:ring-4 focus:ring-laiton-400/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
  );
}
