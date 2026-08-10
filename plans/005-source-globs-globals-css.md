# Plan 005: Remover os `@source` mortos do globals.css

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- packages/ui/src/styles/globals.css`
> Se o arquivo mudou desde a escrita deste plano, compare os trechos de
> "Estado atual" com o código vivo antes de prosseguir; em caso de divergência,
> trate como condição de STOP.

## Status

- **Prioridade**: P2
- **Esforço**: S
- **Risco**: LOW‑MED (a verificação de estilo é obrigatória)
- **Depende de**: nenhum
- **Categoria**: tech-debt
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

Duas das três diretivas `@source` do `globals.css` apontam para diretórios que
**não existem**. O arquivo vive em `packages/ui/src/styles/`, então `../../../`
resolve para `packages/` — e `@source "../../../apps/**"` vira
`packages/apps/**` (inexistente), `@source "../../../components/**"` vira
`packages/components/**` (inexistente). Os estilos do app funcionam hoje por
outro caminho: a **auto-detecção** de sources do Tailwind v4, que varre a partir
do cwd do build (`apps/web`). As duas linhas são peso morto que ensina errado a
quem lê — e viram bug real se a auto-detecção um dia for desligada
(`source(none)`) ou o build mudar de cwd.

Não é seguro "corrigir a profundidade" (`../../../../apps/**`): o app consome o
arquivo via symlink do pnpm (`node_modules/@workspace/ui/...`), e o path
re-resolvido a partir do symlink apontaria para dentro de `node_modules`.
Remover é o fix correto; a cobertura do app fica, documentadamente, com a
auto-detecção.

## Estado atual

- `packages/ui/src/styles/globals.css:1-8`:

  ```css
  @import "tailwindcss";
  @import "tw-animate-css";
  @import "shadcn/tailwind.css";

  @custom-variant dark (&:is(.dark *));
  @source "../../../apps/**/*.{ts,tsx}";        /* ← packages/apps — não existe */
  @source "../../../components/**/*.{ts,tsx}";  /* ← packages/components — não existe */
  @source "../**/*.{ts,tsx}";                   /* ← packages/ui/src — correto */
  ```

- Consumo: `apps/web/app/layout.tsx:3` importa `@workspace/ui/globals.css`; o
  PostCSS do app (`apps/web/postcss.config.mjs` re-exporta o de
  `packages/ui`) processa o arquivo durante `next build` com cwd `apps/web`.
- Convenção do repo: comentários pt-BR explicando o porquê (ver
  `turbo.json`, `next.config.ts`).

## Comandos necessários

| Propósito | Comando         | Esperado no sucesso |
|-----------|-----------------|---------------------|
| Instalar  | `pnpm install`  | exit 0              |
| Build     | `pnpm build`    | exit 0              |
| E2E       | `pnpm test:e2e` | 6 testes passam (o webServer rebuilda produção sozinho) |

## Escopo

**Em escopo**:

- `packages/ui/src/styles/globals.css` — somente as linhas 6–7 (remoção) e um
  comentário novo.
- `apps/web/e2e/styles.check.spec.ts` — **temporário**, apagado antes do commit.

**Fora de escopo**:

- As demais linhas do `globals.css` (tokens, `@theme`, `@layer`) — o plano 003
  mexe nas linhas de fonte; não conflitam, mas não toque nelas aqui.
- `postcss.config.mjs` de qualquer workspace.
- Desligar/ligar auto-detecção (`source(...)` no `@import "tailwindcss"`).

## Fluxo de git

- Branch: `advisor/005-source-globs`
- Commit único, ex.: `fix: drop dead @source globs from globals.css`
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: baseline descartável de estilos

Criar `apps/web/e2e/styles.check.spec.ts` — asserta que classes de **três
origens distintas** produzem estilo computado (app demo, app home, pacote ui):

```ts
import { expect, test } from "@playwright/test"

// Spec descartável do plano 005 — apagar antes do commit final.
test("classes do app e do ui geram CSS", async ({ page }) => {
  await page.goto("/demo")
  // max-w-2xl vem de apps/web/app/demo/page.tsx (código do APP)
  const maxWidth = await page
    .locator("main")
    .evaluate((el) => getComputedStyle(el).maxWidth)
  expect(maxWidth).toBe("672px")
  // border dos topic links (rounded-lg border) também é código do APP
  const border = await page
    .getByTestId("topic-link-shell-estatico")
    .evaluate((el) => getComputedStyle(el).borderTopWidth)
  expect(border).toBe("1px")
})
```

**Verificar**: `pnpm --filter web exec playwright test styles.check` → verde
(baseline: os estilos existem HOJE, antes da mudança).

### Passo 2: remover as linhas mortas e documentar

Em `packages/ui/src/styles/globals.css`, substituir as linhas 6–8 por:

```css
/* Fontes de classes: as do próprio pacote vêm do @source abaixo; as dos apps
   vêm da auto-detecção do Tailwind v4, que varre a partir do cwd do build de
   cada app. Não adicione @source apontando para fora do pacote: este arquivo
   é consumido via symlink do pnpm e paths relativos re-resolvem errado. */
@source "../**/*.{ts,tsx}";
```

**Verificar**: `pnpm build` → exit 0.

### Passo 3: provar que nada sumiu

**Verificar**: `pnpm --filter web exec playwright test styles.check` → verde
(mesmos valores do passo 1). Depois `pnpm test:e2e` → 6/6 (suite completa, nos
dois projects desktop+mobile).

### Passo 4: limpeza

Apagar `apps/web/e2e/styles.check.spec.ts`.

**Verificar**: `git status` mostra somente `packages/ui/src/styles/globals.css`
modificado.

## Plano de teste

O spec descartável dos passos 1–3 é o teste: mesma asserção antes e depois da
mudança (verde→verde). A suite `instant()` completa cobre a regressão de
runtime nos dois breakpoints. Não fica teste permanente — a guarda de longo
prazo é o comentário no CSS + a suite e2e existente, que falharia visivelmente
se as classes do app sumissem (skeletons e shells perderiam layout).

## Critérios de done

- [ ] `grep -c "@source" packages/ui/src/styles/globals.css` → 1
- [ ] `grep -n "packages/apps\|\.\./\.\./\.\./apps" packages/ui/src/styles/globals.css` → 0 matches
- [ ] `pnpm build` → exit 0
- [ ] `pnpm test:e2e` → 6/6
- [ ] `apps/web/e2e/styles.check.spec.ts` não existe no commit final
- [ ] `git status` limpo fora do arquivo em escopo
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- O passo 1 (baseline) falhar ANTES de qualquer mudança — o ambiente está
  quebrado ou os testids mudaram; nada a corrigir aqui.
- O passo 3 falhar: **restaurar as linhas removidas** (`git checkout -- packages/ui/src/styles/globals.css`),
  confirmar o verde de novo e reportar — significa que a auto-detecção NÃO
  cobre o app neste setup e a premissa do plano está errada.
- Qualquer estilo visivelmente diferente entre passos 1 e 3.

## Notas de manutenção

- Se um dia alguém quiser desligar a auto-detecção
  (`@import "tailwindcss" source(none)`), TODOS os sources passam a ser
  explícitos — e os dos apps precisarão ser declarados **no lado do app** (ex.:
  um CSS wrapper por app), nunca por path relativo dentro do pacote (symlink).
  O comentário deixado no arquivo aponta isso.
- Um segundo app no monorepo não precisa fazer nada: seu build tem o próprio
  cwd e a auto-detecção o cobre.
