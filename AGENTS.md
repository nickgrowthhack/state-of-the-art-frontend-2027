Este projeto é um boilerplate de frontend que define um conjunto de convenções a ser seguido por quaisquer outros agentes que venham a interagir com este projeto. Enquanto o trabalho de outros agentes seria basicamente seguir essas convenções à risca, o seu é criar e documentar essas convenções, garantindo que elas façam sentido e estejam alinhadas com as melhores práticas de desenvolvimento web para 2026.

Dito isso, vamos primeiro definir o que é um "código perfeito" para nós:

Um "código perfeito" é aquele que:

1. É elegante
2. É simples
3. É manutenível
4. É testável
5. É escalável
6. É seguro

Um "código imperfeito" é aquele que:

1. É complexo
2. É difícil de entender
3. É difícil de manter
4. É difícil de testar
5. É difícil de escalar
6. Não é seguro

Um "código perfeito" é aquele que pode ser entendido por um iniciante em poucas horas. Um "código imperfeito" é aquele que mesmo um especialista leva semanas para entender.

As convenções deste arquivo estão espelhadas como itens verificáveis em [CHECKLIST.md](CHECKLIST.md), organizado por fluxo de trabalho. **Toda convenção nova entra no CHECKLIST.md no mesmo commit que a estabelece.**

# Gerenciador de pacotes

**pnpm é o único gerenciador de pacotes deste projeto.** `pnpm-lock.yaml` é o único lockfile e vai sempre versionado. Nunca use `npm`, `yarn` ou `bun` — o script `preinstall` aborta a instalação se você tentar, e um `package-lock.json` ou `yarn.lock` no diff é sempre um erro.

A versão do pnpm vem do campo `packageManager` no `package.json`. O pnpm 10 se auto-alinha a essa versão sozinho, então basta ter qualquer pnpm 10 instalado — não instale uma versão específica à mão nem use Corepack.

## Comandos canônicos

Todos os comandos abaixo rodam **na raiz do repositório**. Os que agem sobre código são tasks do Turborepo, que as distribui para os workspaces.

| Objetivo | Comando |
| --- | --- |
| Instalar dependências | `pnpm install` |
| Servidor de desenvolvimento | `pnpm dev` |
| Build de produção | `pnpm build` |
| Servir o build | `pnpm start` |
| Lint | `pnpm lint` |
| Checagem de tipos | `pnpm typecheck` |
| Formatação | `pnpm format` |
| Testes end-to-end | `pnpm test:e2e` |
| Adicionar dependência a um workspace | `pnpm --filter <workspace> add <pkg>` |
| Adicionar dependência de desenvolvimento a um workspace | `pnpm --filter <workspace> add -D <pkg>` |
| Adicionar ferramenta de repositório (raiz) | `pnpm add -Dw <pkg>` |
| Executar um binário efêmero | `pnpm dlx <pkg>` (nunca `npx`) |

**Dependência de app ou de biblioteca nunca vai para a raiz.** Um `pnpm add` sem `--filter` na raiz de um workspace falha (o pnpm exige `-w` explícito), e é exatamente essa fricção que impede uma dependência de `apps/web` de acabar no `package.json` errado. A raiz só hospeda ferramenta de repositório: turbo, prettier e os pacotes `@workspace/*`.

Em CI, use `pnpm install --frozen-lockfile`: ele falha se o lockfile estiver dessincronizado do `package.json`, em vez de corrigi-lo silenciosamente.

## Regras do `package.json`

