import { Footer } from "@/components/marketing/footer";
import { SiteNav } from "@/components/marketing/site-nav";
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
      <header className="absolute inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0b0c0e]/40 backdrop-blur-md">
        <SiteNav connecte={!!user} hrefCompte={user ? "/dashboard" : "/"} />
      </header>
      {children}
      <Footer />
    </div>
  );
}
