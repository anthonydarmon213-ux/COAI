import Link from "next/link";

export function Footer() {
  return (
    <footer className="coai-marketing-footer px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-graphite-500">
          <Link href="/pricing" className="hover:text-laiton-400">
            Formules
          </Link>
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
          <Link href="/programme-musculation-femme" className="hover:text-laiton-400">
            Musculation pour femme
          </Link>
          <Link href="/programme-perte-de-poids" className="hover:text-laiton-400">
            Perte de poids
          </Link>
          <Link href="/programme-prise-de-masse" className="hover:text-laiton-400">
            Prise de masse
          </Link>
          <Link href="/programme-musculation-debutant" className="hover:text-laiton-400">
            Musculation débutant
          </Link>
          <Link href="/calculateur-calories" className="hover:text-laiton-400">
            Calculateur de calories
          </Link>
          <Link href="/bilan-forme-gratuit" className="hover:text-laiton-400">
            Bilan de forme gratuit
          </Link>
          <Link href="/coach-sportif-ia" className="hover:text-laiton-400">
            Coach sportif IA
          </Link>
          <Link href="/coach-sante-dirigeant" className="hover:text-laiton-400">
            Coach santé dirigeant
          </Link>
          <Link href="/programme-sport-entrepreneur" className="hover:text-laiton-400">
            Sport entrepreneur
          </Link>
          <Link href="/ameliorer-energie-au-travail" className="hover:text-laiton-400">
            Énergie au travail
          </Link>
          <Link href="/challenge-30-jours" className="hover:text-laiton-400">
            Challenge 30 jours gratuit
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
