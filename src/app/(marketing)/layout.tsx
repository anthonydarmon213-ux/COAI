import { Footer } from "@/components/marketing/footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { UtmCapture } from "@/components/analytics/utm-capture";
import { getCurrentUser } from "@/lib/auth/server";

// Nav publique complète (11/08/2026, cf. src/components/marketing/site-nav.tsx)
// pour les pages marketing : les pages marketing n'ont pas de nav applicative
// (AppNav), mais un client existant doit pouvoir retrouver le chemin vers son
// compte. Si l'utilisateur est déjà connecté (ex: il arrive sur /pricing
// depuis l'app), le logo et le bouton ramènent vers son tableau de bord
// plutôt que vers l'accueil public / la connexion.
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="relative">
      <UtmCapture />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#090a0b]/82 shadow-[0_12px_35px_rgba(0,0,0,.18)] backdrop-blur-xl">
        <SiteNav connecte={!!user} hrefCompte={user ? "/dashboard" : "/"} />
      </header>
      {children}
      <Footer />
    </div>
  );
}
