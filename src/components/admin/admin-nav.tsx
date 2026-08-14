import Link from "next/link";
import { prisma } from "@/lib/db/client";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/business", label: "Business" },
  { href: "/admin/leads", label: "Diagnostics" },
  { href: "/admin/programmes", label: "Validation" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/suivi", label: "Suivi à risque" },
  { href: "/admin/videos", label: "Vidéos" },
] as const;

// Nav minimale partagée par les pages /admin/* — ces pages n'étaient reliées
// entre elles par aucun lien (accès uniquement par URL directe).
//
// Le compteur "Validation" est affiché ici (pas seulement sur la page elle-
// même) : filet de sécurité si jamais la notif email de nouveau programme se
// perdait encore (cf. bug diagnostic_leads du 10/08) — Anthony le verrait
// quand même en visitant n'importe quelle page admin.
export async function AdminNav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  const enAttenteCount = await prisma.programmeGenerated.count({ where: { statut: "EN_ATTENTE" } });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
            link.href === current
              ? "border-laiton-400/20 bg-laiton-400/[0.08] text-laiton-300"
              : "border-graphite-800 text-graphite-400 hover:text-white"
          }`}
        >
          {link.label}
          {link.href === "/admin/programmes" && enAttenteCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-laiton-400 px-1.5 text-xs font-semibold text-graphite-950">
              {enAttenteCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
