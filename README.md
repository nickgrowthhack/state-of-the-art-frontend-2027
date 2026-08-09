# state-of-the-art-frontend-2027

Confesso ter bastante ciúmes desta estrutura organizacional e estou, na verdade, torcendo para que não muitos a vejam e a compartilhem. De fato, não vou expor aqui completamente a engenharia e a arquitetura de frontend dos meus projetos; apenas uma parte dela, mas talvez entregando pistas o suficiente para alguém decompilar ela por completo. Seja como for, o objetivo aqui é manter um repositório público que reflita, na minha opinião e experiência particular, as melhores práticas para desenvolvimento web em 2027.

Dito isso, se você está lendo isso, a essa altura, já devo ter publicado um post no meu blog pessoal, a título de "O frontend que eu monto quando nenhum endemoniado está discordando de mim". Este título não foi inspirado em nenhuma experiência pessoal em que quis matar outro desenvolvedor que ainda trabalha comigo.

## Estrutura

Monorepo pnpm + Turborepo, no layout que o `shadcn init --monorepo` espera:

```
.
├── apps/
│   └── web/                    # o app Next.js
└── packages/
    ├── ui/                     # @workspace/ui — design system e a única folha de estilo
    ├── eslint-config/          # @workspace/eslint-config
    └── typescript-config/      # @workspace/typescript-config
```

As regras que valem para mexer aqui — o que mora em qual workspace, por que o `exports` de `@workspace/ui` é infraestrutura e como adicionar dependência sem errar o `package.json` — estão no [AGENTS.md](AGENTS.md).

## Stacks

- **Next.js** `16.3.0` — App Router, React Server Components por padrão, em [apps/web](apps/web)
- **React** `19.2.8` e **React DOM** `19.2.8`
- **Turborepo** `2.10.9` — orquestra `dev`, `build`, `start`, `lint`, `format` e `typecheck` pelos workspaces via [turbo.json](turbo.json)
- **TypeScript** `5.9.3` — modo `strict` e `noUncheckedIndexedAccess`, presets compartilhados em [packages/typescript-config/](packages/typescript-config/); alias `@/*` no app e `@workspace/ui/*` para o design system
- **Tailwind CSS** `4.3.3` — configuração CSS-first, sem `tailwind.config.*`; folha única em [packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css), consumida pelo app como `@workspace/ui/globals.css`
- **@tailwindcss/postcss** `4.3.3` — único plugin do [packages/ui/postcss.config.mjs](packages/ui/postcss.config.mjs), que [apps/web/postcss.config.mjs](apps/web/postcss.config.mjs) re-exporta
- **Turbopack** — bundler padrão do Next.js 16, em dev e em build (sem opt-in)
- **next/font** — **Geist** e **Geist Mono** auto-hospedadas, expostas como `--font-geist-sans` / `--font-geist-mono` em [apps/web/app/layout.tsx](apps/web/app/layout.tsx)
- **next/image** — otimização de imagens, usado em [apps/web/app/page.tsx](apps/web/app/page.tsx)
- **ESLint** `9.39.5` — flat config; cada workspace importa o preset que lhe cabe de [packages/eslint-config/](packages/eslint-config/)
- **eslint-config-next** `16.3.0` — presets `core-web-vitals` + `typescript`, base do `@workspace/eslint-config/next-js`
- **typescript-eslint** `8.65.0`, **eslint-config-prettier** e **eslint-plugin-turbo** — base compartilhada do `@workspace/eslint-config/base`
- **Prettier** `3.9.6` com **prettier-plugin-tailwindcss** `0.8.1` — ordenação de classes ancorada no `globals.css` de `@workspace/ui`
- **clsx** `2.1.1` e **tailwind-merge** `3.6.0` — sustentam o `cn()` em [packages/ui/src/lib/utils.ts](packages/ui/src/lib/utils.ts)
- **@types/react** `19.2.18` e **@types/react-dom** `19.2.4` — fixados via `pnpm.overrides` no `package.json` da raiz
- **@types/node** `20.19.43`
- **pnpm** `10.22.0` — workspaces declarados em [pnpm-workspace.yaml](pnpm-workspace.yaml); `pnpm-lock.yaml` é o único lockfile do repo, a versão é fixada pelo campo `packageManager` e o `preinstall` bloqueia npm/yarn/bun

## Skills

As skills vivem em [.agents/skills/](.agents/skills/) e são fixadas por [skills-lock.json](skills-lock.json): `agent-browser`, `improve`, `next-cache-components-adoption`, `next-cache-components-optimizer`, `next-dev-loop`, `next-partial-prefetching-adoption`, `vercel-react-best-practices`.

O que cada uma faz e por que está aqui: [SKILLS.md](SKILLS.md).

## Getting Started

Install the dependencies and start the development server — both from the repository root:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `apps/web/app/page.tsx`. The page auto-updates as you edit the file. Shared components live in `packages/ui/src/components` and are imported as `@workspace/ui/components/<name>`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
