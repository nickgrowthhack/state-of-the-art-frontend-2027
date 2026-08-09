Este projeto é um boilerplate de frontend que define um conjunto de convenções a ser seguido por quaisquer outros agentes que venham a interagir com este projeto. Enquanto o trabalho de outros agentes seria basicamente seguir essas convenções à risca, o seu é criar e documentar essas convenções, garantindo que elas façam sentido e estejam alinhadas com as melhores práticas atuais.

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
- **`apps/web/AGENTS.md` e `apps/web/CLAUDE.md` são gerados pelo `next dev`** (`agentRules: true` no `next.config.ts`) e ficam ao lado do app, não na raiz. São arquivos versionados: commite-os junto com o seu trabalho em vez de tentar removê-los.
- Cada workspace expõe os mesmos scripts (`lint`, `format`, `typecheck`, e `dev`/`build`/`start` onde faz sentido); o `turbo.json` da raiz é quem os orquestra. Um workspace novo que não expuser esses scripts simplesmente não participa de `pnpm lint` e `pnpm typecheck`.
