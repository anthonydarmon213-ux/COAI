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
  for (const status of ["ACTIVE", "INCOMPLETE", "CANCELED", "PAST_DUE", null, "ANONYMOUS"]) {
    const user = status === "ANONYMOUS" ? null : {
      id: "local-test", subscription: status ? { status } : null,
    };
    const sandbox = { exports: {}, require(id) {
      if (id === "react/jsx-runtime") return require(id);
      if (id === "@/lib/auth/server") return { getCurrentAppUser: async () => user };
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
    assert.equal(props.abonnementActif, status === "ACTIVE", status);
    assert.equal(props.connecte, user !== null, status);
    assert.equal(typeof props.abonnementActif, "boolean");
    assert.equal(props.subscription, undefined);
  }
  console.log("PASS: 6 statuts du diagnostic, connexion distincte de l’abonnement actif");
})().catch((error) => { console.error(error); process.exitCode = 1; });
