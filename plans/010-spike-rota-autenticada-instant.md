# Plan 010: Spike — rota autenticada com navegação instantânea

> **Instruções ao executor**: este é um plano de **spike**: o entregável é uma
> rota-exemplo funcional + o spec `instant()` que a guarda + a atualização do
> contrato no rig — e um registro honesto do que ficou aberto. Siga o LOOP do
> rig à risca (baseline descartável → vermelho → correção → diferencial). Em
> condição de STOP, pare e reporte. Ao terminar, atualize `plans/README.md`.
>
> **Checagem de drift (rode primeiro)**:
> `git diff --stat 3870aff..HEAD -- apps/web/app apps/web/e2e apps/web/playwright.config.ts apps/web/instant-nav.rig.md`
> Se os arquivos mudaram desde a escrita deste plano, compare os trechos de
> "Estado atual" com o código vivo antes de prosseguir; divergência = STOP.

## Status

- **Prioridade**: P3
- **Esforço**: M‑L (estimativa grossa — é spike)
- **Risco**: MED (território novo: testing API + cookies; o build valida cedo)
- **Depende de**: nenhum obrigatório (recomendado após 001–005 para o CI estar confiável)
- **Categoria**: direction (spike)
- **Planejado em**: commit `3870aff`, 2026-08-10

## Por que isso importa

O contrato de navegação instantânea do repo (`apps/web/instant-nav.rig.md`) já
**antecipa** rotas autenticadas na seção TEST USER: "Quando surgir rota
autenticada, injetar a sessão por `storageState` — sem chamar `page.goto` no
setup, porque o `instant()` de carga inicial precisa que a primeira navegação
seja a dele." É intenção registrada e não entregue — e é o cenário que
qualquer app real enfrenta primeiro: quase tudo que importa fica atrás de
login. Sem um exemplo, o primeiro consumidor do boilerplate vai descobrir
sozinho (e provavelmente errado) como sessão, shell estático e prefetch
convivem sob Cache Components.

## Estado atual

- `apps/web/instant-nav.rig.md:52-57` (TEST USER) — o contrato citado acima.
  O LOOP (linhas 68–80) define o ciclo baseline→vermelho→correção→diferencial;
  o passo 4 (diferencial) é obrigatório.
- Rotas existentes: `/` (estática), `/demo` (shell + `io()`), `/demo/[slug]`
  (shell compartilhado + `params` como promise dentro do boundary). O exemplar
  de spec é `apps/web/e2e/demo.instant.spec.ts`; o exemplar de rota com
  conteúdo diferido é `apps/web/app/demo/page.tsx`.
- `apps/web/playwright.config.ts` — dois projects (desktop/mobile), `retries: 0`,
  `webServer` roda `pnpm build && pnpm start` em `127.0.0.1:3100` com
  `NEXT_E2E: "1"` via `env` (nunca prefixo de shell — Windows).
- Não há middleware/proxy, nem auth lib, nem rota de API no app.
- Regras do AGENTS.md que governam o design: leituras de request ficam abaixo
  de `<Suspense>`; `io()` para não-determinismo (não bloqueia prefetch);
  `connection()` só quando renderizar precisa esperar request real; o shell
  estático é o que entra no prefetch. Leia
  `apps/web/node_modules/next/dist/docs/` sobre `cookies()` antes de codar —
  a memória do modelo sobre esta versão do Next é não confiável.

## Design proposto (ponto de partida do spike)

- **Rota**: `/conta` — página com shell estático (header "Sua conta") e, abaixo
  de `<Suspense>`, um componente que lê o cookie de sessão demo via `cookies()`
  e mostra o "usuário" logado. Sem provider real: a "sessão" é um cookie
  `demo-session` com um nome de usuário — **nenhum segredo, nenhuma senha**;
  é demonstração de forma, não de segurança (dizer isso em comentário).
- **Login**: uma Server Action (ou route handler `POST /conta/login`) que seta
  o cookie e redireciona — o suficiente para um humano usar em dev.
