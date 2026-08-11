# Plan 003: Consertar a fiação de fontes — Geist Sans nunca renderiza

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- apps/web/app/layout.tsx packages/ui/src/styles/globals.css README.md`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P1
- **Esforço**: S
- **Risco**: LOW
- **Depende de**: nenhum
- **Categoria**: bug
- **Planejado em**: commit `3870aff`, 2026-08-10
- **DONE em 2026-08-11**, a pedido direto do operador, junto com a correção do
  preset `b3uv3ZyQIE` (os dois `preset resolve` divergiam do código canônico
  pela mesma causa raiz). A execução seguiu o **formato canônico do scaffold do
  shadcn** em vez dos passos 2–3 deste plano: **3** instâncias `next/font` com
  nomes canônicos (`--font-sans`, `--font-mono`, `--font-heading`) + classe
  `font-sans` no `<html>` + fallbacks literais em `@layer base { :root }` do
  `globals.css` — sem remap `--font-heading: var(--font-mono)` no tema. O
  vermelho→verde do spec descartável (passos 1 e 4) foi executado como escrito.
  Racional e convenção resultante: AGENTS.md §Tipografia e preset do design
  system; itens correspondentes no CHECKLIST.md §1 e §5.

## Por que isso importa

O layout carrega Geist e Geist Mono via `next/font`, mas com os **nomes de
variável errados** para o tema do design system. O tema
(`@theme inline` no `globals.css`) mapeia `--font-sans: var(--font-sans)` — ou
seja, a utility `font-sans` resolve para uma variável CSS de runtime chamada
`--font-sans` que **ninguém define**: o layout define `--font-geist-sans`.
Resultado: `font-sans` (usada na home) cai no fallback de sistema do preflight
do Tailwind; a Geist Sans é baixada, paga no payload, e nunca renderiza.

Agravantes: a Geist Mono é instanciada **duas vezes** (`--font-heading` e
`--font-geist-mono`), e `--font-geist-mono` não é consumida por nenhum mapeamento
do tema (a utility `font-mono` usa a pilha default do Tailwind, não a Geist
Mono). Só `--font-heading` funciona hoje — por coincidência de nome.

## Estado atual

- `apps/web/app/layout.tsx:6-19` — três instâncias de fonte:

  ```tsx
  const geistMonoHeading = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-heading",
  })

  const geistSans = Geist({
    variable: "--font-geist-sans",   // ← o tema espera --font-sans
    subsets: ["latin"],
  })

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",   // ← ninguém consome
    subsets: ["latin"],
  })
  ```

  As três `.variable` são aplicadas no `<html>` via `cn(...)` (linhas 32–41).

- `packages/ui/src/styles/globals.css:118-119` — fim do bloco `@theme inline`:

  ```css
  --font-sans: var(--font-sans);
  --font-heading: var(--font-heading);
  ```

  (Não existe mapeamento para `--font-mono` — a utility `font-mono` usa o
  default do Tailwind.)

- Consumidores: `apps/web/app/page.tsx:6` usa `font-sans`;
  `apps/web/app/demo/page.tsx:24` e `apps/web/app/demo/[slug]/page.tsx:24`
  usam `font-heading` nos `<h1>`.
- `README.md:32` — bullet do stack afirma: Geist e Geist Mono "expostas como
  `--font-geist-sans` / `--font-geist-mono`". Ficará falso após o fix; precisa
  acompanhar.

Convenção do repo: comentários em pt-BR explicando o "porquê" (ver os próprios
arquivos acima); prettier sem ponto-e-vírgula.

## Comandos necessários

| Propósito | Comando            | Esperado no sucesso |
|-----------|--------------------|---------------------|
| Instalar  | `pnpm install`     | exit 0              |
| Types     | `pnpm typecheck`   | exit 0              |
| Build     | `pnpm build`       | exit 0              |
| E2E       | `pnpm test:e2e`    | 6 testes passam (mais o spec descartável enquanto existir) |

Nota Windows: nunca use prefixo `VAR=1 comando` — o `webServer` do Playwright
já define `NEXT_E2E` sozinho.

## Escopo

**Em escopo**:

- `apps/web/app/layout.tsx`
- `packages/ui/src/styles/globals.css` (somente as linhas de `--font-*` no
  `@theme inline`)
- `README.md` (somente o bullet de fontes)
- `apps/web/e2e/fonts.check.spec.ts` — **temporário**, apagado antes do commit
  final

**Fora de escopo**:

- Qualquer outra linha do `globals.css` (tokens de cor, `@source`, etc. — o
  plano 005 cuida dos `@source`).
- Trocar as famílias de fonte ou adicionar novas.
- `apps/web/app/**/page.tsx` — as classes `font-sans`/`font-heading` já estão
  certas; é a fiação que está errada.

## Fluxo de git

- Branch: `advisor/003-fiacao-de-fontes`
- Commit único no estilo do histórico, ex.:
  `fix: wire next/font variables to the design system theme`
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: baseline descartável (prova o vermelho)

Criar `apps/web/e2e/fonts.check.spec.ts`:

```ts
import { expect, test } from "@playwright/test"

