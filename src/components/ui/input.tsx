import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50 placeholder:text-graphite-400 outline-none transition focus:border-laiton-500 ${className}`}
        {...props}
      />
    );
  }
);
