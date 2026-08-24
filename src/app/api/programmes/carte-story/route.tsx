import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { photoRepasPourNom } from "@/lib/nutrition/photos-repas";
import { photoRecuperationPourTexte } from "@/lib/recuperation/photos-recuperation";
import type { Pilier } from "@prisma/client";

function textes(contenu: unknown): string[] {
  const resultat: string[] = [];
  function walk(noeud: unknown) {
    if (typeof noeud === "string") {
      if (noeud.trim()) resultat.push(noeud.trim());
      return;
    }
    if (Array.isArray(noeud)) return noeud.forEach(walk);
    if (typeof noeud === "object" && noeud !== null) Object.values(noeud).forEach(walk);
  }
  walk(contenu);
  return resultat;
}

function premierVisuel(contenu: unknown, pilier: Pilier, sexe?: string | null): string | null {
  const valeurs = textes(contenu);
  if (pilier === "ENTRAINEMENT") {
    for (const valeur of valeurs) {
      const photo = photoCoaiPourNom(valeur);
      if (photo) return photo;
    }
  }
  if (pilier === "NUTRITION") {
    for (const valeur of valeurs) {
      const photo = photoRepasPourNom(valeur);
      if (photo) return photo;
    }
  }
  if (pilier === "RECUPERATION") return photoRecuperationPourTexte(valeurs.join(" "), sexe);
  return null;
}

function titre(contenu: unknown, repli: string): string {
  if (typeof contenu === "object" && contenu !== null && !Array.isArray(contenu)) {
    const valeur = (contenu as Record<string, unknown>).titre;
    if (typeof valeur === "string" && valeur.trim()) return valeur.trim().slice(0, 54);
  }
  return repli;
}

export async function GET(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    select: { id: true, profile: { select: { sexe: true } } },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const programmes = await Promise.all(
    piliers.map(async (pilier) => {
      const [valide, dernier] = await Promise.all([
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: "VALIDE" },
          orderBy: { generatedAt: "desc" },
          select: { contenu: true },
        }),
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: { in: ["GENERE_IA", "EN_ATTENTE"] } },
          orderBy: { generatedAt: "desc" },
          select: { contenu: true },
        }),
      ]);
      return valide ?? dernier;
    })
  );

  if (!programmes.some(Boolean)) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });
  const origine = new URL(request.url).origin;
  const absolu = (chemin: string) => new URL(chemin, origine).toString();
  const replis = [
    "/exercices/back-squat-barre.jpg",
    "/repas/plat-saumon-quinoa-brocolis.jpg",
    user.profile?.sexe?.toLowerCase() === "homme"
      ? "/recuperation/sauna-homme-blond-premium.jpg"
      : "/recuperation/sauna-femme-blonde-premium.jpg",
  ] as const;
  const cartes = [
    { numero: "01", label: "ENTRAÎNEMENT", titre: titre(programmes[0]?.contenu, "Bouger avec intention"), image: premierVisuel(programmes[0]?.contenu, "ENTRAINEMENT") ?? replis[0] },
    { numero: "02", label: "ALIMENTATION", titre: titre(programmes[1]?.contenu, "Manger pour progresser"), image: premierVisuel(programmes[1]?.contenu, "NUTRITION") ?? replis[1] },
    { numero: "03", label: "RÉCUPÉRATION", titre: titre(programmes[2]?.contenu, "Récupérer pour durer"), image: premierVisuel(programmes[2]?.contenu, "RECUPERATION", user.profile?.sexe) ?? replis[2] },
  ];

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "76px 68px", background: "radial-gradient(circle at 90% 0%,rgba(0,240,255,.12),transparent 32%),radial-gradient(circle at 5% 78%,rgba(212,175,55,.18),transparent 35%),#0D0E12", color: "#fffdf8", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", width: 74, height: 74, alignItems: "center", justifyContent: "center", border: "4px solid #D4AF37", borderRadius: 999, boxShadow: "0 0 28px rgba(212,175,55,.35)" }}><div style={{ width: 38, height: 38, border: "3px solid #00F0FF", borderRadius: 999 }} /></div>
          <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: 12 }}>COAI</span>
        </div>
        <span style={{ fontSize: 18, color: "#D4AF37", letterSpacing: 4 }}>MON PROGRAMME</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 72 }}>
        <span style={{ fontSize: 24, color: "#00F0FF", letterSpacing: 6 }}>3 PILIERS. UNE DIRECTION.</span>
        <span style={{ marginTop: 18, fontSize: 70, lineHeight: 1.03, fontWeight: 760, letterSpacing: -3 }}>MON CORPS.<br />MON RYTHME.<br />MON PLAN.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 58 }}>
        {cartes.map((carte) => (
          <div key={carte.numero} style={{ position: "relative", display: "flex", height: 285, overflow: "hidden", borderRadius: 28, border: "1px solid rgba(255,255,255,.14)", background: "#16181b" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendu next/og */}
            <img src={absolu(carte.image)} alt="" width={944} height={285} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: .62 }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg,rgba(5,6,8,.96) 0%,rgba(5,6,8,.72) 52%,rgba(5,6,8,.12) 100%)" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "34px 40px", width: 650 }}>
              <span style={{ fontSize: 17, color: carte.numero === "02" ? "#00F0FF" : "#D4AF37", letterSpacing: 5 }}>{carte.numero} · {carte.label}</span>
              <span style={{ marginTop: 18, fontSize: 35, lineHeight: 1.18, fontWeight: 700 }}>{carte.titre}</span>
              <span style={{ marginTop: 17, color: "#c6c8cb", fontSize: 19 }}>Plan personnalisé · visuels COAI</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 54, paddingTop: 34 }}>
        <span style={{ maxWidth: 600, fontSize: 24, lineHeight: 1.45, color: "#c6c8cb" }}>Mon coaching s&apos;adapte chaque jour à ma forme, mon temps et mon matériel.</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}><span style={{ fontSize: 26, fontWeight: 750 }}>BILAN OFFERT</span><span style={{ color: "#D4AF37", fontSize: 24 }}>coai.fr/diagnostic</span></div>
      </div>
    </div>,
    { width: 1080, height: 1920 }
  );
}
