# Plan 001: Tornar o lint um gate real (`--max-warnings 0` + presets corrigidos)

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- packages/eslint-config apps/web/package.json packages/ui/package.json`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P1
- **Esforço**: S
- **Risco**: LOW
- **Depende de**: nenhum
- **Categoria**: dx
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

O repositório usa `eslint-plugin-only-warn`, que rebaixa **todo erro de lint a
warning**, e nenhum script `lint` passa `--max-warnings`. O ESLint sai com
código 0 quando só há warnings — logo `pnpm lint` **nunca pode falhar**, com
qualquer quantidade de violações. O passo `pnpm lint` do CI
(`.github/workflows/ci.yml`) é um gate decorativo: passa sempre.

Aproveitando que os presets serão tocados: `react-internal.js` re-espalha três
configs que já vêm do base (duplicação), e `eslint-config-prettier` — cujo
contrato é vir **por último** para desligar regras estilísticas conflitantes —
aparece no meio da cadeia, antes de configs que adicionam regras. Hoje o
only-warn mascara isso; quando o gate passar a morder, a ordem errada vira
falha falsa.

## Estado atual

Arquivos relevantes:

- `packages/eslint-config/base.js` — preset base compartilhado; importa o
  only-warn e posiciona o prettier cedo demais:

  ```js
  // base.js:12-32 (hoje)
  export const config = [
    js.configs.recommended,
    eslintConfigPrettier,          // ← cedo demais; deveria ser o último do config FINAL
    ...tseslint.configs.recommended,
    {
      plugins: { turbo: turboPlugin },
      rules: { "turbo/no-undeclared-env-vars": "warn" },
    },
    {
      plugins: { onlyWarn },       // ← rebaixa tudo a warning
    },
    {
      ignores: ["dist/**", ".next/**", "**/.turbo/**", "**/coverage/**"],
    },
  ]
  ```

- `packages/eslint-config/next.js` — preset do app Next; espalha
  `baseConfig`, depois `nextVitals` e `nextTs` (nenhum prettier no fim).
- `packages/eslint-config/react-internal.js` — preset de biblioteca React;
  linhas 16–18 re-espalham `js.configs.recommended`, `eslintConfigPrettier` e
  `tseslint.configs.recommended`, que **já vêm** de `...baseConfig` na linha 15.
- `apps/web/package.json:10` — `"lint": "eslint"`
- `packages/ui/package.json:7` — `"lint": "eslint"`
- `.github/workflows/ci.yml:30` — `- run: pnpm lint`
- `turbo.json` — task `lint` com `dependsOn: ["^lint"]`; nada a mudar nela.

Convenções do repo que se aplicam:

- Nenhum workspace consome `@workspace/eslint-config/base` diretamente hoje
  (`apps/web` usa `next-js`; `packages/ui` usa `react-internal` — confira em
  `apps/web/eslint.config.js` e `packages/ui/eslint.config.js`). Por isso o
  prettier pode sair do base e ir para o fim de cada config **final**.
- `eslint-config-prettier@10.1.8` já é devDependency de
  `packages/eslint-config` — nenhum install novo é necessário.
- Manter o `only-warn`: ele existe para UX de editor (squiggles amarelos, não
  vermelhos). O gate fica estrito via `--max-warnings 0`, não removendo o plugin.

## Comandos necessários

| Propósito | Comando          | Esperado no sucesso |
|-----------|------------------|---------------------|
| Instalar  | `pnpm install`   | exit 0              |
| Lint      | `pnpm lint`      | exit 0, sem warnings |
| Types     | `pnpm typecheck` | exit 0              |

(Todos na raiz do repositório. `pnpm lint` delega ao turbo, que roda o script
de cada workspace.)

## Escopo

**Em escopo** (únicos arquivos a modificar):

- `packages/eslint-config/base.js`
- `packages/eslint-config/next.js`
- `packages/eslint-config/react-internal.js`
- `apps/web/package.json` (apenas o script `lint`)
- `packages/ui/package.json` (apenas o script `lint`)

**Fora de escopo** (NÃO tocar, mesmo parecendo relacionado):

- `turbo.json` — a task `lint` já está correta.
- `.github/workflows/ci.yml` — o passo `pnpm lint` não muda; ele passa a morder
  sozinho.
- Remover `eslint-plugin-only-warn` — decisão deliberada de mantê-lo (ver
  "Estado atual").
- Qualquer correção em massa de violações pré-existentes (ver STOP).

## Fluxo de git

- Branch: `advisor/001-lint-que-morde`
- Conventional commits em inglês, como no histórico (ex.:
  `fix: make lint gate fail on warnings`). Um commit por unidade lógica.
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: mover `eslint-config-prettier` para o fim dos configs finais

Em `packages/eslint-config/base.js`: remover `eslintConfigPrettier` do array
(e o import correspondente). Adicionar um comentário no topo do array:
`// eslint-config-prettier não entra aqui: cada config FINAL o adiciona por último.`

