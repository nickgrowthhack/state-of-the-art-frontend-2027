# Plan 012: Camadas do shadcn — pristine × extensão, com guarda no CI

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Pré-condição e checagem de drift (rode primeiro)**:
>
> 1. `git status --short` deve estar **limpo**. Árvore suja significa outro
>    plano em voo nesta máquina (na escrita deste plano, o 003 estava
>    exatamente nesse estado); aguarde o commit dele ou pare e reporte. Nunca
>    execute este plano sobre árvore suja.
> 2. `git diff --stat 08e6576..HEAD -- packages/ui turbo.json package.json .github/workflows/ci.yml AGENTS.md CHECKLIST.md README.md`
>    Drift **esperado e aceitável**: (a) do plano 003 — seção nova
>    "# Tipografia e preset do design system" no `AGENTS.md`, itens de fontes
>    no CHECKLIST §5, mudanças em `globals.css`, `README.md`,
>    `apps/web/app/layout.tsx`; (b) do plano 011 — ~54 componentes novos em
>    `packages/ui/src/components/`, hooks em `src/hooks/`, dependências novas
>    no manifest do pacote. Este plano funciona igual sobre 1 ou 54
>    componentes (o Passo 3 hasheia o que existir). Qualquer OUTRO drift — em
>    especial `button.tsx` editado à mão, o `exports` alterado, um diretório
>    `src/extensions/` já existente, ou mudanças em `turbo.json`/`ci.yml` que
>    conflitem com os passos — é condição de STOP.

## Status

- **Prioridade**: P1
- **Esforço**: M
- **Risco**: LOW
- **Depende de**: nenhum (ordem relativa ao 011: ver "Notas de dependência" no
  `plans/README.md` — recomendado 012 **antes** do 011)
- **Categoria**: arquitetura
- **Planejado em**: commit `08e6576`, 2026-08-11 (variante `plan` da skill
  `improve`, pedido direto do operador)

## Por que isso importa

O `README.md` (§shadcn/ui) declara a estratégia de design system do repo:
separar a **camada de upstream (pristine)** — fiel à origem, atualizável,
diffável — da **camada de extensão**, onde vive toda divergência de casa.
A razão: componente shadcn é **código copiado, não dependência**. Sem uma
fronteira explícita, meses depois ninguém sabe dizer o que é do shadcn e o que
é de casa, e atualizar do upstream vira arqueologia.

Hoje a estratégia é só prosa: não existe diretório de extensão, nenhuma regra
no `AGENTS.md`, nenhum item no `CHECKLIST.md`, nenhum mecanismo de verificação.
E o momento é o ideal — `packages/ui` está **de fato pristine**: o único
componente (`src/components/button.tsx`) nunca foi editado depois que o CLI o
escreveu (2 commits na história inteira do pacote, ambos de scaffold/add).
A janela fecha rápido: o plano 011 vai despejar ~54 componentes upstream em
`packages/ui` e vendorizar dezenas de cards que os consomem — exatamente o tipo
de trabalho em que a tentação de "ajustar rapidinho" um componente pristine é
máxima. Este plano ergue a fronteira e a torna **verificável por comando**
(manifest de hashes + check no CI), no espírito do CHECKLIST deste repo: regra
que não se confere olhando diff ou rodando comando não é regra.

Decisões já tomadas pelo operador (não re-litigar):

- Camada de extensão em **`packages/ui/src/extensions/`**, importada como
  `@workspace/ui/extensions/<nome>`.
- Enforcement por **manifest de hashes + check no CI** (não só convenção).

## Estado atual

Árvore de `packages/ui/src` (commit `08e6576`):

```
src/components/.gitkeep
src/components/button.tsx   ← único componente
src/hooks/.gitkeep
src/lib/utils.ts
src/styles/globals.css
```

(Se o plano 011 rodou antes, `components/` e `hooks/` estarão populados com
~54 componentes e os `.gitkeep` de diretórios populados, removidos.)

`packages/ui/package.json` — scripts e exports de interesse:

```json
"scripts": {
  "lint": "eslint",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit"
},
"exports": {
  "./globals.css": "./src/styles/globals.css",
  "./postcss.config": "./postcss.config.mjs",
  "./lib/*": "./src/lib/*.ts",
  "./components/*": "./src/components/*.tsx",
  "./hooks/*": "./src/hooks/*.ts"
}
```

`src/components/button.tsx` exporta `{ Button, LinkButton, buttonVariants }`.
`Button` envolve `ButtonPrimitive` e `LinkButton` envolve `LinkPrimitive`,
ambos de `react-aria-components`, ambos com `data-slot="button"`. **Não se sabe
se `LinkButton` é upstream do style `aria-lyra` ou divergência de casa criada
no commit de adição** — o Passo 0 resolve isso empiricamente.

Fatos de ambiente que os passos usam:

