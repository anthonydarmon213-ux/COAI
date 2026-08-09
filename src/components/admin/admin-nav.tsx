import Link from "next/link";

const LINKS = [
  { href: "/admin/business", label: "Business" },
  { href: "/admin/programmes", label: "Validation" },
  { href: "/admin/suivi", label: "Suivi à risque" },
  { href: "/admin/videos", label: "Vidéos" },
] as const;

// Nav minimale partagée par les pages /admin/* — ces pages n'étaient reliées
// entre elles par aucun lien (accès uniquement par URL directe).
export function AdminNav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
            link.href === current
              ? "border-laiton-400/20 bg-laiton-400/[0.08] text-laiton-300"
              : "border-graphite-800 text-graphite-400 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