Em `packages/eslint-config/next.js`: importar `eslintConfigPrettier` de
`eslint-config-prettier` e adicioná-lo como **último** elemento do array
`nextJsConfig` (depois do objeto de `ignores`; a posição relevante é depois de
tudo que adiciona regras).

Em `packages/eslint-config/react-internal.js`: idem — último elemento do array.

**Verificar**: `pnpm lint` → exit 0 (configs ainda parseiam e rodam).

### Passo 2: remover duplicação em `react-internal.js`

Remover as linhas que re-espalham `js.configs.recommended`,
`eslintConfigPrettier` (a ocorrência do meio — a do fim, adicionada no passo 1,
fica) e `...tseslint.configs.recommended` — todas já vêm de `...baseConfig`.
Remover imports que ficarem sem uso.

**Verificar**: `pnpm lint` → exit 0.

### Passo 3: endurecer os scripts

- `apps/web/package.json`: `"lint": "eslint --max-warnings 0"`
- `packages/ui/package.json`: `"lint": "eslint --max-warnings 0"`

**Verificar**: `pnpm lint` → exit 0. Se aparecerem violações pré-existentes:
até ~10 ocorrências triviais (variável sem uso etc.), corrija junto; acima
disso, condição de STOP.

### Passo 4: diferencial — provar que o gate morde

1. Adicionar temporariamente em `apps/web/lib/demo-topics.ts`:
   `const naoUsada = 1` (sem export).
2. `pnpm lint` → **exit ≠ 0**, com o warning de `no-unused-vars` reportado e a
   task `web#lint` falhando no turbo. Se sair 0, o gate não mordeu — STOP.
3. Desfazer a linha.
4. `pnpm lint` → exit 0.

**Verificar**: sequência acima na ordem exata; o repositório termina limpo
(`git status` sem `demo-topics.ts` modificado).

## Plano de teste

Este plano não adiciona testes de runtime (não há mudança de comportamento do
app). O teste é o diferencial do passo 4 — ele é obrigatório, não opcional.
Adicionalmente: `pnpm typecheck` → exit 0 (nada de TS mudou, sanity check).

## Critérios de done

Todos verificáveis por comando; TODOS devem valer:

- [ ] `pnpm lint` → exit 0
- [ ] Com violação semeada (passo 4), `pnpm lint` → exit ≠ 0
- [ ] `grep -n "max-warnings" apps/web/package.json packages/ui/package.json` → 1 match em cada
- [ ] `grep -c "eslintConfigPrettier" packages/eslint-config/base.js` → 0
- [ ] `packages/eslint-config/next.js` e `react-internal.js` terminam seus arrays com `eslintConfigPrettier`
- [ ] `pnpm typecheck` → exit 0
- [ ] `git status` só mostra os arquivos em escopo
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

Pare e reporte (não improvise) se:

- O código em "Estado atual" não bater com os trechos citados (drift).
- `pnpm lint` limpo revelar violações pré-existentes em mais de ~10 pontos —
  a correção em massa é outra tarefa, não esta.
- Após o passo 1, alguma regra do `eslint-config-next` ou do
  `eslint-plugin-react` entrar em conflito irreconciliável com o prettier
  (falha que não some com o prettier em último).
- O passo 4 (diferencial) não produzir exit ≠ 0.

## Notas de manutenção

- Workspaces novos devem copiar o script `"lint": "eslint --max-warnings 0"` —
  sem isso, voltam a ter gate decorativo. Vale adicionar essa frase ao
  `AGENTS.md` se/quando ele ganhar uma seção de lint (fora de escopo aqui).
- Todo config final novo em `packages/eslint-config` deve terminar com
  `eslintConfigPrettier`. O comentário deixado no `base.js` (passo 1) é o
  lembrete disso.
- O plano 002 (`plans/002-format-check-e-ci.md`) adiciona o gate de formatação;
  os dois juntos fecham o ciclo "estilo é verificado, não opinado".
