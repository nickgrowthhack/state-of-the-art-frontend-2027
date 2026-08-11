# Plan 011: Substituir a home pelo catálogo vendorizado do design system

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 7ad2cd7..HEAD -- apps/web/app apps/web/e2e apps/web/package.json apps/web/next.config.ts packages/ui CHECKLIST.md`
> Além disso: (1) a linha do plano **003** em `plans/README.md` precisa estar
> **DONE** — sem ela o catálogo renderiza em fonte de sistema (`font-sans` e
> `cn-font-heading` dependem da fiação `--font-sans`/`--font-mono`); (2) o
> diretório `C:\ngh\alfa-manager-web` precisa existir e conter
> `apps\web\src\app\(app)\design-system\` — é o repositório-fonte do porte
> (somente leitura); (3) `git status` limpo antes de começar. Qualquer uma das
> três falhando é condição de STOP.

## Status

- **Prioridade**: P1 (pedido direto do operador)
- **Esforço**: L
- **Risco**: MED (substitui a rota raiz; o e2e `instant()` existente é a rede)
- **Depende de**: `plans/003-fiacao-de-fontes.md` (dura)
- **Categoria**: direction (porte de feature)
- **Planejado em**: commit `7ad2cd7`, 2026-08-11
- **Substitui**: `plans/009-spike-vitrine-design-system.md` (o spike virou porte
  completo; as questões Q1–Q4 do 009 são respondidas por decisões deste plano)

## Por que isso importa

O repo mantém um design system (`@workspace/ui`, preset shadcn `b3uv3ZyQIE`,
style `aria-lyra`) que o app nunca demonstra: a home ainda é o template do
create-next-app e `packages/ui` tem um único componente (`button.tsx`). O
projeto `alfa-manager-web` já resolveu o problema com um **catálogo
vendorizado**: um script baixa os examples/blocks oficiais do registry
`aria-lyra` do shadcn, reescreve os imports para o pacote do workspace e commita
o resultado — preview ao vivo de todo o design system, sem dependência de rede
no build. Este plano porta esse catálogo para cá, adaptado às convenções deste
repo (Cache Components, ícones Tabler, testes `instant()`), e o coloca na raiz:
a home passa a ser a vitrine do design system.

## Estado atual

### Neste repo (destino)

- `apps/web/app/page.tsx` — home template do create-next-app (73 linhas, classes
  `zinc-*` cruas, zero imports de `@workspace/ui`). Único elemento com contrato:
  `<Link ... href="/demo" data-testid="demo-link">Demo</Link>`. **Será removida.**
- `apps/web/app/layout.tsx` — root layout sem providers. Após o plano 003 terá
  duas fontes (`--font-sans`, `--font-mono`) aplicadas via `cn(...)` no `<html
  lang="en">`. Não tem `suppressHydrationWarning` nem `<Suspense>`.
- `apps/web/app/demo/page.tsx` e `apps/web/app/demo/[slug]/page.tsx` — exemplares
  canônicos de Cache Components. O `[slug]` é o modelo obrigatório para a rota
  de item deste plano:

  ```tsx
  // apps/web/app/demo/[slug]/page.tsx:12-38 (resumo)
  export default function DemoTopicPage({ params }: PageProps<"/demo/[slug]">) {
    return (
      <main ...>
        <header data-testid="topic-shell" ...>...</header>
        {/* `params` nunca é aguardado aqui em cima: a promise desce para dentro
            do boundary. Vale mesmo com todos os slugs em generateStaticParams */}
        <Suspense fallback={<TopicDetailSkeleton />}>
          <TopicDetail params={params} />
        </Suspense>
      </main>
    )
  }
  ```

- `apps/web/e2e/demo.instant.spec.ts` — 3 testes × 2 projects (desktop + mobile
  Pixel 7) = 6. O segundo teste é o **contrato da home**: `page.goto("/")` →
  `instant()` → `click(getByTestId("demo-link"))` → `waitForURL("/demo")` →
  `demo-shell` visível + `demo-live` com `toHaveCount(0)`. **Este spec nunca é
  editado**: a home nova se adapta a ele.
- `apps/web/next.config.ts` — `cacheComponents: true`, `partialPrefetching:
  true`, `transpilePackages: ["@workspace/ui"]`, `agentRules: true`,
  `exposeTestingApiInProductionBuild` atrás de `NEXT_E2E`. **Sem
  `images.remotePatterns`** (os examples vendorizados usam `next/image` com
  hosts remotos — precisa adicionar).
- `packages/ui/src/components/` — só `button.tsx` (anatomia: `"use client"`,
  `cva` + export `buttonVariants`, primitivas `react-aria-components`,
  `data-slot`/`data-variant`/`data-size`, `cn()`).
- `packages/ui/src/styles/globals.css` — única folha de estilo.
  `@custom-variant dark (&:is(.dark *))` na linha 5; tokens oklch em
  `:root`/`.dark`; `@theme inline` termina com `--font-sans`/`--font-heading`
  (o 003 acrescenta `--font-mono`). **Não** declara nenhum variant `style-*`
  nem a utility `cn-font-heading` (verificado que o `shadcn/tailwind.css`
  importado na linha 3, versão 4.16.2, também não — sem colisão).
- `apps/web/package.json` — deps: `@tabler/icons-react ^3.46.0` (declarada,
  hoje sem nenhum import — este plano passa a usá-la), `@workspace/ui`,
  `next 16.3.0`, `react 19.2.8`. Script `format`: `prettier --write
  "**/*.{ts,tsx}"`.
- Dark mode: o CSS é class-based mas **nada aplica `.dark`**; `next-themes` não
  está instalado. Não há `RouterProvider` do react-aria — um `href` de
  componente react-aria hoje viraria navegação full-page.
- Convenções que este plano deve honrar (CHECKLIST.md §4, §5, §6): `params`
  como promise dentro de `<Suspense>`; `generateStaticParams` nunca vazio; LCP
  fora de todo boundary; componente novo via
  `pnpm dlx shadcn@latest add <name> -c apps/web`; nunca editar os dois
  `components.json`; spec `*.instant.spec.ts` com par negativo dentro do lock;
  testids `<rota>-shell`/`<rota>-<detalhe>`; LOOP do
  `apps/web/instant-nav.rig.md` (baseline descartável → vermelho → correção →
  diferencial); convenção nova entra no CHECKLIST.md no mesmo commit.

### No alfa-manager-web (fonte — somente leitura)

Raiz da rota: `C:\ngh\alfa-manager-web\apps\web\src\app\(app)\design-system\`.

- `C:\ngh\alfa-manager-web\apps\web\scripts\sync-design-system.mjs` (237 linhas)
  — o gerador. Baixa `example` + 55 `<componente>-example` + 2 blocks do
  registry (`https://ui.shadcn.com/r/styles/aria-lyra/<name>.json`) e os cards
  dos blocks via GitHub raw
  (`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/aria/...`),
  reescreve imports (função `rewrite`, linhas 81–109), valida com `assertClean`
  (exit 1 se sobrar import não reescrito), gera `icons.ts` (coleta props
  `remixicon="…"` — linha 181), `registry.ts` (manifesto de 59 itens) e
  `item-components.tsx` (`next/dynamic`, um chunk por item), e grava tudo em
  `_generated/` (~129 arquivos, ~32k linhas, **commitados** — o build nunca
  depende da rede). 3 examples pulados de propósito (`SKIPPED`, linhas 51–55).