- **Sem sessão**: o componente abaixo do boundary mostra o estado "não logado"
  com o link/form de login — a rota continua pública e o shell é o mesmo (o
  que evita `redirect()` no topo, que amarraria o shell ao request).
- **Setup do Playwright**: project `setup` que constrói o `storageState` **via
  `request` API** (POST no endpoint de login com `playwright.request.newContext`)
  — sem `page.goto`, honrando o rig. Os projects desktop/mobile dependem do
  setup e usam `storageState` só nos specs de `/conta`.

## Questões abertas que o spike deve responder (registrar no passo final)

- **Q1**: `cookies()` abaixo do boundary mantém o shell no prerender e o
  prefetch quente? (Expectativa: sim — é o caso canônico de "request data
  abaixo do Suspense"; provar com o `instant()`.)
- **Q2**: precisa de `io()` além de `cookies()`? (`cookies()` já marca leitura
  de request; a dúvida é se algum outro não-determinismo da rota exige `io()`.)
- **Q3**: o `storageState` interage com o cookie
  `next-instant-navigation-testing` do testing API? (O rig avisa que o cookie é
  escopado por domínio — conferir que o storageState não o sobrescreve/limpa.)
- **Q4**: Server Action vs route handler para o login demo — qual fica mais
  didático como convenção do boilerplate?

## Comandos necessários

| Propósito | Comando          | Esperado no sucesso |
|-----------|------------------|---------------------|
| Types     | `pnpm typecheck` | exit 0              |
| Build     | `pnpm build`     | exit 0 — atenção à tabela de rotas: `/conta` deve ter shell estático |
| E2E       | `pnpm test:e2e`  | suite inteira passa (6 atuais + os novos) |
| Dev       | `pnpm dev`       | serve em :3000      |

Skills úteis se disponíveis: `next-cache-components-optimizer` (é literalmente
o playbook deste loop), `next-dev-loop`, `agent-browser`.

## Escopo

**Em escopo**:

- `apps/web/app/conta/**` (novo)
- `apps/web/e2e/conta.instant.spec.ts` (novo) + setup de auth em
  `apps/web/e2e/` e ajustes de projects no `playwright.config.ts`
- `apps/web/instant-nav.rig.md` (atualizar TEST USER com o que ficou real)
- `plans/010-notas-spike-auth.md` (novo — registro do spike)

**Fora de escopo**:

- Auth de verdade (NextAuth/Clerk/etc.), senhas, JWT — o cookie demo é forma,
  não segurança; integração real é decisão do maintainer.
- Middleware/proxy.
- Mudar os specs/rotas de `/demo` — são o exemplar estável.
- `export const prefetch` — só com justificativa forte registrada nas notas.

## Fluxo de git

- Branch: `advisor/010-spike-rota-autenticada`
- Commits pequenos por etapa do LOOP. NÃO fazer push nem PR sem instrução do
  operador.

## Passos

### Passo 1: ler os guias desta versão do Next

Ler em `apps/web/node_modules/next/dist/docs/` os guias de `cookies`, Server
Actions e Cache Components (o AGENTS.md manda — a versão mudou o suficiente
para a memória do modelo estar errada).

### Passo 2: rota `/conta` + login demo

Implementar o design proposto. O shell (`data-testid="conta-shell"`) fica fora
do boundary; a leitura de `cookies()` fica num componente async abaixo de
`<Suspense>` (`data-testid="conta-session"` no conteúdo, skeleton no fallback)
— siga `apps/web/app/demo/page.tsx` como padrão estrutural e de comentários.

**Verificar**: `pnpm build` → exit 0 E a saída do build mostra `/conta` com
shell prerenderizado (não totalmente dinâmica). Se o build falhar com
`blocking-prerender-dynamic`, a leitura de cookie subiu demais — é exatamente o
erro que o exemplo existe para ensinar a evitar.

### Passo 3: baseline descartável (LOOP passo 1)

Spec SEM `instant()` provando que os marcadores renderizam: logado (com
storageState) vê `conta-session` com o nome; deslogado vê o estado "não
logado". **Apagar antes do commit final.**

### Passo 4: setup de storageState sem `page.goto`

Project `setup` no `playwright.config.ts` + arquivo de setup usando a API
`request` do Playwright para POSTar o login e salvar `storageState`. Os specs
de `/conta` consomem via `test.use({ storageState: ... })`.

**Verificar**: baseline do passo 3 verde nos dois projects.

### Passo 5: spec `instant()` (LOOP passos 2–3)

`apps/web/e2e/conta.instant.spec.ts`, seguindo `demo.instant.spec.ts`:
carga inicial e navegação client-side; dentro do lock, `conta-shell` visível e
`conta-session` com `toHaveCount(0)`; fora do lock, `conta-session` visível.
Se começar vermelho, empurrar boundaries até o verde — anotando cada movimento
nas notas (isso É o dado do spike).

**Verificar**: `pnpm test:e2e` → suite inteira verde, desktop e mobile.

### Passo 6: diferencial (LOOP passo 4 — obrigatório)

Quebrar de propósito (ex.: `await cookies()` no topo da page, acima do
boundary), confirmar que o build falha OU o spec fica vermelho, desfazer,
confirmar verde. Registrar qual guarda pegou (build vs teste) nas notas —
essa informação vai para o rig.

### Passo 7: rig + notas

- Atualizar `instant-nav.rig.md` TEST USER: de "Nenhum" para o contrato real
  (como o storageState é construído, onde mora o setup, a regra de nunca
  `page.goto` no setup — agora com o exemplo apontável).
- Escrever `plans/010-notas-spike-auth.md`: respostas de Q1–Q4 com evidência,
  decisões tomadas, o que uma auth real mudaria.
- Apagar o baseline do passo 3.

**Verificar**: `pnpm test:e2e` verde; `git status` sem specs descartáveis.

## Plano de teste

O spec `instant()` novo É o entregável de teste, construído pelo LOOP do rig
(com baseline e diferencial obrigatórios). A suite existente (6) segue verde —
`/conta` não pode afetar `/demo` nem a home.

## Critérios de done

- [ ] `pnpm build` → exit 0, `/conta` com shell estático na tabela do build
- [ ] `pnpm test:e2e` → suite inteira verde (6 + novos), desktop e mobile
- [ ] Diferencial executado e registrado (qual guarda pegou)
- [ ] `instant-nav.rig.md` TEST USER atualizado
- [ ] `plans/010-notas-spike-auth.md` responde Q1–Q4 com evidência
- [ ] Nenhum segredo em código/spec (o cookie demo carrega só um nome público)
- [ ] Baseline descartável apagado; `pnpm typecheck` e `pnpm lint` verdes
- [ ] Linha do plano atualizada em `plans/README.md`

## Condições de STOP

- Q1 der negativo (não existir forma de `cookies()` conviver com shell
  prerenderizado nesta versão) após consultar os guias do passo 1 — isso
  contradiz a premissa do exemplo; registre e pare.
- Q3 der conflito real (storageState corromper o cookie do testing API) sem
  solução em uma tentativa — registre e pare; pode exigir mudança no rig.
- A suite existente (6) quebrar em qualquer ponto — a rota nova não pode custar
  as antigas.
- Tentação de adicionar middleware ou `export const prefetch` — fora de escopo;
  registre a motivação nas notas e siga sem.

## Notas de manutenção

- Este exemplo vira O padrão de rota autenticada do boilerplate — quando
  entrar auth de verdade, a forma (shell público + sessão abaixo do boundary +
  storageState via request API) deve sobreviver à troca do mecanismo de login.
- O rig ganha a seção TEST USER "de verdade" — rotas autenticadas futuras devem
  reusar o mesmo setup project em vez de criar outro.
- Revisor: checar que o estado "não logado" e o "logado" compartilham o MESMO
  shell (é isso que mantém a rota prerenderizável e o exemplo honesto).