- **Overrides vão em `pnpm.overrides`**, nunca no `overrides` de topo — este último é sintaxe do npm e o pnpm o ignora sem emitir aviso, fazendo os pins pararem de valer silenciosamente.
- **O `node_modules` usa o layout isolado padrão do pnpm.** Não adicione `node-linker=hoisted`: o isolamento é o que impede dependências fantasmas, ou seja, importar um pacote que você nunca declarou. Se um import quebrar por falta de hoisting, declare a dependência que falta — não afrouxe o layout.
- **O pnpm 10 bloqueia build scripts de dependências por padrão.** Quando um pacote realmente precisar rodar `postinstall`, adicione-o explicitamente, um a um, em `pnpm.onlyBuiltDependencies`. Nunca use `dangerouslyAllowAllBuilds`: executar script arbitrário de dependência transitiva na instalação é exatamente o vetor de ataque que esse bloqueio existe para fechar.
- **`pnpm.overrides` e `pnpm.onlyBuiltDependencies` só valem no `package.json` da raiz.** O pnpm ignora ambos em `package.json` de workspace, sem avisar. Se um pin precisa valer para todo mundo, ele mora na raiz.
- **Não use o bloco `allowBuilds:` do `pnpm-workspace.yaml`.** É uma alternativa ao `pnpm.onlyBuiltDependencies` e ter as duas listas significa ter duas fontes de verdade. Este repositório usa a do `package.json`.

# Estrutura do monorepo

O repositório é um monorepo pnpm + Turborepo no layout do template `next-monorepo` do shadcn, que é o layout que o `shadcn init --monorepo` espera encontrar:

```
.
├── apps/
│   └── web/                    # o app Next.js — components.json próprio
└── packages/
    ├── ui/                     # @workspace/ui — design system, dono do globals.css
    ├── eslint-config/          # @workspace/eslint-config — base, next-js, react-internal
    └── typescript-config/      # @workspace/typescript-config — base, nextjs, react-library
```

- **`packages/ui` é o dono do CSS.** `packages/ui/src/styles/globals.css` é a única folha de estilo do repositório; `apps/web` a consome via `import "@workspace/ui/globals.css"` e re-exporta o PostCSS do pacote. Não crie um `globals.css` dentro de `apps/web`.
- **O campo `exports` do `packages/ui/package.json` é infraestrutura, não conveniência.** É por ele que `@workspace/ui/components/*`, `@workspace/ui/lib/*` e `@workspace/ui/hooks/*` resolvem — tanto para o bundler quanto para o CLI do shadcn, que lê esse mapa para descobrir onde escrever cada arquivo. Mexer nele quebra os dois.
- **Componentes de design system vão em `packages/ui`; composições específicas do app vão em `apps/web/components`.** É essa a divisão que os dois `components.json` codificam: no do app, o alias `ui` aponta para `@workspace/ui/components` e o alias `components` aponta para `@/components`.
- **`apps/web/AGENTS.md` e `apps/web/CLAUDE.md` são gerados pelo `next dev`** (`agentRules: true` no `next.config.ts`) e ficam ao lado do app, não na raiz. O "project root" da doc do Next é a raiz do **app**: o `AGENTS.md` da raiz do monorepo nunca é tocado. São arquivos versionados: commite-os junto com o seu trabalho em vez de tentar removê-los. A geração depende de o `next dev` enxergar as variáveis de detecção de agente (`AI_AGENT`, `CLAUDECODE` etc.) — a task `dev` do `turbo.json` faz o `passThroughEnv` delas, e removê-lo desliga a geração silenciosamente ao rodar pela raiz. E quando o bloco gerenciado já está atual, o `next dev` não escreve nem loga nada: silêncio é o estado saudável, não um defeito.
- Cada workspace expõe os mesmos scripts (`lint`, `format`, `typecheck`, e `dev`/`build`/`start` onde faz sentido); o `turbo.json` da raiz é quem os orquestra. Um workspace novo que não expuser esses scripts simplesmente não participa de `pnpm lint` e `pnpm typecheck`.
- **Em app Next, `typecheck` é `next typegen && tsc --noEmit`.** `PageProps`, `LayoutProps` e `RouteContext` não são tipos importáveis: são globais que o Next gera em `.next/types`. Só o `tsc` sozinho encontra esses globais quando um `next dev` ou `next build` anterior já deixou o diretório para trás — ou seja, passa na máquina de quem programa e falha com `TS2304: Cannot find name 'PageProps'` em qualquer clone frio, que é exatamente o caso do CI. O `next typegen` gera os tipos sem buildar e sai com código diferente de zero em falha, então o `&&` interrompe. Isso é o que mantém o passo de `typecheck` independente da ordem do pipeline.