- Rotas: `(shell)/layout.tsx` (SidebarProvider + sidebar + header),
  `(shell)/page.tsx` (redirect — **não portar**, aqui a landing é própria),
  `(shell)/[item]/page.tsx` (renderiza só
  `<iframe src="/design-system/view/{item}">` — examples assumem a viewport
  inteira e blocks têm ~2400px), `view/[item]/page.tsx` (rota nua fora do
  shell = conteúdo do iframe; `metadata.robots: { index: false }`; blocks
  ganham wrapper `*:overflow-visible! *:contain-none!`). **As duas fazem
  `await params` no topo — o alfa não tem `cacheComponents`; aqui isso precisa
  ser adaptado** (ver passos 3.3 e 3.4).
- `_components/design-system-shell.tsx` (228 linhas, client) — sidebar
  `collapsible="icon"` com filtro client-side, grupos colapsáveis
  Blocks/Componentes (links via `SidebarMenuSubButton href` — react-aria),
  header com `SidebarTrigger` + título via `usePathname` + `ThemeToggle`.
  Branding Alfa a remover: `BrandSymbol` (linhas 34, 89) e o subtítulo
  `"base-lyra · mist"` (linha 94).
- `_components/item-renderer.tsx` (12 linhas, client) — resolve nome →
  componente no mapa `ITEM_COMPONENTS`.
- `_shims/design-system.ts` (54 linhas) — constantes fixas do preset (style,
  baseColor, theme, iconLibrary, font…) + `FONTS`/`STYLES` +
  `useDesignSystemSearchParams()`; substitui os módulos reativos do `/create`
  do shadcn. Consumido por 6 cards.
- `_shims/icon-placeholder.tsx` (51 linhas, client) — resolve a prop
  `remixicon` no mapa gerado `REMIX_ICONS`. Os arquivos vendorizados carregam
  props para as 5 bibliotecas (`lucide`/`tabler`/`hugeicons`/`phosphor`/
  `remixicon`) — **625 props `tabler="Icon…"` em 61 arquivos, ~139 nomes
  distintos**, todos no formato de export do `@tabler/icons-react`.
- Providers genéricos que a rota exige (portáveis):
  `apps\web\src\components\theme-provider.tsx` (next-themes),
  `apps\web\src\components\aria-providers.tsx` (RouterProvider do react-aria
  plugado no `useRouter` — sem ele todo `href` da sidebar vira full-page load),
  `apps\web\src\components\theme-toggle.tsx` (ToggleGroup + `useTheme` +
  `useSyncExternalStore` para hidratação) e `<Toaster />` (sonner).
- Bug herdado documentado em
  `C:\ngh\alfa-manager-web\docs\design-system-catalogo.md`: 293 classes
  `style-*:` (das quais ~61 `style-lyra:`) e 6 usos de `cn-font-heading` nos
  vendorizados compilam para nada. **Decisão do operador para este porte:
  corrigir** (passo 2.3).
