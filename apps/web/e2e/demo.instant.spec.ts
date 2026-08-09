import { expect, test } from "@playwright/test"
import { instant } from "@next/playwright"

// `instant()` trava a resposta do servidor durante o callback. O que estiver
// visível ali dentro veio do shell estático — prerenderizado e prefetchado.
// O que ainda não chegou prova que está corretamente fora do shell.
//
// É uma régua, não um cronômetro: nada aqui usa timeout customizado, retry ou
// medição de tempo. As asserções negativas (`toHaveCount(0)`) dentro do lock são
// o que impede o teste de passar por vazio.

test.describe("/demo", () => {
  test("é instantânea na carga inicial", async ({ page, baseURL }) => {
    await instant(
      page,
      async () => {
        await page.goto("/demo")

        await expect(page.getByTestId("demo-shell")).toBeVisible()
        await expect(page.getByTestId("demo-live")).toHaveCount(0)
      },
      // Obrigatório quando o `goto` é a primeira navegação: o helper precisa da
      // origem antes de pedir o documento.
      { baseURL }
    )

    await expect(page.getByTestId("demo-live")).toBeVisible()
  })

  test("é instantânea na navegação client-side", async ({ page }) => {
    await page.goto("/")

    await instant(page, async () => {
      await page.getByTestId("demo-link").click()
      // Esperar a URL antes de assertar a UI: um seletor compartilhado casaria
      // com a página de origem antes de o destino commitar. Se o destino não
      // puder commitar sob o lock, este wait estoura — e é exatamente essa
      // falha que significa "não foi instantâneo".
      await page.waitForURL((url) => url.pathname === "/demo")

      await expect(page.getByTestId("demo-shell")).toBeVisible()
      await expect(page.getByTestId("demo-live")).toHaveCount(0)
    })

    await expect(page.getByTestId("demo-live")).toBeVisible()
  })
})

test.describe("/demo/[slug]", () => {
  test("é instantânea na navegação client-side", async ({ page }) => {
    await page.goto("/demo")

    await instant(page, async () => {
      await page.getByTestId("topic-link-dados-de-url").click()
      await page.waitForURL((url) => url.pathname === "/demo/dados-de-url")

      // O shell é compartilhado por todos os slugs. O detalhe também está no
      // prerender porque o slug vem de generateStaticParams — se alguém subir
      // uma leitura não cacheada acima do boundary, esta asserção cai.
      await expect(page.getByTestId("topic-shell")).toBeVisible()
      await expect(page.getByTestId("topic-detail")).toBeVisible()
    })
  })
})