# Tipografia e preset do design system

O preset canônico do design system é **`b3uv3ZyQIE`**. A verificação é de ida-e-volta: `pnpm dlx shadcn@latest preset resolve -c apps/web --json` e `pnpm dlx shadcn@latest preset resolve -c packages/ui --json` devem retornar exatamente esse código **com `fallbacks: []`**. Um item em `fallbacks` significa que o resolvedor não detectou aquele valor no projeto e caiu no default do style — o código pode até coincidir por sorte, mas isso não é detecção, é acaso.

A fiação de fontes que sustenta esse ciclo tem três camadas, cada uma com um papel:

- **O app define.** `apps/web/app/layout.tsx` carrega as fontes via `next/font` com os nomes canônicos `--font-sans`, `--font-mono` e `--font-heading`, e aplica a classe `font-sans` no `<html>`. O resolvedor do shadcn descarta qualquer variável fora do conjunto `--font-sans`/`--font-serif`/`--font-mono`/`--font-heading` — foi o drift para `--font-geist-*` (padrão do create-next-app) que quebrou tanto o preset quanto a renderização da Geist.
- **O tema consome.** O `@theme inline` do `globals.css` mapeia token → variável de runtime (`--font-sans: var(--font-sans)` etc.). Nunca coloque font-family literal aí: com `inline`, o valor congela dentro das utilities e o next/font perde a vez.
- **Os fallbacks literais** (`"Geist"`, `"Geist Mono"`) vivem em `@layer base { :root }` do `globals.css`. São eles que o `preset resolve` lê em `packages/ui` — workspace sem layout para varrer — e o que vale para consumidores fora do Next; é o mesmo padrão que o próprio shadcn gera em projetos CSS-only. Dentro do app, as declarações do next/font vencem por serem sem camada (unlayered ganha de `@layer`, independentemente de ordem e especificidade).

`shadcn apply --preset` **não conserta** drift de nome de variável — ele reformata o que reconhece e ignora o resto (verificado). Se o `resolve` divergir do código canônico, a correção é manual, nesta fiação.

# Renderização

**`cacheComponents` está ligado** no `apps/web/next.config.ts`. A regra que sai disso é uma só: *o que é estático pinta imediatamente; o que depende do request fica abaixo de um `<Suspense>`.* A parte prerenderizada de uma rota é o **shell estático** — é ela que entra no prefetch e aparece antes de qualquer resposta do servidor.

Antes de escrever código de rota, leia o guia correspondente em `apps/web/node_modules/next/dist/docs/`. Esta versão do Next mudou o suficiente para que a memória do modelo esteja errada em pontos que o build não pega.

- **Nunca exporte `dynamic`, `revalidate` ou `fetchCache`.** Com `cacheComponents` ligado eles são erro, não aviso. O substituto de `revalidate` é `cacheLife`; `dynamic = 'force-dynamic'` e `fetchCache` simplesmente deixam de existir. `experimental_ppr` também foi removido — PPR é implícito.
- **Todo `"use cache"` declara um `cacheLife` explícito.** Sem ele, aninhar um cache de vida curta abaixo do escopo derruba o prerender. E **nunca use o perfil `"seconds"` em algo que deva estar no shell**: `stale` abaixo de 30 segundos é excluído do prerender, porque um prefetch expiraria antes de o usuário clicar. Esse é o erro mais silencioso da lista — ele não parece um erro de cache, parece uma rota que ficou lenta.
- **Use `io()`, não `connection()`.** Para valores não determinísticos (`new Date()`, `Math.random()`, `crypto.randomUUID()`), `await io()` de `next/cache` marca onde a leitura começa. `connection()` também tira o conteúdo do shell, mas fica suspenso até uma navegação real chegar ao servidor, então **bloqueia o prefetch**. Só use `connection()` quando renderizar realmente precisar esperar um request de verdade.
- **`params` e `searchParams` descem como promise para dentro do boundary.** Nunca faça `await params` no topo da página. Vale **mesmo quando todos os valores estão em `generateStaticParams`**: um param conhecido ainda pertence a uma única URL, e lê-lo acima do boundary amarra o shell compartilhado a ela.
- **`generateStaticParams` nunca retorna lista vazia.** Isso era o padrão antes do Next 16 e agora é erro: o Next precisa de ao menos um param para prerenderizar a rota e validar que ela produz um shell.
- **O elemento de LCP fica fora de todo boundary.** Um boundary alto demais — no layout raiz, por exemplo — passa na validação e ainda assim entrega uma tela em branco.
- **Estado de componente sobrevive à navegação.** O Next passou a usar `<Activity mode="hidden">` no client-side, então `useState`, campos de formulário e posição de scroll persistem ao sair e voltar. Padrões que contavam com desmontagem para resetar estado quebram silenciosamente.