- Hosts de imagem usados pelos examples: `images.unsplash.com`,
  `avatar.vercel.sh`, `github.com` (os três `remotePatterns` do alfa).

## Comandos necessários

| Propósito | Comando | Esperado no sucesso |
|-----------|---------|---------------------|
| Instalar | `pnpm install` | exit 0 |
| Types | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |
| E2E | `pnpm test:e2e` | 6 testes até a fase 4; 12 depois |
| Sync do catálogo | `pnpm --filter web sync:ds` | "59 itens, 129 arquivos" (criado no passo 2.1) |
| Formatar | `pnpm format` | exit 0 |
| Dev | `pnpm dev` | serve em :3000 |
| Spec isolado | `pnpm --filter web exec playwright test design-system` | passa |

Nota Windows: nunca prefixo `VAR=1 comando`; o `webServer` do Playwright define
`NEXT_E2E` sozinho.

## Toolkit sugerido

- Skill `shadcn` antes de escrever qualquer UI (obrigatória pelo
  `apps/web/AGENTS.md`).
- Skill `next-cache-components-optimizer` para o LOOP dos specs `instant()` da
  fase 4; `next-dev-loop`/`agent-browser` para validar insights no `next dev`
  com navegador real.
- Ler antes da fase 3: `apps/web/instant-nav.rig.md` e os guias em
  `apps/web/node_modules/next/dist/docs/` (`instant-navigation.md`,
  `adopting-partial-prefetching.md` e a referência
  `route-segment-config/instant.md` — §"Disabling static shell validation").

## Escopo

**Em escopo** (os únicos arquivos a modificar/criar/remover):

- `apps/web/app/(catalog)/**` (novo), `apps/web/app/design-system/**` (novo)
- `apps/web/app/page.tsx` (**remover**), `apps/web/app/layout.tsx` (providers)
- `apps/web/components/{theme-provider,aria-providers,theme-toggle}.tsx` (novos)
- `apps/web/scripts/sync-design-system.mjs` (novo) e o script `sync:ds` em
  `apps/web/package.json`
- `apps/web/e2e/design-system.instant.spec.ts` (novo)
- `apps/web/next.config.ts` (só `images.remotePatterns`)
- `apps/web/package.json` (deps novas + script), `packages/ui/**` (componentes
  e deps **via CLI do shadcn**; `globals.css` só as duas adições do passo 2.3)
- `apps/web/public/next.svg` e `apps/web/public/vercel.svg` (**remover** — só a
  home antiga os referenciava)
- `CHECKLIST.md`, `apps/web/instant-nav.rig.md`, `README.md` (só menções à home
  template), `plans/README.md`
- `apps/web/AGENTS.md` / `apps/web/CLAUDE.md` (regenerados pelo `next dev` —
  entram no commit, nunca editados à mão)

**Fora de escopo** (não tocar, mesmo parecendo relacionado):

- `apps/web/e2e/demo.instant.spec.ts` e as rotas `/demo` — são o contrato; a
  home nova se adapta a eles, nunca o contrário.
- Os dois `components.json` — proibido editar (AGENTS.md do app).
- `apps/web/playwright.config.ts` — exceção única: `webServer.timeout`, e só se
  o gate da fase 3 estourar (ver STOP/risco); `retries`, host, porta e projects
  são intocáveis.
- O campo `exports` de `packages/ui/package.json` (o CLI pode acrescentar
  dependências ao manifest; o mapa `exports` não muda).
- `turbo.json`, `.prettierrc`, `pnpm-lock.yaml` à mão, tokens de cor do
  `globals.css`.
- **Todo o repositório `C:\ngh\alfa-manager-web`** — fonte de leitura, zero
  escrita.

## Fluxo de git

- Branch: `advisor/011-catalogo-design-system`
- Um commit por fase (5 commits), conventional commits em inglês no estilo do
  histórico (ex.: `feat: add design system catalog foundation`). O repo fica
  **verde em cada commit** (typecheck + build + e2e da fase).
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Fase 1 — Fundação (commit 1)

**1.1 Componentes do design system via CLI.** Anote antes:
`git diff --stat packages/ui/src/components/button.tsx` (deve estar limpo).
Rode na raiz:

```
pnpm dlx shadcn@latest add accordion alert alert-dialog aspect-ratio attachment avatar badge breadcrumb bubble button-group calendar card carousel chart checkbox collapsible combobox command context-menu dialog drawer dropdown-menu empty field input input-group input-otp item kbd label marker native-select pagination popover progress radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner spinner switch table tabs textarea toggle toggle-group tooltip -c apps/web
```

(53 nomes; `button` fica de fora — já existe. O CLI resolve dependências
sozinho: espere arquivos extras como `direction.tsx` e
`packages/ui/src/hooks/use-mobile.ts`, e deps novas no
`packages/ui/package.json` — ex.: `embla-carousel-react`, `react-day-picker`,
`@base-ui/react`. Isso é esperado.) Se o CLI perguntar sobre sobrescrever
`button.tsx`, aceite e **inspecione o diff**: um overwrite que preserve a
anatomia (cva + `buttonVariants` + react-aria + `data-slot`) é aceitável;
perda de anatomia é STOP. Remova `packages/ui/src/components/.gitkeep` de
carona (nota em `plans/README.md`).

