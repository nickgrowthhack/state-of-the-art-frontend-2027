import { defineConfig, devices } from "@playwright/test"

// Porta dedicada, separada do `next dev` (3000). O testing API do Next usa o
// cookie `next-instant-navigation-testing`, que é escopado por domínio e não
// por porta — um dev server em localhost contaminaria a run. Por isso o host
// aqui é 127.0.0.1, que tem seu próprio jar de cookies.
const HOST = "127.0.0.1"
const PORT = 3100
const baseURL = `http://${HOST}:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  // Sem retries: `instant()` é uma régua, não um cronômetro. Um teste que só
  // passa na segunda tentativa está medindo tempo, não estrutura.
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // O shell precisa bater com o render real em todos os breakpoints: um
    // skeleton que só serve no desktop vira layout shift no mobile.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Build de produção é obrigatório: o Next não faz prefetch em `next dev`,
    // então a navegação client-side não teria o que medir.
    command: `pnpm build && pnpm start --hostname ${HOST} --port ${PORT}`,
    url: baseURL,
    // Passado como env do processo, não como prefixo de shell — o repo também
    // roda em Windows, onde `VAR=1 cmd` não existe.
    env: { NEXT_E2E: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