- Os dois `components.json` (apps/web e packages/ui) têm `style: "aria-lyra"`
  e aliases `ui`/`components` → `@workspace/ui/components`. Regra vigente:
  **nunca editá-los** (`apps/web/AGENTS.md`, gerado pelo `next dev`).
- `.prettierrc`: `semi: false`, aspas duplas, `endOfLine: "lf"`, `printWidth:
  80`. O `button.tsx` local já está sem ponto-e-vírgula — a saída do CLI passa
  (ou passou) por essa formatação, o que importa para interpretar `--diff`.
- `turbo.json`: tasks `build`, `start`, `lint`, `format`, `typecheck`, `dev`,
  `test:e2e`. Decisão não óbvia de task é registrada em comentário JSONC no
  próprio arquivo (convenção do CHECKLIST §7).
- `.github/workflows/ci.yml`, job `verify`:
  install → `pnpm lint` → `pnpm typecheck` → `pnpm build` → install de browser
  → `pnpm test:e2e`. Atenção: a base de lint usa `eslint-plugin-only-warn`;
  enquanto o plano 001 não estiver DONE (confira no `plans/README.md`),
  `pnpm lint` sai 0 com qualquer quantidade de warnings — por isso as
  verificações deste plano rodam `eslint --max-warnings 0` direto no arquivo
  novo, o que morde nos dois estados.
- Raiz só orquestra: todo script de task do `package.json` raiz é
  `turbo <task>` (única exceção: `preinstall`).
- `README.md` — seção `## shadcn/ui` com a estratégia em prosa (3 parágrafos),
  sem link para mecanismo (que ainda não existe).
- `CHECKLIST.md` §5 ("Ao criar ou alterar um componente de UI") contém o item
  do `exports`, hoje verbatim: "Não mexer no `exports` de
  `packages/ui/package.json` — bundler e CLI do shadcn dependem desse mapa".
- Execuções paralelas: o plano 003 foi executado em 2026-08-11 (pode já estar
  commitado no seu checkout — a pré-condição de árvore limpa cuida do resto);
  o plano 011 pode ou não ter executado. Os dois casos são drift esperado.
- Regra de manutenção do CHECKLIST: **toda convenção nova entra no CHECKLIST.md
  no mesmo commit que a estabelece.**
- CLI do shadcn: sempre `pnpm dlx shadcn@latest ... -c apps/web` (nunca `npx`).
  O comando `diff` standalone está deprecado; preview/merge é
  `add <nome> --dry-run` / `--diff [arquivo]` / `--view [arquivo]`
  (os dois últimos implicam `--dry-run` — não escrevem nada).

## Comandos necessários

| Propósito | Comando | Esperado no sucesso |
|-----------|---------|---------------------|
| Instalar | `pnpm install` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Types | `pnpm typecheck` | exit 0 |
| Build | `pnpm build` | exit 0 |
| Guarda pristine | `pnpm check:pristine` | exit 0 (após Passo 3) |
| Atualizar manifest | `pnpm --filter @workspace/ui run update:pristine` | exit 0, lock reescrito |

(Todos na raiz. Os dois últimos passam a existir neste plano.)

## Escopo

**Em escopo** (únicos arquivos a modificar/criar):

- `packages/ui/src/extensions/` — novo (com `.gitkeep`)
- `packages/ui/src/extensions/link-button.tsx` — **condicional** (Passo 2a)
- `packages/ui/src/extensions/proof.tsx` e `apps/web/lib/proof.ts` —
  **temporários** do Passo 2b: criados, verificados e apagados; nunca
  commitados
- `packages/ui/src/components/button.tsx` — **condicional**, e só via CLI (Passo 2a)
- `packages/ui/src/components/.gitkeep` — remover se ainda existir (carona
  sancionada no `plans/README.md`, "Achados considerados e rejeitados")
- `packages/ui/package.json` — 2 scripts novos + 1 entrada **aditiva** no `exports`
- `packages/ui/scripts/check-pristine.mjs` — novo
- `packages/ui/pristine.lock.json` — novo (gerado pelo script)
- `turbo.json` — task `check:pristine`
- `package.json` (raiz) — script `check:pristine`
- `.github/workflows/ci.yml` — 1 step novo
- `AGENTS.md` — seção nova + emenda de 1 bullet
- `CHECKLIST.md` — itens novos em §5 e §8, emenda de 1 item em §5
- `README.md` — 1 frase de link na §shadcn/ui
- `plans/README.md` — só a linha de status deste plano
- `pnpm-lock.yaml` — **somente** se o Passo 2a rodar `add --overwrite` e o CLI
  tocar dependências (nunca editar à mão)

**Fora de escopo** (NÃO tocar, mesmo parecendo relacionado):

- Os dois `components.json` — regra vigente é nunca editá-los.
- `packages/ui/src/styles/globals.css` — fora da garantia pristine, e fora
  deste plano.