**Verificar**: `ls packages/ui/src/components | wc -l` ≥ 54; `pnpm install`
exit 0; `pnpm typecheck` exit 0.

**1.2 Dependências do app.**

```
pnpm --filter web add next-themes react-aria-components recharts sonner input-otp @internationalized/date react-resizable-panels react-qr-code
```

(Todas são importadas diretamente por arquivos de `apps/web` — providers e
vendorizados da fase 2; declarar no app evita dependência fantasma via
`packages/ui`.)

**1.3 Providers e toggle** em `apps/web/components/` (composição de app — é a
divisão do AGENTS.md). Portar de
`C:\ngh\alfa-manager-web\apps\web\src\components\`:

- `theme-provider.tsx` — client; repassa para `ThemeProvider` do `next-themes`.
- `aria-providers.tsx` — porte 1:1 (client; `RouterProvider` do
  `react-aria-components` com `navigate={(href) => router.push(href)}`;
  preservar o comentário explicando que sem ele todo `href` react-aria vira
  navegação full-page).
- `theme-toggle.tsx` — porte com ícones trocados: `RiComputerLine` →
  `IconDeviceDesktop`, `RiSunLine` → `IconSun`, `RiMoonLine` → `IconMoon`
  (de `@tabler/icons-react`). Preservar o padrão `useSyncExternalStore` de
  hidratação e os comentários.

**1.4 Root layout** (`apps/web/app/layout.tsx`): adicionar
`suppressHydrationWarning` no `<html>` (exigência do next-themes) e envolver os
children:

```tsx
<body className="flex min-h-full flex-col">
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <AriaProviders>{children}</AriaProviders>
    <Toaster />
  </ThemeProvider>
