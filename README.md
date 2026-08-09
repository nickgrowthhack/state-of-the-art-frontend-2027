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

As skills vivem em [.agents/skills/](.agents/skills/) e são fixadas por [skills-lock.json](skills-lock.json): `agent-browser`, `improve`, `next-cache-components-adoption`, `next-cache-components-optimizer`, `next-dev-loop`, `next-partial-prefetching-adoption`, `vercel-react-best-practices`.

O que cada uma faz e por que está aqui: [SKILLS.md](SKILLS.md).

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
