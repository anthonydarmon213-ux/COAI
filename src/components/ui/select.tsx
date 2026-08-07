"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

type Option = { value: string; label: string; disabled?: boolean };

function extractOptions(children: ReactNode): Option[] {
  const options: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean };
    options.push({
      value: String(props.value ?? ""),
      label: typeof props.children === "string" ? props.children : String(props.value ?? ""),
      disabled: props.disabled,
    });
  });
  return options;
}

// Menu déroulant flottant custom (même principe que NavGroupDropdown) —
// remplace le <select> natif, dont le popup d'options ne se stylise pas
// en CSS. Garde la même API (value/onChange/children d'<option>) pour ne
// rien changer sur les ~11 sites d'appel existants.
export function Select({
  value,
  onChange,
  children,
  disabled,
  className = "",
}: Pick<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "children" | "disabled" | "className">) {
  const options = extractOptions(children);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function updateCoords() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    updateCoords();

    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  function selectOption(option: Option) {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value } } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-graphite-900 px-4 py-3 text-left text-graphite-50 outline-none transition focus:border-laiton-400/70 focus:ring-4 focus:ring-laiton-400/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={selected?.value ? "" : "text-graphite-400"}>
          {selected?.label ?? "Sélectionner…"}
        </span>
        <span className={`shrink-0 text-[10px] text-graphite-400 transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
            className="z-50 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#14161a] p-1.5 shadow-2xl shadow-black/60"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => selectOption(option)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "bg-laiton-400/[0.1] text-laiton-300"
                      : "text-graphite-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
