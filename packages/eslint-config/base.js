import js from "@eslint/js"
import onlyWarn from "eslint-plugin-only-warn"
import turboPlugin from "eslint-plugin-turbo"
import tseslint from "typescript-eslint"

// `eslint-config-prettier` não entra aqui: o contrato dele é desligar as regras
// estilísticas de tudo que veio antes, então ele tem que ser o **último**
// elemento do config FINAL — e este é uma base, sempre espalhada dentro de
// outro. Cada preset final (`./next-js`, `./react-internal`) o adiciona no fim.
/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**"],
  },
]
