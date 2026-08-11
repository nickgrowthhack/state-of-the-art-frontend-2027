# Checklist de convenções

Índice verificável de todas as convenções deste boilerplate, organizado por
fluxo de trabalho. A prosa e o porquê de cada regra vivem no
[AGENTS.md](AGENTS.md) e no [instant-nav.rig.md](apps/web/instant-nav.rig.md) —
este arquivo só carrega o **o quê**, em itens que um revisor confere olhando
o diff ou rodando um comando. Itens marcados com `(config)` não têm prosa em
lugar nenhum: o arquivo de configuração citado é a própria fonte de verdade.

**Como usar:** antes de uma tarefa, localize a(s) seção(ões) do fluxo
correspondente e percorra os itens. As caixas nunca são marcadas neste arquivo:
copie a seção para o seu contexto de trabalho e marque lá. Uma caixa marcada no
diff deste arquivo é erro.

**Manutenção:** toda convenção nova entra neste arquivo **no mesmo commit que a
estabelece**. Inconsistência encontrada entre documentação e código não se
corrige por conta própria: registra-se em
[Pendências / decisões em aberto](#10-pendências--decisões-em-aberto).

## 1. Ao dar bootstrap ou replicar o boilerplate

- [ ] pnpm é o único gerenciador; `pnpm-lock.yaml` é o único lockfile e vai versionado. `package-lock.json` ou `yarn.lock` no diff é erro — fonte: [AGENTS.md](AGENTS.md) §Gerenciador de pacotes
- [ ] A versão do pnpm vem só de `packageManager: "pnpm@10.22.0"` — sem instalar versão à mão, sem Corepack — fonte: [AGENTS.md](AGENTS.md) §Gerenciador de pacotes
- [ ] `engines` intacto: `node >=22`, `pnpm >=10` — fonte: [package.json](package.json) (config)
- [ ] `preinstall: "npx only-allow pnpm"` intacto — fonte: [package.json](package.json) (config)
- [ ] `pnpm-workspace.yaml` declara apenas `apps/*` e `packages/*` — fonte: [pnpm-workspace.yaml](pnpm-workspace.yaml) (config)
- [ ] O layout segue o template `next-monorepo` do shadcn — o que `shadcn init --monorepo` espera encontrar — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] O preset canônico do design system é `b3uv3ZyQIE`; a réplica fecha o ciclo com `preset resolve` nos dois workspaces (ver §5) — fonte: [AGENTS.md](AGENTS.md) §Tipografia e preset do design system
- [ ] A raiz só orquestra: todo script é `turbo <task>` e as devDependencies se limitam a turbo, prettier + plugin tailwind, typescript e `@workspace/*` — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] `CLAUDE.md` da raiz contém apenas `@AGENTS.md` — fonte: [CLAUDE.md](CLAUDE.md) (config)
- [ ] `.gitignore` cobre `.turbo`, `dist`, `.env*` e os artefatos do Playwright (`test-results`, `playwright-report`, `blob-report`, `.playwright`) — fonte: [.gitignore](.gitignore) (config)
- [ ] Instalar com `pnpm install`; em CI, com `--frozen-lockfile` (ver §8) — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos

## 2. Ao adicionar ou atualizar uma dependência

- [ ] Dependência de workspace via `pnpm --filter <workspace> add [-D] <pkg>`; dependência de app ou biblioteca nunca vai para a raiz — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] Ferramenta de repositório via `pnpm add -Dw <pkg>` — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] Binário efêmero via `pnpm dlx`, nunca `npx` — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] Override novo só em `pnpm.overrides` do `package.json` da **raiz** — nunca no `overrides` de topo (sintaxe npm, ignorada em silêncio), nunca em workspace — fonte: [AGENTS.md](AGENTS.md) §Regras do `package.json`
- [ ] Pacote que precisa de `postinstall` entra item a item em `pnpm.onlyBuiltDependencies` (raiz); `dangerouslyAllowAllBuilds` e o bloco `allowBuilds:` do `pnpm-workspace.yaml` são proibidos — fonte: [AGENTS.md](AGENTS.md) §Regras do `package.json`
- [ ] Nunca adicionar `node-linker=hoisted`; import quebrado por falta de hoisting se resolve declarando a dependência que falta — fonte: [AGENTS.md](AGENTS.md) §Regras do `package.json`
- [ ] Framework e pacotes acoplados a ele ficam pinados exatos (`next`, `react`, `react-dom`, `eslint-config-next`, `@next/playwright`; `@types/react*` via override da raiz); ferramental genérico fica em caret — fonte: [package.json](package.json) + manifests dos workspaces (config)
- [ ] Dependência interna sempre como `workspace:*` — fonte: manifests dos workspaces (config)
- [ ] Lockfile atualizado no mesmo commit; o CI valida com `--frozen-lockfile` (ver §8) — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos

## 3. Ao criar um workspace novo

- [ ] Vive sob `apps/` ou `packages/` — os únicos globs do workspace — fonte: [pnpm-workspace.yaml](pnpm-workspace.yaml) (config)
- [ ] `package.json` com `private: true` e `type: "module"`; pacotes se chamam `@workspace/<nome>` — fonte: manifests dos workspaces existentes (config)
- [ ] Expõe `lint`, `format` e `typecheck` (e `dev`/`build`/`start`/`test:e2e` onde fizer sentido); workspace que não expõe não participa de `pnpm lint`/`pnpm typecheck` — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] App Next: o `typecheck` é `next typegen && tsc --noEmit`, nunca `tsc --noEmit` sozinho — `PageProps`/`LayoutProps`/`RouteContext` são globais gerados em `.next/types` — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] `eslint.config.js` apenas reexporta um preset de `@workspace/eslint-config` (ver §7)
- [ ] `tsconfig.json` estende o preset certo de `@workspace/typescript-config` (ver §7)
- [ ] Dependências internas como `workspace:*` (ver §2)
- [ ] App novo com rotas instantâneas cria o **próprio** `instant-nav.rig.md` — o rig vive ao lado do app, não na raiz — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) (preâmbulo)

## 4. Ao criar ou alterar uma rota/página em apps/web

Contexto fixo: `cacheComponents` e `partialPrefetching` estão ligados no
[next.config.ts](apps/web/next.config.ts), e `partialPrefetching` depende de
`cacheComponents` — sem ele, `next dev` e `next build` falham na validação.

- [ ] Ler o guia correspondente em `apps/web/node_modules/next/dist/docs/` **antes** de escrever código de rota — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] O que é estático pinta imediatamente; tudo que depende do request fica abaixo de um `<Suspense>` — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] Nenhum `export const dynamic`/`revalidate`/`fetchCache` (com `cacheComponents` são erro; o substituto de `revalidate` é `cacheLife`) e nenhum `experimental_ppr` (PPR é implícito) — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] Todo `"use cache"` declara um `cacheLife` explícito; nunca o perfil `"seconds"` em conteúdo que deva estar no shell — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] Valor não determinístico só depois de `await io()` de `next/cache`; `connection()` apenas quando renderizar precisa esperar um request real, com justificativa (bloqueia o prefetch) — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] `params` e `searchParams` descem como promise para dentro do boundary — nunca `await` no topo da página, mesmo com todos os valores em `generateStaticParams` — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] `generateStaticParams` nunca retorna lista vazia — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] O elemento de LCP fica fora de todo boundary — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] Nenhum padrão conta com desmontagem para resetar estado: `<Activity mode="hidden">` preserva estado entre navegações — fonte: [AGENTS.md](AGENTS.md) §Renderização
- [ ] `prefetch` é configuração do **destino** (`export const prefetch` no `page.tsx`/`layout.tsx` de destino); nunca escrever `'partial'` (redundante) nem `'auto'` (default); `'force-disabled'` só com justificativa — fonte: [AGENTS.md](AGENTS.md) §Prefetch parcial
- [ ] `<Link prefetch={true}>` exige justificativa — custa uma invocação de servidor por link — fonte: [AGENTS.md](AGENTS.md) §Prefetch parcial
- [ ] A navegação aquece o App Shell **compartilhado** da rota, não a página do slug: conteúdo dependente de param não estará no shell (ver §6) — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §WALLS
- [ ] Validar em `next dev` com navegador real: os insights (`instant-shell-url-data`, shell vazio) não disparam com `curl` nem `next build` — fonte: [AGENTS.md](AGENTS.md) §Insights de desenvolvimento
- [ ] Erro de validação de `instant` em **todas** as rotas = dev server degradado; reiniciar antes de investigar o código — fonte: [AGENTS.md](AGENTS.md) §Insights de desenvolvimento
- [ ] Shell e conteúdo diferido marcados com `data-testid` estáveis, e a rota entrega seu spec `instant()` (ver §6) — fonte: [AGENTS.md](AGENTS.md) §Testes

