import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "../..")
export const binFile = "bin/process-factory.mjs"
export const templateFolder = "templates/organisation"
/** The files of the organisation context, in the order the command line creates them. */
export const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
export const usage =
  'Usage: process-factory init\n       process-factory new "<title>"\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory org init\n'

/** A new empty folder outside the repository. */
export function emptyFolder(): string {
  return mkdtempSync(path.join(tmpdir(), "process-factory-organisation-"))
}

/** Runs `node <script> <args>` with `cwd` as the working directory. */
export function runNode(cwd: string, script: string, args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" })
}

/** Runs the repository's command line with `cwd` as the working directory. */
export function runCommand(cwd: string, args: string[]) {
  return runNode(cwd, path.join(root, binFile), args)
}

/** The content of a file in `folder`, or an empty string when it does not exist. */
export function readFile(folder: string, file: string): string {
  const absolute = path.join(folder, file)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

/** Writes a file in `folder` and creates the folders above it. */
export function writeFile(folder: string, file: string, content: string): void {
  const absolute = path.join(folder, file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

/** The sorted names in a folder of `folder`, or an empty list when it does not exist. */
export function entries(folder: string, subfolder = "."): string[] {
  const absolute = path.join(folder, subfolder)
  return existsSync(absolute) ? readdirSync(absolute).sort() : []
}

/** The lines of the skill template after its frontmatter block. */
function skillBodyLines(): string[] {
  const lines = readFile(root, "templates/skills/process/SKILL.md").split(/\r?\n/)
  const end = lines.indexOf("---", 1)
  return end === -1 ? [] : lines.slice(end + 1)
}

/** The value of the description key in the frontmatter of the skill template, or an empty string. */
export function skillDescription(): string {
  const prefix = "description: "
  const lines = readFile(root, "templates/skills/process/SKILL.md").split(/\r?\n/)
  return lines.find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? ""
}

/** Everything in the skill template after the frontmatter block. */
export function skillBody(): string {
  return skillBodyLines().join("\n")
}

/** The text under `## <title>` in the skill template, up to the next heading of level 1 or 2. */
export function skillSection(title: string): string {
  const lines = skillBodyLines()
  const start = lines.indexOf(`## ${title}`)
  if (start === -1) {
    return ""
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,2} /.test(line))
  return (end === -1 ? rest : rest.slice(0, end)).join("\n")
}
