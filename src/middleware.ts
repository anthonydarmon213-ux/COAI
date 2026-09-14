import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protège les routes (app)/* : redirige vers /sign-in si non authentifié,
// et pourra vérifier l'abonnement actif avant d'accéder à l'espace membre.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(updates: { name: string; value: string; options: CookieOptions }[]) {
          // Both the current server render and the browser need the new
          // session. Updating only the response leaves this render expired.
          updates.forEach(({ name, value }) => request.cookies.set(name, value));
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          previous.forEach(cookie => response.cookies.set(cookie));
          updates.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Les fichiers statiques ne passent JAMAIS par l'authentification
  // (01/09/2026). Le motif "/videos/:path*" visait la page des vidéos
  // exclusives, mais il attrapait aussi /videos/exercices/*.mp4 : les 79
  // vidéos de démonstration étaient redirigées vers /sign-in et
  // s'affichaient en noir dans les fiches d'exercice. Elles n'avaient
  // jamais fonctionné en production.
  //
  // Un <video> ne suit pas une redirection HTML : il reçoit du texte là où
  // il attend un flux, et échoue en silence — d'où l'absence de message
  // d'erreur qui rendait le défaut si difficile à voir.
  if (/\.[a-z0-9]{2,5}$/i.test(request.nextUrl.pathname)) {
    return response;
  }

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/programme") ||
    request.nextUrl.pathname.startsWith("/coach") ||
    request.nextUrl.pathname.startsWith("/videos") ||
    request.nextUrl.pathname.startsWith("/suivi") ||
    request.nextUrl.pathname.startsWith("/avis") ||
    request.nextUrl.pathname.startsWith("/compte") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/bienvenue") ||
    request.nextUrl.pathname.startsWith("/completer-inscription");

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/sign-in", request.url);
    // Conserver la séance choisie et le retour Stripe si la session a expiré.
    // La destination reste relative et est validée à nouveau après connexion.
    redirectUrl.searchParams.set("redirect_to", request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/programme/:path*", "/coach/:path*", "/videos/:path*", "/suivi/:path*", "/avis/:path*", "/compte/:path*", "/admin/:path*", "/bienvenue/:path*", "/completer-inscription/:path*"],
};
