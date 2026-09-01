"use client";

import { useState } from "react";

export type CarteStory = {
  numero: string;
  label: string;
  titre: string;
  image: string;
  accroche?: string;
  reperes?: Array<{ label: string; valeur: string }>;
  actions?: string[];
  invitation?: string;
};

const OR = "#D4AF37";
const CYAN = "#00F0FF";
const BLANC = "#FFFDF8";
const GRIS = "#A9ADB5";

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function cheminArrondi(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  largeur: number,
  hauteur: number,
  rayon: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, largeur, hauteur, rayon);
}

function lignesDeTexte(
  ctx: CanvasRenderingContext2D,
  texte: string,
  largeur: number,
  maximum = 3,
) {
  const mots = texte.trim().split(/\s+/);
  const lignes: string[] = [];
  let ligne = "";

  for (let index = 0; index < mots.length; index += 1) {
    const mot = mots[index];
    if (!mot) continue;
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width <= largeur || !ligne) {
      ligne = essai;
      continue;
    }

    lignes.push(ligne);
    ligne = mot;
    if (lignes.length === maximum - 1) {
      const reste = [ligne, ...mots.slice(index + 1)].join(" ");
      let tronque = reste;
      while (ctx.measureText(`${tronque}…`).width > largeur && tronque.length > 1) {
        tronque = tronque.slice(0, -1);
      }
      lignes.push(`${tronque.trim()}…`);
      return lignes;
    }
  }

  if (ligne) lignes.push(ligne);
  return lignes.slice(0, maximum);
}

function dessinerTexte(
  ctx: CanvasRenderingContext2D,
  texte: string,
  x: number,
  y: number,
  largeur: number,
  interligne: number,
  maximum = 3,
) {
  const lignes = lignesDeTexte(ctx, texte, largeur, maximum);
  lignes.forEach((ligne, index) => ctx.fillText(ligne, x, y + index * interligne));
  return lignes.length;
}

function dessinerFond(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#090B0F";
  ctx.fillRect(0, 0, 1080, 1920);

  const haloCyan = ctx.createRadialGradient(980, 300, 20, 980, 300, 620);
  haloCyan.addColorStop(0, "rgba(0,240,255,.16)");
  haloCyan.addColorStop(1, "rgba(0,240,255,0)");
  ctx.fillStyle = haloCyan;
  ctx.fillRect(0, 0, 1080, 1000);

  const haloOr = ctx.createRadialGradient(80, 1500, 20, 80, 1500, 600);
  haloOr.addColorStop(0, "rgba(212,175,55,.16)");
  haloOr.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = haloOr;
  ctx.fillRect(0, 950, 1080, 970);
}