## Prefetch parcial

**`partialPrefetching` está ligado**, e depende de `cacheComponents` — sem ele o `next dev` e o `next build` falham na validação da config. Um `<Link>` passa a carregar um **App Shell compartilhado por rota**, reaproveitado por todos os links que apontam para ela, em vez de um prefetch por link visível.

- **`prefetch` é configuração do destino, não do link.** Ele vai como `export const prefetch` no `page.tsx`/`layout.tsx` de destino. É o engano mais comum.
- **Não escreva `export const prefetch = 'partial'`.** Com a flag ligada isso é redundante. E `'auto'` é o default — escrevê-lo explicitamente é ruído. O único valor que se escreve aqui é `'force-disabled'`, e com justificativa.
- **`<Link prefetch={true}>` exige justificativa.** Ele custa uma invocação de servidor por link prefetchável. O default já entrega o shell.

# Testes

**O teste `instant()` é a guarda de navegação deste repositório.** Ele trava a resposta do servidor durante o callback: o que estiver visível ali dentro veio do shell estático. Toda rota que deve ser instantânea entrega um — em `apps/web/e2e/`, junto do exemplo em `demo.instant.spec.ts`.

O contrato de como buildar, expor e medir vive em [apps/web/instant-nav.rig.md](apps/web/instant-nav.rig.md). Leia antes de escrever o primeiro spec de uma rota nova.

- **`instant()` é uma régua, não um cronômetro.** Sem timeout customizado, sem retry, sem medir tempo. `retries: 0` no `playwright.config.ts` é intencional: um teste que só passa na segunda tentativa está medindo latência, não estrutura.
- **A asserção negativa é o que dá valor ao teste.** Dentro do lock, o conteúdo diferido tem que ter `toHaveCount(0)`; fora dele, tem que estar visível. Sem esse par, o spec passa por vazio.
- **Rode o diferencial antes de commitar.** Desfaça a correção, confirme o vermelho, refaça. É o único jeito de saber que o teste guarda alguma coisa.
- **`NEXT_E2E` jamais é definido em produção.** É ele que liga `experimental.exposeTestingApiInProductionBuild`. Sem a variável o testing API não é exposto — e `instant()` **não lança erro** nesse caso, ele passa por vazio. Um verde em ambiente sem a flag não significa nada.
- **Nunca meça contra `next dev`.** O Next não faz prefetch em desenvolvimento; a navegação client-side não teria o que medir. O `webServer` do Playwright já faz o build de produção sozinho.

## Insights de desenvolvimento

Parte da validação só existe em `next dev` e não falha o build: leituras de URL alto demais na árvore (`instant-shell-url-data`) e shells que ficam vazios aparecem no log do dev server e na aba Insights do overlay. Precisa de navegador de verdade em rotas concretas — `curl` e `next build` não disparam.

Se aparecer erro de validação de `instant` em **todas** as rotas, inclusive nas que você não tocou, suspeite primeiro do dev server: um processo que ficou de pé atravessando mudança de `next.config.ts` acumula estado degradado. Reinicie antes de investigar o código.
