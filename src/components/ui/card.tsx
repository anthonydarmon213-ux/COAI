import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-graphite-800 bg-graphite-900/40 p-5 ${className}`}
      {...props}
    />
  );
}
