import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "no-console": ["error", { allow: ["warn", "error"] }], eqeqeq: "error", "prefer-const": "error" } },
  globalIgnores([".next/**", "coverage/**", "next-env.d.ts", "node_modules/**"]),
]);
