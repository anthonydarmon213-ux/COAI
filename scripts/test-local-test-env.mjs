import assert from 'node:assert/strict';
import { checkLocalTestEnv } from './check-local-test-env.mjs';

const valid = {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:54322/test',
  DIRECT_URL: 'postgresql://test:test@localhost:54322/test',
  STRIPE_SECRET_KEY: 'sk_test_fixture',
  STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture',
};
assert.deepEqual(checkLocalTestEnv(valid), []);
for (const [name, value] of Object.entries({
  NEXT_PUBLIC_APP_URL: 'https://coai.fr',
  NEXT_PUBLIC_SUPABASE_URL: 'https://production.supabase.co',
  DATABASE_URL: 'postgresql://secret-password@remote.example/test',
  DIRECT_URL: 'not-a-url',
  STRIPE_SECRET_KEY: 'sk_live_DO_NOT_DISPLAY',
  AI_API_KEY: 'DO_NOT_DISPLAY',
  RESEND_API_KEY: 'DO_NOT_DISPLAY',
  NTFY_TOPIC: 'DO_NOT_DISPLAY',
  MAKE_OUTGOING_WEBHOOK_URL: 'DO_NOT_DISPLAY',
  NEXT_PUBLIC_META_PIXEL_ID: 'DO_NOT_DISPLAY',
  STRIPE_WEBHOOK_SECRET: '',
})) {
  const errors = checkLocalTestEnv({ ...valid, [name]: value });
  assert.ok(errors.some(error => error.startsWith(name + ' :')), name);
  assert.ok(!errors.join('').includes('DO_NOT_DISPLAY'));
  assert.ok(!errors.join('').includes('secret-password'));
}
assert.ok(checkLocalTestEnv({}).length >= 8);
console.log('PASS : configuration locale, 11 refus ciblés, configuration vide et secrets non affichés.');
