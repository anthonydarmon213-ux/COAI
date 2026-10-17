import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  // These newly introduced React Compiler recommendations need a separate
  // component review. Keep them visible without changing stable UI behavior
  // during the security upgrade; hooks order/dependency checks remain enabled.
  { rules: {
    "react-hooks/purity": "warn",
    "react-hooks/refs": "warn",
    "react-hooks/set-state-in-effect": "warn",
  } },
];
