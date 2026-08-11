// Guarda da camada pristine (AGENTS.md §shadcn/ui): falha se qualquer
// arquivo escrito pelo CLI do shadcn divergir do hash registrado em
// pristine.lock.json. Sync legítimo de upstream reescreve o lock: --update.
// process/console importados de módulos node: — o preset de lint não
// habilita globals de Node; não remover os imports.
import console from "node:console"
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, relative, sep } from "node:path"
import process from "node:process"
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
      relative(pkgRoot, join(entry.parentPath, entry.name)).split(sep).join("/")
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
  console.error(
    "check:pristine FALHOU — camada pristine divergiu do manifest:\n"
  )
  for (const problem of problems) console.error(`  ${problem}`)
  console.error(`
Sync legítimo de upstream (via CLI do shadcn)? Rode
  pnpm --filter @workspace/ui run update:pristine
e commite o pristine.lock.json junto. Edição manual? Reverta — divergência
de casa vive em src/ext/ (AGENTS.md §shadcn/ui).`)
  process.exit(1)
}

console.log(`check:pristine OK — ${files.length} arquivo(s) pristine conferem.`)