// Spec descartável do plano 003 — apagar antes do commit final.
test("Geist aplica no body e Geist Mono no heading", async ({ page }) => {
  await page.goto("/demo")
  const heading = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(heading).toContain("Geist Mono")
  const body = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).fontFamily)
  expect(body).toContain("Geist")
})
```

**Verificar**: `pnpm --filter web exec playwright test fonts.check` — a asserção
do **body** deve FALHAR (fonte de sistema, não Geist) e a do heading passar.
Esse vermelho é a prova do bug. Se ambas passarem, o bug não existe mais —
condição de STOP (drift).

### Passo 2: corrigir o layout

Em `apps/web/app/layout.tsx`, reduzir para **duas** instâncias e alinhar nomes:

```tsx
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
```

Remover `geistMonoHeading` e atualizar o `cn(...)` do `<html>` para aplicar
`geistSans.variable` e `geistMono.variable` (mantendo `"h-full"` e
`"antialiased"`).

**Verificar**: `pnpm typecheck` → exit 0.

### Passo 3: corrigir o tema

Em `packages/ui/src/styles/globals.css`, no `@theme inline`, substituir as duas
linhas de fonte por três:

```css
--font-sans: var(--font-sans);
--font-mono: var(--font-mono);
/* heading usa a mono do layout — um só download, dois papéis */
--font-heading: var(--font-mono);
```

**Verificar**: `pnpm build` → exit 0.

### Passo 4: rodar o spec de fontes no verde

**Verificar**: `pnpm --filter web exec playwright test fonts.check` → ambas as
asserções passam (body contém "Geist", h1 contém "Geist Mono").

### Passo 5: README e limpeza

- `README.md:32`: reescrever o bullet para refletir a realidade, ex.: Geist e
  Geist Mono auto-hospedadas, expostas como `--font-sans` / `--font-mono` (com
  `--font-heading` apontando para a mono no tema do design system).
- Apagar `apps/web/e2e/fonts.check.spec.ts`.
- `grep -rn "font-geist" apps packages README.md` → **0 matches**.

**Verificar**: `pnpm test:e2e` → 6/6 passam (suite `instant()` intacta).

## Plano de teste

O teste de runtime é o spec descartável (passos 1 e 4) — o padrão
vermelho→correção→verde→apagar segue o LOOP documentado em
`apps/web/instant-nav.rig.md` (baseline descartável). A guarda permanente é a
suite `instant()` existente, que deve continuar 6/6, e o critério
`grep font-geist` vazio.

## Critérios de done

- [ ] `pnpm typecheck` e `pnpm build` → exit 0
- [ ] Passo 1 produziu vermelho no body ANTES da correção (registrar no reporte)
- [ ] Passo 4 produziu verde nas duas asserções DEPOIS
- [ ] `grep -rn "font-geist" apps packages README.md` → 0 matches
- [ ] `apps/web/app/layout.tsx` tem exatamente 2 chamadas de `next/font`
- [ ] `apps/web/e2e/fonts.check.spec.ts` não existe no commit final
- [ ] `pnpm test:e2e` → 6/6
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- O passo 1 não reproduzir o vermelho (bug já corrigido ou fiação mudou —
  reavaliar antes de mexer).
- Após o passo 3, o build falhar com erro de tema/Tailwind — não tentar
  reescrever o `@theme` além das linhas especificadas.
- A suite `instant()` quebrar em qualquer ponto — fontes não deveriam afetar
  shell estático; se afetarem, algo fora do escopo foi tocado.

## Notas de manutenção

- A convenção resultante: **o app define** `--font-sans`/`--font-mono` (via
  `next/font`) e **o tema consome** — qualquer app novo no monorepo precisa
  definir essas duas variáveis no seu root layout, senão volta a fonte de
  sistema. Vale uma linha no AGENTS.md quando houver um segundo app.
- Se um dia o heading deixar de ser mono, muda-se só a linha
  `--font-heading: var(--font-mono)` no tema — o layout não precisa saber.
- Revisor: conferir no diff que nenhuma outra linha do `globals.css` mudou
  (risco de formatador tocar o arquivo inteiro — o plano 002 cuida de formato).
