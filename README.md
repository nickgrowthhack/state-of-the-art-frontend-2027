# state-of-the-art-frontend-2027

Confesso ter bastante ciúmes desta estrutura organizacional e estou, na verdade, torcendo para que não muitos a vejam e a compartilhem. De fato, não vou expor aqui completamente a engenharia e a arquitetura de frontend dos meus projetos; apenas uma parte dela, mas talvez entregando pistas o suficiente para alguém decompilar ela por completo. Seja como for, o objetivo aqui é manter um repositório público que reflita, na minha opinião e experiência particular, as melhores práticas para desenvolvimento web em 2027.

Dito isso, se você está lendo isso, a essa altura, já devo ter publicado um post no meu blog pessoal, a título de "O frontend que eu monto quando nenhum endemoniado está discordando de mim". Este título não foi inspirado em nenhuma experiência pessoal em que quis matar outro desenvolvedor que ainda trabalha comigo.

## Stacks

- **Next.js** `16.3.0` — App Router, React Server Components por padrão
- **React** `19.2.8` e **React DOM** `19.2.8`
- **TypeScript** `5.9.3` — modo `strict`, `moduleResolution: bundler`, alias `@/*`
- **Tailwind CSS** `4.3.3` — configuração CSS-first via `@theme inline` em [app/globals.css](app/globals.css); não existe `tailwind.config.*`
- **@tailwindcss/postcss** `4.3.3` — único plugin do [postcss.config.mjs](postcss.config.mjs)
- **Turbopack** — bundler padrão do Next.js 16, em dev e em build (sem opt-in)
- **next/font** — **Geist** e **Geist Mono** auto-hospedadas, expostas como `--font-geist-sans` / `--font-geist-mono` em [app/layout.tsx](app/layout.tsx)
- **next/image** — otimização de imagens, usado em [app/page.tsx](app/page.tsx)
- **ESLint** `9.39.5` — flat config em [eslint.config.mjs](eslint.config.mjs)
- **eslint-config-next** `16.3.0` — presets `core-web-vitals` + `typescript`
- **@types/react** `19.2.18` e **@types/react-dom** `19.2.4` — fixados via `pnpm.overrides` no `package.json`
- **@types/node** `20.19.43`
- **pnpm** `10.22.0` — `pnpm-lock.yaml` (lockfile v9) é o único lockfile do repo; a versão é fixada pelo campo `packageManager` e o `preinstall` bloqueia npm/yarn/bun

## Skills

As skills vivem em [.agents/skills/](.agents/skills/) e são versionadas junto com o código. O [skills-lock.json](skills-lock.json) fixa, para cada uma, a origem no GitHub (`vercel/next.js`, `vercel-labs/agent-browser`, `vercel-labs/agent-skills`, `shadcn/improve`), o caminho de origem e o hash do conteúdo — é um lockfile, e serve para o mesmo propósito: a instrução que o agente recebe precisa ser reproduzível e aparecer no diff quando muda. O `.claude/skills/` é apenas o espelho gerado para o Claude Code consumir; não é versionado.

### next-cache-components-adoption

**O que faz:** liga a flag `cacheComponents` e conduz o app até o build passar, resolvendo cada rota que se torna bloqueante — decidindo, caso a caso, entre corrigir a rota (`"use cache"`, `cacheLife`, `<Suspense>`) ou optar por fora com `export const instant = false`.

**Por que está aqui:** Cache Components é o modelo de cache do Next 16, e a migração é mecânica e volumosa. O trabalho é sequenciamento e disciplina, não criatividade — exatamente o tipo de coisa que se delega.

### next-partial-prefetching-adoption

**O que faz:** liga `partialPrefetching`, opta rotas com `export const prefetch = 'partial'`, audita as chamadas de `<Link prefetch={true}>` e resolve os insights `link-prefetch-partial` e `instant-shell-url-data`.

**Por que está aqui:** esses insights só aparecem no overlay do `next dev` e nada disso quebra o build. Sem alguém percorrendo o app deliberadamente, a regressão passa despercebida até chegar em produção.

### next-cache-components-optimizer

**O que faz:** leva uma rota a navegação instantânea sob Cache Components/PPR, codificando a meta como um teste `@next/playwright` `instant()` que começa falhando e trabalhando até passar. O teste fica no repositório como guarda de regressão.

**Por que está aqui:** transforma performance de opinião em critério verificável e versionado — o "é testável" do [AGENTS.md](AGENTS.md) aplicado a navegação. Requer Next.js 16.3+, que é o que este projeto usa.

### vercel-react-best-practices

**O que faz:** 70 regras da Vercel Engineering em 8 categorias ordenadas por impacto — waterfalls e bundle size como CRITICAL; server-side, client-side, re-render, rendering e JS abaixo disso — consultadas ao escrever, revisar ou refatorar React e Next.

**Por que está aqui:** é o padrão de qualidade escrito que substitui o gosto pessoal em code review. Sem ele, "componente performático" é discussão; com ele, é regra citável.

### next-dev-loop

**O que faz:** define o ritmo editar → verificar durante o `next dev`, cruzando duas visões do mesmo app rodando: o `/_next/mcp` (rotas, segmentos, RSC, erros do servidor) e o browser de verdade.

**Por que está aqui:** compilar e passar no type-check não é prova de que a página funciona. Essa skill fecha a lacuna entre "buildou" e "funciona".

### agent-browser

**O que faz:** CLI de automação de browser via CDP, com snapshots da árvore de acessibilidade e refs compactas `@eN` — navegar, preencher formulário, clicar, capturar tela, extrair dados, testar.

**Por que está aqui:** é o braço executor das duas skills acima — tanto o `next-dev-loop` quanto o optimizer dependem de dirigir um browser real — e o caminho preferencial para automação de browser, no lugar das ferramentas embutidas do agente.

### improve

**O que faz:** audita o repositório como um consultor sênior: reconhecimento, varredura por categoria (correção, segurança, performance, cobertura de testes, dívida técnica, dependências, DX, docs e direção de produto), vetagem das descobertas e, ao final, planos de implementação numerados em `plans/` — auto-contidos o bastante para um modelo mais barato, sem nenhum contexto da sessão, executar. É estritamente read-only sobre o código-fonte: nunca edita, corrige ou refatora nada por conta própria.

**Por que está aqui:** separa julgar de executar. O modelo caro faz a parte em que inteligência compõe — entender, priorizar, especificar — e o barato executa. Num boilerplate cujo produto é a convenção, isso significa que "melhorar o projeto" vira um plano revisável em diff, e não uma leva de commits improvisados. É também a única skill do conjunto que não é específica de Next.js: ela serve para decidir o que fazer, não como fazer.

## Getting Started

Install the dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