## 5. Ao criar ou alterar um componente de UI

- [ ] Componente de design system vai em `packages/ui/src/components`; composição específica do app vai em `apps/web/components` — divisão codificada nos dois `components.json` — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] Componente de `packages/ui` segue a anatomia: `"use client"`, variantes via `cva` com export do `*Variants`, primitivas de `react-aria-components` (não Radix), atributos `data-slot`/`data-variant`/`data-size`, classes via `cn()` — fonte: [packages/ui/src/components/](packages/ui/src/components/) (config)
- [ ] CSS só em `packages/ui/src/styles/globals.css`; proibido criar `globals.css` em `apps/web` — o app importa `@workspace/ui/globals.css` e re-exporta o PostCSS do pacote — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] Tailwind v4 CSS-first: sem `tailwind.config.*`; tokens em oklch em `:root`/`.dark` mapeados por `@theme inline`; `@source` cobre `apps/**` e `packages/ui/**` — fonte: [globals.css](packages/ui/src/styles/globals.css) (config)
- [ ] `exports` de `packages/ui/package.json`: entradas existentes congeladas (bundler e CLI do shadcn dependem do mapa); entrada nova só aditiva e só para a camada de extensão — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão
- [ ] Os dois `components.json` ficam em sincronia: `style: "aria-lyra"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "tabler"`, `rtl: true`, `menuColor: "default-translucent"`, `menuAccent: "subtle"`, `tailwind.config` vazio — fonte: [apps/web/components.json](apps/web/components.json) + [packages/ui/components.json](packages/ui/components.json) (config)
- [ ] App que consome `@workspace/ui` declara `transpilePackages: ["@workspace/ui"]` — fonte: [next.config.ts](apps/web/next.config.ts) (config)
- [ ] Fontes seguem a fiação de três camadas: `next/font` só com nomes canônicos (`--font-sans`/`--font-mono`/`--font-heading`) e classe `font-sans` no `<html>` do root layout; `@theme inline` só consome (nunca font-family literal ali); fallbacks literais em `@layer base { :root }` do `globals.css` — fonte: [AGENTS.md](AGENTS.md) §Tipografia e preset do design system
- [ ] Ao tocar em fonte, tema ou `components.json`: `pnpm dlx shadcn@latest preset resolve -c apps/web --json` **e** `-c packages/ui --json` retornam `"code": "b3uv3ZyQIE"` com `"fallbacks": []` — fonte: [AGENTS.md](AGENTS.md) §Tipografia e preset do design system
- [ ] Arquivo em `packages/ui/src/{components,hooks,lib}` (camada pristine) nunca é editado à mão: só o fluxo de sync via CLI escreve ali, em commit dedicado `chore(ui): sync <nome> from upstream` com `pristine.lock.json` atualizado no mesmo commit — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão
- [ ] Divergência de casa no design system (wrapper, variante, composição, componente net-new) vai em `packages/ui/src/ext`, importada como `@workspace/ui/ext/<nome>`, com a mesma anatomia dos componentes pristine — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão
- [ ] Direção de import: `ext/` importa `components/`; `components/` nunca importa `ext/`; quando existe extensão de um componente, o app importa a extensão — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão
- [ ] Sync de upstream: preview com `pnpm dlx shadcn@latest add <nome> --dry-run`/`--diff` (nunca fetch cru do GitHub), aceite com `--overwrite`, depois `pnpm format` e `pnpm --filter @workspace/ui run update:pristine` — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão

