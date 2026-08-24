"use client";

import { useState } from "react";

type CarteStory = { numero: string; label: string; titre: string; image: string };

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function texteSurDeuxLignes(ctx: CanvasRenderingContext2D, texte: string, x: number, y: number, largeur: number) {
  const mots = texte.split(/\s+/);
  const lignes: string[] = [];
  let ligne = "";
  for (const mot of mots) {
    const test = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(test).width > largeur && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else ligne = test;
    if (lignes.length === 1) break;
  }
  if (ligne && lignes.length < 2) lignes.push(ligne);
  lignes.slice(0, 2).forEach((item, index) => ctx.fillText(item, x, y + index * 42));
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
      ctx.fillStyle = "#0D0E12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Emblème COAI dessiné en vectoriel pour rester parfaitement net en Story.
      // L'anneau ouvert reprend le symbole de la marque, avec le cœur cyan tech.
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(104, 89, 34, -0.72, Math.PI * 1.72);
      ctx.stroke();
      ctx.strokeStyle = "#00F0FF";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(104, 89, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const marque = ctx.createLinearGradient(148, 0, 330, 0);
      marque.addColorStop(0, "#FFFDF8");
      marque.addColorStop(0.72, "#F0D59D");
      marque.addColorStop(1, "#D4AF37");
      ctx.fillStyle = marque;
      ctx.font = "800 55px system-ui";
      ctx.fillText("COAI", 154, 105);
      ctx.fillStyle = "#A9ADB5";
      ctx.font = "600 13px system-ui";
      ctx.fillText("PERSONAL TRAINING, REIMAGINED.", 156, 132);

      ctx.fillStyle = "#D4AF37";
      ctx.font = "700 24px system-ui";
      ctx.fillText("MON PROGRAMME", 760, 92);
      ctx.fillStyle = "#00F0FF";
      ctx.font = "600 21px system-ui";
      ctx.fillText("3 PILIERS. UNE DIRECTION.", 70, 190);
      ctx.fillStyle = "#fffdf8";
      ctx.font = "800 66px system-ui";
      ctx.fillText("MON PLAN EN UN", 70, 280);
      ctx.fillText("COUP D’ŒIL.", 70, 350);

      const images = await Promise.all(cartes.slice(0, 3).map((carte) => chargerImage(carte.image)));
      cartes.slice(0, 3).forEach((carte, index) => {
        const y = 430 + index * 380;
        const image = images[index];
        if (!image) return;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(60, y, 960, 330, 28);
        ctx.clip();
        const ratio = Math.max(960 / image.width, 330 / image.height);
        const largeur = image.width * ratio;
        const hauteur = image.height * ratio;
        ctx.drawImage(image, 60 + (960 - largeur) / 2, y + (330 - hauteur) / 2, largeur, hauteur);
        const degrade = ctx.createLinearGradient(60, 0, 900, 0);
        degrade.addColorStop(0, "rgba(5,6,8,.98)");
        degrade.addColorStop(0.62, "rgba(5,6,8,.68)");
        degrade.addColorStop(1, "rgba(5,6,8,.10)");
        ctx.fillStyle = degrade;
        ctx.fillRect(60, y, 960, 330);
        ctx.restore();
        ctx.fillStyle = index === 1 ? "#00F0FF" : "#D4AF37";
        ctx.font = "700 18px system-ui";
        ctx.fillText(`${carte.numero} · ${carte.label}`, 100, y + 82);
        ctx.fillStyle = "#fffdf8";
        ctx.font = "700 32px system-ui";
        texteSurDeuxLignes(ctx, carte.titre, 100, y + 145, 590);
      });

      ctx.fillStyle = "#c6c8cb";
      ctx.font = "500 25px system-ui";
      ctx.fillText("Entraînement · alimentation · récupération", 70, 1650);
      ctx.fillStyle = "#fffdf8";
      ctx.font = "800 31px system-ui";
      ctx.fillText("BILAN INITIAL OFFERT", 70, 1745);
      ctx.fillStyle = "#D4AF37";
      ctx.font = "700 34px system-ui";
      ctx.fillText("coai.fr/diagnostic", 70, 1800);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((resultat) => resultat ? resolve(resultat) : reject(new Error("Image indisponible")), "image/png")
      );
      const href = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = href;
      lien.download = "mon-programme-coai-story.png";
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
      setEtat("done");
      window.setTimeout(() => setEtat("idle"), 3500);
    } catch {
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
      {etat === "loading" ? "Création de la Story…" : etat === "done" ? "Story téléchargée ✓" : etat === "error" ? "Réessayer" : "Télécharger ma Story"}
    </button>
  );
}
