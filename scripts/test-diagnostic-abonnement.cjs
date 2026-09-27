const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exécute la vraie page serveur avec Auth/Prisma simulés : une connexion
// seule ne doit pas masquer l'offre, et aucune donnée privée ne passe au quiz.
const source = fs.readFileSync(path.join(__dirname, "../src/app/(marketing)/diagnostic/page.tsx"), "utf8");
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const Quiz = () => null;
function findQuiz(node) {
  if (!node || typeof node !== "object") return null;
  if (node.type === Quiz) return node.props;
  return [node.props?.children].flat(Infinity).map(findQuiz).find(Boolean) ?? null;
}

(async () => {
  const scenarios = ["ACTIVE", "INCOMPLETE", "CANCELED", "PAST_DUE", null, "ANONYMOUS"].map(status => ({status, programme: status === 'ACTIVE', unavailable: false}));
  scenarios.push(
    {status: 'APPLE', programme: true, unavailable: false},
    {status: 'HISTORICAL', programme: true, unavailable: false},
    {status: 'APPLE_UNAVAILABLE', programme: false, unavailable: true},
    {status: 'HISTORICAL_APPLE_UNAVAILABLE', programme: true, unavailable: true},
  );
  for (const {status, programme, unavailable} of scenarios) {
    const user = status === "ANONYMOUS" ? null : {
      id: "local-test", subscription: status ? { status } : null,
    };
    let accessCalls = 0;
    const sandbox = { exports: {}, require(id) {
      if (id === "react/jsx-runtime") return require(id);
      if (id === "@/lib/auth/server") return { getCurrentAppUser: async () => user };
      if (id === "@/lib/subscription/content-access") return { contentAccessFor: async candidate => {
        assert.equal(candidate, user); accessCalls++;
        return { programme, appleUnavailable: unavailable };
      } };
      if (id === "@/lib/db/client") return { prisma: { programmeGenerated: { findFirst: async () => null } } };
      if (id === "@/components/marketing/diagnostic-quiz") return { DiagnosticQuiz: Quiz };
      if (id === "@/components/marketing/back-link") return { BackLink: () => null };
      if (id === "@/components/ui/card") return { Card: () => null };
      if (id === "@/components/analytics/track-conversion") return { TrackConversion: () => null };
      throw new Error(`Unexpected dependency: ${id}`);
    } };
    vm.runInNewContext(code, sandbox);
    const props = findQuiz(await sandbox.exports.default({}));
    assert.ok(props, "DiagnosticQuiz rendered");
    assert.equal(props.accesProgrammeActif, programme, status);
    assert.equal(props.verificationAccesIndisponible, unavailable && !programme, status);
    assert.equal(accessCalls, user ? 1 : 0);
    assert.equal(props.connecte, user !== null, status);
    assert.equal(typeof props.accesProgrammeActif, "boolean");
    assert.equal(props.subscription, undefined);
    assert.equal(props.user, undefined);
    assert.equal(props.access, undefined);
  }
  const quiz = fs.readFileSync(path.join(__dirname, '../src/components/marketing/diagnostic-quiz.tsx'), 'utf8');
  assert.match(quiz, /verificationAccesIndisponible \? \(/);
  assert.match(quiz, /Ne souscris pas à nouveau/);
  assert.match(quiz, /connecte && !accesProgrammeActif && !verificationAccesIndisponible \? \(/);
  console.log("PASS: 10 diagnostic access cases, Stripe/Apple/historical access, unavailable verification without repurchase prompt; only booleans exposed. Server dependencies mocked.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
