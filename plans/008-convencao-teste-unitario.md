# Plan 008: Estabelecer a convenção de teste unitário (vitest)

> **Instruções ao executor**: siga este plano passo a passo. Rode todo comando de
> verificação e confirme o resultado esperado antes do próximo passo. Se qualquer
> condição da seção "Condições de STOP" ocorrer, pare e reporte — não improvise.
> Ao terminar, atualize a linha deste plano em `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- turbo.json package.json apps/web packages/ui .github/workflows/ci.yml AGENTS.md`
> Se algum arquivo em escopo mudou desde a escrita deste plano, compare os
> trechos de "Estado atual" com o código vivo antes de prosseguir; em caso de
> divergência, trate como condição de STOP.

## Status

- **Prioridade**: P2
- **Esforço**: M
- **Risco**: LOW
- **Depende de**: nenhum (se o plano 001 já landou, o lint estrito vai cobrar imports limpos nos testes — bom)
- **Categoria**: tests
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

O AGENTS.md declara "testável" como pilar do código perfeito, mas a única
camada de teste do repo é o e2e `instant()` — que guarda **navegação**, não
lógica. `packages/ui` (o design system, produto central do boilerplate) tem
zero testes; `cn()` e `Button` não têm nenhuma verificação. Mais importante
para um boilerplate: **não existe convenção definida** — o primeiro consumidor
que precisar de um teste unitário vai inventar a própria (runner, localização,
nomenclatura), que é exatamente o que um boilerplate existe para evitar.

Este plano instala vitest por workspace, escreve três testes exemplares (que
são a documentação viva da convenção) e registra a convenção no AGENTS.md.

## Estado atual

- Nenhum vitest/jest/@testing-library em nenhum manifest (verificado por grep).
- `turbo.json` — tasks: `build`, `start`, `lint`, `format`, `typecheck`, `dev`,
  `test:e2e`. Sem task `test`.
- Raiz `package.json` — scripts espelham as tasks do turbo; sem `test`.
- `.github/workflows/ci.yml` — install → lint → typecheck → build → playwright
  install → test:e2e.
