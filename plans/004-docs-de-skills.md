# Plan 004: Fazer SKILLS.md e README dizerem a verdade sobre as skills

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- SKILLS.md README.md skills-lock.json .agents/skills .claude/skills`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P2
- **Esforço**: S
- **Risco**: LOW
- **Depende de**: nenhum
- **Categoria**: docs
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

Num repositório cujo produto é a convenção, o contrato de reprodutibilidade das
skills está errado em dois pontos verificáveis:

1. `SKILLS.md` afirma que `.claude/skills/` "é apenas o espelho gerado para o
   Claude Code consumir; **não é versionado**" — mas `git ls-files` rastreia o
   diretório inteiro (hoje em sincronia byte a byte com `.agents/skills/`,
   verificado por `diff -rq` na auditoria).
2. A skill `shadcn` está instalada e fixada em `skills-lock.json` (fonte
   `shadcn/ui`), mas **não aparece** nem no `SKILLS.md` nem na lista do
   `README.md` — 8 skills instaladas, 7 documentadas. A lista de fontes do
   `SKILLS.md` também omite `shadcn/ui`.

Um agente que siga o `SKILLS.md` à risca vai ignorar (ou tentar deletar) o
espelho `.claude/`, e nunca vai descobrir a skill `shadcn`.

## Estado atual

- `SKILLS.md:3` — o parágrafo de abertura termina com:

  > O `.claude/skills/` é apenas o espelho gerado para o Claude Code consumir;
  > não é versionado.

  E no meio do mesmo parágrafo, a lista de fontes:
  `(vercel/next.js, vercel-labs/agent-browser, vercel-labs/agent-skills, shadcn/improve)`
  — sem `shadcn/ui`.

- `SKILLS.md` tem 6 seções `##`, nesta ordem: `next-cache-components-adoption`,
  `next-partial-prefetching-adoption`, `next-cache-components-optimizer`,
  `vercel-react-best-practices`, `next-dev-loop`, `agent-browser`, `improve`
  (7 skills documentadas). Cada seção tem o formato **"O que faz:"** +
  **"Por que está aqui:"** — siga esse formato exato na seção nova.
- `README.md:45` — lista: "`agent-browser`, `improve`,
  `next-cache-components-adoption`, `next-cache-components-optimizer`,
  `next-dev-loop`, `next-partial-prefetching-adoption`,
  `vercel-react-best-practices`" — sem `shadcn`.
- `skills-lock.json` — 8 entradas; a de `shadcn`:

  ```json
  "shadcn": {
    "source": "shadcn/ui",
    "sourceType": "github",
    "skillPath": "skills/shadcn/SKILL.md",
    "computedHash": "f99ef49d9909d380ca683ceb8dc8c25775c20ee38140112c394e037d8c11ee18"
  }
  ```

- `.agents/skills/shadcn/SKILL.md` — existe; leia-o antes de escrever a seção
  nova (a descrição do frontmatter resume o que a skill faz: gerenciar
  componentes e projetos shadcn — adicionar, buscar, corrigir, estilizar e
  compor UI; vale para qualquer projeto com `components.json`).
- Fato relevante para a redação: **não existe script gerador** do espelho no
  repo (nenhum script em `package.json` sincroniza `.agents/` → `.claude/`).
  Portanto a correção honesta é assumir que o espelho é versionado e mantido em
  sincronia, não inventar um gerador.

## Comandos necessários

| Propósito | Comando | Esperado no sucesso |
|-----------|---------|---------------------|
| Verificar rastreamento | `git ls-files .claude/skills \| head -3` | ≥ 1 linha |
| Verificar sincronia | `diff -rq .agents/skills .claude/skills` | sem saída, exit 0 |
| Contar skills no lock | `grep -c "computedHash" skills-lock.json` | 8 |

(Este plano só toca Markdown — não há build/teste a rodar além de
`pnpm format:check`, se o plano 002 já tiver landado.)

## Escopo

**Em escopo**:

- `SKILLS.md`
- `README.md` (somente a linha da lista de skills)

**Fora de escopo** (NÃO tocar):

