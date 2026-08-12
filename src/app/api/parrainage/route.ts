import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L, ambigus à l'oral/écrit
const LONGUEUR_CODE = 7;

function genererCode(): string {
  let code = "";
  for (let i = 0; i < LONGUEUR_CODE; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

// Get-or-create le code de parrainage de l'utilisateur (généré à la demande,
// pas à l'inscription) et renvoie la liste de ses filleuls avec leur statut.
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: {
      filleuls: {
        select: {
          prenom: true,
          email: true,
          createdAt: true,
          recompenseParrainageAppliquee: true,
          subscription: { select: { status: true, trialEnd: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  let code = user.codeParrainage;
  if (!code) {
    // Boucle de re-tentative en cas de collision (improbable avec 7
    // caractères sur un alphabet de 32, mais la contrainte unique protège
    // dans tous les cas contre un doublon en base).
    for (let tentative = 0; tentative < 5 && !code; tentative++) {
      const essai = genererCode();
      try {
        await prisma.user.update({ where: { id: user.id }, data: { codeParrainage: essai } });
        code = essai;
      } catch {
        // Collision : on retente avec un nouveau code.
      }
    }
    if (!code) {
      return NextResponse.json({ error: "Impossible de générer un code" }, { status: 500 });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const filleuls = user.filleuls.map((f) => ({
    prenom: f.prenom,
    email: f.email,
    inscritLe: f.createdAt,
    statut: f.recompenseParrainageAppliquee
      ? "converti"
      : f.subscription
        ? "en_essai"
        : "inscrit",
  }));

  return NextResponse.json({ code, lien: `${appUrl}/invitation/${code}`, filleuls });
}