function dessinerMarque(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = OR;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(104, 89, 34, -0.72, Math.PI * 1.72);
  ctx.stroke();
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(104, 89, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const marque = ctx.createLinearGradient(148, 0, 330, 0);
  marque.addColorStop(0, BLANC);
  marque.addColorStop(0.72, "#F0D59D");
  marque.addColorStop(1, OR);
  ctx.fillStyle = marque;
  ctx.font = "800 55px system-ui";
  ctx.fillText("COAI", 154, 105);
  ctx.fillStyle = GRIS;
  ctx.font = "600 13px system-ui";
  ctx.fillText("PERSONAL TRAINING, REIMAGINED.", 156, 132);
}

function dessinerImageCouverte(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  largeur: number,
  hauteur: number,
  rayon: number,
) {
  ctx.save();
  cheminArrondi(ctx, x, y, largeur, hauteur, rayon);
  ctx.clip();
  const ratio = Math.max(largeur / image.width, hauteur / image.height);
  const largeurImage = image.width * ratio;
  const hauteurImage = image.height * ratio;
  ctx.drawImage(
    image,
    x + (largeur - largeurImage) / 2,
    y + (hauteur - hauteurImage) / 2,
    largeurImage,
    hauteurImage,
  );
  ctx.restore();
}

function titreStory(carte: CarteStory) {
  if (carte.numero === "01") return "MA SÉANCE EN UN COUP D’ŒIL.";
  if (carte.numero === "02") return "MON PLAN ALIMENTAIRE.";
  return "MA RÉCUPÉRATION DU JOUR.";
}

async function dessinerStoryPilier(ctx: CanvasRenderingContext2D, carte: CarteStory) {
  const image = await chargerImage(carte.image);
  const couleur = carte.numero === "02" ? CYAN : OR;

  ctx.fillStyle = couleur;
  ctx.font = "700 21px system-ui";
  ctx.fillText(`${carte.numero} · ${carte.label}`, 70, 205);

  ctx.fillStyle = BLANC;
  ctx.font = "800 66px system-ui";
  dessinerTexte(ctx, titreStory(carte), 70, 286, 930, 70, 2);

  ctx.fillStyle = "#C9CDD4";
  ctx.font = "500 26px system-ui";
  dessinerTexte(
    ctx,
    carte.accroche ?? "Les repères essentiels pour avancer simplement aujourd’hui.",
    70,
    420,
    900,
    36,
    2,
  );

  dessinerImageCouverte(ctx, image, 60, 500, 960, 440, 34);
  ctx.save();
  cheminArrondi(ctx, 60, 500, 960, 440, 34);
  ctx.clip();
  const degrade = ctx.createLinearGradient(60, 620, 60, 940);
  degrade.addColorStop(0, "rgba(5,6,8,0)");
  degrade.addColorStop(1, "rgba(5,6,8,.96)");
  ctx.fillStyle = degrade;
  ctx.fillRect(60, 500, 960, 440);
  ctx.restore();

  ctx.fillStyle = couleur;
  ctx.font = "700 18px system-ui";
  ctx.fillText("MON OBJECTIF", 100, 832);
  ctx.fillStyle = BLANC;
  ctx.font = "750 34px system-ui";
  dessinerTexte(ctx, carte.titre, 100, 882, 820, 42, 2);

  ctx.fillStyle = GRIS;
  ctx.font = "700 17px system-ui";
  ctx.fillText("MES REPÈRES", 70, 1018);

  const reperes = (carte.reperes?.length ? carte.reperes : [
    { label: "CAP", valeur: "Simple" },
    { label: "RYTHME", valeur: "Régulier" },
    { label: "PRIORITÉ", valeur: "Durable" },
  ]).slice(0, 3);
  reperes.forEach((repere, index) => {
    const x = 60 + index * 330;
    cheminArrondi(ctx, x, 1050, 300, 150, 26);
    ctx.fillStyle = "rgba(255,255,255,.045)";
    ctx.fill();
    ctx.strokeStyle = index === 1 ? "rgba(0,240,255,.35)" : "rgba(212,175,55,.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = GRIS;
    ctx.font = "700 15px system-ui";
    ctx.fillText(repere.label.toUpperCase(), x + 24, 1092);
    ctx.fillStyle = BLANC;
    ctx.font = "750 29px system-ui";
    dessinerTexte(ctx, repere.valeur, x + 24, 1143, 250, 32, 2);
  });

  cheminArrondi(ctx, 60, 1260, 960, 300, 30);
  ctx.fillStyle = "rgba(255,255,255,.035)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = couleur;
  ctx.font = "700 17px system-ui";
  ctx.fillText("LE CAP À GARDER", 98, 1310);

  const actions = (carte.actions?.length ? carte.actions : [
    "Suis le plan prévu aujourd’hui.",
    "Reste régulier plutôt que parfait.",
    "Ajuste seulement si ton corps le demande.",
  ]).slice(0, 3);
  actions.forEach((action, index) => {
    const y = 1370 + index * 63;
    ctx.fillStyle = index === 1 ? CYAN : OR;
    ctx.beginPath();
    ctx.arc(103, y - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BLANC;
    ctx.font = "600 24px system-ui";
    dessinerTexte(ctx, action, 130, y, 820, 30, 1);
  });

  cheminArrondi(ctx, 60, 1615, 960, 150, 30);
  const partage = ctx.createLinearGradient(60, 0, 1020, 0);
  partage.addColorStop(0, "rgba(212,175,55,.18)");
  partage.addColorStop(1, "rgba(0,240,255,.10)");
  ctx.fillStyle = partage;
  ctx.fill();
  ctx.fillStyle = BLANC;
  ctx.font = "700 21px system-ui";
  dessinerTexte(
    ctx,
    carte.invitation ?? "Tu connais quelqu’un qui en a besoin ? Partage-lui ce plan.",
    98,
    1672,
    840,
    30,
    2,
  );

  ctx.fillStyle = BLANC;
  ctx.font = "800 29px system-ui";
  ctx.fillText("BILAN INITIAL OFFERT", 70, 1842);
  ctx.fillStyle = OR;
  ctx.font = "700 32px system-ui";
  ctx.fillText("coai.fr/diagnostic", 70, 1890);
}

async function dessinerStoryComplete(ctx: CanvasRenderingContext2D, cartes: CarteStory[]) {
  ctx.fillStyle = CYAN;
  ctx.font = "600 21px system-ui";
  ctx.fillText("3 PILIERS. UNE DIRECTION.", 70, 190);
  ctx.fillStyle = BLANC;
  ctx.font = "800 66px system-ui";
  ctx.fillText("MON PLAN EN UN", 70, 280);
  ctx.fillText("COUP D’ŒIL.", 70, 350);

  ctx.fillStyle = "#A8ADB3";
  ctx.font = "500 24px system-ui";
  ctx.fillText("Ta journée, structurée en un regard.", 70, 392);

  const selection = cartes.slice(0, 3);
  const images = await Promise.all(
    selection.map((carte) => chargerImage(carte.image)),
  );
  selection.forEach((carte, index) => {
    const y = 430 + index * 350;
    const image = images[index];
    const couleur = index === 1 ? CYAN : OR;

    ctx.fillStyle = "#14161A";
    cheminArrondi(ctx, 50, y, 980, 325, 28);
    ctx.fill();

    if (image) {
      dessinerImageCouverte(ctx, image, 50, y, 325, 325, 28);
    }
    ctx.save();
    cheminArrondi(ctx, 50, y, 325, 325, 28);
    ctx.clip();
    const degrade = ctx.createLinearGradient(50, y, 375, y + 325);
    degrade.addColorStop(0, "rgba(5,6,8,.05)");
    degrade.addColorStop(1, "rgba(5,6,8,.72)");
    ctx.fillStyle = degrade;
    ctx.fillRect(50, y, 325, 325);
    ctx.restore();

    ctx.fillStyle = couleur;
    ctx.font = "700 18px system-ui";
    ctx.fillText(`${carte.numero} · ${carte.label}`, 410, y + 46);
    ctx.fillStyle = BLANC;
    ctx.font = "700 30px system-ui";
    dessinerTexte(ctx, carte.titre, 410, y + 92, 575, 38, 2);

    const reperes = carte.reperes?.slice(0, 2) ?? [];
    reperes.forEach((repere, repereIndex) => {
      const x = 410 + repereIndex * 285;
      ctx.fillStyle = "#202329";
      cheminArrondi(ctx, x, y + 177, 265, 68, 14);
      ctx.fill();
      ctx.fillStyle = "#858B93";
      ctx.font = "600 13px system-ui";
      ctx.fillText(repere.label.toUpperCase(), x + 16, y + 200);
      ctx.fillStyle = BLANC;
      ctx.font = "700 20px system-ui";
      dessinerTexte(ctx, repere.valeur, x + 16, y + 228, 230, 24, 1);
    });

    const conseil = carte.actions?.[0] ?? carte.accroche;
    if (conseil) {
      ctx.fillStyle = couleur;
      ctx.font = "700 14px system-ui";
      ctx.fillText("À RETENIR", 410, y + 278);
      ctx.fillStyle = "#C6C8CB";
      ctx.font = "500 17px system-ui";
      dessinerTexte(ctx, conseil, 505, y + 278, 480, 22, 2);
    }
  });

  const ctaY = 1495;
  const cta = ctx.createLinearGradient(50, ctaY, 1030, ctaY + 245);
  cta.addColorStop(0, "rgba(212,175,55,.24)");
  cta.addColorStop(0.58, "rgba(212,175,55,.10)");
  cta.addColorStop(1, "rgba(0,240,255,.12)");
  ctx.fillStyle = cta;
  cheminArrondi(ctx, 50, ctaY, 980, 245, 28);
  ctx.fill();

  ctx.strokeStyle = "rgba(212,175,55,.56)";
  ctx.lineWidth = 2;
  cheminArrondi(ctx, 50, ctaY, 980, 245, 28);
  ctx.stroke();

  ctx.fillStyle = CYAN;
  ctx.font = "700 18px system-ui";
  ctx.fillText("À DEUX, C’EST PLUS MOTIVANT", 85, ctaY + 46);
  ctx.fillStyle = BLANC;
  ctx.font = "800 39px system-ui";
  ctx.fillText("ENVOIE-LA À UN AMI", 85, ctaY + 100);
  ctx.fillStyle = OR;
  ctx.font = "800 31px system-ui";
  ctx.fillText("MOTIVEZ-VOUS À DEUX.", 85, ctaY + 145);
  ctx.fillStyle = "#C6C8CB";
  ctx.font = "500 19px system-ui";
  dessinerTexte(
    ctx,
    "Identifiez @coai.fr et tentez de gagner un coaching 1:1 offert.",
    85,
    ctaY + 190,
    880,
    24,
    2,
  );

  ctx.fillStyle = BLANC;
  ctx.font = "800 27px system-ui";
  ctx.fillText("BILAN INITIAL OFFERT", 70, 1820);
  ctx.fillStyle = OR;
  ctx.font = "700 30px system-ui";
  ctx.fillText("coai.fr/diagnostic", 70, 1862);
}

function telecharger(blob: Blob) {
  const href = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = href;
  lien.download = "ma-story-coai-3-en-1.png";
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

export function ProgrammeShareButton({ cartes }: { cartes: CarteStory[] }) {
  const [etat, setEtat] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function partager() {
    setEtat("loading");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");

      dessinerFond(ctx);
      dessinerMarque(ctx);
      ctx.fillStyle = OR;
      ctx.font = "700 24px system-ui";
      ctx.fillText("MON PROGRAMME", 760, 92);

      if (cartes.length === 1 && cartes[0]) {
        await dessinerStoryPilier(ctx, cartes[0]);
      } else {
        await dessinerStoryComplete(ctx, cartes);
      }

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (resultat) => resultat ? resolve(resultat) : reject(new Error("Image indisponible")),
          "image/png",
        ),
      );
      const fichier = new File([blob], "ma-story-coai-3-en-1.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({
          files: [fichier],
          title: "Ma Story COAI 3-en-1",
          text: "Je t’envoie mon plan COAI 3-en-1. On se motive à deux ? Entraînement, alimentation et récupération.",
        });
      } else {
        telecharger(blob);
      }

      setEtat("done");
      window.setTimeout(() => setEtat("idle"), 3500);
    } catch (erreur) {
      if (erreur instanceof DOMException && erreur.name === "AbortError") {
        setEtat("idle");
        return;
      }
      setEtat("error");
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      disabled={etat === "loading"}
      className="rounded-full border border-laiton-400/35 bg-laiton-400/[0.08] px-4 py-2 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/[0.16]"
    >
      {etat === "loading"
        ? "Préparation du partage…"
        : etat === "done"
          ? "Fiche prête à partager ✓"
          : etat === "error"
            ? "Réessayer"
            : "Partager avec un ami"}
    </button>
  );
}
