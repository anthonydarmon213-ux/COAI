import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-laiton-400/25 hover:bg-white/[0.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_28px_90px_-40px_rgba(0,0,0,0.95)] ${className}`}
      {...props}
    />
  );
}
