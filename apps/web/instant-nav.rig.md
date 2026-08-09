# Rig de navegação instantânea — `apps/web`

Contrato de como buildar, expor e medir esta aplicação para os testes `instant()`.
Vive junto do app, não na raiz: é infra do `apps/web`, e um segundo app do
monorepo terá o seu.

## BUILD

```
pnpm --filter web build
```

O Playwright roda `pnpm build && pnpm start` sozinho, via `webServer` em
[playwright.config.ts](playwright.config.ts). **Nunca medir contra `next dev`**:
o Next não faz prefetch em desenvolvimento, então a navegação client-side não
teria o que medir.

## EXPOSE

`experimental.exposeTestingApiInProductionBuild` em
[next.config.ts](next.config.ts), atrás de `process.env.NEXT_E2E === "1"`.

O `webServer` define `NEXT_E2E: "1"` pela opção `env` do Playwright — não por
prefixo de shell, que não existe no Windows.

> **`NEXT_E2E` jamais é definido em deploy voltado ao usuário.** Sem ele o
> testing API não é exposto — e `instant()` **não lança erro** nesse caso, ele
> simplesmente passa por vazio. Um verde num ambiente sem a flag não significa
> nada.

## RUN

`http://127.0.0.1:3100`.

Porta dedicada e host `127.0.0.1` de propósito: o testing API usa o cookie
`next-instant-navigation-testing`, **escopado por domínio e não por porta**. Um
`next dev` em `localhost:3000` compartilharia o cookie e contaminaria a run.

## TEST USER

Nenhum. As rotas cobertas são públicas e não leem sessão. Quando surgir rota
autenticada, injetar a sessão por `storageState` — sem chamar `page.goto` no
setup, porque o `instant()` de carga inicial precisa que a primeira navegação
seja a dele.

## DRIFT

Dois projects em [playwright.config.ts](playwright.config.ts), desktop e mobile:
o shell tem que bater com o render real em todos os breakpoints. Um skeleton que
só serve o desktop vira layout shift no mobile.

`retries: 0` de propósito — `instant()` é uma régua, não um cronômetro. Teste que
só passa na segunda tentativa está medindo tempo, não estrutura.

## LOOP

Ao cobrir uma rota nova, nesta ordem:

1. **Baseline descartável** — o mesmo spec **sem** o `instant()`, provando que os
   marcadores renderizam para este usuário. Sem isso, um vermelho pode ser
   seletor errado, redirect ou empty state, e não navegação lenta.
   **Apagar antes do commit.**
2. **Vermelho** — o spec com o lock falha.
3. **Correção** — empurrar os boundaries para baixo até passar.
4. **Diferencial** — desfazer a correção, confirmar o vermelho, refazer.

O passo 4 é o que separa um teste que guarda algo de um que passa por vazio.

### Diferencial verificado nesta rota

Trocar `cacheLife("hours")` por `cacheLife("seconds")` em
[app/demo/page.tsx](app/demo/page.tsx) e adicionar `export const instant = false`
derruba os dois specs de `/demo`: `stale` abaixo de 30s é excluído do prerender,
o shell deixa de existir e `demo-shell` não é encontrado. O spec de
`/demo/[slug]` continua verde, porque é outra rota.

Sem o `instant = false`, o mesmo `cacheLife("seconds")` falha ainda antes, no
build, com `blocking-prerender-dynamic`.
