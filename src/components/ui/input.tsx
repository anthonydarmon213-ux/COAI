import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-graphite-50 placeholder:text-graphite-400 outline-none transition hover:border-white/20 focus:border-laiton-400/70 focus:bg-white/[0.065] focus:ring-4 focus:ring-laiton-400/10 ${className}`}
        {...props}
      />
    );
  }
);
