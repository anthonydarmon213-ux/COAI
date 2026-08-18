import { NextResponse } from "next/server";

const CODE_PARRAINAGE = /^[A-HJ-KM-NP-Z2-9]{7}$/;
const TRENTE_JOURS = 60 * 60 * 24 * 30;

// Porte d'entrée publique des invitations : le filleul découvre d'abord la
// valeur de COAI via le diagnostic gratuit. Le code reste disponible jusqu'à
// l'inscription (email ou Google) sans apparaître dans toutes les URLs du
// tunnel.
export function GET(request: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const invitation = new URL(request.url);
  const destination = new URL("/diagnostic", request.url);
  destination.searchParams.set("utm_source", "parrainage");
  destination.searchParams.set("utm_medium", "partage_membre");
  destination.searchParams.set("utm_campaign", "score_challenge");

  const score = Number(invitation.searchParams.get("score"));
  if (Number.isInteger(score) && score >= 0 && score <= 100) {
    destination.searchParams.set("challenge_score", String(score));
    destination.searchParams.set("utm_content", `score_${score}`);
  }

  const response = NextResponse.redirect(destination);
  if (CODE_PARRAINAGE.test(code)) {
    response.cookies.set("coai_ref", code, {
      path: "/",
      maxAge: TRENTE_JOURS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}
