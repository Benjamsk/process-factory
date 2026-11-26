import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "../..")
export const boardFile = "processes/board.json"
export const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"] [--org <org-id>]\n       process-factory move <process-id> <stage> [--org <org-id>]\n       process-factory show [<process-id>] [--org <org-id>]\n       process-factory answer <process-id> <file> [--org <org-id>]\n       process-factory accept-spec <process-id> [--org <org-id>]\n       process-factory round <process-id> [--org <org-id>]\n       process-factory owner <process-id> "<person>" [--org <org-id>]\n       process-factory approve <process-id> --by "<person>" [--org <org-id>]\n       process-factory respec <process-id> [--org <org-id>]\n       process-factory send-back <process-id> <file> [--org <org-id>]\n       process-factory edit <process-id> <name> <file> --by "<person>" [--org <org-id>]\n       process-factory org new "<name>"\n       process-factory org list\n       process-factory org init [--org <org-id>]\n       process-factory check [--org <org-id>]\n       process-factory export <process-id> --format html|markdown --link <address> [--org <org-id>]\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n'

/** The ten stages, each with the stages a process may move to from it, in the order of the spec's table. */
export const moves: [string, string[]][] = [
  ["intake", ["clarify", "spec"]],
  ["clarify", ["spec"]],
  ["spec", ["clarify"]],
  ["cases", ["draft"]],
  ["draft", ["review"]],
  ["review", ["rework", "approval"]],
  ["rework", ["review"]],
  ["approval", ["published", "rework"]],
  ["published", ["regenerate"]],
  ["regenerate", ["review", "published"]],
]

/** The id of the one organisation of the project of an earlier test. */
export const organisationId = "acme"

/**
 * The empty folder `organisations/acme` of a new project outside the repository: the folder of the one organisation
 * of that project. Every path an earlier test names is a path in this folder, and its commands run in the project.
 */
export function organisationFolder(prefix: string): string {
  const folder = path.join(mkdtempSync(path.join(tmpdir(), prefix)), "organisations", organisationId)
  mkdirSync(folder, { recursive: true })
  return folder
}

/** The project the folder of an organisation lies in. */
export function projectOf(folder: string): string {
  return path.resolve(folder, "../..")
}

/**
 * What the command line printed, with every path of the store as it is from the folder of the organisation:
 * `organisations/acme/processes/...` as `processes/...`. A path of the store that is printed without
 * `organisations/acme/` in front is marked `UNPREFIXED-`, so that no test passes on it.
 */
export function inside(text: string): string {
  return text.replace(/(organisations\/acme\/)?\b(processes|organisation|exports)\//g, (_match, prefix: string | undefined, name: string) =>
    prefix === undefined ? `UNPREFIXED-${name}/` : `${name}/`,
  )
}

/** Runs `node <script> <args>` in the project of the folder of an organisation, and gives what it printed through `inside`. */
export function runInProject(folder: string, script: string, args: string[], input?: string) {
  const result = spawnSync(process.execPath, [path.resolve(folder, script), ...args], { cwd: projectOf(folder), encoding: "utf8", input, timeout: 60_000 })
  return { ...result, stdout: inside(result.stdout), stderr: inside(result.stderr) }
}

/** A new empty folder of an organisation, in a new project outside the repository. */
export function emptyFolder(): string {
  return organisationFolder("process-factory-machine-")
}

/** Runs the repository's command line in the project of `cwd`, the folder of an organisation. */
export function runCommand(cwd: string, args: string[]) {
  return runInProject(cwd, path.join(root, "bin/process-factory.mjs"), args)
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

/** Writes a board with these entries, in the layout the command line writes. */
export function writeBoard(folder: string, processes: Record<string, unknown>[]): void {
  writeFile(folder, boardFile, `${JSON.stringify({ processes }, null, 2)}\n`)
}

/**
 * Gives the process `id`, which is on the board in `approval`, the draft `draft-1.md`, the owner `Kari Nordmann`
 * and her approval of that draft. Writes an `organisation/roles.md` that names her when there is none.
 */
export function approveDraft(folder: string, id: string): void {
  if (!existsSync(path.join(folder, "organisation/roles.md"))) {
    writeFile(folder, "organisation/roles.md", "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n")
  }
  writeFile(folder, `processes/${id}/drafts/draft-1.md`, "# Draft 1\n")
  runCommand(folder, ["owner", id, "Kari Nordmann"])
  runCommand(folder, ["approve", id, "--by", "Kari Nordmann"])
}

/** Writes the open reader feedback `feedback-1.md` of the process `id`, which is a reason to regenerate it. */
export function writeOpenFeedback(folder: string, id: string): void {
  writeFile(folder, `processes/${id}/feedback/feedback-1.md`, `# Feedback 1\n\nProcess: ${id}\nVersion: 1\nStep: whole document\nKind: document\nFrom: anonymous\nStatus: open\n\n## Text\n\nStep 1 is unclear.\n`)
}

/**
 * Writes `draft-<n>.md` of the process `id`, which is being regenerated from version 1, and its change list
 * `changes-<n>.md` with one change that names these reasons.
 */
export function writeRegeneratedDraft(folder: string, id: string, number: number, reasons: string[]): void {
  const changes = [`# Changes of draft-${String(number)}.md against version 1`, "", "## Change 1", "", "- Section: Steps", "- Change: Step 1 says more clearly what to do.", ...reasons.map((reason) => `- Reason: ${reason}`), ""]
  writeFile(folder, `processes/${id}/drafts/draft-${String(number)}.md`, `# Draft ${String(number)}\n`)
  writeFile(folder, `processes/${id}/drafts/changes-${String(number)}.md`, changes.join("\n"))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The entries under `processes` on the board of `folder`, or an empty list when there is none. */
export function processes(folder: string): Record<string, unknown>[] {
  const text = readFile(folder, boardFile)
  const parsed: unknown = text === "" ? {} : JSON.parse(text)
  const list: unknown = isRecord(parsed) ? parsed.processes : []
  return Array.isArray(list) ? list.filter(isRecord) : []
}

/** The history entries of a board entry, or an empty list when it has none. */
export function history(entry: Record<string, unknown> | undefined): Record<string, unknown>[] {
  const list: unknown = entry?.history
  return Array.isArray(list) ? list.filter(isRecord) : []
}

/** The stages in the history of a board entry, oldest first. */
export function historyStages(entry: Record<string, unknown> | undefined): unknown[] {
  return history(entry).map((change) => change.stage)
}
