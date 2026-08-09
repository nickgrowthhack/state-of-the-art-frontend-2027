import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  agentRules: true,
  transpilePackages: ["@workspace/ui"],
  cacheComponents: true,
  // Depende de `cacheComponents`: sem ele, `next dev` e `next build` falham na
  // validação da config. Um `<Link>` passa a carregar um App Shell compartilhado
  // por rota, em vez de um prefetch por link visível.
  partialPrefetching: true,
  experimental: {
    // Expõe o testing API usado pelo `instant()` do Playwright em builds de
    // produção. Fica atrás de uma variável de ambiente e nunca é ligado por
    // hardcode: em deploy voltado ao usuário, `NEXT_E2E` jamais é definido.
    exposeTestingApiInProductionBuild: process.env.NEXT_E2E === "1",
  },
}

export default nextConfig
