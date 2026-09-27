// Standalone document: no analytics, scripts, React shell or session exchange.
// The originating iOS WebKit store alone holds the PKCE verifier.
export function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const code = query.get("code");
  const valid = [...query.keys()].length === 1 && code !== null && /^[A-Za-z0-9_-]{1,2048}$/.test(code);
  const action = valid
    ? `<a class="primary" href="fr.coai.mobile://auth/email-confirmation?code=${code}">Ouvrir COAI</a>`
    : `<a class="primary" href="/sign-in?error=auth_link">Retrouver ma connexion</a>`;
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Revenir dans COAI</title>
<style>html{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0a1217;color:#f3f4f2;font:18px/1.6 system-ui,sans-serif;min-height:100svh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:460px;border:1px solid #33434b;border-radius:24px;padding:28px;background:#142027}h1{font-size:32px;line-height:1.2}p{color:#ced5d8}a{color:#e0c68a;overflow-wrap:anywhere}.primary{display:block;min-height:50px;text-align:center;padding:14px;border-radius:28px;background:#e0c68a;color:#10191d;font-weight:700;text-decoration:none;margin:28px 0}.brand{letter-spacing:.2em;color:#e0c68a;font-weight:700}</style></head>
<body><main><div class="brand">COAI</div><h1>${valid ? "Retrouve ton espace." : "Ce lien ne peut pas être utilisé."}</h1>
<p>${valid ? "Ouvre COAI sur l’iPhone où tu as commencé ton inscription pour terminer la confirmation." : "Reviens dans COAI pour te connecter ou demander un nouveau lien de confirmation."}</p>
${action}<p>L’app ne s’ouvre pas ? Retourne dans COAI et choisis « Mon compte est déjà confirmé · me connecter ».</p>
<a href="/sign-in">Me connecter sur le site</a></main></body></html>`, {
    status: valid ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    },
  });
}
