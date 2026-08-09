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

| Objetivo | Comando |
| --- | --- |
| Instalar dependências | `pnpm install` |
| Servidor de desenvolvimento | `pnpm dev` |
| Build de produção | `pnpm build` |
| Servir o build | `pnpm start` |
| Lint | `pnpm lint` |
| Adicionar dependência | `pnpm add <pkg>` |
| Adicionar dependência de desenvolvimento | `pnpm add -D <pkg>` |
| Executar um binário efêmero | `pnpm dlx <pkg>` (nunca `npx`) |

Em CI, use `pnpm install --frozen-lockfile`: ele falha se o lockfile estiver dessincronizado do `package.json`, em vez de corrigi-lo silenciosamente.

## Regras do `package.json`

- **Overrides vão em `pnpm.overrides`**, nunca no `overrides` de topo — este último é sintaxe do npm e o pnpm o ignora sem emitir aviso, fazendo os pins pararem de valer silenciosamente.
- **O `node_modules` usa o layout isolado padrão do pnpm.** Não adicione `node-linker=hoisted`: o isolamento é o que impede dependências fantasmas, ou seja, importar um pacote que você nunca declarou. Se um import quebrar por falta de hoisting, declare a dependência que falta — não afrouxe o layout.
- **O pnpm 10 bloqueia build scripts de dependências por padrão.** Quando um pacote realmente precisar rodar `postinstall`, adicione-o explicitamente, um a um, em `pnpm.onlyBuiltDependencies`. Nunca use `dangerouslyAllowAllBuilds`: executar script arbitrário de dependência transitiva na instalação é exatamente o vetor de ataque que esse bloqueio existe para fechar.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
