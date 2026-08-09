export type DemoTopic = {
  slug: string
  title: string
  summary: string
}

export const demoTopics: DemoTopic[] = [
  {
    slug: "shell-estatico",
    title: "Shell estático",
    summary:
      "O que é prerenderizado entra no prefetch e pinta antes de qualquer resposta do servidor.",
  },
  {
    slug: "conteudo-diferido",
    title: "Conteúdo diferido",
    summary:
      "Leituras de request-time ficam abaixo de <Suspense> e chegam em streaming, sem atrasar o shell.",
  },
  {
    slug: "dados-de-url",
    title: "Dados de URL",
    summary:
      "params pertence a uma única URL, então desce como promise para dentro do boundary.",
  },
]

export function findDemoTopic(slug: string): DemoTopic | undefined {
  return demoTopics.find((topic) => topic.slug === slug)
}
