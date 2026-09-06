"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { BilanExercice } from "@/components/programme/seance-bilan";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

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

function orbitesCoai(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(890, 190);
  [62, 98, 138].forEach((rayon, index) => {
    ctx.beginPath();
    ctx.strokeStyle = index === 1 ? "rgba(0,240,255,.28)" : "rgba(212,175,55,.24)";
    ctx.lineWidth = index === 1 ? 3 : 2;
    ctx.arc(0, 0, rayon, -2.7 + index * 0.35, 1.6 + index * 0.25);
    ctx.stroke();
  });
  [[-53, -33, CYAN], [94, -29, OR], [26, 132, OR]].forEach(([x, y, couleur]) => {
    ctx.beginPath();
    ctx.fillStyle = String(couleur);
    ctx.shadowColor = String(couleur);
    ctx.shadowBlur = 18;
    ctx.arc(Number(x), Number(y), 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function SeanceShareButton({
  nomSeance,
  exercices,
  chronoFormate,
  ecartPourcent,
}: {
  nomSeance: string;
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

      const fond = ctx.createLinearGradient(0, 0, 1080, 1920);
      fond.addColorStop(0, "rgba(0,240,255,.08)");
      fond.addColorStop(0.42, "rgba(13,14,18,0)");
      fond.addColorStop(1, "rgba(212,175,55,.09)");
      ctx.fillStyle = fond;
      ctx.fillRect(0, 0, 1080, 1920);

      // Liseré et orbites : effet technologique premium sans photo ni
      // dépendance, donc toujours instantané et identique sur chaque mobile.
      const liseré = ctx.createLinearGradient(70, 0, 1010, 0);
      liseré.addColorStop(0, CYAN);
      liseré.addColorStop(0.5, OR);
      liseré.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = liseré;
      ctx.fillRect(70, 32, 940, 4);
      orbitesCoai(ctx);

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

      ctx.fillStyle = "#FFFDF8";
      ctx.font = "800 48px system-ui";
      const titre = nomSeance.length > 34 ? `${nomSeance.slice(0, 33)}…` : nomSeance;
      ctx.fillText(titre.toUpperCase(), 70, 370);
      ctx.fillStyle = "#7F898F";
      ctx.font = "600 22px system-ui";
      ctx.fillText(new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()), 70, 412);

      // Le chiffre, plein cadre : c'est lui qu'on voit dans un fil.
      if (tonnage > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(212,175,55,.34)";
        ctx.shadowBlur = 34;
        ctx.fillStyle = "#FFFDF8";
        const valeur = tonnage.toLocaleString("fr-FR");
        ctx.font = `800 ${valeur.length > 6 ? 145 : 180}px system-ui`;
        ctx.fillText(valeur, 70, 610);
        const largeur = ctx.measureText(valeur).width;
        ctx.fillStyle = "#A9ADB5";
        ctx.font = "700 54px system-ui";
        ctx.fillText("kg", Math.min(950, 70 + largeur + 20), 610);
        ctx.fillStyle = CYAN;
        ctx.font = "600 30px system-ui";
        ctx.fillText("DE VOLUME TOTAL", 70, 666);
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = "rgba(0,240,255,.34)";
        ctx.shadowBlur = 34;
        ctx.fillStyle = "#FFFDF8";
        ctx.font = "800 105px system-ui";
        ctx.fillText("SÉANCE", 70, 570);
        ctx.fillStyle = CYAN;
        ctx.fillText("VALIDÉE", 70, 675);
        ctx.restore();
      }

      if (ecartPourcent !== null && ecartPourcent > 0) {
        ctx.save();
        ctx.shadowColor = "rgba(52,211,153,.35)";
        ctx.shadowBlur = 16;
        ctx.fillStyle = "#34D399";
        ctx.font = "700 34px system-ui";
        ctx.fillText(`PROGRESSION  +${ecartPourcent}%`, 70, 725);
        ctx.restore();
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
          ctx.roundRect(x, 790, 290, 160, 22);
        } else {
          ctx.rect(x, 790, 290, 160);
        }
        ctx.stroke();
        ctx.fillStyle = "#FFFDF8";
        ctx.font = "800 52px system-ui";
        ctx.fillText(v, x + 28, 872);
        ctx.fillStyle = "#A9ADB5";
        ctx.font = "700 20px system-ui";
        ctx.fillText(l, x + 28, 912);
      });

      // Détail par exercice — au plus 7 lignes, sinon la Story déborde.
      ctx.fillStyle = OR;
      ctx.font = "700 22px system-ui";
      ctx.fillText("MA SÉANCE", 70, 1045);
      let y = 1110;
      exercices.slice(0, 7).forEach((e) => {
        const t = e.sets.reduce((s, x) => s + x.reps * x.charge, 0);
        const repsExercice = e.sets.reduce((s, x) => s + x.reps, 0);
        ctx.fillStyle = "#E6E8EA";
        ctx.font = "600 32px system-ui";
        const nom = e.nom.length > 30 ? `${e.nom.slice(0, 29)}…` : e.nom;
        ctx.fillText(nom, 70, y);
        ctx.fillStyle = "#A9ADB5";
        ctx.font = "500 30px system-ui";
        const droite = t > 0
          ? `${e.series} séries · ${t.toLocaleString("fr-FR")} kg`
          : repsExercice > 0
            ? `${e.series} séries · ${repsExercice} reps`
            : `${e.series} séries`;
        ctx.fillText(droite, 1010 - ctx.measureText(droite).width, y);
        y += 56;
      });
      if (exercices.length > 7) {
        ctx.fillStyle = "#6f767c";
        ctx.font = "500 28px system-ui";
        ctx.fillText(`+ ${exercices.length - 7} autres`, 70, y);
      }

      // Vague de données bleu/or : signature visuelle COAI, dessinée en
      // vectoriel pour rester nette sans charger d'image externe.
      for (let ligne = 0; ligne < 7; ligne++) {
        ctx.beginPath();
        ctx.strokeStyle = ligne % 2 === 0 ? `rgba(0,240,255,${0.12 + ligne * 0.025})` : `rgba(212,175,55,${0.1 + ligne * 0.02})`;
        ctx.lineWidth = 2;
        for (let x = 0; x <= 1080; x += 12) {
          const yVague = 1660 + ligne * 24 + Math.sin(x / 95 + ligne * 0.65) * (34 + ligne * 5);
          if (x === 0) ctx.moveTo(x, yVague);
          else ctx.lineTo(x, yVague);
        }
        ctx.stroke();
      }

      ctx.fillStyle = "#FFFDF8";
      ctx.font = "800 28px system-ui";
      ctx.fillText("TON CORPS CHANGE. COAI S’ADAPTE.", 70, 1785);
      ctx.fillStyle = "#A9ADB5";
      ctx.font = "600 22px system-ui";
      ctx.fillText("Fais ton bilan forme gratuit · coai.fr/diagnostic", 70, 1830);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((r) => (r ? resolve(r) : reject(new Error("Image indisponible"))), "image/png")
      );
      const fichier = new File([blob], "ma-seance-coai.png", { type: "image/png" });

      // Partage natif quand le téléphone le permet — c'est là que la carte
      // part réellement. Sinon, téléchargement.
      if (navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: "Ma séance COAI" });
        trackFunnelEvent("progress_shared", { support: "seance_story_native" });
      } else {
        const lien = document.createElement("a");
        lien.href = URL.createObjectURL(blob);
        lien.download = "ma-seance-coai.png";
        lien.click();
        URL.revokeObjectURL(lien.href);
        trackFunnelEvent("progress_shared", { support: "seance_story_download" });
      }
      setEtat("idle");
    } catch {
      setEtat("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={partager}
        disabled={etat === "loading"}
        className="coai-rainbow-cta inline-flex items-center gap-2 rounded-full border-0 px-7 py-3 text-sm font-extrabold text-[#111216] shadow-[0_18px_55px_-18px_rgba(56,189,248,.8)] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        <Share2 size={15} aria-hidden="true" />
        {etat === "loading" ? "Création de la Story…" : "Créer ma Story COAI"}
      </button>
      {etat !== "error" && <p className="text-[11px] text-graphite-400">Format 9:16 · prêt pour Instagram</p>}
      {etat === "error" && (
        <p className="text-[11px] text-graphite-400">Image indisponible, réessaie dans un instant.</p>
      )}
    </div>
  );
}
