"use client";

import { useState } from "react";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Bouton de partage sur l'écran résultat du diagnostic (14/08/2026, demande
// Anthony — "on peut tester") : jusqu'ici aucun partage n'était proposé au
// moment le plus chaud émotionnellement (juste après avoir vu son "Aujourd'hui
// → Avec COAI" personnalisé), alors que le système de parrainage existe déjà
// ailleurs (compte/abonnement, cartes de progression). Texte volontairement
// simple (pas d'image générée ici, contrairement aux cartes de progression —
// portée limitée pour un premier test). Un visiteur connecté partage son vrai
// lien de parrainage (chargé à la demande, pas au montage, pour ne jamais
// appeler /api/parrainage pour un visiteur anonyme qui n'en a pas) ; un
// visiteur anonyme partage simplement le diagnostic public.
// Mobile vs desktop (22/08/2026, demande Anthony) — sur mobile, la feuille
// de partage native ouvre directement Instagram/TikTok ; sur desktop ces
// apps n'existent pas, donc partager l'image n'a aucun sens : on télécharge
// le visuel pour que la personne le transfère sur son téléphone.
// Détection par pointeur grossier + absence de survol plutôt que par user
// agent : un iPad se déclare "Macintosh" depuis iPadOS 13, et un user agent
// se falsifie trivialement.
function estMobile(): boolean {
  if (typeof window === "undefined") return false;
  const tactile = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const sansSurvol = window.matchMedia?.("(hover: none)").matches ?? false;
  return tactile && sansSurvol;
}

