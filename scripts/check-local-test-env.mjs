import { pathToFileURL } from 'node:url';

// Read-only preflight. Never print values: database URLs contain passwords.
export function checkLocalTestEnv(env) {
  const errors = [];
  const local = new Set(['localhost', '127.0.0.1', '[::1]']);
  for (const [name, protocols] of [
    ['NEXT_PUBLIC_APP_URL', ['http:', 'https:']],
    ['NEXT_PUBLIC_SUPABASE_URL', ['http:', 'https:']],
    ['DATABASE_URL', ['postgres:', 'postgresql:']],
    ['DIRECT_URL', ['postgres:', 'postgresql:']],
  ]) {
    try {
      const url = new URL(env[name]);
      if (!local.has(url.hostname) || !protocols.includes(url.protocol)) throw new Error();
    } catch {
      errors.push(`${name} : une adresse locale valide est obligatoire.`);
    }
  }
  if (!/^(sk|rk)_test_.+/.test(env.STRIPE_SECRET_KEY || '')) {
    errors.push('STRIPE_SECRET_KEY : clé Stripe de test obligatoire.');
  }
  for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_WEBHOOK_SECRET']) {
    if (!env[name]?.trim()) errors.push(`${name} : configuration locale manquante.`);
  }
  for (const name of [
    'AI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'RESEND_API_KEY',
    'HUBSPOT_ACCESS_TOKEN', 'MAKE_OUTGOING_WEBHOOK_URL', 'NTFY_TOPIC',
    'PEXELS_API_KEY', 'NEXT_PUBLIC_GA_MEASUREMENT_ID', 'NEXT_PUBLIC_META_PIXEL_ID',
    'NEXT_PUBLIC_CLARITY_PROJECT_ID', 'NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN',
  ]) {
    if (env[name]?.trim()) errors.push(`${name} : doit être absent du test local isolé.`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkLocalTestEnv(process.env);
  if (errors.length) {
    console.error('Test local non prêt :\n' + errors.map(error => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Configuration locale contrôlée. Restent à vérifier : services accessibles, prix Stripe en mode test et webhook.');
  }
}
