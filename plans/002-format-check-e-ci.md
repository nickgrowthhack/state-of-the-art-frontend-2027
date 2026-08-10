# Plan 002: Verificar formatação no CI (`format:check`) e cachear browsers do Playwright

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- .prettierignore .github/workflows/ci.yml package.json apps/web/package.json packages/ui/package.json`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P1
- **Esforço**: S
- **Risco**: LOW
- **Depende de**: nenhum (recomendado após `plans/001-lint-que-morde.md` para o CI mudar uma coisa por vez)
- **Categoria**: dx
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

O repo tem Prettier configurado com `prettier-plugin-tailwindcss` (ordenação de
classes ancorada no `globals.css`), mas **nenhum lugar verifica formatação**:
não existe script `format:check` e o CI não tem passo de formato. O script
`format` existente é `--write` e cobre só `**/*.{ts,tsx}` — arquivos `.js`,
`.css`, `.md` e `.json` nunca são formatados. O drift já é visível no repo:
`apps/web/eslint.config.js` usa ponto-e-vírgula contra o `"semi": false` do
`.prettierrc`, e `packages/ui/src/styles/globals.css:122-131` tem indentação
quebrada (chaves de fechamento desalinhadas).

De carona no mesmo arquivo de CI: os browsers do Playwright são reinstalados do
zero em toda run (`playwright install --with-deps chromium`, ~30–60s), sem
cache.

## Estado atual

- `.prettierrc` (raiz):

  ```json
  {
    "endOfLine": "lf",
    "semi": false,
    "singleQuote": false,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "plugins": ["prettier-plugin-tailwindcss"],
    "tailwindStylesheet": "packages/ui/src/styles/globals.css",
    "tailwindFunctions": ["cn", "cva"]
  }
  ```

- `.prettierignore` (raiz, hoje): `dist/`, `node_modules/`, `.next/`,
  `.turbo/`, `coverage/`, `pnpm-lock.yaml`, `.pnpm-store/`.
- `package.json` (raiz) — scripts: `format` → `turbo format`; **não** existe
  `format:check`. `prettier` e `prettier-plugin-tailwindcss` são devDependencies
  da raiz (convenção do AGENTS.md: ferramenta de repositório mora na raiz).
- `apps/web/package.json:11` — `"format": "prettier --write \"**/*.{ts,tsx}\""`
- `packages/ui/package.json:8` — idem.
- `.github/workflows/ci.yml` — passos: checkout → pnpm/action-setup →
  setup-node (cache pnpm) → `pnpm install --frozen-lockfile` → `pnpm lint` →
  `pnpm typecheck` → `pnpm build` →
  `pnpm --filter web exec playwright install --with-deps chromium` →
  `pnpm test:e2e`. Sem cache de browsers.
- `@playwright/test` resolvido no lockfile: `1.62.1`.

**Restrições críticas de escopo do check** (motivo de cada ignore novo):

- `.agents/skills/**` e `.claude/skills/**` têm o conteúdo com **hash fixado em
  `skills-lock.json`** — formatá-los quebra o lockfile de skills.
- `apps/web/AGENTS.md` e `apps/web/CLAUDE.md` são **gerados pelo `next dev`**
  (ver AGENTS.md da raiz) — formatá-los cria diff perpétuo contra o gerador.
- `plans/**` são artefatos do advisor, atualizados por executores — fora do
  gate de formato para não travar atualizações de status.

## Comandos necessários

| Propósito       | Comando               | Esperado no sucesso |
|-----------------|-----------------------|---------------------|
| Instalar        | `pnpm install`        | exit 0              |
| Checar formato  | `pnpm format:check`   | exit 0 (após passo 3) |
| Formatar        | `pnpm dlx prettier --write <arquivos>` ou `pnpm format:write` (ver passo 3) | exit 0 |
| Lint            | `pnpm lint`           | exit 0              |
| E2E (sanidade)  | `pnpm test:e2e`       | 6 testes passam     |

## Escopo

**Em escopo**:

- `.prettierignore`
- `package.json` (raiz — novos scripts)
- `apps/web/package.json`, `packages/ui/package.json` (glob do `format`)
- `.github/workflows/ci.yml`
- Arquivos reformatados pelo prettier no passo 3 (mudança mecânica, em commit
  separado)

**Fora de escopo** (NÃO tocar):

- `.prettierrc` — as opções estão decididas; não mudar regras de estilo.
- `.agents/`, `.claude/`, `apps/web/AGENTS.md`, `apps/web/CLAUDE.md`,
  `skills-lock.json` — nunca formatar (ver acima).
- `turbo.json` — o `format:check` roda direto na raiz, sem task turbo (decisão:
  o prettier da raiz enxerga o repo inteiro, inclusive arquivos que nenhum
  workspace cobre, como `README.md` e o próprio `turbo.json`).

## Fluxo de git

- Branch: `advisor/002-format-check-e-ci`
- Dois commits no mínimo: (1) infra (`feat: enforce formatting in CI and cache
  playwright browsers`), (2) reformatação mecânica (`style: apply prettier to
  files newly covered by format:check`).
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: ampliar os ignores do prettier

Adicionar ao `.prettierignore`:

```
.agents/
.claude/
apps/web/AGENTS.md
apps/web/CLAUDE.md
plans/
apps/web/public/
```

(`public/` contém SVGs de asset; formatação não agrega e suja diff.)

**Verificar**: `pnpm dlx prettier --check . ; echo "exit: $?"` roda sem erro de
config (o exit pode ser ≠ 0 por arquivos desformatados — esperado até o passo 3)
e a lista de arquivos acusados **não contém** nada sob `.agents/`, `.claude/`
ou `apps/web/AGENTS.md`/`CLAUDE.md`.

### Passo 2: scripts

- Raiz `package.json`, em `scripts`:
  - `"format:check": "prettier --check ."`
  - (manter `"format": "turbo format"` como está)
- `apps/web/package.json` e `packages/ui/package.json`: ampliar o glob do
  `format` para `"prettier --write \"**/*.{ts,tsx,js,mjs,css,md,json}\""`.

**Verificar**: `pnpm format:check` → lista os arquivos desformatados conhecidos
(ao menos `apps/web/eslint.config.js` e `packages/ui/src/styles/globals.css`)
e exit ≠ 0.

### Passo 3: reformatar o que o check acusa (commit separado)

`pnpm dlx prettier --write .` na raiz (respeita o `.prettierignore` do passo 1).

**Verificar**: `pnpm format:check` → exit 0. `pnpm lint` → exit 0.
`git diff --stat` — conferir que **nenhum** arquivo sob `.agents/`, `.claude/`,
`apps/web/AGENTS.md`, `apps/web/CLAUDE.md` ou `plans/` foi tocado; se foi,
restaurar (`git checkout -- <path>`) e revisar o `.prettierignore`.

### Passo 4: CI — passo de formato + cache de browsers

Em `.github/workflows/ci.yml`:

1. Depois de `pnpm install --frozen-lockfile`, inserir:

   ```yaml
   - run: pnpm format:check
   ```

2. Antes do passo `playwright install`, inserir cache:

   ```yaml
   # Chave inclui a versão do @playwright/test: browser novo a cada upgrade.
   - uses: actions/cache@v4
     with:
       path: ~/.cache/ms-playwright
       key: playwright-${{ runner.os }}-1.62.1
   ```

   Antes de escrever, confirme a versão resolvida:
   `grep -m1 "'@playwright/test@" pnpm-lock.yaml` → use a versão exata que
   aparecer. Manter o passo `playwright install --with-deps chromium` como está
   (com cache quente ele só instala dependências de sistema, rápido).

**Verificar**: `pnpm dlx prettier --check .github/workflows/ci.yml` → exit 0;
YAML válido (`git diff` legível, indentação de 2 espaços como o resto do
arquivo).

## Plano de teste

- `pnpm format:check` → exit 0 (gate novo, verde no estado final).
- Diferencial: desformatar de propósito um arquivo (ex.: trocar aspas em
  `apps/web/lib/demo-topics.ts`), `pnpm format:check` → exit ≠ 0; desfazer.
- `pnpm test:e2e` → 6 testes passam (garante que a reformatação mecânica não
  quebrou nada de runtime — CSS incluído).

## Critérios de done

- [ ] `pnpm format:check` → exit 0
- [ ] Diferencial acima produz exit ≠ 0 e depois volta a 0
- [ ] `pnpm lint` e `pnpm typecheck` → exit 0
- [ ] `pnpm test:e2e` → 6/6 passam
- [ ] `git log --oneline` mostra a reformatação mecânica em commit separado
- [ ] Nenhum arquivo sob `.agents/`, `.claude/`, `plans/`, nem os AGENTS/CLAUDE
      do app, aparece em `git diff 3870aff..HEAD --stat`
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- A reformatação do passo 3 tocar mais de ~40 arquivos — o `.prettierignore`
  provavelmente está furado; pare e liste o que foi acusado.
- O e2e ficar vermelho após a reformatação (formatação de CSS não deveria mudar
  semântica; se mudar, algo além de whitespace foi alterado).
- `prettier --check .` acusar arquivos dentro de `.agents/` ou `.claude/`
  mesmo após o passo 1.

## Notas de manutenção

- O `.prettierignore` agora é a fronteira entre "conteúdo do repo" e "conteúdo
  gerado/fixado por hash". Quem adicionar uma skill nova não precisa fazer nada
  (o diretório inteiro está ignorado); quem criar um novo artefato gerado deve
  adicioná-lo ali.
- A chave do cache de browsers embute a versão do `@playwright/test` — num
  upgrade do Playwright, a chave muda sozinha se quem fizer o upgrade atualizar
  o número no `ci.yml`. Vale automatizar (ler do lockfile) se isso esquecer
  duas vezes.
- Follow-up deferido: workspaces `packages/eslint-config` e
  `packages/typescript-config` não têm script `format` (o AGENTS.md diz que
  todo workspace expõe os mesmos scripts — hoje não é verdade para eles). O
  `format:check` da raiz já os cobre; alinhar os scripts é cosmético e ficou
  fora daqui.