</body>
```

`Toaster` vem de `@workspace/ui/components/sonner`. Não mexer nas fontes (são
do 003) nem no `lang`/`metadata` (são do 007).

**1.5 `next.config.ts`**: adicionar, com comentário de justificativa:

```ts
images: {
  // Exigido pelos examples vendorizados do catálogo (fase 2 do plano 011).
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "avatar.vercel.sh" },
    { protocol: "https", hostname: "github.com" },
  ],
},
```

**1.6 CHECKLIST.md §5**: item novo — "Componente react-aria com `href` depende
do `RouterProvider` montado no root layout (`apps/web/components/aria-providers.tsx`);
sem ele a navegação vira full-page load" (convenção nova → mesmo commit).

**Verificar (gate do commit 1)**: `pnpm typecheck` exit 0 · `pnpm lint` exit 0 ·
`pnpm build` exit 0 · **`pnpm test:e2e` → 6/6** (prova que os providers não
derrubam nenhum shell do prerender — se qualquer spec ficar vermelho aqui, é
STOP, não ajuste) · `pnpm dev` + navegador: alternar o tema aplica/remove a
classe `.dark` no `<html>` e as cores mudam.

### Fase 2 — Gerador, sync e CSS (commit 2)

**2.1 Portar o gerador** para `apps/web/scripts/sync-design-system.mjs`, a
partir de `C:\ngh\alfa-manager-web\apps\web\scripts\sync-design-system.mjs`,
com estas adaptações (e só estas):

1. `OUT_DIR = join(ROOT, "app/design-system/_generated")` (o destino não tem
   `src/`).
2. `SHIM_ICON = "@/app/design-system/_shims/icon-placeholder"` e
   `SHIM_DS = "@/app/design-system/_shims/design-system"`.
3. Comentário de cabeçalho: preset deste repo é `b3uv3ZyQIE` (não `b1Zirvjrm`);
   caminho de saída atualizado.
4. Ícones (passo 4 do script): trocar a regex `remixicon="([A-Za-z0-9]+)"` por
   `tabler="([A-Za-z0-9]+)"`, o import de `@remixicon/react` por
   `@tabler/icons-react`, e `REMIX_ICONS` por `TABLER_ICONS` (atualizar o
   header gerado do `icons.ts`).
5. **Remover** a reescrita especial
   `out = out.replace(/style-lyra:rounded-none style-sera:rounded-none/g, "rounded-none")`
   (linhas 104–106 da fonte): com o `@custom-variant style-lyra` do passo 2.3,
   a classe original funciona sozinha.
6. Adicionar ao `apps/web/package.json`:
   `"sync:ds": "node scripts/sync-design-system.mjs"`.

Não alterar: listas `COMPONENTS`/`BLOCKS`/`SKIPPED`, URLs do registry,
`assertClean` (a rigidez é de propósito), a lógica de escrita.

**2.2 Portar os shims** para `apps/web/app/design-system/_shims/`:

- `icon-placeholder.tsx` — resolver `props.tabler` contra `TABLER_ICONS`
  (importado de `../_generated/icons`); trocar o tipo
  `RemixiconComponentType` pelo tipo de ícone exportado por
  `@tabler/icons-react` (confira o export no pacote instalado — esperado
  `Icon`/`IconProps`; o `pnpm typecheck` valida). Manter a lista
  `ICON_LIBRARY_KEYS` e a limpeza de props, e os comentários adaptados.
- `design-system.ts` — porte com as constantes do preset **deste** repo
  (valores canônicos no `apps/web/AGENTS.md`): `style: "lyra"`,
  `baseColor: "neutral"`, `theme: "indigo"`, `chartColor: "indigo"`,
  `iconLibrary: "tabler"`, `font: "geist"`, `fontHeading: "geist-mono"`,
  `radius: "none"`, `menuColor: "default-translucent"`, `menuAccent: "subtle"`.
  Estruturas `FONTS`/`STYLES`/`useDesignSystemSearchParams()` iguais às da
  fonte.

**2.3 CSS** em `packages/ui/src/styles/globals.css` — exatamente duas adições:

1. Logo abaixo de `@custom-variant dark (&:is(.dark *));` (linha 5):

   ```css
   /* O style deste repo é fixo em lyra: o variant do customizer do shadcn vira
      um variant sempre-ativo, para as classes `style-lyra:*` dos arquivos
      vendorizados do catálogo aplicarem. Os variants dos demais styles
      (style-sera: etc.) ficam propositalmente não declarados — Tailwind v4
      ignora variant desconhecido sem erro. */
   @custom-variant style-lyra (&);
   ```

2. Após o bloco `@theme inline`:

   ```css
   /* Utility do app do shadcn usada pelos vendorizados do catálogo. */
   @utility cn-font-heading {
     font-family: var(--font-heading);
   }
   ```

Nenhuma outra linha do arquivo muda.

**2.4 Rodar o sync**: `pnpm --filter web sync:ds` (exige rede:
`ui.shadcn.com` e `raw.githubusercontent.com`).

**Verificar**: saída reporta **59 itens, 129 arquivos** e **~139 ícones tabler**
(pequenas variações por mudança upstream são aceitáveis; divergência grande —
ex.: itens ≠ 59±3, `assertClean` estourando — é STOP) ·
`grep -rn "@remixicon" apps/web/app` → **0 matches** ·
`grep -rn "style-lyra:" apps/web/app/design-system/_generated | head -3` →
matches existem (a reescrita especial foi mesmo removida).

**2.5 Formatar**: `pnpm format`, depois `pnpm format` de novo →
`git status` não muda entre as duas rodadas (idempotência; os vendorizados
ficam sob o prettier do repo, **não** entram no `.prettierignore` — convenção:
todo `sync:ds` é seguido de `pnpm format` antes do commit; registre isso no
comentário de cabeçalho do script).

**Verificar (gate do commit 2)**: `pnpm typecheck` exit 0 (**prova que os ~139
nomes Tabler existem na `^3.46.0`** — para até ~5 nomes ausentes, crie um mapa
de aliases explícito no passo 4 do gerador com comentário; mais que isso é
STOP) · `pnpm lint` exit 0 · `pnpm build` exit 0 · `pnpm test:e2e` → 6/6
(diretórios `_*` não viram rota — nada mudou de rota ainda).

### Fase 3 — Rotas e substituição da home (commit 3)

Antes: ler o rig e os guias do Next listados no toolkit. Estrutura-alvo:

```
apps/web/app/
  (catalog)/
    layout.tsx                      # shell do catálogo (rota / e /design-system/[item])
    page.tsx                        # /  — landing estática (substitui a home)
    design-system/[item]/page.tsx   # item: iframe dentro de <Suspense>
  design-system/
    view/[item]/page.tsx            # conteúdo do iframe (fora do shell)
    _components/…  _shims/…  _generated/…