- As entradas **existentes** do `exports` — congeladas.
- `apps/web/**` — exceto a atualização mecânica de imports do Passo 2a caso o
  plano 011 já tenha vendorizado cards que importam `LinkButton`.
- `playwright.config.ts`, specs e2e, `instant-nav.rig.md`.
- `.agents/skills/**` e `.claude/skills/**` (skills vendorizadas de terceiros).
- Regra de lint proibindo import inverso — futuro possível, não aqui (ver
  Notas de manutenção).

## Fluxo de git

- Branch: `advisor/012-camadas-shadcn-pristine-extensao`
- Conventional commits em inglês. Alvo: **um único commit**
  (`feat(ui): establish pristine/extension layering with CI guard`) — a regra
  do CHECKLIST exige convenção e itens de checklist no mesmo commit, e o
  manifest só é honesto se nascer junto da fronteira que ele guarda. Exceção
  **obrigatória**: se o Passo 2a ocorrer, o restore do `button.tsx` + a
  movimentação do `LinkButton` formam um commit próprio e **anterior**
  (`refactor(ui): move LinkButton to the extensions layer`) — o diferencial do
  Passo 3.6 usa `git checkout` sobre `button.tsx` e reverteria uma restauração
  não commitada.
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 0: verificação empírica com o CLI (não escreve nada)

Na raiz do repo:

```
pnpm dlx shadcn@latest add button --view button.tsx -c apps/web
pnpm dlx shadcn@latest add button --diff button.tsx -c apps/web
```

`--view`/`--diff` implicam `--dry-run` — nenhum arquivo é escrito. Referência
deste plano: CLI 4.x (o repo invoca sempre `shadcn@latest`, por convenção); se
o output divergir do descrito — flags inexistentes, formato irreconhecível —
suspeite de major novo do CLI e trate como STOP. Responda e anote (vão para a
mensagem de commit):

- **(A) `LinkButton` é upstream?** No output do `--view` (o conteúdo que o
  upstream `aria-lyra` instalaria hoje, já com imports reescritos), procure
  `function LinkButton`. Presente → upstream (siga para 2b). Ausente →
  divergência de casa (siga para 2a).
- **(B) Quanto ruído de formatação o `--diff` carrega?** Critério objetivo: se
  existir ao menos uma linha do diff cuja única diferença é ponto-e-vírgula
  final ou estilo de aspas, a frase entre colchetes do texto do Passo 4 sobre
  ruído de formatação **fica**; caso contrário, **remova-a**.
- **(C) A camada é pristine de fato?** Sem rede: para cada arquivo de
  `src/components`, `src/hooks` e `src/lib`,
  `git log --oneline --follow -- <arquivo>` deve mostrar só commits de
  scaffold/adição/sync (no commit `08e6576`: `button.tsx` → só `c1dd30e`;
  `utils.ts` → só `4efed5c`), nenhum commit de edição manual posterior.
  Edição manual na história é STOP: o manifest congelaria uma divergência
  rotulando-a de upstream.

**Verificar**: os comandos do CLI saem com exit 0 e produzem output legível;
`git status --short` segue exatamente como antes deles (preview não escreve).

### Passo 1: estrutura da camada de extensão

1. Criar `packages/ui/src/extensions/.gitkeep` (vazio).
2. Remover `packages/ui/src/components/.gitkeep` **se** ainda existir ao lado
   de arquivos reais (carona sancionada; se o 011 já removeu, nada a fazer).
3. Em `packages/ui/package.json`:
   - Adicionar ao `exports`, **depois** da entrada `"./components/*"` e sem
     tocar em nenhuma entrada existente:

     ```json
     "./extensions/*": "./src/extensions/*.tsx",
     ```

   - Adicionar aos `scripts` (o script chega no Passo 3; adicionar já aqui
     evita editar o arquivo duas vezes):

     ```json
     "check:pristine": "node scripts/check-pristine.mjs",
     "update:pristine": "node scripts/check-pristine.mjs --update"
     ```

**Verificar**: `pnpm install` → exit 0 (manifest ainda parseia);
`pnpm typecheck` → exit 0.

### Passo 2: resolver o `LinkButton` (condicional pelo Passo 0-A)

#### 2a — `LinkButton` é divergência de casa

1. Criar `packages/ui/src/extensions/link-button.tsx` movendo para lá a função
   `LinkButton` exatamente como está hoje em `button.tsx` (linhas 70-88),
   ajustada para importar da pristine:

   ```tsx
   "use client"

   import { type VariantProps } from "class-variance-authority"
   import {
     Link as LinkPrimitive,
     type LinkProps as LinkPrimitiveProps,
   } from "react-aria-components"

   import { buttonVariants } from "@workspace/ui/components/button"
   import { cn } from "@workspace/ui/lib/utils"

   function LinkButton({
     className,
     variant = "default",
     size = "default",
     ...props
   }: Omit<LinkPrimitiveProps, "className"> &
     VariantProps<typeof buttonVariants> & {
       className?: string
     }) {
     return (
       <LinkPrimitive
         data-slot="button"
         data-variant={variant}
         data-size={size}
         className={cn(buttonVariants({ variant, size, className }))}
         {...props}
       />
     )
   }

   export { LinkButton }
   ```

   (Confira contra o `button.tsx` vivo antes de copiar: se o corpo local da
   função divergir do trecho acima, o corpo local vence — o objetivo é mover,
   não reescrever.)

