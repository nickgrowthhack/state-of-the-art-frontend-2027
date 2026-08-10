# Plan 009: Spike — vitrine do design system + dark mode de verdade

> **Instruções ao executor**: este é um plano de **spike**, não de construção
> completa: o entregável é um protótipo funcional MÍNIMO mais um registro de
> decisões e questões abertas. Siga os passos, rode as verificações, e onde o
> plano manda "investigar e registrar", escreva a resposta no arquivo de notas
> (passo 6) em vez de expandir o escopo. Condição de STOP vale como sempre:
> pare e reporte, não improvise. Ao terminar, atualize `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- apps/web/app apps/web/components packages/ui/src packages/ui/package.json apps/web/package.json`
> Este plano depende de 003 e 007 — se as linhas deles ainda estiverem TODO no
> `plans/README.md`, pare: a ordem importa (fontes e copy da home mudam aqui de
> novo se executado antes).

## Status

- **Prioridade**: P3
- **Esforço**: M (estimativa grossa — é spike)
- **Risco**: MED (toca o root layout; o e2e `instant()` é a rede)
- **Depende de**: `plans/003-fiacao-de-fontes.md`, `plans/007-branding-e-readme.md`
- **Categoria**: direction (spike)
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

O repo mantém um design system (`@workspace/ui`: Button/LinkButton sobre
react-aria-components, estilo aria-lyra, tokens completos de light/dark) que o
app **nunca demonstra**: os únicos imports do pacote são o CSS e o `cn()`; a
home hand-rolla botões com Tailwind cru. Pior: o `globals.css` declara dark
mode por classe (`@custom-variant dark (&:is(.dark *))`) e tem a paleta `.dark`
inteira — mas **nada no repo põe a classe `.dark` em lugar nenhum**. Todos os
`dark:` do app são código morto; usuário com o sistema em dark mode recebe
light. Para um boilerplate cujo produto é convenção, a divisão
design-system ↔ app que o AGENTS.md codifica não tem exemplo vivo.

## Estado atual

- `packages/ui/src/components/button.tsx` — exporta `Button`, `LinkButton`
  (sobre `ButtonPrimitive`/`LinkPrimitive` do react-aria-components) e
  `buttonVariants` (cva). `LinkButton` renderiza um `<a>` do react-aria — **sem
  integração com o router do Next** (ver questão aberta Q1).
- `packages/ui/src/styles/globals.css:5` — `@custom-variant dark (&:is(.dark *))`;
  paleta `.dark` nas linhas 45–77.
- Grep de `@workspace/ui` em `apps/web/*.{ts,tsx}`: só `globals.css` (layout) e
  `lib/utils` (layout). Zero componentes.
- Sem `next-themes` (nem qualquer theming) em nenhum manifest.
- Divisão codificada nos dois `components.json` (AGENTS.md): componente de
  design system → `packages/ui`; composição específica do app →
  `apps/web/components` (alias `components` → `@/components`).
- Regras de renderização do AGENTS.md que este spike NÃO pode violar:
  o elemento de LCP fica fora de todo boundary; o shell estático pinta
  imediatamente; estado de componente sobrevive à navegação (`<Activity>`).
- Contrato e2e: `pnpm test:e2e` → 6/6, incluindo shells visíveis sob o lock de
  `instant()` — qualquer provider no root layout que atrase o primeiro paint
  quebra isso visivelmente.

## Questões abertas que o spike deve responder (registrar no passo 6)

- **Q1 — Navegação com LinkButton**: o `LinkPrimitive` do react-aria renderiza
  `<a href>` sem client-side routing do Next → navegação dura, sem prefetch,
  matando a instantaneidade. Caminhos: (a) envolver o app em `RouterProvider`
  do react-aria plugado no `useRouter` do Next (o caminho "aria-lyra completo";
  exige client component no layout — medir efeito no shell), ou (b) usar
  `<Link>` do Next com `className={cn(buttonVariants({...}))}` e reservar
  `LinkButton` para links externos. O spike prototipa os dois e recomenda um.
- **Q2 — Onde vive o ThemeProvider**: `next-themes` exige client component e
  `suppressHydrationWarning` no `<html>`. Verificar com o e2e `instant()` que o
  provider não tira nada do shell (children de client component continuam RSC —
  a expectativa é que não tire; provar, não supor).
- **Q3 — Toggle**: componente de design system (`packages/ui`, genérico) com o
  estado vindo do app, ou composição do app (`apps/web/components`)? A divisão
  do AGENTS.md sugere: primitivo visual na ui, wiring do next-themes no app.
- **Q4 — FOUC/persistência**: `next-themes` com `attribute="class"` e
  `defaultTheme="system"` — conferir ausência de flash em hard load nos dois
  temas (dev tools → emular `prefers-color-scheme`).

## Comandos necessários

| Propósito | Comando          | Esperado no sucesso |
|-----------|------------------|---------------------|
| Instalar  | `pnpm install`   | exit 0              |
| Types     | `pnpm typecheck` | exit 0              |
| Build     | `pnpm build`     | exit 0              |
| E2E       | `pnpm test:e2e`  | 6 testes passam     |
| Dev       | `pnpm dev`       | serve em :3000      |

Skills úteis se disponíveis no ambiente: `next-dev-loop` (verificar runtime),
`agent-browser` (dirigir o browser para Q4), `shadcn` (padrões de composição),
`vercel-react-best-practices` (regras de client/server).

