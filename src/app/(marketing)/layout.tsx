import Link from "next/link";
import { Footer } from "@/components/marketing/footer";
import { CoaiMark } from "@/components/brand/coai-mark";
import { getCurrentUser } from "@/lib/auth/server";

// Barre minimale pour les pages publiques (accueil, pricing) : les pages
// marketing n'ont pas de nav applicative (AppNav), mais un client existant
// doit pouvoir retrouver le chemin vers son compte. Si l'utilisateur est
// déjà connecté (ex: il arrive sur /pricing depuis l'app), le logo et le
// bouton ramènent vers son tableau de bord plutôt que vers l'accueil public
// / la connexion — sinon ça donne l'impression d'être déconnecté.
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="relative">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-start justify-between px-6 py-6 sm:px-10">
          <Link href={user ? "/dashboard" : "/"} className="group flex flex-col">
            <span className="flex items-center gap-2.5">
              <CoaiMark size={22} />
              <span className="font-display text-lg font-semibold tracking-[0.2em] text-white">
                COAI
                <span className="ml-2 font-mono text-[0.55rem] font-normal tracking-[0.2em] text-laiton-400">
                  HI × AI™
                </span>
              </span>
            </span>
            <span className="mt-1.5 text-xs font-medium tracking-wide text-graphite-200 transition group-hover:text-white sm:text-sm">
              AI generates. Humans validate.
            </span>
            <span className="mt-0.5 hidden text-[0.6rem] tracking-wide text-graphite-500 sm:block">
              L&apos;IA génère. L&apos;humain valide.
            </span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/sign-in"}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-graphite-300 transition hover:border-laiton-400/40 hover:text-white"
          >
            {user ? "Mon compte" : "Se connecter"}
          </Link>
        </div>
      </header>
      {children}
      <Footer />
    </div>
  );
}
