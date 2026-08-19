import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

const PAGES = [
  { href: "/coach-sportif-paris", label: "Coach sportif à Paris" },
  { href: "/coach-sportif-en-ligne", label: "Coach sportif en ligne" },
  { href: "/programme-musculation-ia", label: "Programme de musculation par IA" },
  { href: "/coaching-nutrition-ia", label: "Coaching nutrition par IA" },
  { href: "/programme-musculation-femme", label: "Musculation pour femme" },
  { href: "/programme-perte-de-poids", label: "Perte de poids" },
  { href: "/programme-prise-de-masse", label: "Prise de masse" },
  { href: "/programme-musculation-debutant", label: "Musculation débutant" },
  { href: "/calculateur-calories", label: "Calculateur de calories" },
  { href: "/bilan-forme-gratuit", label: "Bilan de forme gratuit" },
  { href: "/coach-sportif-ia", label: "Coach sportif IA" },
  { href: "/coach-sante-dirigeant", label: "Coach santé pour dirigeants" },
  { href: "/programme-sport-entrepreneur", label: "Programme sport entrepreneur" },
  { href: "/ameliorer-energie-au-travail", label: "Améliorer son énergie au travail" },
] as const;

// Maillage interne entre les pages SEO (11/08/2026, étendu 14/08/2026) —
// jusqu'ici chacune était une impasse (aucun lien vers les autres), ce qui
// n'aidait ni le visiteur à explorer les autres angles de COAI, ni Google à
// comprendre qu'elles forment un ensemble thématique cohérent.
export function RelatedSeoLinks({ currentPath }: { currentPath: (typeof PAGES)[number]["href"] }) {
  const autres = PAGES.filter((page) => page.href !== currentPath);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 border-t border-white/[0.07] px-6 pt-16 text-center">
      <SectionLabel>À voir aussi</SectionLabel>
      <div className="flex flex-wrap justify-center gap-3">
        {autres.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-graphite-300 transition hover:border-laiton-400/30 hover:text-laiton-200"
          >
            {page.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