// Téléchargement explicite du visuel Story (1080x1920, cf.
// /api/diagnostic/carte-story). Réservé au desktop : sur Safari iOS, ce
// même clic synthétique sur un blob: pouvait naviguer l'onglet en cours et
// éjecter la personne de la page (bug signalé le 21/08).
function telechargerFichier(blob: Blob, nom: string) {
  const href = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = href;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  // Révocation différée : révoquer immédiatement annule parfois le
  // téléchargement sur Chrome avant qu'il ne démarre.
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export function DiagnosticShareButton({
  connecte,
  objectif,
  score,
  ageCoai,
  ageReel,
}: {
  connecte: boolean;
  objectif: string;
  score: number;
  // Âge COAI (01/09/2026) : facultatif — absent si l'âge n'a pas été
  // déclaré. La carte et les textes retombent alors sur le score seul.
  ageCoai?: number;
  ageReel?: number;
}) {
  const avecAge = Number.isFinite(ageCoai) && Number.isFinite(ageReel) && (ageCoai ?? 0) > 0 && (ageReel ?? 0) > 0;
  const ecartAge = avecAge ? (ageCoai as number) - (ageReel as number) : 0;
  const paramsAge = avecAge ? `&age=${ageCoai}&ageReel=${ageReel}` : "";
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function getShareLink() {
    let lien = "https://coai.fr/diagnostic";
    if (connecte) {
      const res = await fetch("/api/parrainage").catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (typeof data?.lien === "string") lien = data.lien;
    }
    const url = new URL(lien, window.location.origin);
    if (connecte) {
      // /invitation/[code] conserve le score pendant sa redirection vers le
      // diagnostic : le filleul arrive directement avec un objectif clair à
      // battre, sans exposer le nom ni les réponses du parrain.
      url.searchParams.set("score", String(score));
    } else {
      url.searchParams.set("challenge_score", String(score));
    }
    url.searchParams.set("utm_source", "score_coai");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "score_challenge");
    url.searchParams.set("utm_content", `score_${score}`);
    return url.toString();
  }

  // Lien "offrir un bilan gratuit" (21/08/2026, demande Anthony) — distinct
  // du défi ci-dessus : pas de score/challenge_score (le destinataire n'est
  // pas invité à battre un chiffre, juste à faire SON bilan gratuit), même
  // lien de parrainage réel pour un visiteur connecté. Séparé volontairement
  // de getShareLink() plutôt que d'ajouter un paramètre conditionnel de plus
  // : deux intentions différentes (défi vs cadeau) valent deux fonctions
  // simples plutôt qu'une seule avec des branches qui s'entremêlent.
  async function getGiftLink() {
    let lien = "https://coai.fr/diagnostic";
    if (connecte) {
      const res = await fetch("/api/parrainage").catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (typeof data?.lien === "string") lien = data.lien;
    }
    const url = new URL(lien, window.location.origin);
    url.searchParams.set("utm_source", "score_coai");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "gift_bilan");
    url.searchParams.set("utm_content", "offre_bilan");
    return url.toString();
  }

  async function partagerBilanOffert() {
    setLoading(true);
    setMessage(null);
    try {
      const lien = await getGiftLink();
      const text = `Je t’offre un bilan gratuit COAI — 5 minutes, sans carte bancaire, pour voir où tu en es et ce qu’un programme sur-mesure changerait :\n${lien}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "Un bilan gratuit COAI, offert par moi", text });
          trackFunnelEvent("diagnostic_result_shared", { support: "native", referral: connecte, challenge: "gift_bilan" });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(text);
      setMessage("Message copié — envoie-le à qui tu veux.");
      trackFunnelEvent("diagnostic_result_shared", { support: "clipboard", referral: connecte, challenge: "gift_bilan" });
    } catch {
      setMessage("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  function shareText(lien: string) {
    if (avecAge) {
      const phrase =
        ecartAge === 0
          ? `Mon Âge COAI est pile mon âge réel (${ageReel} ans)`
          : ecartAge < 0
            ? `Mon corps a ${Math.abs(ecartAge)} an${Math.abs(ecartAge) > 1 ? "s" : ""} de moins que moi (${ageCoai} au lieu de ${ageReel})`
            : `Mon corps a ${ecartAge} an${ecartAge > 1 ? "s" : ""} de plus que moi (${ageCoai} au lieu de ${ageReel})`;
      return `${phrase}, avec un Score COAI de ${score}/100. Et toi, quel âge a vraiment ton corps ? Le bilan est gratuit 👇\n${lien}`;
    }
    return `J’ai obtenu ${score}/100 à mon Score COAI pour ${objectif.toLowerCase()}. Essaie de battre mon score : le bilan est gratuit 👇\n${lien}`;
  }

  async function partagerWhatsApp() {
    setLoading(true);
    const lien = await getShareLink();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(lien))}`, "_blank", "noopener,noreferrer");
    trackFunnelEvent("diagnostic_result_shared", { support: "whatsapp", referral: connecte, challenge: "compare_score" });
    setLoading(false);
  }

  async function partagerEmail() {
    setLoading(true);
    setMessage(null);
    try {
      const lien = await getShareLink();
      const text = shareText(lien);
      const subject = avecAge ? `Mon Âge COAI · ${ageCoai} ans` : `Mon Score COAI · ${score}/100`;

      // Un lien mailto: ne peut techniquement joindre aucun fichier — la
      // carte-image du score n'était donc jamais insérée, seulement le texte
      // (bug signalé : "ça ne l'a pas inséré en pièce jointe"). Web Share API
      // avec fichier permet de choisir l'app Mail depuis la vraie feuille de
      // partage du système, qui l'insère alors comme une pièce jointe réelle
      // — même mécanisme déjà utilisé pour Instagram/TikTok ci-dessus.
      const cardUrl = `/api/diagnostic/carte-story?score=${score}&objectif=${encodeURIComponent(objectif)}${paramsAge}`;
      const response = await fetch(cardUrl).catch(() => null);
      const file = response?.ok
        ? new File([await response.blob()], avecAge ? `age-coai-${ageCoai}-ans.png` : `score-coai-${score}.png`, { type: "image/png" })
        : null;

      if (file && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: subject, text });
        trackFunnelEvent("diagnostic_result_shared", { support: "email_native", referral: connecte, challenge: "compare_score" });
        return;
      }

      // Repli : mailto: (texte + lien uniquement) — mais la carte est aussi
      // téléchargée pour que la personne puisse la joindre elle-même si elle
      // le souhaite, plutôt que de la perdre silencieusement.
      if (file) {
        telechargerFichier(file, file.name);
        setMessage("Carte téléchargée ✓ Ta messagerie s'ouvre — joins l'image si tu veux l'inclure.");
      }
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      trackFunnelEvent("diagnostic_result_shared", { support: "email_mailto", referral: connecte, challenge: "compare_score" });
    } catch {
      setMessage("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  async function partagerStory(platform: "instagram" | "tiktok") {
    setLoading(true);
    setMessage(null);
    try {
      const url = `/api/diagnostic/carte-story?score=${score}&objectif=${encodeURIComponent(objectif)}${paramsAge}`;
      const [response, lien] = await Promise.all([fetch(url), getShareLink()]);
      if (!response.ok) throw new Error("Carte indisponible");
      const blob = await response.blob();
      const file = new File([blob], avecAge ? `age-coai-${ageCoai}-ans.png` : `score-coai-${score}.png`, { type: "image/png" });
      // Bug corrigé (21/08/2026, signalé par Anthony : le bouton TikTok l'a
      // éjecté de la page diagnostic sans retour possible) — le partage
      // natif (navigator.share) était réservé à Instagram ; TikTok tombait
      // toujours dans le chemin de secours ci-dessous. Sur Safari iOS, un
      // clic synthétique sur un <a download> pointant vers un blob: peut
      // naviguer l'onglet en cours au lieu de juste télécharger — c'est ce
      // qui a fait disparaître la page. Les deux plateformes utilisent
      // maintenant le même partage natif quand il est disponible : l'image
      // partagée seule (sans texte/URL) reste plus fiable pour que
      // l'option Story apparaisse dans la feuille de partage iOS.
      const partageNatifDisponible =
        Boolean(navigator.share) && (!navigator.canShare || navigator.canShare({ files: [file] }));

      if (estMobile() && partageNatifDisponible) {
        // Mobile : la feuille de partage native propose directement
        // Instagram/TikTok. L'image est partagée SEULE (sans texte ni URL) —
        // ajouter du texte fait disparaître l'option Story sur iOS. Le lien
        // du défi est déjà imprimé sur la carte.
        await navigator.share({ files: [file] });
        setMessage(platform === "instagram"
          ? "Carte prête ✓ Dans Instagram : appuie sur +, choisis Story, puis sélectionne la carte."
          : "Carte prête ✓ Dans TikTok : crée une Story, puis sélectionne la carte.");
        trackFunnelEvent("diagnostic_result_shared", { support: `story_${platform}_native`, referral: connecte, challenge: "compare_score" });
      } else {
        // Desktop : Instagram et TikTok ne publient pas de Story depuis un
        // ordinateur — on télécharge le visuel 1080x1920 pour que la
        // personne le transfère sur son téléphone.
        telechargerFichier(blob, `story-coai-${score}.png`);
        if (navigator.clipboard) await navigator.clipboard.writeText(lien);
        setMessage("Story téléchargée ! Transfère-la sur ton téléphone pour la poster. Le lien du défi est copié.");
        trackFunnelEvent("diagnostic_result_shared", { support: `story_${platform}_download`, referral: connecte, challenge: "compare_score" });
      }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setMessage("Impossible de créer la Story pour le moment.");
    } finally { setLoading(false); }
  }

  async function partager() {
    setLoading(true);
    setMessage(null);
    try {
      const lien = await getShareLink();
      const text = shareText(lien);

      if (navigator.share) {
        try {
          await navigator.share({ title: `Mon Score COAI · ${score}/100`, text });
          trackFunnelEvent("diagnostic_result_shared", { support: "native", referral: connecte, challenge: "compare_score" });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(text);
      setMessage("Défi copié — envoie-le à tes proches.");
      trackFunnelEvent("diagnostic_result_shared", { support: "clipboard", referral: connecte, challenge: "compare_score" });
    } catch {
      setMessage("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/[0.055] px-5 py-4 text-center">
      <p className="text-sm font-medium text-white">Partage ton Score COAI, ou offres-en un à un proche.</p>
      {connecte && (
        <p className="text-xs text-graphite-500">
          Si un proche rejoint COAI avec ton lien, un mois t’est offert.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {/* "Offrir un bilan gratuit" en premier (21/08/2026, demande Anthony —
            un lien simple plutôt qu'une image à créer, plus robuste et plus
            proche des habitudes de la cible COAI que publier une Story). */}
        <button
          type="button"
          onClick={partagerBilanOffert}
          disabled={loading}
          className="rounded-full border border-laiton-400/45 bg-laiton-400 px-5 py-2.5 text-sm font-semibold text-[#1a140a] shadow-[0_8px_24px_rgba(201,162,98,0.25)] transition hover:-translate-y-0.5 hover:bg-laiton-300 disabled:opacity-50"
        >
          Offrir un bilan gratuit
        </button>
        {/* Story Instagram/TikTok (20/08/2026, retour Anthony :
            "ce sera plus sympa que sur WhatsApp") — partagerStory() existait
            déjà (carte-image + Web Share API) mais n'était jusqu'ici jamais
            rendue : aucun bouton ne l'appelait. */}
        <button
          type="button"
          onClick={() => partagerStory("instagram")}
          disabled={loading}
          className="rounded-full border border-transparent bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(214,41,118,0.25)] transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          Story Instagram
        </button>
        <button
          type="button"
          onClick={() => partagerStory("tiktok")}
          disabled={loading}
          className="rounded-full border border-white/15 bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-graphite-900 disabled:opacity-50"
        >
          Story TikTok
        </button>
        <button
          type="button"
          onClick={partagerWhatsApp}
          disabled={loading}
          className="rounded-full border border-[#25D366]/45 bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-[#102016] shadow-[0_8px_24px_rgba(37,211,102,0.16)] transition hover:-translate-y-0.5 hover:bg-[#35df76] disabled:opacity-50"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={partagerEmail}
          disabled={loading}
          className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold text-graphite-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
        >
          E-mail
        </button>
      </div>
      {message && <span className="text-xs text-graphite-500">{message}</span>}
    </div>
  );
}