## Escopo

**Em escopo** (protótipo mínimo):

- `apps/web/app/page.tsx` e `apps/web/app/layout.tsx`
- `apps/web/components/` (novo: theme-provider e afins — composição do app)
- `packages/ui/src/components/` (novo: toggle de tema, SE Q3 concluir que é ui)
- `apps/web/package.json` (`next-themes` via `pnpm --filter web add`)
- `plans/009-notas-spike-vitrine.md` (novo — o registro do spike)

**Fora de escopo**:

- Adicionar componentes shadcn em massa — só o que a home/toggle precisar.
- Refazer as páginas `/demo` — elas são a demo de navegação, não de UI.
- Mudar tokens/paleta do `globals.css`.
- Resolver Q1 "definitivamente" para o design system inteiro — o spike
  recomenda; a adoção ampla é plano futuro.

## Fluxo de git

- Branch: `advisor/009-spike-vitrine`
- Commits pequenos por etapa (`feat: ...`, `docs: ...`). NÃO fazer push nem PR
  sem instrução do operador.

## Passos

### Passo 1: dark mode funcional

`pnpm --filter web add next-themes`. Criar
`apps/web/components/theme-provider.tsx` (client) envolvendo `children` com
`ThemeProvider attribute="class" defaultTheme="system" enableSystem`; usar no
`layout.tsx` com `suppressHydrationWarning` no `<html>`.

**Verificar**: `pnpm build` → exit 0; `pnpm test:e2e` → 6/6 (Q2 respondida na
prática: se algum shell sumir do prerender, o `instant()` acusa — registre o
resultado).

### Passo 2: toggle de tema

Conforme Q3: prototipar o primitivo visual (um `Button` variant ghost/icon já
existente serve de base) e o wiring `useTheme()` no app. Colocar o toggle na
home.

**Verificar**: `pnpm dev` + browser — alternar light/dark/system muda a classe
no `<html>` e as cores da página inteira (tokens `.dark` aplicam).

### Passo 3: home com o design system

Recompor os CTAs da home (`page.tsx`) usando o caminho (a) OU (b) da Q1 — o
que estiver sendo testado primeiro — mantendo os requisitos duros do plano 007:
`data-testid="demo-link"`, destino `/demo`, prefetch funcionando, página 100%
estática.

**Verificar**: `pnpm test:e2e` → 6/6. Este é o teste decisivo da Q1: com o
caminho (a) sem RouterProvider ou com `<a>` cru, o teste de navegação
client-side da home FALHA (sem prefetch não há shell instantâneo) — um vermelho
aqui é dado do spike, não desastre; registre e teste o outro caminho.

### Passo 4: provar o outro caminho da Q1

Implementar a alternativa não escolhida no passo 3 em cima do mesmo protótipo
(pode ser em commit descartável), rodar o mesmo e2e, registrar o comparativo.
Ficar com o caminho vencedor no protótipo final.

### Passo 5: Q4 — FOUC

Com `pnpm dev` e o browser: hard reload com `prefers-color-scheme: dark`
emulado; observar flash de tema. Registrar (screenshot/descrição).

### Passo 6: registro do spike

Escrever `plans/009-notas-spike-vitrine.md`: decisão de Q1–Q4 com evidência
(qual e2e passou/falhou em cada caminho), o que ficou no protótipo, e a lista
do que um plano de adoção completa precisaria cobrir (ex.: RouterProvider
global, testes `*.test.tsx` dos componentes novos — convenção do plano 008,
dark mode nas páginas demo).

**Verificar**: arquivo existe; `pnpm typecheck`, `pnpm lint`, `pnpm build`,
`pnpm test:e2e` todos verdes no estado final do protótipo.

## Plano de teste

O e2e `instant()` existente é o harness do spike (é ele que responde Q1/Q2 com
evidência). Componentes novos em `packages/ui` ganham `*.test.tsx` no padrão do
plano 008 SE o 008 já tiver landado; senão, registrar como pendência nas notas.

## Critérios de done

- [ ] Dark mode alterna de verdade (classe no `<html>` + cores mudam)
- [ ] Home usa componentes/variants de `@workspace/ui` nos CTAs
- [ ] `pnpm test:e2e` → 6/6 no estado final
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` → exit 0
- [ ] `plans/009-notas-spike-vitrine.md` responde Q1–Q4 com evidência
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- Os planos 003/007 não landaram (checagem de drift) — a ordem importa.
- O e2e ficar vermelho nos DOIS caminhos da Q1 — registre os dois vermelhos e
  pare; o problema é mais fundo que o spike.
- Q2 der negativo (provider derruba shells do prerender) e não houver
  posicionamento alternativo do provider que resolva em uma tentativa —
  registrar e parar; vira questão de arquitetura para o maintainer.
- Precisar tocar em `packages/ui/src/styles/globals.css` além de nada — tokens
  são fora de escopo.

## Notas de manutenção

- O resultado durável deste spike são as **notas** e o protótipo mínimo — a
  adoção completa (todos os CTAs do app, RouterProvider global se for o caso)
  é um plano futuro que nasce das notas.
- Se a recomendação da Q1 for `buttonVariants` + `<Link>` do Next, o
  `LinkButton` do design system deve ganhar um comentário orientando quando
  usá-lo (links externos) — senão o próximo dev repete a investigação.
