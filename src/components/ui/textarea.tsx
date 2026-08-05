import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={`w-full resize-none rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 text-graphite-50 placeholder:text-graphite-400 outline-none transition focus:border-laiton-400/70 focus:bg-white/[0.065] focus:ring-4 focus:ring-laiton-400/10 ${className}`}
        {...props}
      />
    );
  }
);