2. Restaurar a pristine: `pnpm dlx shadcn@latest add button --overwrite -c apps/web`,
   depois `pnpm format`. Nota: `--overwrite` traz o upstream **de hoje** — se
   ele evoluiu além da remoção do `LinkButton`, isso é um sync legítimo, não um
   problema, desde que `pnpm typecheck` e `pnpm build` continuem verdes.
3. Atualizar consumidores: `grep -rn "LinkButton" apps/web packages/ui --include="*.tsx" --include="*.ts"`.
   No commit `08e6576` não há nenhum uso fora do próprio `button.tsx`; se o
   plano 011 rodou antes, cards vendorizados podem importar de
   `@workspace/ui/components/button` — troque nesses arquivos o import de
   `LinkButton` para `@workspace/ui/extensions/link-button` (mudança mecânica
   de import; não tocar em mais nada nos arquivos).
4. Provar a entrada do `exports` — o typecheck **não** a exercita (o `paths`
   do `apps/web/tsconfig.json` resolve `@workspace/ui/*` direto no
   filesystem). De dentro de `apps/web`:
   `node --input-type=module -e "console.log(import.meta.resolve('@workspace/ui/extensions/link-button'))"`
   → imprime `file:///…/packages/ui/src/extensions/link-button.tsx`. Erro
   `ERR_PACKAGE_PATH_NOT_EXPORTED` = a entrada do Passo 1 está errada.
5. **Commitar agora**: `refactor(ui): move LinkButton to the extensions layer`
   (ver "Fluxo de git" — obrigatório antes do Passo 3).

**Verificar**: `pnpm typecheck` → exit 0; `pnpm build` → exit 0;
`grep -n "LinkButton" packages/ui/src/components/button.tsx` → 0 matches.

#### 2b — `LinkButton` é upstream

Nada a mover. Provar o trilho da camada nova com uma baseline descartável
(ethos do repo: trilho não provado não existe). Atenção ao que cada comando
prova: o `paths` do `apps/web/tsconfig.json` resolve `@workspace/ui/*` direto
no filesystem, então o typecheck **não** exercita o `exports` — quem prova a
entrada do `exports` é o `import.meta.resolve`.

1. Criar `packages/ui/src/extensions/proof.tsx`:
   `export { Button as ProofButton } from "@workspace/ui/components/button"`
2. Criar `apps/web/lib/proof.ts`:
   `export { ProofButton } from "@workspace/ui/extensions/proof"`
3. `pnpm typecheck` → exit 0 (o arquivo existe e os tipos fecham).
4. De dentro de `apps/web`:
   `node --input-type=module -e "console.log(import.meta.resolve('@workspace/ui/extensions/proof'))"`
   → imprime `file:///…/packages/ui/src/extensions/proof.tsx`. Erro
   `ERR_PACKAGE_PATH_NOT_EXPORTED` = a entrada do Passo 1 está errada.
5. **Apagar os dois arquivos.** `git status --short` volta a mostrar só o
   escopo real.

**Verificar**: sequência na ordem exata; ao final, nenhum `proof.*` no diff.

### Passo 3: manifest + guarda