- `skills-lock.json`, `.agents/**`, `.claude/**` — o conteúdo das skills tem
  hash fixado; este plano documenta, não altera.
- A alternativa "parar de versionar `.claude/` e criar um script de sync" —
  rejeitada: não existe gerador no repo, o Claude Code precisa dos arquivos
  presentes, e o espelho versionado faz o diff de skills aparecer em review
  (que é o objetivo declarado do lockfile).

## Fluxo de git

- Branch: `advisor/004-docs-de-skills`
- Commit único, ex.: `docs: document shadcn skill and fix .claude mirror claim`
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: corrigir a afirmação sobre o espelho

Em `SKILLS.md:3`, substituir a frase final ("O `.claude/skills/` é apenas o
espelho gerado para o Claude Code consumir; não é versionado.") por uma que
reflita a realidade, por exemplo:

> O `.claude/skills/` é o espelho de `.agents/skills/` que o Claude Code
> consome; é **versionado** e mantido em sincronia byte a byte — divergência
> entre os dois diretórios é erro, e mudanças de skill devem ser commitadas
> nos dois junto com o `skills-lock.json`.

Na lista de fontes do mesmo parágrafo, adicionar `shadcn/ui`.

**Verificar**: `grep -n "não é versionado" SKILLS.md` → 0 matches;
`grep -n "shadcn/ui" SKILLS.md` → ≥ 1 match.

### Passo 2: documentar a skill `shadcn`

Adicionar uma seção `## shadcn` ao `SKILLS.md`, no formato das existentes
(**"O que faz:"** + **"Por que está aqui:"**, 2–4 frases cada). Basear o
conteúdo em `.agents/skills/shadcn/SKILL.md` (leia-o). O "por que está aqui"
deve citar o fato de o repo ter dois `components.json` (app e
`packages/ui`) e a divisão design-system ↔ app que o AGENTS.md codifica.
Posição: junto das outras skills de UI/execução (sugestão: após
`vercel-react-best-practices`).

**Verificar**: `grep -c "^## " SKILLS.md` → 8.

### Passo 3: README

Em `README.md:45`, adicionar `shadcn` à lista (em ordem alfabética, como está:
entre `next-partial-prefetching-adoption` e `vercel-react-best-practices`).

**Verificar**: `grep -n "shadcn" README.md` inclui a linha da lista de skills.

## Plano de teste

Documentação — o teste é a checagem cruzada mecânica:

- Para cada uma das 8 chaves em `skills-lock.json`
  (`grep -oP '"\w[\w-]*"(?=: \{)' skills-lock.json` ou leitura manual), existe
  uma seção `## <nome>` no `SKILLS.md`.
- `diff -rq .agents/skills .claude/skills` → vazio (garante que nada foi
  formatado/tocado por engano).

## Critérios de done

- [ ] `grep -c "^## " SKILLS.md` → 8
- [ ] `grep -n "não é versionado" SKILLS.md` → 0 matches
- [ ] `grep -n "shadcn/ui" SKILLS.md` → ≥ 1
- [ ] Lista do `README.md` contém as 8 skills
- [ ] `diff -rq .agents/skills .claude/skills` → exit 0, sem saída
- [ ] `git status` só mostra `SKILLS.md` e `README.md`
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- `diff -rq .agents/skills .claude/skills` mostrar divergência **antes** de
  você tocar em qualquer coisa — o espelho saiu de sincronia desde a auditoria;
  reporte em vez de documentar um estado quebrado.
- `skills-lock.json` tiver ≠ 8 entradas (skills mudaram desde o plano).
- `.agents/skills/shadcn/SKILL.md` não existir.

## Notas de manutenção

- Quem adicionar/atualizar uma skill passa a ter três pontos de toque:
  `.agents/skills/`, `.claude/skills/` (espelho), `skills-lock.json` — e agora
  dois de documentação: `SKILLS.md` e a lista do `README.md`. Se isso esquecer
  com frequência, o follow-up natural é um check de CI comparando as chaves do
  lockfile com os `##` do `SKILLS.md` (deferido — não fazer agora).
- Revisor: conferir que a seção nova segue o formato "O que faz / Por que está
  aqui" e não parafraseia o SKILL.md inteiro.