## 6. Ao escrever ou alterar um teste E2E (instant)

- [ ] Ler [instant-nav.rig.md](apps/web/instant-nav.rig.md) antes do primeiro spec de uma rota nova — fonte: [AGENTS.md](AGENTS.md) §Testes
- [ ] Spec nomeado `*.instant.spec.ts` em `apps/web/e2e/`; o modelo é [demo.instant.spec.ts](apps/web/e2e/demo.instant.spec.ts) — fonte: [AGENTS.md](AGENTS.md) §Testes
- [ ] Régua, não cronômetro: sem retry, sem timeout customizado, sem medir tempo — o `retries: 0` do [playwright.config.ts](apps/web/playwright.config.ts) não se altera — fonte: [AGENTS.md](AGENTS.md) §Testes + rig §DRIFT
- [ ] Par obrigatório: conteúdo diferido com `toHaveCount(0)` **dentro** do lock e `toBeVisible()` **fora** dele — sem o par, o spec passa por vazio — fonte: [AGENTS.md](AGENTS.md) §Testes
- [ ] `{ baseURL }` como terceiro argumento do `instant()` quando o `goto` é a primeira navegação — fonte: [demo.instant.spec.ts](apps/web/e2e/demo.instant.spec.ts) (config)
- [ ] Navegação client-side: `await page.waitForURL(...)` antes de qualquer asserção de UI — fonte: [demo.instant.spec.ts](apps/web/e2e/demo.instant.spec.ts) (config)
- [ ] `data-testid` estável é contrato: padrão `<rota>-shell` para o shell e `<rota>-<detalhe>` para o diferido — fonte: [demo.instant.spec.ts](apps/web/e2e/demo.instant.spec.ts) (config)
- [ ] Conteúdo dependente de param assertado como ausente dentro do lock é vermelho legítimo, não flake (ver §4) — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §WALLS
- [ ] Nunca medir contra `next dev`; o `webServer` roda `pnpm build && pnpm start` sozinho — fonte: [AGENTS.md](AGENTS.md) §Testes + rig §BUILD
- [ ] Host `127.0.0.1` e porta `3100` não se alteram: o cookie `next-instant-navigation-testing` é escopado por domínio, não por porta — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §RUN
- [ ] `NEXT_E2E` só pela opção `env` do `webServer` (nunca prefixo de shell — o repo roda em Windows) e **jamais** em deploy voltado ao usuário: sem a flag, `instant()` passa por vazio — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §EXPOSE
- [ ] Manter os dois projects, desktop e mobile (Pixel 7): o shell tem que bater em todos os breakpoints — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §DRIFT
- [ ] Rota nova segue o LOOP: baseline descartável (apagada antes do commit) → vermelho → correção → diferencial — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §LOOP
- [ ] Rota autenticada: sessão injetada por `storageState`, sem `page.goto` no setup — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §TEST USER

## 7. Ao mexer em tooling (ESLint, TypeScript, Prettier, Turbo)