- Alvos dos testes exemplares:
  - `packages/ui/src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), 6 linhas.
  - `packages/ui/src/components/button.tsx` — `Button` sobre
    `react-aria-components` (`"use client"` no topo — vitest ignora a diretiva,
    sem problema), com `buttonVariants` (cva) e `data-slot="button"`.
  - `apps/web/lib/demo-topics.ts` — `findDemoTopic(slug)` pura, retorna
    `DemoTopic | undefined`.
- Versões relevantes: React 19.2.8; `@types/react` fixado por override na raiz.
  `@testing-library/react` precisa ser ≥ 16 (suporte a React 19).
- Convenções do repo que se aplicam:
  - Dependência de workspace via `pnpm --filter <ws> add -D` — **nunca** na
    raiz (AGENTS.md).
  - Ambos os workspaces são `"type": "module"` — configs em `.ts` funcionam.
  - e2e mora em `apps/web/e2e/` e roda por task própria — a task `test` nova
    NÃO deve engolir os specs do Playwright.

## Comandos necessários

| Propósito       | Comando                          | Esperado no sucesso |
|-----------------|----------------------------------|---------------------|
| Instalar        | `pnpm install`                   | exit 0              |
| Testes (novo)   | `pnpm test`                      | todos passam        |
| Testes de um ws | `pnpm --filter @workspace/ui test` | todos passam      |
| Types           | `pnpm typecheck`                 | exit 0              |
| Lint            | `pnpm lint`                      | exit 0              |
| E2E (sanidade)  | `pnpm test:e2e`                  | 6 testes passam     |

## Escopo

**Em escopo**:

- `packages/ui`: `package.json` (deps + script), `vitest.config.ts` (novo),
  `src/lib/utils.test.ts` (novo), `src/components/button.test.tsx` (novo),
  `vitest.setup.ts` (novo)
- `apps/web`: `package.json` (deps + script), `vitest.config.ts` (novo),
  `lib/demo-topics.test.ts` (novo)
- `turbo.json` (task `test`), raiz `package.json` (script `test`)
- `.github/workflows/ci.yml` (passo `pnpm test`)
- `AGENTS.md` (subseção nova em "# Testes" + linha na tabela de comandos)

**Fora de escopo** (NÃO tocar):

- `apps/web/e2e/**` e `playwright.config.ts` — o e2e é outra camada, com
  contrato próprio (`instant-nav.rig.md`).
- `packages/eslint-config` / `packages/typescript-config` — não têm lógica a
  testar; não ganham vitest.
- Cobertura (coverage) e thresholds — deferido; primeiro a convenção existe.

## Fluxo de git

- Branch: `advisor/008-convencao-teste-unitario`
- Commits: `feat: add vitest unit test convention with exemplar tests` e
  `docs: record unit test convention in AGENTS.md`.
- NÃO fazer push nem abrir PR sem instrução do operador.

## Passos

### Passo 1: dependências

```
pnpm --filter @workspace/ui add -D vitest jsdom @testing-library/react @testing-library/jest-dom
pnpm --filter web add -D vitest
```

(`apps/web` só testa lógica pura por ora — sem jsdom/testing-library até
precisar; a ui é quem testa componente.)

**Verificar**: `pnpm install` → exit 0; os pacotes aparecem nas devDependencies
dos workspaces certos (não na raiz).

### Passo 2: configs

`packages/ui/vitest.config.ts`:

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Espelha o paths do tsconfig: imports internos usam @workspace/ui/*.
    alias: { "@workspace/ui": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
})
```

`packages/ui/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
```

`apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["{app,lib,components,hooks}/**/*.test.{ts,tsx}"],
    // e2e/ fica de fora: Playwright tem runner e contrato próprios.
  },
})
```

Scripts: `"test": "vitest run"` nos dois workspaces.

**Verificar**: `pnpm --filter @workspace/ui test` e `pnpm --filter web test` →
"no test files found" ainda não (após passo 3 passam); por ora basta o comando
resolver o binário sem erro de config. Se `import.meta.dirname` não existir na
versão de Node local (<20.11), use
`path.dirname(new URL(import.meta.url).pathname)` — mas o repo exige Node ≥22,
então trate isso como sinal de ambiente errado.

### Passo 3: testes exemplares

`packages/ui/src/lib/utils.test.ts` — cobre o contrato real do `cn()`:

```ts
import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
  it("mescla classes condicionais", () => {
    expect(cn("a", false && "b", "c")).toBe("a c")
  })

  it("resolve conflito de utilities pelo último", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("não mescla utilities de eixos diferentes", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4")
  })
})
```

`packages/ui/src/components/button.test.tsx` — render de verdade, sem mock:

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  it("renderiza com o slot e a variant default", () => {
    render(<Button>Salvar</Button>)
    const button = screen.getByRole("button", { name: "Salvar" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "default")
  })

  it("propaga variant e size para os data-attributes", () => {
    render(
      <Button variant="destructive" size="sm">
        Excluir
      </Button>
    )
    const button = screen.getByRole("button", { name: "Excluir" })
    expect(button).toHaveAttribute("data-variant", "destructive")
    expect(button).toHaveAttribute("data-size", "sm")
  })

  it("fica desabilitado com isDisabled (API do react-aria)", () => {
    render(<Button isDisabled>Salvar</Button>)
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled()
  })
})
```

`apps/web/lib/demo-topics.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { demoTopics, findDemoTopic } from "./demo-topics"

describe("findDemoTopic", () => {
  it("encontra todo slug listado", () => {
    for (const topic of demoTopics) {
      expect(findDemoTopic(topic.slug)).toBe(topic)
    }
  })

  it("retorna undefined para slug desconhecido", () => {
    expect(findDemoTopic("nao-existe")).toBeUndefined()
  })
})
```

