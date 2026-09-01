"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { BilanExercice } from "@/components/programme/seance-bilan";

// Carte de séance partageable (01/09/2026, demande Anthony — « que les gens
// en parlent autour d'eux »). Même technique que ProgrammeShareButton :
// dessin direct sur un canvas 1080×1920, sans librairie d'export. Ajouter
// html2canvas pour ça alourdirait le bundle de tout le monde pour une
// fonction utilisée une fois par séance.
//
// Le format Story est volontaire : c'est là que ça se partage réellement.

const OR = "#D4AF37";
const CYAN = "#00F0FF";
const FOND = "#0D0E12";

function emblemeCoai(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = OR;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(x, y, 34, -0.72, Math.PI * 1.72);
  ctx.stroke();
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function SeanceShareButton({
  exercices,
  chronoFormate,
  ecartPourcent,
}: {
  exercices: BilanExercice[];
  chronoFormate: string;
  ecartPourcent: number | null;
}) {
  const [etat, setEtat] = useState<"idle" | "loading" | "error">("idle");

  const tonnage = exercices.reduce((t, e) => t + e.sets.reduce((s, x) => s + x.reps * x.charge, 0), 0);
  const series = exercices.reduce((n, e) => n + e.series, 0);
  const repetitions = exercices.reduce((n, e) => n + e.sets.reduce((s, x) => s + x.reps, 0), 0);

  async function partager() {
    setEtat("loading");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponible");

      ctx.fillStyle = FOND;
      ctx.fillRect(0, 0, 1080, 1920);

      // Halo laiton derrière le chiffre — la signature COAI, en version plate
      // (un dégradé radial rend mieux qu'un anneau à l'export).
      const halo = ctx.createRadialGradient(540, 760, 60, 540, 760, 520);
      halo.addColorStop(0, "rgba(212,175,55,.20)");
      halo.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 240, 1080, 1040);

      emblemeCoai(ctx, 104, 89);
      const marque = ctx.createLinearGradient(148, 0, 330, 0);
      marque.addColorStop(0, "#FFFDF8");
      marque.addColorStop(0.72, "#F0D59D");
      marque.addColorStop(1, OR);
      ctx.fillStyle = marque;
      ctx.font = "800 55px system-ui";
      ctx.fillText("COAI", 154, 105);
      ctx.fillStyle = "#A9ADB5";
      ctx.font = "600 13px system-ui";
      ctx.fillText("PERSONAL TRAINING, REIMAGINED.", 156, 132);

      ctx.fillStyle = OR;
      ctx.font = "700 22px system-ui";
      ctx.fillText("SÉANCE TERMINÉE", 70, 300);

      // Le chiffre, plein cadre : c'est lui qu'on voit dans un fil.
      ctx.fillStyle = "#FFFDF8";
      ctx.font = "800 190px system-ui";
      const valeur = tonnage.toLocaleString("fr-FR");
      ctx.fillText(valeur, 70, 500);
      const largeur = ctx.measureText(valeur).width;
      ctx.fillStyle = "#A9ADB5";
      ctx.font = "700 60px system-ui";
      ctx.fillText("kg", 70 + largeur + 22, 500);

      ctx.fillStyle = CYAN;
      ctx.font = "600 30px system-ui";
      ctx.fillText("soulevés aujourd’hui", 70, 556);

      if (ecartPourcent !== null && ecartPourcent > 0) {
        ctx.fillStyle = "#34D399";
        ctx.font = "700 34px system-ui";
        ctx.fillText(`+${ecartPourcent}% vs ma dernière séance`, 70, 622);
      }

      // Trois chiffres clés
      const tuiles: [string, string][] = [
        [chronoFormate, "DURÉE"],
        [String(series), "SÉRIES"],
        [String(repetitions), "RÉPÉTITIONS"],
      ];
      tuiles.forEach(([v, l], i) => {
        const x = 70 + i * 320;
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // roundRect manque sur les Safari antérieurs à 16 : sans ce repli,
        // l'export entier échouerait pour un simple angle arrondi.
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, 700, 290, 160, 22);
        } else {
          ctx.rect(x, 700, 290, 160);
        }
        ctx.stroke();
        ctx.fillStyle = "#FFFDF8";
        ctx.font = "800 52px system-ui";
        ctx.fillText(v, x + 28, 782);
        ctx.fillStyle = "#A9ADB5";
        ctx.font = "700 20px system-ui";
        ctx.fillText(l, x + 28, 822);
      });

      // Détail par exercice — au plus 7 lignes, sinon la Story déborde.
      ctx.fillStyle = OR;
      ctx.font = "700 22px system-ui";
      ctx.fillText("AU PROGRAMME", 70, 960);
      let y = 1020;
      exercices.slice(0, 7).forEach((e) => {
        const t = e.sets.reduce((s, x) => s + x.reps * x.charge, 0);
        ctx.fillStyle = "#E6E8EA";
        ctx.font = "600 32px system-ui";
        const nom = e.nom.length > 30 ? `${e.nom.slice(0, 29)}…` : e.nom;
        ctx.fillText(nom, 70, y);
        ctx.fillStyle = "#A9ADB5";
        ctx.font = "500 30px system-ui";
        const droite = t > 0 ? `${e.series} × ${t.toLocaleString("fr-FR")} kg` : `${e.series} séries`;
        ctx.fillText(droite, 1010 - ctx.measureText(droite).width, y);
        y += 56;
      });
      if (exercices.length > 7) {
        ctx.fillStyle = "#6f767c";
        ctx.font = "500 28px system-ui";
        ctx.fillText(`+ ${exercices.length - 7} autres`, 70, y);
      }

      ctx.fillStyle = "#A9ADB5";
      ctx.font = "600 28px system-ui";
      ctx.fillText("coai.fr", 70, 1840);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((r) => (r ? resolve(r) : reject(new Error("Image indisponible"))), "image/png")
      );
      const fichier = new File([blob], "ma-seance-coai.png", { type: "image/png" });

      // Partage natif quand le téléphone le permet — c'est là que la carte
      // part réellement. Sinon, téléchargement.
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: "Ma séance COAI" });
      } else {
        const lien = document.createElement("a");
        lien.href = URL.createObjectURL(blob);
        lien.download = "ma-seance-coai.png";
        lien.click();
        URL.revokeObjectURL(lien.href);
      }
      setEtat("idle");
    } catch {
      setEtat("error");
    }
  }

  if (tonnage <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={partager}
        disabled={etat === "loading"}
        className="inline-flex items-center gap-2 rounded-full border border-laiton-300/35 bg-laiton-400/10 px-6 py-2.5 text-sm font-bold text-laiton-200 transition hover:bg-laiton-400/20 disabled:opacity-60"
      >
        <Share2 size={15} aria-hidden="true" />
        {etat === "loading" ? "Préparation…" : "Partager ma séance"}
      </button>
      {etat === "error" && (
        <p className="text-[11px] text-graphite-400">Image indisponible, réessaie dans un instant.</p>
      )}
    </div>
  );
}
