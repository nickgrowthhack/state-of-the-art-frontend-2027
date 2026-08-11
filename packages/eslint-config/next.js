import eslintConfigPrettier from "eslint-config-prettier"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

import { config as baseConfig } from "./base.js"

/**
 * A custom ESLint configuration for apps that use Next.js.
 *
 * Builds on `eslint-config-next`, the preset this repository already pins,
 * instead of assembling `@next/eslint-plugin-next` by hand.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const nextJsConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  // Sempre por último: desliga as regras estilísticas que conflitam com o
  // Prettier, inclusive as que `eslint-config-next` adiciona acima.
  eslintConfigPrettier,
]