**Verificar**: `pnpm --filter @workspace/ui test` → 6 passam;
`pnpm --filter web test` → 2 passam. `pnpm typecheck` → exit 0 (se os arquivos
de teste derem erro de tipo por falta dos types do vitest, adicione
`"types": ["vitest/globals"]`? NÃO — os testes importam tudo explicitamente de
`vitest`, sem globals; um erro aqui indica outra causa, investigue).

### Passo 4: orquestração

- `turbo.json`, nova task:

  ```jsonc
  "test": {
    "dependsOn": ["^test"]
  }
  ```

- Raiz `package.json`: `"test": "turbo test"`.
- `.github/workflows/ci.yml`: inserir `- run: pnpm test` entre o `typecheck` e
  o `build` (unit falha rápido; não precisa de build antes).

**Verificar**: `pnpm test` na raiz → as duas suítes rodam via turbo, 8 testes
passam; workspaces sem script `test` (eslint-config, typescript-config) são
ignorados sem erro.

### Passo 5: registrar a convenção

No `AGENTS.md`, dentro da seção `# Testes`, adicionar uma subseção curta
(`## Testes unitários`) com a convenção:

- vitest por workspace; arquivos `*.test.ts(x)` **colocados ao lado do fonte**
  (e2e continua separado em `e2e/`, com contrato próprio).
- Imports explícitos de `vitest` (sem modo globals).
- jsdom + Testing Library **só** onde há componente (hoje: `packages/ui`);
  lógica pura roda em ambiente node.
- Comando canônico: `pnpm test` (adicionar linha na tabela de comandos:
  `| Testes unitários | pnpm test |`).

**Verificar**: `grep -n "pnpm test" AGENTS.md` → ≥ 1 match na tabela.

## Plano de teste

Os testes novos SÃO o entregável. Diferencial obrigatório: quebre de propósito
uma asserção (ex.: troque `"p-4"` por `"p-2"` no teste de conflito), rode
`pnpm test` → exit ≠ 0; desfaça, rode de novo → exit 0. Sanidade final:
`pnpm test:e2e` → 6/6 (nada do e2e foi afetado).

## Critérios de done

- [ ] `pnpm test` → exit 0, 8 testes passando (6 ui + 2 web)
- [ ] Diferencial acima produz exit ≠ 0 e volta a 0
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` → exit 0
- [ ] `pnpm test:e2e` → 6/6
- [ ] CI tem o passo `pnpm test` antes do build
- [ ] AGENTS.md documenta a convenção e a tabela tem `pnpm test`
- [ ] Nenhuma dep de teste na raiz (`grep -n "vitest\|testing-library" package.json` → 0)
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- `@testing-library/react` reclamar da versão do React (peer) — não forçar
  resolução nem downgrade; reporte as versões envolvidas.
- O teste do Button falhar porque o `react-aria-components` exige provider ou
  contexto que o render simples não dá — reporte o erro em vez de mockar o
  react-aria (mock aqui destruiria o valor do teste exemplar).
- A task `test` do turbo entrar em conflito com `test:e2e` (nomes, cache) —
  pare e descreva o conflito.

## Notas de manutenção

- A convenção "jsdom só onde há DOM" deve sobreviver: se `apps/web` ganhar
  testes de componente, o `vitest.config.ts` dele muda para
  `environment: "jsdom"` por arquivo (`// @vitest-environment jsdom`) ou por
  glob — não globalmente, para os testes de lógica continuarem rápidos.
- Quando o plano 009 adicionar componentes novos ao design system, cada um deve
  chegar com um `*.test.tsx` no padrão do `button.test.tsx` — o revisor cobra.
- Cobertura (c8/istanbul) ficou explicitamente de fora; se o repo crescer,
  reavaliar em outro plano.
