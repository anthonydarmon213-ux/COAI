import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-graphite-500">
          <Link href="/programme-musculation-ia" className="hover:text-laiton-400">
            Programme musculation IA
          </Link>
          <Link href="/coach-sportif-en-ligne" className="hover:text-laiton-400">
            Coach sportif en ligne
          </Link>
          <Link href="/coaching-nutrition-ia" className="hover:text-laiton-400">
            Coaching nutrition IA
          </Link>
          <Link href="/coach-sportif-paris" className="hover:text-laiton-400">
            Coach sportif Paris
          </Link>
        </div>
        <div className="flex w-full flex-col items-center justify-between gap-4 text-xs text-graphite-500 sm:flex-row">
          <span>© {new Date().getFullYear()} COAI by Anthony Darmon</span>
          <div className="flex gap-5">
            <Link href="/mentions-legales" className="hover:text-laiton-400">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-laiton-400">
              CGV
            </Link>
            <Link href="/confidentialite" className="hover:text-laiton-400">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
