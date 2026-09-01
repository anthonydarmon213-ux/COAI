import Script from "next/script";

/**
 * Charge Microsoft Clarity uniquement lorsqu'un identifiant de projet est
 * configuré. Le composant est placé une seule fois dans le layout racine.
 */
export function MicrosoftClarity() {
  // L'identifiant Clarity est public et figure dans chaque requête envoyée
  // par le navigateur. La variable permet de le remplacer par environnement.
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "y4bcwlkjk8";

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", ${JSON.stringify(projectId)});
      `}
    </Script>
  );
}