1. Criar `packages/ui/scripts/check-pristine.mjs`:

   ```js
   // Guarda da camada pristine (AGENTS.md §shadcn/ui): falha se qualquer
   // arquivo escrito pelo CLI do shadcn divergir do hash registrado em
   // pristine.lock.json. Sync legítimo de upstream reescreve o lock: --update.
   // process/console importados de módulos node: — o preset de lint não
   // habilita globals de Node; não remover os imports.
   import { createHash } from "node:crypto"
   import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
   import { join, relative, sep } from "node:path"
   import process from "node:process"
   import console from "node:console"
   import { fileURLToPath } from "node:url"

   const pkgRoot = fileURLToPath(new URL("..", import.meta.url))
   const lockPath = join(pkgRoot, "pristine.lock.json")
   const SCOPES = ["src/components", "src/hooks", "src/lib"]

   function listFiles(scope) {
     const dir = join(pkgRoot, scope)
     if (!existsSync(dir)) return []
     return readdirSync(dir, { withFileTypes: true, recursive: true })
       .filter((entry) => entry.isFile() && entry.name !== ".gitkeep")
       .map((entry) =>
         relative(pkgRoot, join(entry.parentPath, entry.name))
           .split(sep)
           .join("/")
       )
   }

   const files = SCOPES.flatMap(listFiles).sort()
   // Hash sobre o conteúdo com fim de linha normalizado para LF: o git deste
   // ambiente roda com core.autocrlf=true e o repo não tem .gitattributes,
   // então o mesmo arquivo alterna CRLF/LF entre checkouts (Windows × CI
   // Linux) sem mudar de conteúdo real. O escopo pristine é só código texto.
   const hashes = Object.fromEntries(
     files.map((file) => [
       file,
       "sha256-" +
         createHash("sha256")
           .update(
             readFileSync(join(pkgRoot, file), "utf8").replaceAll("\r\n", "\n")
           )
           .digest("hex"),
     ])
   )

   if (process.argv.includes("--update")) {
     const lock = {
       $comment:
         "Gerado por scripts/check-pristine.mjs --update. Não editar à mão.",
       files: hashes,
     }
     writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n")
     console.log(`pristine.lock.json atualizado: ${files.length} arquivo(s).`)
     process.exit(0)
   }

   if (!existsSync(lockPath)) {
     console.error(
       "pristine.lock.json não existe. Gere com: pnpm --filter @workspace/ui run update:pristine"
     )
     process.exit(1)
   }

   const lock = JSON.parse(readFileSync(lockPath, "utf8"))
   const problems = []
   for (const [file, hash] of Object.entries(lock.files)) {
     if (!(file in hashes)) {
       problems.push(`AUSENTE   ${file} — está no lock, não no disco`)
     } else if (hashes[file] !== hash) {
       problems.push(`ALTERADO  ${file} — hash difere do lock`)
     }
   }
   for (const file of files) {
     if (!(file in lock.files)) {
       problems.push(`NOVO      ${file} — está no disco, fora do lock`)
     }
   }

   if (problems.length > 0) {
     console.error("check:pristine FALHOU — camada pristine divergiu do manifest:\n")
     for (const problem of problems) console.error(`  ${problem}`)
     console.error(`
   Sync legítimo de upstream (via CLI do shadcn)? Rode
     pnpm --filter @workspace/ui run update:pristine
   e commite o pristine.lock.json junto. Edição manual? Reverta — divergência
   de casa vive em src/extensions/ (AGENTS.md §shadcn/ui).`)
     process.exit(1)
   }

   console.log(`check:pristine OK — ${files.length} arquivo(s) pristine conferem.`)
   ```

2. Gerar o manifest: `pnpm --filter @workspace/ui run update:pristine` →
   `packages/ui/pristine.lock.json` criado listando os arquivos de
   `src/components`, `src/hooks` e `src/lib` (sem `.gitkeep`). Conferir a
   correspondência com
   `git ls-files packages/ui/src/components packages/ui/src/hooks packages/ui/src/lib`:
   cada caminho listado, removido o prefixo `packages/ui/` e ignorados os
   `.gitkeep`, deve aparecer como chave do lock — e nenhuma chave a mais.
3. Task no `turbo.json` (depois de `typecheck`, com comentário JSONC —
   convenção do CHECKLIST §7):

   ```jsonc
   "check:pristine": {
     // Guarda da camada pristine do design system (AGENTS.md §shadcn/ui).
     // Sem dependsOn (não consome saída de ninguém) e sem outputs (é puro
     // check). Inputs explícitos, sem $TURBO_DEFAULT$: a task relê só o que
     // vigia — arquivos pristine, manifest, o próprio script e o package.json
     // (que define os scripts check/update).
     "inputs": [
       "src/components/**",
       "src/hooks/**",
       "src/lib/**",
       "pristine.lock.json",
       "scripts/check-pristine.mjs",
       "package.json"
     ]
   },
   ```

4. Script na raiz (`package.json`), junto dos demais: `"check:pristine": "turbo check:pristine"`.
5. Step no CI (`.github/workflows/ci.yml`), entre `pnpm typecheck` e
   `pnpm build`:

   ```yaml
       # Guarda da camada pristine do design system: falha se um arquivo
       # escrito pelo CLI do shadcn foi editado à mão (AGENTS.md §shadcn/ui).
       - run: pnpm check:pristine
   ```

6. **Diferencial — provar que a guarda morde** (obrigatório, não opcional):
   1. `pnpm check:pristine` → exit 0.
   2. Editar 1 caractere em `packages/ui/src/components/button.tsx` (ex.:
      trocar `"use client"` por `"use client" ` com espaço).
   3. `pnpm check:pristine` → **exit ≠ 0**, com `ALTERADO src/components/button.tsx`
      no output. Se sair 0, a guarda não morde — STOP.
   4. Desfazer a edição (`git checkout -- packages/ui/src/components/button.tsx`
      — seguro aqui: com o hash normalizando CRLF→LF, o fim de linha que o git
      reescrever no checkout não altera o hash; e no caminho 2a o `button.tsx`
      restaurado já está commitado).
   5. `pnpm check:pristine` → exit 0. Atenção ao cache do turbo: se o item 3
      desta sequência (o check vermelho) devolver verde instantâneo com
      `cache hit`, os `inputs` da task estão errados (não capturaram a
      mudança) — também é STOP.