- [ ] ESLint é flat config e o `eslint.config.js` de cada workspace apenas reexporta um preset de `@workspace/eslint-config` (`./base`, `./next-js`, `./react-internal`); regra nova entra no preset, não no workspace — fonte: [packages/eslint-config/](packages/eslint-config/) (config)
- [ ] A base mantém `eslint-plugin-only-warn` (tudo vira warning) e `turbo/no-undeclared-env-vars` — fonte: [base.js](packages/eslint-config/base.js) (config)
- [ ] O par que faz o lint morder: `only-warn` para a UX do editor (amarelo, não vermelho) **e** `--max-warnings 0` no script `lint` de cada workspace. Um sem o outro devolve o gate decorativo — fonte: manifests dos workspaces (config)
- [ ] `eslint-config-prettier` é o **último** elemento de cada config final (`./next-js`, `./react-internal`), nunca do `./base` — ele desliga as regras estilísticas de tudo que veio antes — fonte: [base.js](packages/eslint-config/base.js) (comentário)
- [ ] `./next-js` constrói sobre `eslint-config-next` (`core-web-vitals` + `typescript`), não sobre plugins do Next montados à mão — fonte: [next.js](packages/eslint-config/next.js) (config)
- [ ] A base TS mantém `strict`, `noUncheckedIndexedAccess`, `moduleDetection: "force"` e `isolatedModules`; app estende `nextjs.json`, biblioteca estende `react-library.json` — fonte: [packages/typescript-config/](packages/typescript-config/) (config)
- [ ] Aliases de import: `@/*` dentro do app, `@workspace/ui/*` para o design system — fonte: [apps/web/tsconfig.json](apps/web/tsconfig.json) (config)
- [ ] Prettier único na raiz: `semi: false`, aspas duplas, `printWidth: 80`, `trailingComma: "es5"`, `endOfLine: "lf"`, `tailwindStylesheet` ancorado no globals.css do ui, `tailwindFunctions: ["cn", "cva"]` — fonte: [.prettierrc](.prettierrc) (config)
- [ ] Task nova no turbo.json: `dependsOn: ["^<task>"]` quando consome saída de dependências; `cache: false` + `persistent: true` em processo de longa duração (`dev`, `start`); `outputs` do build = `.next/**` menos `.next/cache/**` — fonte: [turbo.json](turbo.json) (config)
- [ ] Variável que altera o artefato entra em `env` da task (ex.: `NEXT_E2E` no build); variável específica da máquina entra em `passThroughEnv` (ex.: `PLAYWRIGHT_BROWSERS_PATH` no `test:e2e`) — fonte: comentários no [turbo.json](turbo.json) (config)
- [ ] A task `dev` mantém o `passThroughEnv` com as variáveis de detecção de AI agent (`AI_AGENT`, `CLAUDECODE` etc.); remover qualquer uma desliga silenciosamente a geração de `apps/web/AGENTS.md` ao rodar `pnpm dev` pela raiz — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo + comentário no [turbo.json](turbo.json)
- [ ] Decisão não óbvia de task fica registrada como comentário JSONC no próprio turbo.json — fonte: [turbo.json](turbo.json) (config)
- [ ] Artefato novo de ferramenta entra no `.gitignore` (e no `.prettierignore` quando for conteúdo gerado) — fonte: [.gitignore](.gitignore) + [.prettierignore](.prettierignore) (config)

## 8. Ao mexer no CI

- [ ] Workflow único: job `verify` em `ubuntu-latest`, gatilhos `push` e `pull_request` em `main` — fonte: [ci.yml](.github/workflows/ci.yml) (config)
- [ ] `pnpm/action-setup@v4` **sem** o input `version` (herda de `packageManager`) e **antes** de `actions/setup-node@v4` (`node-version: 22`, `cache: pnpm`) — fonte: comentários no [ci.yml](.github/workflows/ci.yml) (config)
- [ ] Instalação sempre com `pnpm install --frozen-lockfile` — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] Ordem do pipeline: install → lint → typecheck → check:pristine → build → instalação de browser → test:e2e — fonte: [ci.yml](.github/workflows/ci.yml) (config)
- [ ] Cada passo é autossuficiente: nenhum depende de artefato deixado por um passo anterior. O `typecheck` vem antes do `build` e gera os próprios tipos de rota (ver §3) — fonte: [ci.yml](.github/workflows/ci.yml) (config)
- [ ] Browser escopado e mínimo: `pnpm --filter web exec playwright install --with-deps chromium` — fonte: [ci.yml](.github/workflows/ci.yml) (config)
- [ ] O build duplo é intencional: `pnpm build` valida o artefato **sem** `NEXT_E2E`; o `webServer` do e2e rebuilda com a flag (ver §6) — fonte: comentários no [turbo.json](turbo.json) e no [ci.yml](.github/workflows/ci.yml) (config)
- [ ] Condicionais de CI moram no `playwright.config.ts`: `forbidOnly` e reporter `github` só sob `CI`; `reuseExistingServer: !CI` — fonte: [playwright.config.ts](apps/web/playwright.config.ts) (config)

