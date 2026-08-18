import { Footer } from "@/components/marketing/footer";
import { SiteNav } from "@/components/marketing/site-nav";
import { UtmCapture } from "@/components/analytics/utm-capture";
import { getCurrentUser } from "@/lib/auth/server";

// Nav publique complète (11/08/2026, cf. src/components/marketing/site-nav.tsx)
// pour les pages marketing : les pages marketing n'ont pas de nav applicative
// (AppNav), mais un client existant doit pouvoir retrouver le chemin vers son
// compte. Le logo suit la convention web et ramène toujours à l'accueil ;
// le bouton de droite reste contextuel et ouvre le tableau de bord lorsque
// l'utilisateur est connecté.
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="relative">
      <UtmCapture />
      <header className="coai-public-header fixed inset-x-0 top-0 z-50 border-b shadow-[0_12px_35px_rgba(0,0,0,.18)] backdrop-blur-xl">
        <SiteNav connecte={!!user} />
      </header>
      {children}
      <Footer />
    </div>
  );
}