**Verificar**: além do diferencial,
`pnpm --filter @workspace/ui exec eslint --max-warnings 0 scripts/check-pristine.mjs`
→ exit 0 (o preset usa `only-warn`, então `pnpm lint` sozinho não prova nada
até o plano 001 executar; `--max-warnings 0` faz este check morder) e
`pnpm build` → exit 0.

### Passo 4: documentar a convenção no `AGENTS.md`

Inserir a seção abaixo imediatamente **após** a seção "# Estrutura do
monorepo" — antes da próxima seção de nível 1 (no momento da escrita, "#
Tipografia e preset do design system", vinda do plano 003; se ela não existir
no seu checkout, a próxima é "# Renderização"). Ajustar a frase entre
colchetes conforme o critério do Passo 0-B e **remover os colchetes** (ou a
frase inteira, se o critério mandou remover):

```markdown
# shadcn/ui: camada pristine e camada de extensão

Componente shadcn é **código copiado, não dependência** — sem uma fronteira
explícita, meses depois ninguém sabe o que é do upstream e o que é de casa. A
fronteira deste repositório é por diretório, dentro de `packages/ui/src`:

- **Camada pristine — `components/`, `hooks/` e `lib/`**: tudo que o CLI do
  shadcn escreve, exatamente como ele escreveu. Nenhuma edição manual, nunca.
  O único fluxo que muda esses arquivos é o sync abaixo.
- **Camada de extensão — `extensions/`**: todo o código de casa do design
  system — wrappers, variantes, composições reutilizáveis e componentes
  net-new. Importada como `@workspace/ui/extensions/<nome>`. Segue a mesma
  anatomia dos componentes pristine (`cva` com export do `*Variants`,
  primitivas de `react-aria-components`, `data-slot`, `cn()`). Composição
  específica do app continua em `apps/web/components` — a camada de extensão é
  design system, não app.
- **Fora da garantia**: `src/styles/globals.css` (tokens e tema são de casa;
  divergência esperada — mudanças de CSS do upstream se revisam no sync com
  `--diff globals.css`) e os `components.json` (config, regida por regra
  própria: nunca editar).

Direção de dependência: `extensions/` importa `components/`; `components/`
**nunca** importa `extensions/` — o CLI reescreve imports para o alias `ui`, e
um import invertido quebraria no próximo sync. Quando existe extensão de um
componente, o app importa a extensão, não o pristine por baixo dela.

## Sync com upstream

- Adicionar ou atualizar: `pnpm dlx shadcn@latest add <nome> -c apps/web`.
  Preview antes: `--dry-run` (lista arquivos) e `--diff [arquivo]`; aceite
  upstream com `--overwrite`. Nunca buscar arquivo cru do GitHub — o comando
  `diff` standalone do CLI está deprecado; o fluxo é `add --diff`. [O `--diff`
  carrega ruído de formatação (o repo aplica Prettier sobre a saída do CLI);
  avalie o diff pelo conteúdo, não pelo tamanho.]
- Depois do CLI: `pnpm format`, depois
  `pnpm --filter @workspace/ui run update:pristine`.
- Commit **dedicado** — `chore(ui): sync <nome> from upstream` — contendo só a
  saída do CLI, o `pristine.lock.json` e o lockfile do pnpm (se o CLI adicionou
  dependências). Nunca misturar sync com trabalho de feature: é essa separação
  que mantém `git log -- packages/ui/src/components` legível como changelog de
  upstream.

## O manifest `pristine.lock.json`

`packages/ui/pristine.lock.json` registra o sha256 de cada arquivo pristine, e
`pnpm check:pristine` (task do turbo, step do CI) falha se qualquer um
divergir. Vermelho significa uma de duas coisas: sync legítimo sem atualizar o
manifest — rode `pnpm --filter @workspace/ui run update:pristine` e commite
junto — ou edição manual de arquivo pristine — reverta; divergência de casa
vive em `extensions/`. A guarda detecta divergência, não autoria: quem garante
que a mudança veio mesmo do CLI é o review do sync commit, cujo diff deve
conter só saída de CLI, manifest e lockfile.

O `exports` de `packages/ui/package.json` continua congelado nas entradas
existentes; `./extensions/*` é a exceção aditiva que codifica esta camada.
Entrada nova além dela (ex.: `./extensions/hooks/*` quando o primeiro hook de
casa nascer) entra no mesmo commit do primeiro arquivo que a exige, nunca
antes.
```

Emendar também o bullet do `exports` em "# Estrutura do monorepo". Hoje:

> **O campo `exports` do `packages/ui/package.json` é infraestrutura, não
> conveniência.** É por ele que `@workspace/ui/components/*`,
> `@workspace/ui/lib/*` e `@workspace/ui/hooks/*` resolvem — tanto para o
> bundler quanto para o CLI do shadcn, que lê esse mapa para descobrir onde
> escrever cada arquivo. Mexer nele quebra os dois.

Acrescentar ao final do bullet: `As entradas existentes não mudam nunca;
entrada nova, aditiva, só para a camada de extensão (ver §shadcn/ui: camada
pristine e camada de extensão).`

**Verificar**: `grep -n "camada pristine" AGENTS.md` ≥ 1 match;
`pnpm lint` → exit 0.

### Passo 5: CHECKLIST.md e README.md (mesmo commit — regra do CHECKLIST)

Em `CHECKLIST.md` §5 ("Ao criar ou alterar um componente de UI"), adicionar:

```markdown
- [ ] Arquivo em `packages/ui/src/{components,hooks,lib}` (camada pristine) nunca é editado à mão: só o fluxo de sync via CLI escreve ali, em commit dedicado `chore(ui): sync <nome> from upstream` com `pristine.lock.json` atualizado no mesmo commit — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui
- [ ] Divergência de casa no design system (wrapper, variante, composição, componente net-new) vai em `packages/ui/src/extensions`, importada como `@workspace/ui/extensions/<nome>`, com a mesma anatomia dos componentes pristine — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui
- [ ] Direção de import: `extensions/` importa `components/`; `components/` nunca importa `extensions/`; quando existe extensão de um componente, o app importa a extensão — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui
- [ ] Sync de upstream: preview com `pnpm dlx shadcn@latest add <nome> --dry-run`/`--diff` (nunca fetch cru do GitHub), aceite com `--overwrite`, depois `pnpm format` e `pnpm --filter @workspace/ui run update:pristine` — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui
```

Substituir o item existente do `exports` em §5:

- De: `- [ ] Não mexer no \`exports\` de \`packages/ui/package.json\` — bundler e CLI do shadcn dependem desse mapa — fonte: [AGENTS.md](AGENTS.md) §Estrutura do monorepo`
- Para: `- [ ] \`exports\` de \`packages/ui/package.json\`: entradas existentes congeladas (bundler e CLI do shadcn dependem do mapa); entrada nova só aditiva e só para a camada de extensão — fonte: [AGENTS.md](AGENTS.md) §shadcn/ui: camada pristine e camada de extensão`

Em §8, atualizar o item da ordem do pipeline:

- De: `Ordem do pipeline: install → lint → typecheck → build → instalação de browser → test:e2e`
- Para: `Ordem do pipeline: install → lint → typecheck → check:pristine → build → instalação de browser → test:e2e`

Em `README.md`, ao final da seção `## shadcn/ui` (hoje termina em "…base de
comparação (capacidade de fazer diff com o upstream)."), adicionar um
parágrafo:

```markdown
O mecanismo que sustenta isso — a fronteira por diretório, o fluxo de sync e o
manifest `pristine.lock.json` verificado no CI — está documentado no
[AGENTS.md](AGENTS.md).
```

**Verificar**: `grep -c "shadcn/ui" CHECKLIST.md` ≥ 4;
`grep -n "pristine.lock.json" README.md` → 1 match; nenhuma caixa `[x]` no
diff do CHECKLIST (as caixas nunca são marcadas nesse arquivo).

### Passo 6: verificação final e fechamento

1. `pnpm lint` → exit 0 (sanidade) e
   `pnpm --filter @workspace/ui exec eslint --max-warnings 0 scripts/check-pristine.mjs`
   → exit 0 (o check que morde)
2. `pnpm typecheck` → exit 0
3. `pnpm check:pristine` → exit 0
4. `pnpm build` → exit 0
5. `git status` → só arquivos do escopo
6. Commit(s) conforme "Fluxo de git"; a mensagem registra o resultado do
   Passo 0-A (ex.: `LinkButton confirmed upstream via add --view` ou
   `LinkButton was local divergence; moved to extensions layer`).
7. Atualizar a linha do 012 em `plans/README.md` (status → DONE).

## Plano de teste

Não há mudança de comportamento de runtime do app — não entram testes e2e
novos. Os testes deste plano são os dois diferenciais, obrigatórios:

- **Guarda** (Passo 3.6): edição manual em arquivo pristine → `check:pristine`
  vermelho → revert → verde. Inclui a checagem anti-falso-verde do cache do
  turbo.
- **Trilho da camada** (Passo 2a via `link-button.tsx`, ou Passo 2b via
  baseline descartável): um import real de `@workspace/ui/extensions/<nome>`
  compila (typecheck, via `paths` do tsconfig) **e** resolve pela entrada nova
  do `exports` (`import.meta.resolve` — são mecanismos distintos; os dois
  precisam passar).

## Critérios de done

Todos verificáveis por comando; TODOS devem valer:

- [ ] `packages/ui/src/extensions/` existe no git (`git ls-files packages/ui/src/extensions` ≥ 1 arquivo)
- [ ] `grep -n "\"./extensions/\*\"" packages/ui/package.json` → 1 match; entradas pré-existentes do `exports` intactas
- [ ] `pnpm check:pristine` → exit 0
- [ ] Diferencial da guarda executado (vermelho com arquivo editado; verde após revert; sem `cache hit` falso)
- [ ] `grep -n "check:pristine" package.json turbo.json .github/workflows/ci.yml` → ≥ 1 match em cada
- [ ] `grep -n "camada pristine" AGENTS.md` ≥ 1; itens novos presentes no CHECKLIST §5/§8; frase de link no README §shadcn/ui
- [ ] Pergunta do `LinkButton` respondida e registrada na mensagem de commit
- [ ] `pnpm --filter @workspace/ui exec eslint --max-warnings 0 scripts/check-pristine.mjs` → exit 0
- [ ] `pnpm typecheck` → exit 0; `pnpm build` → exit 0
- [ ] `git status` limpo fora do escopo; nenhum `components.json` ou `globals.css` no diff
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

Pare e reporte (não improvise) se:

- A pré-condição de árvore limpa falhar e o estado não se resolver com um
  simples "aguardar o plano em voo commitar".
- A checagem de drift mostrar mudanças que **não** sejam as execuções dos
  planos 003/011 (em especial: `button.tsx` editado à mão, `exports` já
  alterado, ou um diretório `src/extensions/` já existente).
- Qualquer invocação do CLI (Passos 0 e 2a) falhar: sem rede, exigindo
  interação, output irreconhecível (major novo do CLI?), ou o item `button`
  não existindo mais no registry do style `aria-lyra` — a pergunta do
  `LinkButton` fica irrespondível.
- O Passo 0-C encontrar commit de edição manual na história de um arquivo
  pristine.
- O Passo 2a for necessário e o `grep` de consumidores encontrar usos de
  `LinkButton` cuja troca de import não seja mecânica (ex.: re-export com
  transformação no meio).
- Após o `--overwrite` do Passo 2a, `pnpm typecheck` ou `pnpm build` ficarem
  vermelhos — o upstream evoluiu de forma incompatível, e absorver um sync
  grande é outra tarefa, não esta.
- O diferencial do Passo 3.6 não produzir exit ≠ 0, ou produzir verde por
  `cache hit` do turbo.
- `eslint --max-warnings 0` reprovar o `.mjs` por regra que os imports de
  `node:process`/`node:console` não resolvam (preset com surpresas — não
  silenciar regra por conta própria).

## Notas de manutenção

- **Executor do plano 011**: o `shadcn add` em massa do passo 1 daquele plano
  deve terminar com `pnpm format` +
  `pnpm --filter @workspace/ui run update:pristine`, e o commit deve incluir o
  `pristine.lock.json` — o 011 foi escrito antes deste plano e não menciona o
  manifest (a nota de dependência no `plans/README.md` registra isso).
- **Fim de linha**: o hash normaliza CRLF→LF de propósito — o git do ambiente
  roda com `core.autocrlf=true` e o repo não tem `.gitattributes`, então o
  mesmo arquivo alterna de fim de linha entre checkouts (Windows × CI Linux)
  sem mudar de conteúdo real. Se o repo um dia adotar `.gitattributes`
  (`* text=auto eol=lf`), a normalização continua correta; não removê-la.
- **Bump de Prettier** pode reformatar arquivos pristine em massa: o
  `check:pristine` fica vermelho e o remédio é `pnpm format` +
  `update:pristine` **no mesmo commit do bump** — é mudança mecânica, não
  divergência.
- **Plano 002 (`format:check`)**: o script e o lock nascem Prettier-compatíveis
  (LF, 2 espaços, sem ponto-e-vírgula, newline final). Se o glob do
  `format:check` passar a cobrir `.mjs`/`.json`, nada deve quebrar.
- **Plano 001 (lint que morde)**: os imports de `node:process`/`node:console`
  no script existem porque o preset de lint não habilita globals de Node — não
  "simplificar" removendo-os.
- A skill vendorizada `.agents/skills/shadcn` usa `npx` nos exemplos; a regra
  deste repo (`pnpm dlx`, CHECKLIST §2) prevalece.
- **Futuro possível, fora deste plano**: regra de lint que proíba
  `components/` de importar `extensions/` (hoje a direção é convenção +
  review). Se a camada crescer, vale um plano próprio.
- Hooks e utilitários de casa ainda não existem; quando o primeiro nascer, a
  entrada `./extensions/hooks/*` (ou equivalente) entra no `exports` **no
  mesmo commit**, pela regra aditiva documentada no Passo 4.
