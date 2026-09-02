/** @type {import('next').NextConfig} */
const nextConfig = {
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
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