```

(`view` é segmento estático e vence `[item]` — sem colisão; topologia idêntica
à do alfa.)

**3.1 Shell**: portar `design-system-shell.tsx` para
`apps/web/app/design-system/_components/design-system-shell.tsx` com as
adaptações:

- Remover `BrandSymbol` (import e uso); no lugar, um ícone Tabler (sugestão:
  `IconPalette`) na mesma posição do `SidebarMenuButton size="lg"`.
- `href` do botão de cabeçalho da sidebar: `/` (a home é o catálogo).
- Subtítulo (`ItemDescription`): `aria-lyra · neutral` (style + baseColor dos
  `components.json` deste repo).
- Ícones Remix → Tabler: `RiSearchLine` → `IconSearch`, `RiArrowRightSLine` →
  `IconChevronRight`, `RiLayoutMasonryLine`/`RiShapesLine` → equivalentes
  existentes (sugestões: `IconLayoutGrid` para Blocks, `IconComponents` para
  Componentes; o `pnpm typecheck` acusa nome inexistente — troque por
  equivalente, não invente).
- Links de item continuam `SidebarMenuSubButton href={"/design-system/" + name}`
  (react-aria + RouterProvider da fase 1). O parsing
  `usePathname().split("/")[2]` continua válido (`/design-system/<item>`).
- `DesignSystemHeader`: adicionar `data-testid="catalog-shell"` no `<header>`
  (é o marcador de shell da rota para o e2e). Manter o `ThemeToggle` no header.
- Textos permanecem em pt-BR (idioma do produto).

Portar também `item-renderer.tsx` para
`apps/web/app/design-system/_components/` (ajustar só o caminho do import de
`_generated`).

**3.2 Layout do catálogo** `apps/web/app/(catalog)/layout.tsx`, a partir do
`(shell)/layout.tsx` do alfa: `SidebarProvider` + `DesignSystemSidebar` +
`SidebarInset` (com `min-w-0`) + `DesignSystemHeader` + wrapper
`flex min-h-0 flex-1 flex-col` nos children (comentário do alfa explica: o
iframe precisa poder encolher no flex). `metadata`:
`{ title: { default: "Design System", template: "%s – Design System" }, description: … }`.

**3.3 Landing** `apps/web/app/(catalog)/page.tsx` — **substitui a home**;
remover `apps/web/app/page.tsx` no mesmo commit (dois `page.tsx` para `/` é
erro de build) e apagar `public/next.svg` e `public/vercel.svg`. Requisitos
duros:

- 100% estática, **sem nenhum `<Suspense>`** — tudo entra no shell; o `<h1>`
  (LCP) fica no topo do conteúdo, fora de qualquer boundary.
- Hero: `<h1>` "Design System" + parágrafo curto (pt-BR) citando o preset
  (`aria-lyra · neutral · indigo · tabler`) + **`<Link href="/demo"
  data-testid="demo-link">`** estilizado com
  `cn(buttonVariants({ variant: "outline" }))` — tem que ser `next/link` (é o
  que prefetcha o App Shell de `/demo`; o contrato do
  `demo.instant.spec.ts` depende disso) e tem que ficar **no conteúdo da
  landing**, visível nos dois viewports (a sidebar colapsa em offcanvas no
  Pixel 7 — nada de contrato dentro dela).
- Grid do catálogo: duas seções (Blocks, Componentes) mapeando
  `DESIGN_SYSTEM_ITEMS` de `@/app/design-system/_generated/registry` para
  cards-link — cada um um `next/link` para `/design-system/<name>` com
  `data-testid={"catalog-card-" + name}`, composto com componentes do design
  system (`Item`/`Card` — use a skill `shadcn`). Com `partialPrefetching`, os
  59 links aquecem **um único** App Shell compartilhado da rota
  `/design-system/[item]` — custo O(1), sem justificativa de prefetch a dar.

**3.4 Página de item** `apps/web/app/(catalog)/design-system/[item]/page.tsx`
— modelo obrigatório: `apps/web/app/demo/[slug]/page.tsx`. Forma-alvo:

```tsx
import { Suspense } from "react"
import { notFound } from "next/navigation"
import {
  DESIGN_SYSTEM_ITEMS,
  getDesignSystemItem,
} from "@/app/design-system/_generated/registry"

export function generateStaticParams() {
  return DESIGN_SYSTEM_ITEMS.map((item) => ({ item: item.name }))
}

// Metadata streama fora de banda e não participa do shell de UI — aguardar
// `params` aqui não amarra o App Shell compartilhado à URL.
export async function generateMetadata({
  params,
}: Pick<PageProps<"/design-system/[item]">, "params">) {
  const { item } = await params
  return { title: getDesignSystemItem(item)?.title ?? "Design System" }
}

export default function DesignSystemItemPage({
  params,
}: PageProps<"/design-system/[item]">) {
  // O shell desta rota é o layout (sidebar + header). O iframe depende do
  // param, então desce para dentro do boundary — mesmo com todos os itens em
  // generateStaticParams, um param conhecido ainda pertence a uma única URL.
  return (
    <Suspense fallback={<ItemFrameSkeleton />}>
      <ItemFrame params={params} />
    </Suspense>
  )
}

async function ItemFrame({
  params,
}: Pick<PageProps<"/design-system/[item]">, "params">) {
  const { item } = await params
  const entry = getDesignSystemItem(item)
  if (!entry) notFound()
  // Mesma escolha do /create do shadcn: o preview roda num iframe. Vários
  // examples assumem a viewport inteira e os blocks são grades de ~2400px.
  return (
    <iframe
      key={item}
      data-testid="item-frame"
      src={`/design-system/view/${item}`}
      title={entry.title}
      className="size-full flex-1 border-0"
    />
  )
}

