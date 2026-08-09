import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { demoTopics, findDemoTopic } from "@/lib/demo-topics"

// Sob Cache Components, devolver uma lista vazia é erro: o Next precisa de ao
// menos um param para prerenderizar a rota e validar que ela produz um shell.
export function generateStaticParams() {
  return demoTopics.map((topic) => ({ slug: topic.slug }))
}

export default function DemoTopicPage({ params }: PageProps<"/demo/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      {/* Shell estático: idêntico para todo slug, prerenderizado uma vez e
          reaproveitado por qualquer URL desta rota. */}
      <header data-testid="topic-shell" className="flex flex-col gap-3">
        <Link
          href="/demo"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Voltar
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Tópico
        </h1>
      </header>

      {/* `params` nunca é aguardado aqui em cima: a promise desce para dentro do
          boundary. Vale mesmo com todos os slugs em generateStaticParams — um
          param conhecido ainda pertence a uma única URL, e lê-lo acima daqui
          amarraria o shell compartilhado a ela. */}
      <Suspense fallback={<TopicDetailSkeleton />}>
        <TopicDetail params={params} />
      </Suspense>
    </main>
  )
}

async function TopicDetail({
  params,
}: Pick<PageProps<"/demo/[slug]">, "params">) {
  const { slug } = await params
  const topic = findDemoTopic(slug)

  if (!topic) {
    notFound()
  }

  return (
    <article data-testid="topic-detail" className="flex flex-col gap-2">
      <h2 className="text-xl font-medium">{topic.title}</h2>
      <p className="text-muted-foreground">{topic.summary}</p>
    </article>
  )
}

function TopicDetailSkeleton() {
  return <p className="text-muted-foreground">Carregando tópico…</p>
}
