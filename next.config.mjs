// A second local build must not replace the bundle used by a running iOS test.
// Fixed paths and loopback-only origin; never enable this on a deployment.
const localQA = process.env.COAI_LOCAL_QA_BUILD === "1";
if (localQA && (process.env.VERCEL || process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3051")) {
  throw new Error("COAI_LOCAL_QA_BUILD requires the isolated localhost:3051 environment");
}
/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(localQA ? { distDir: ".next-qa", typescript: { tsconfigPath: "tsconfig.qa.json" } } : {}),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/sign/**" },
    ],
    // Les couvertures de programmes sont des SVG : titre, accroche et
    // monogramme sont du texte vectoriel, net à toutes les tailles. Sans
    // cette option, next/image les refuse et renvoie 400 — les douze
    // couvertures étaient invisibles en production alors que le fichier
    // était bien servi.
    //
    // "dangerously" vise les SVG téléversés par des tiers, qui peuvent
    // embarquer du script. Ceux-ci viennent de public/, versionnés dans le
    // dépôt. La politique ci-dessous neutralise malgré tout tout script et
    // toute ressource externe, au cas où un SVG douteux arriverait un jour.
    dangerouslyAllowSVG: true,
    // "inline" et non "attachment" : ce reglage s'applique a TOUTES les
    // images optimisees, pas seulement aux SVG. En "attachment" le navigateur
    // les traite comme des telechargements et n'affiche plus rien — toutes les
    // photos de recettes et d'exercices sont devenues noires. La protection
    // contre un SVG malveillant est assuree par la politique ci-dessous.
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