function ItemFrameSkeleton() {
  return <div className="size-full flex-1" />
}
```

**3.5 Rota do iframe** `apps/web/app/design-system/view/[item]/page.tsx` — a
partir da fonte do alfa, com uma adaptação de Cache Components:

```tsx
// Rota nua, fora do shell: é o conteúdo que /design-system/[item] embute num
// <iframe>. Nunca é alvo de <Link> nem de prefetch — só de hard load do
// próprio iframe — então fica fora da validação de shell estático:
export const instant = false
```

Manter do alfa: `metadata.robots: { index: false, follow: false }`,
`generateStaticParams`, `await params` no topo (permitido aqui pelo
`instant = false` — documentado em
`node_modules/next/dist/docs/.../route-segment-config/instant.md`,
§"Disabling static shell validation"), `notFound()` para item desconhecido, o
wrapper `*:overflow-visible! *:contain-none!` para `group === "block"` (com o
comentário original explicando o scroll), e `ItemRenderer`.

**Plano B** (só se o build recusar a rota mesmo com `instant = false`):
reestruturar como o passo 3.4 — componente síncrono + `params` promise para
dentro de `<Suspense fallback={null}>` — e reportar a divergência da doc.

**3.6 Convenções no mesmo commit**:

- CHECKLIST.md §4: item novo — "Rota que existe só como conteúdo de iframe
  (hard load, nunca alvo de Link/prefetch) pode declarar
  `export const instant = false` com comentário de justificativa e, com isso,
  ler `params` no topo; exemplo: `apps/web/app/design-system/view/[item]/page.tsx`".
- `apps/web/instant-nav.rig.md` §WALLS: entrada nova — links react-aria
  (sidebar do catálogo) navegam client-side via RouterProvider mas **não
  prefetcham**; a garantia de navegação instantânea vem dos `next/link` da
  landing. E: a rota `view/[item]` está fora da validação (`instant = false`).
- `apps/web/AGENTS.md`/`CLAUDE.md` regenerados pelo `next dev` entram no
  commit.

**Verificar (gate do commit 3)**: `pnpm build` exit 0 e a tabela de rotas lista
`/` (estática), `/design-system/[item]` e `/design-system/view/[item]` com os
59 params prerenderizados · `pnpm test:e2e` → **6/6** (contrato `demo-link`
sobrevive à home nova; vermelho aqui = ajustar a landing, nunca o spec) ·
`pnpm dev` + navegador real em `/`, `/design-system/preview` e
`/design-system/button-example`: sidebar navega client-side (sem full reload),
iframe carrega, overlay de Insights sem `instant-shell-url-data`/shell vazio
nas rotas novas (exceto a `view`, que está opted-out) · `pnpm typecheck` e
`pnpm lint` exit 0.

### Fase 4 — Specs `instant()` (commit 4)

Seguir o LOOP do rig, nesta ordem, em
`apps/web/e2e/design-system.instant.spec.ts` (modelo:
`demo.instant.spec.ts`):

**4.1 Baseline descartável** (spec temporário sem `instant()`): `goto("/")` →
`catalog-shell`, `catalog-card-preview` e `demo-link` visíveis;
`goto("/design-system/preview")` → `catalog-shell` e `item-frame` visíveis.
Rodar nos 2 projects. **Apagar antes do commit.**

**4.2 Specs definitivos** (3 testes × 2 projects = 6 novos; suite total 12):

```
describe "/"
  "é instantânea na carga inicial"
    instant(page, goto("/") → expect catalog-shell toBeVisible
                             → expect catalog-card-preview toBeVisible
                             → expect demo-link toBeVisible, { baseURL })
    // Sem par negativo: a landing é 100% estática por design — não existe
    // conteúdo diferido para assertar ausente. Exceção registrada no
    // CHECKLIST §6 neste mesmo commit.

describe "/design-system/[item]"
  "é instantânea na carga inicial"
    instant(page, goto("/design-system/preview")
      → expect catalog-shell toBeVisible
      → expect item-frame toHaveCount(0), { baseURL })
    fora do lock: expect item-frame toBeVisible

  "é instantânea na navegação client-side"
    goto("/")
    instant(page, click(catalog-card-preview)
      → waitForURL(pathname === "/design-system/preview")
      → expect catalog-shell toBeVisible
      → expect item-frame toHaveCount(0))
    fora do lock: expect item-frame toBeVisible
```

Comentários no spec no estilo do modelo (explicando o porquê de cada asserção).
CHECKLIST.md §6, no mesmo commit: item novo — "Rota comprovadamente 100%
estática pode ter spec `instant()` sem par negativo, com comentário
justificando; o par continua obrigatório em toda rota com conteúdo diferido".

**4.3 Diferencial** (o que separa o teste de um que passa por vazio):
desfazer temporariamente a estrutura do passo 3.4 — içar o `await params` para
o topo de `(catalog)/design-system/[item]/page.tsx` sem `Suspense` — e
confirmar o vermelho: o próprio `pnpm build` falha com
`blocking-prerender-dynamic`. Refazer (reverter o desfazer), confirmar
`pnpm test:e2e` → 12/12, e registrar o diferencial no rig
(§"Diferencial verificado", nova subseção para esta rota). Evidência extra
para a entrada de WALLS (opcional, sem commitar): trocar um card da landing de
`next/link` para link react-aria derruba o teste de navegação client-side.

**Verificar (gate do commit 4)**: `pnpm test:e2e` → **12/12** · baseline
apagada (`git status` sem spec temporário) · diferencial registrado no rig ·
CHECKLIST §6 atualizado no mesmo commit.

### Fase 5 — Reconciliação (commit 5)

- `plans/README.md`: linha do 011 → DONE; conferir que a linha do 009 está
  REJECTED (o advisor já a marcou ao escrever este plano) e que a nota do 007
  reflete a sobreposição (a home que o 007 retocaria não existe mais; metadata
  do root layout, `lang` e README continuam de lá).
- `README.md` da raiz: atualizar menções à home/template
  (`grep -in "create-next-app\|next.svg\|vercel.svg" README.md`) para
  descrever a home nova (catálogo do design system em `/`, itens em
  `/design-system/[item]`, sync via `pnpm --filter web sync:ds`).

**Verificar**: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e`
(12/12) verdes no estado final · `git log --oneline` mostra 5 commits na
branch.

