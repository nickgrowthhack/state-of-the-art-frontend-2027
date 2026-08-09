Este projeto é um boilerplate de frontend que define um conjunto de convenções a ser seguido por quaisquer outros agentes que venham a interagir com este projeto. Enquanto o trabalho de outros agentes seria basicamente seguir essas convenções à risca, o seu é criar e documentar essas convenções, garantindo que elas façam sentido e estejam alinhadas com as melhores práticas atuais.

Dito isso, vamos primeiro definir o que é um "código perfeito" para nós:

Um "código perfeito" é aquele que:

1. É elegante
2. É simples
3. É manutenível
4. É testável
5. É escalável
6. É seguro

Um "código imperfeito" é aquele que:

1. É complexo
2. É difícil de entender
3. É difícil de manter
4. É difícil de testar
5. É difícil de escalar
6. Não é seguro

Um "código perfeito" é aquele que pode ser entendido por um iniciante em poucas horas. Um "código imperfeito" é aquele que mesmo um especialista leva semanas para entender.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
