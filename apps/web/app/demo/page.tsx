import { Suspense } from "react"
import Link from "next/link"
import { cacheLife, io } from "next/cache"
import { demoTopics } from "@/lib/demo-topics"

// Todo `"use cache"` declara seu `cacheLife` explicitamente: sem isso, aninhar
// um cache de vida curta abaixo deste escopo derruba o prerender. O perfil
// também nunca é "seconds" — stale abaixo de 30s é excluído do shell estático,
// porque um prefetch expiraria antes de o usuário clicar.
async function getTopics() {
  "use cache"
  cacheLife("hours")

  return demoTopics
}

export default async function DemoPage() {
  const topics = await getTopics()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      {/* Shell estático: fora de qualquer boundary, é o que pinta primeiro. */}
      <header data-testid="demo-shell" className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Navegação instantânea
        </h1>
        <p className="text-muted-foreground">
          Tudo nesta seção é prerenderizado, entra no prefetch e aparece antes
          de qualquer resposta do servidor.
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {topics.map((topic) => (
          <li key={topic.slug}>
            <Link
              href={`/demo/${topic.slug}`}
              data-testid={`topic-link-${topic.slug}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <span className="font-medium">{topic.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {topic.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Abaixo do boundary: fica fora do shell e chega em streaming. */}
      <Suspense fallback={<RenderedAtSkeleton />}>
        <RenderedAt />
      </Suspense>
    </main>
  )
}

// `io()` marca onde a leitura não determinística começa. Ao contrário de
// `connection()`, ele não espera uma navegação real chegar ao servidor, então
// não bloqueia o prefetch — é por isso que é o preferido sob Cache Components.
async function RenderedAt() {
  await io()

  return (
    <p data-testid="demo-live" className="text-sm text-muted-foreground">
      Renderizado no servidor em {new Date().toISOString()}
    </p>
  )
}

function RenderedAtSkeleton() {
  return (
    <p className="text-sm text-muted-foreground">Renderizando no servidor…</p>
  )
}
