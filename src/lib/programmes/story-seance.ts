import { formatRepos } from "./repos";

export type StoryExercise = { nom: string; series: string; repetitions: string; repos: string; methode: string; photo?: string | null };
export type StorySeance = { exercices: StoryExercise[]; echauffement: string; retourAuCalme: string; echauffementPhoto?: string | null; retourAuCalmePhoto?: string | null };

const text = (v: unknown) => typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

// Whitelist only programme instructions, never profile, health, loads or notes.
export function storySeance(exercices: unknown[], echauffement: unknown, retourAuCalme: unknown): StorySeance {
  return {
    exercices: exercices.filter((v): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)).map(v => ({
      nom: text(v.nom) || "Exercice", series: text(v.series), repetitions: text(v.repetitions), repos: text(v.repos), methode: text(v.methode),
    })),
    echauffement: text(echauffement), retourAuCalme: text(retourAuCalme),
  };
}

export async function renderStory(data: StorySeance, page: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Canvas indisponible");
  const logo = new Image();
  logo.src = "/brand/coai-mark.svg";
  await logo.decode();
  const photos = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set([data.echauffementPhoto, data.retourAuCalmePhoto, ...data.exercices.slice(page * 3, page * 3 + 3).map(ex => ex.photo)].filter((s): s is string => !!s))].map(async src => {
    if (!src.startsWith("/") || src.startsWith("//")) throw new Error("Source non autorisée");
    const image = new Image(); image.src = src; await image.decode(); photos.set(src, image);
  }));
  const photo = (src: string | null | undefined, x: number, y: number, w: number, h: number) => {
    const image = src ? photos.get(src) : null;
    if (!image) return;
    const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
    c.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  };
  const bg = c.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, "#192b34"); bg.addColorStop(0.55, "#0a151c"); bg.addColorStop(1, "#292619");
  c.fillStyle = bg; c.fillRect(0, 0, 1080, 1920);
  const lines = (value: string, x: number, y: number, width: number, size: number, color: string, limit = 2) => {
    c.font = `600 ${size}px Arial, sans-serif`; c.fillStyle = color;
    const words = value.replace(/\s+/g, " ").split(" ");
    const rows: string[] = []; let row = "";
    for (const word of words) {
      if (row && c.measureText(`${row} ${word}`).width > width) { rows.push(row); row = word; }
      else row = row ? `${row} ${word}` : word;
    }
    if (row) rows.push(row);
    rows.slice(0, limit).forEach((line, i) => {
      let out = line;
      const clipped = c.measureText(out).width > width || (i === limit - 1 && rows.length > limit);
      if (clipped) {
        while (out.length && c.measureText(`${out}…`).width > width) out = out.slice(0, -1);
        out += "…";
      }
      c.fillText(out, x, y + i * size * 1.3);
    });
  };
  lines("MA SÉANCE", 86, 235, 900, 80, "#ffffff");
  lines("Un pas de plus. Pour moi.", 88, 305, 900, 38, "#e1c66c");
  lines(`FICHE COAI · ${data.exercices.length} EXERCICES · ${page + 1}/${Math.max(1, Math.ceil(data.exercices.length / 3))}`, 88, 365, 900, 25, "#99c6d9");
  lines("01 / ÉCHAUFFEMENT & MOBILITÉ", 88, 410, 900, 27, "#e1c66c");
  photo(data.echauffementPhoto, 88, 435, 220, 125);
  lines(data.echauffement || "Consulte l’échauffement de ta fiche.", data.echauffementPhoto ? 330 : 88, 475, data.echauffementPhoto ? 660 : 890, 27, "#d5e0e5", 3);
  data.exercices.slice(page * 3, page * 3 + 3).forEach((ex, i) => {
    const y = 585 + i * 260;
    c.fillStyle = "#172831"; c.fillRect(72, y, 936, 238);
    c.fillStyle = "#e1c66c"; c.fillRect(72, y, 5, 238);
    photo(ex.photo, 88, y + 16, 300, 206);
    if (!ex.photo) lines("Visuel COAI à compléter", 110, y + 95, 250, 24, "#99c6d9", 2);
    lines(`${String(page * 3 + i + 1).padStart(2, "0")}  ${ex.nom}`, 410, y + 47, 570, 32, "#ffffff", 2);
    lines([ex.series && `${ex.series}${/^\d+$/.test(ex.series) ? " séries" : ""}`, ex.repetitions].filter(Boolean).join(" · "), 410, y + 138, 570, 27, "#e1c66c", 1);
    lines([ex.repos && `Repos ${formatRepos(ex.repos)}`, ex.methode].filter(Boolean).join(" · "), 410, y + 178, 570, 25, "#99c6d9", 2);
  });
  lines("03 / RETOUR AU CALME", 88, 1435, 900, 27, "#e1c66c");
  photo(data.retourAuCalmePhoto, 88, 1460, 220, 110);
  lines(data.retourAuCalme || "Consulte le retour au calme de ta fiche.", data.retourAuCalmePhoto ? 330 : 88, 1480, data.retourAuCalmePhoto ? 660 : 880, 27, "#d5e0e5", 3);
  lines("Aperçu de séance · consignes complètes dans COAI", 88, 1600, 880, 24, "#abbcc4", 1);
  lines("coai.fr", 88, 1700, 600, 42, "#e1c66c");
  c.drawImage(logo, 740, 1620, 90, 90);
  lines("COAI", 842, 1680, 175, 42, "#ffffff", 1);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Export impossible")), "image/png"));
}
