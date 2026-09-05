import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-cyan-300/[0.13] bg-[linear-gradient(135deg,rgba(255,255,255,.055),rgba(56,189,248,.025))] px-4 py-3 text-graphite-50 placeholder:text-graphite-400 outline-none transition hover:border-cyan-300/30 focus:border-cyan-300/65 focus:bg-cyan-300/[0.055] focus:ring-4 focus:ring-cyan-300/10 ${className}`}
        {...props}
      />
    );
  }
);
