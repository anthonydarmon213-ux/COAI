import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-cyan-300/[0.12] bg-[linear-gradient(145deg,rgba(255,255,255,.05),rgba(56,189,248,.025))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.065),0_24px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.055] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_28px_90px_-40px_rgba(14,116,144,.42)] ${className}`}
      {...props}
    />
  );
}
