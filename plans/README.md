# Planos de implementação

Gerados pela skill `improve` em 2026-08-10, contra o commit `3870aff` (auditoria
completa: 100% do código-fonte lido, `pnpm audit` limpo, sem achados de
segurança). O usuário selecionou todos os grupos de achados. O plano 011 foi
adicionado em 2026-08-11, contra o commit `7ad2cd7` (variante `plan` da skill,
pedido direto do operador), e **substitui o 009**. Execute na ordem
abaixo, salvo onde as dependências digam outra coisa. Cada executor: leia o
plano inteiro antes de começar, honre as condições de STOP, e atualize a sua
linha ao terminar.

Convenções comuns a todos os planos: branch `advisor/NNN-slug`, conventional
commits em inglês, **nunca** push/PR sem instrução do operador, e nunca editar
`pnpm-lock.yaml` na mão (só via comandos pnpm).

## Ordem de execução & status

| Plano | Título | Prioridade | Esforço | Depende de | Status |
|-------|--------|------------|---------|------------|--------|
| [001](001-lint-que-morde.md) | Tornar o lint um gate real | P1 | S | — | DONE (2026-08-11, os 4 passos como escritos; zero violações preexistentes — ver nota de status no plano) |
| [002](002-format-check-e-ci.md) | `format:check` no CI + cache de browsers | P1 | S | — (após 001, recomendado) | TODO |
| [003](003-fiacao-de-fontes.md) | Fiação de fontes (Geist nunca renderiza) | P1 | S | — | TODO |
| [004](004-docs-de-skills.md) | SKILLS.md/README verdadeiros sobre skills | P2 | S | — | TODO |
| [005](005-source-globs-globals-css.md) | Remover `@source` mortos do globals.css | P2 | S | — | TODO |
| [006](006-higiene-deps-e-configs.md) | Higiene: `@types/node`, tsconfig morto, dep órfã | P2 | S | — | TODO |
| [007](007-branding-e-readme.md) | Tirar o branding de boilerplate | P2 | S | 003 | TODO |
| [008](008-convencao-teste-unitario.md) | Convenção de teste unitário (vitest) | P2 | M | — | TODO |
| [009](009-spike-vitrine-design-system.md) | Spike: vitrine do design system + dark mode | P3 | M | 003, 007 | REJECTED (substituído pelo 011 — o spike virou porte completo) |
| [010](010-spike-rota-autenticada-instant.md) | Spike: rota autenticada instantânea | P3 | M‑L | — (após 001–005, recomendado) | TODO |
| [011](011-catalogo-design-system.md) | Portar o catálogo do design system do alfa-manager-web para a home | P1 | L | 003 | TODO |

Valores de status: TODO | IN PROGRESS | DONE | BLOCKED (com motivo em uma
linha) | REJECTED (com justificativa em uma linha).

## Notas de dependência

- **007 exige 003**: os dois tocam `apps/web/app/layout.tsx` e o README; 003
  primeiro evita conflito de merge e retrabalho de copy.
- **011 exige 003** (dura): o catálogo usa `font-sans`/`cn-font-heading` — sem
  a fiação de fontes, renderiza em fonte de sistema. As questões Q1–Q4 do
  antigo 009 são respondidas por decisões do 011 (RouterProvider global,
  ThemeProvider no root layout com prova via e2e, toggle como composição do
  app, `next-themes` com `attribute="class"`).
- **007 encolhe com o 011**: o passo da home própria caduca (a home vira o
  catálogo); metadata do root layout, `lang` e README continuam do 007. A
  ordem entre 007 e 011 é indiferente, contanto que 003 venha antes de ambos.
- **002 após 001** (soft): os dois mexem no comportamento do CI; um de cada vez
  facilita bisect se algo quebrar.
- **010 após 001–005** (soft): o spike depende de confiar no CI e na suite e2e
  como harness.
- **008 é independente**, mas se landar antes de 011, os componentes novos de
  `apps/web/components/` já nascem com a convenção de teste (o plano 011 cobra
  isso na nota de manutenção).

## Achados considerados e rejeitados

Registrados para ninguém re-auditar:

- **Build duplo no CI** (`pnpm build` + rebuild do webServer do Playwright):
  intencional — o primeiro valida o artefato de produção **sem** `NEXT_E2E`;
  o split de env está documentado em comentário no `turbo.json`. Não mudar.
- **`shadcn` como dependency de `packages/ui`**: não é cruft — o
  `globals.css:3` importa `shadcn/tailwind.css` em runtime de build. Manter.
- **Prettier/TypeScript resolvidos via raiz nos scripts de workspace**:
  convenção documentada no AGENTS.md (ferramenta de repositório mora na raiz).
  Não é dependência fantasma de código.
- **Versões exatas em prosa no README** (Stacks): hoje batem com o lockfile
  (conferidas uma a uma na auditoria). É um custo de manutenção aceito pelo
  repo; o plano 006 mostra o protocolo (bump → atualizar bullet). Sem plano
  próprio.
- **`.gitkeep` coexistindo com conteúdo** (`packages/ui/src/components/`):
  cosmético demais para valer um plano; remover de carona em qualquer plano que
  tocar o diretório.
- **Scripts `lint`/`format`/`typecheck` ausentes em `packages/eslint-config` e
  `packages/typescript-config`** (o AGENTS.md afirma que todo workspace os
  expõe): impacto ~zero (são JSON/JS de config, cobertos pelo `format:check` da
  raiz do plano 002). Registrado como follow-up cosmético na nota de manutenção
  do 002.