## 9. Antes de commitar (qualquer fluxo)

- [ ] `pnpm lint` e `pnpm typecheck` verdes na raiz; `pnpm test:e2e` se o commit toca rota ou teste — fonte: [AGENTS.md](AGENTS.md) §Comandos canônicos
- [ ] Nenhum `package-lock.json`/`yarn.lock` no diff — fonte: [AGENTS.md](AGENTS.md) §Gerenciador de pacotes
- [ ] `apps/web/AGENTS.md` e `apps/web/CLAUDE.md` regenerados pelo `next dev` entram no commit — removê-los do diff só recria a mudança — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo
- [ ] Spec `instant()` novo ou alterado: diferencial rodado (desfazer a correção → vermelho → refazer) e baseline descartável apagada — fonte: [AGENTS.md](AGENTS.md) §Testes + rig §LOOP
- [ ] Armadilha nova descoberta nos testes virou entrada em WALLS do rig — fonte: [instant-nav.rig.md](apps/web/instant-nav.rig.md) §WALLS
- [ ] Justificativas exigidas presentes em comentário: `'force-disabled'`, `<Link prefetch={true}>`, `connection()` — fonte: [AGENTS.md](AGENTS.md) §Renderização e §Prefetch parcial
- [ ] Convenção nova estabelecida neste commit tem item correspondente adicionado a este arquivo — fonte: cabeçalho deste arquivo

## 10. Pendências / decisões em aberto

Inconsistências doc↔código registradas na auditoria de 2026-08 (histórico de
commits + skill `improve`, que gerou os planos numerados em [plans/](plans/)).
Nada foi corrigido deliberadamente; cada item aguarda decisão ou a execução do
plano correspondente.

- **O script `format` cobre só `**/*.{ts,tsx}`** e não existe `format:check`; `apps/web/eslint.config.js` viola o `.prettierrc` (ponto e vírgula) → [plans/002-format-check-e-ci.md](plans/002-format-check-e-ci.md)
- **`packages/eslint-config` e `packages/typescript-config` não expõem script nenhum**, contra a regra "todo workspace expõe os mesmos scripts" → follow-up registrado na nota de manutenção do [plans/002-format-check-e-ci.md](plans/002-format-check-e-ci.md)
- **`packages/ui/tsconfig.lint.json` está morto** (nada o referencia; inclui diretório inexistente), **`@types/node@^20` contradiz `engines >=22`** e **`@tabler/icons-react` está declarado sem nenhum import** → [plans/006-higiene-deps-e-configs.md](plans/006-higiene-deps-e-configs.md)
- **Metadata boilerplate do create-next-app e `lang="en"`** no layout raiz de um produto em pt-BR; restos de template no README → [plans/007-branding-e-readme.md](plans/007-branding-e-readme.md)
- **README desatualizado**: omite `test:e2e` na lista de tasks orquestradas e a seção Stacks não cita Playwright/`instant()` — sem plano dedicado; versões exatas em prosa são custo aceito, com protocolo de bump na nota do [plans/006-higiene-deps-e-configs.md](plans/006-higiene-deps-e-configs.md)
- **Task `format` do turbo.json é cacheável** apesar de `prettier --write` mutar a árvore — sem plano; decidir `cache: false` (o [plans/002](plans/002-format-check-e-ci.md) contorna de propósito rodando `format:check` direto na raiz, sem task turbo)
- **`plugins: [{ "name": "next" }]` duplicado** entre `packages/typescript-config/nextjs.json` e `apps/web/tsconfig.json` — sem plano
- **Assimetria de `exports`**: `@workspace/eslint-config` declara o campo, `@workspace/typescript-config` não — sem plano; alinhar ou registrar a exceção
- **Não é pendência** (registrado para ninguém "corrigir"): `shadcn` em `dependencies` de `packages/ui` é correto — o `globals.css` importa `shadcn/tailwind.css`; ver também "Achados considerados e rejeitados" no [plans/README.md](plans/README.md)
