import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={`w-full rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50 placeholder:text-graphite-400 outline-none transition focus:border-laiton-500 ${className}`}
        {...props}
      />
    );
  }
);
