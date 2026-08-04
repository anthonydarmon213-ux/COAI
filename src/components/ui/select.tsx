import { forwardRef, type SelectHTMLAttributes } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50 outline-none transition focus:border-laiton-500 ${className}`}
        {...props}
      />
    );
  }
);
