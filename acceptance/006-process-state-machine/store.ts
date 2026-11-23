import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "../..")
export const boardFile = "processes/board.json"
export const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n'

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

/** A new empty folder outside the repository. */
export function emptyFolder(): string {
  return mkdtempSync(path.join(tmpdir(), "process-factory-machine-"))
}

/** Runs the repository's command line with `cwd` as the working directory. */
export function runCommand(cwd: string, args: string[]) {
  return spawnSync(process.execPath, [path.join(root, "bin/process-factory.mjs"), ...args], { cwd, encoding: "utf8" })
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
