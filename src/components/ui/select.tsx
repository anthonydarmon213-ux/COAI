import { forwardRef, type SelectHTMLAttributes } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-xl border border-white/10 bg-graphite-900 px-4 py-3 text-graphite-50 outline-none transition focus:border-laiton-400/70 focus:ring-4 focus:ring-laiton-400/10 ${className}`}
        {...props}
      />
    );
  }
);