## Plano de teste

- A guarda permanente são os specs `instant()`: os 6 existentes (intocados —
  o contrato `demo-link` prova que a home nova mantém a navegação instantânea
  para `/demo`) e os 6 novos da fase 4 (shell do catálogo no prerender das
  duas rotas novas; iframe corretamente fora do shell).
- O modelo estrutural é `apps/web/e2e/demo.instant.spec.ts`; o processo é o
  LOOP do rig (baseline descartável → vermelho → correção → diferencial).
- Não há teste unitário neste plano: a convenção de vitest é o plano 008; se o
  008 já estiver DONE ao executar, os três componentes de
  `apps/web/components/` ganham `*.test.tsx` no padrão de lá (senão, registrar
  como pendência na linha do 011 no `plans/README.md`).

## Critérios de done

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` → exit 0
- [ ] `pnpm test:e2e` → **12/12** (6 antigos + 6 novos)
- [ ] `/` responde com o catálogo (hero + grid); `apps/web/app/page.tsx` não
      existe mais
- [ ] `/design-system/preview` e `/design-system/button-example` renderizam
      preview ao vivo dentro do iframe
- [ ] `pnpm --filter web sync:ds` roda de novo sem diff além de timestamps
      inexistentes (rodar + `pnpm format` + `git status` → limpo, rede
      permitindo)
- [ ] `grep -rn "@remixicon" apps/web` → 0 · `grep -rn "alfa" apps/web/app` →
      0 (nenhum resto de branding/caminho do repo-fonte)
- [ ] Dark mode alterna de verdade (classe `.dark` no `<html>` + cores mudam)
- [ ] Diferencial da fase 4 registrado em `apps/web/instant-nav.rig.md`
- [ ] CHECKLIST.md com os 3 itens novos (§4 iframe/`instant = false`, §5
      RouterProvider, §6 spec sem par negativo) nos commits das fases 1/3/4
- [ ] Nenhum arquivo fora do escopo modificado (`git status` + diff da branch)
- [ ] Linha do 011 atualizada em `plans/README.md`

## Condições de STOP

- Checagem de drift falhou: 003 não está DONE, `C:\ngh\alfa-manager-web`
  ausente, ou working tree sujo.
- `sync:ds` falhou no `assertClean` ou as contagens divergiram muito de
  59 itens / 129 arquivos / ~139 ícones — o upstream do shadcn mudou de forma;
  **nunca afrouxar o assert**. (Fallback documentado, só com aval do operador:
  copiar `_generated/` do alfa e reescrever
  `@/app/(app)/design-system/_shims/` → `@/app/design-system/_shims/` — perde
  a regeneração limpa e mantém 2 substituições `rounded-none` já aplicadas lá.)
- Mais de ~5 nomes de ícone Tabler inexistentes na `^3.46.0` no typecheck da
  fase 2.
- O diff do `button.tsx` após o CLI da fase 1 perde a anatomia
  (cva/`buttonVariants`/react-aria/`data-slot`).
- `pnpm test:e2e` vermelho no gate da fase 1 (providers derrubaram shell do
  prerender — era a condição de STOP do antigo plano 009).
- O build recusar `view/[item]` mesmo com `instant = false` **e** o plano B do
  passo 3.5 também falhar.
- O contrato `demo-link` (teste 2 do `demo.instant.spec.ts`) vermelho após a
  fase 3 e não resolvível ajustando a landing — **editar o spec é proibido**.
- O `webServer` do Playwright (timeout 180s) estourar no build com as ~120
  páginas novas: a única mudança permitida é subir `webServer.timeout` no
  `playwright.config.ts` com comentário; se não bastar, STOP.

## Notas de manutenção

- **Atualizar o catálogo** = `pnpm --filter web sync:ds` + `pnpm format` +
  commit. O script é estrito de propósito: mudança de forma no upstream
  derruba a execução em vez de virar erro de build obscuro. Nunca editar
  `_generated/` à mão (os headers dos arquivos avisam).
- **Bump do pacote `shadcn`**: revalidar que `shadcn/tailwind.css` continua sem
  declarar `style-*`/`cn-font-heading` (hoje, 4.16.2, não declara) — se passar
  a declarar, remover as duas adições do passo 2.3.
- **Bump do `@tabler/icons-react`**: o `pnpm typecheck` acusa ícone renomeado
  (o `icons.ts` gerado importa nomeadamente).
- A rota `view/[item]` é a única fora da validação `instant` — revisor deve
  desconfiar de qualquer novo `instant = false` que não seja conteúdo de
  iframe.
- O catálogo é **público e indexável** (só a `view` tem `robots: noindex`) —
  mesmo comportamento do alfa; se este boilerplate virar produto, decidir se
  `/design-system` entra no robots.
- Sobreposição com o plano 007: metadata do root layout, `lang="en"` e o resto
  do README continuam sendo dele.
- Se o plano 008 (vitest) landar depois deste, os componentes de
  `apps/web/components/` deste plano devem ganhar testes na convenção de lá.
