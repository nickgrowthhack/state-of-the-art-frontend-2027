# Plan 006: Higiene de dependências e configs mortos

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- apps/web/package.json packages/ui/package.json packages/ui/tsconfig.lint.json README.md pnpm-lock.yaml`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P2
- **Esforço**: S
- **Risco**: LOW
- **Depende de**: nenhum
- **Categoria**: deps
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

Três itens pequenos que contradizem a disciplina que o próprio AGENTS.md prega:

1. **`@types/node` 20 num repo que exige Node ≥ 22** (`engines` da raiz; CI usa
   Node 22). Os types descrevem um runtime proibido: APIs novas do Node 22 dão
   erro de tipo falso, APIs removidas passam no typecheck.
2. **`packages/ui/tsconfig.lint.json` é um arquivo morto**: nada no repo o
   referencia (verificado por grep em todos os configs) e ele inclui um
   diretório `turbo` que não existe. Config fantasma ensina errado.
3. **`@tabler/icons-react` está declarado em dois workspaces e importado em
   nenhum** (verificado por grep em `apps/web` e `packages/ui/src`). O
   argumento de "provisionamento" não se sustenta: o CLI do shadcn instala
   dependências automaticamente quando um componente adicionado precisar delas,
   e os `components.json` continuam declarando `iconLibrary: "tabler"`.

## Estado atual

- Raiz `package.json` — `"engines": { "node": ">=22", "pnpm": ">=10" }`; sem
  `@types/node` na raiz.
- `apps/web/package.json:26` — `"@types/node": "^20"` (devDependencies).
- `packages/ui/package.json:24` — `"@types/node": "^20"` (devDependencies).
- `apps/web/package.json:16` — `"@tabler/icons-react": "^3.46.0"`
  (dependencies). Grep de `@tabler` em `apps/web` (fora de `node_modules`):
  só o próprio `package.json`.
- `packages/ui/package.json:12` — `"@tabler/icons-react": "^3.46.0"`
  (dependencies). Grep em `packages/ui/src`: zero imports.
- `packages/ui/tsconfig.lint.json` — conteúdo integral:

  ```json
  {
    "extends": "@workspace/typescript-config/react-library.json",
    "compilerOptions": { "outDir": "dist" },
    "include": ["src", "turbo"],
    "exclude": ["node_modules", "dist"]
  }
  ```

  O typecheck real usa `packages/ui/tsconfig.json` (script `tsc --noEmit`);
  o eslint da ui não referencia tsconfig nenhum.
- `README.md:40` — bullet: "**@types/node** `20.19.43`". Precisa acompanhar o
  bump.
- Regra do AGENTS.md que se aplica: dependência de workspace se mexe com
  `pnpm --filter <workspace> add/remove` — nunca editando o `package.json` na
  mão e nunca na raiz sem `-w`.

## Comandos necessários

| Propósito  | Comando          | Esperado no sucesso |
|------------|------------------|---------------------|
| Instalar   | `pnpm install`   | exit 0, lockfile atualizado |
| Types      | `pnpm typecheck` | exit 0              |
| Lint       | `pnpm lint`      | exit 0              |
| Build      | `pnpm build`     | exit 0              |
| E2E        | `pnpm test:e2e`  | 6 testes passam     |

## Escopo

**Em escopo**:

- `apps/web/package.json`, `packages/ui/package.json` (via comandos pnpm)
- `pnpm-lock.yaml` (consequência dos comandos — nunca editar na mão)
- `packages/ui/tsconfig.lint.json` (deletar)
- `README.md` (somente o bullet do `@types/node`)

**Fora de escopo** (NÃO tocar):

- `pnpm.overrides` da raiz (`@types/react`/`@types/react-dom`) — pins
  intencionais, outro assunto.
- A dependência `shadcn` de `packages/ui` — **não é cruft**: o
  `globals.css:3` importa `shadcn/tailwind.css`. Não remover.
- `iconLibrary` nos `components.json` — continua `tabler`; o CLI reinstala a
  lib quando precisar.
- `engines`, versão de Node no CI.

## Fluxo de git

- Branch: `advisor/006-higiene-deps`
- Commit único, ex.: `chore: align @types/node with engines, drop unused dep and dead tsconfig`
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: bump do `@types/node`

```
pnpm --filter web add -D @types/node@^22
pnpm --filter @workspace/ui add -D @types/node@^22
```

**Verificar**: `pnpm typecheck` → exit 0. Depois
`grep -m1 "'@types/node@22" pnpm-lock.yaml` → 1 match (anote a versão exata
resolvida, ex. `22.x.y`, para o passo 4).

### Passo 2: remover `@tabler/icons-react`

```
pnpm --filter web remove @tabler/icons-react
pnpm --filter @workspace/ui remove @tabler/icons-react
```

**Verificar**: `grep -rn "@tabler" apps/web/package.json packages/ui/package.json`
→ 0 matches; `pnpm typecheck` e `pnpm build` → exit 0.

### Passo 3: deletar o tsconfig morto

Antes de deletar, reconfirme que nada o referencia:
`grep -rn "tsconfig.lint" --include="*.{json,js,mjs,ts}" apps packages turbo.json package.json`
→ esperado: 0 matches. Então deletar `packages/ui/tsconfig.lint.json`.

**Verificar**: `pnpm typecheck` e `pnpm lint` → exit 0.

### Passo 4: README

Atualizar o bullet `README.md:40` com a versão resolvida do passo 1 (ex.:
"**@types/node** `22.x.y`").

**Verificar**: `grep -n "types/node" README.md` mostra a versão nova; ela bate
com `grep -m1 "'@types/node@22" pnpm-lock.yaml`.

### Passo 5: verificação integral

**Verificar**: `pnpm install --frozen-lockfile` (prova lockfile↔manifests em
sincronia) → exit 0; `pnpm test:e2e` → 6/6.

## Plano de teste

Sem teste novo — a mudança é de manifesto. As guardas são: typecheck com os
types novos, `--frozen-lockfile` verde e a suite e2e completa (que rebuilda
produção).

## Critérios de done

- [ ] `grep -rn '"@types/node": "\^20"' apps packages` → 0 matches
- [ ] `grep -rn "@tabler" apps/web/package.json packages/ui/package.json` → 0 matches
- [ ] `packages/ui/tsconfig.lint.json` não existe
- [ ] `pnpm install --frozen-lockfile` → exit 0
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` → exit 0
- [ ] `pnpm test:e2e` → 6/6
- [ ] Bullet do README bate com o lockfile
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- O typecheck falhar após o passo 1 com erros vindos de `node_modules/@types/node`
  ou de APIs de Node usadas no repo — reporte os erros em vez de fixar em ^20
  de volta ou espalhar `@ts-ignore`.
- O grep do passo 3 encontrar alguma referência a `tsconfig.lint` — o arquivo
  não está morto; reporte onde.
- Qualquer import de `@tabler/icons-react` existir no código no momento da
  execução (drift desde a auditoria) — nesse caso a dep não é órfã; pule o
  passo 2 e registre.

## Notas de manutenção

- Quando o `engines` subir para Node 24+, repetir o passo 1 — types e engines
  andam juntos; é fácil de esquecer porque nada quebra na hora.
- Se o CLI do shadcn adicionar um componente que usa ícones, ele vai reintroduzir
  `@tabler/icons-react` no workspace certo sozinho — isso é o funcionamento
  esperado, não uma regressão deste plano.
- O README fixa versões exatas em prosa (decisão do repo); qualquer bump de dep
  citada ali precisa tocar o README junto — o plano 002 não cobre isso (prettier
  não valida conteúdo).
