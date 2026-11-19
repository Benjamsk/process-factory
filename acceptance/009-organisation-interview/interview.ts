import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "../..")
export const binFile = "bin/process-factory.mjs"
export const skillTemplate = "templates/skills/process/SKILL.md"
export const interviewerTemplate = "templates/skills/process/interviewer.md"
export const installedFolder = ".claude/skills/process"
/** The files of the organisation context, in the order of the areas of the interview. */
export const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]

/** A new empty folder outside the repository. */
export function emptyFolder(): string {
  return mkdtempSync(path.join(tmpdir(), "process-factory-interview-"))
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

/** The lines of a file in the repository, each with whether it lies in a fenced code block or is a fence line. */
function markedLines(file: string): { text: string; fenced: boolean }[] {
  let inFence = false
  return readFile(root, file)
    .split(/\r?\n/)
    .map((text) => {
      const isFence = text.startsWith("```")
      const fenced = inFence || isFence
      if (isFence) {
        inFence = !inFence
      }
      return { text, fenced }
    })
}

/** The headings of one level in a file in the repository, outside fenced code blocks, without their `#` signs. */
export function headings(file: string, level: number): string[] {
  const prefix = `${"#".repeat(level)} `
  return markedLines(file)
    .filter((line) => !line.fenced && line.text.startsWith(prefix))
    .map((line) => line.text.slice(prefix.length))
}

/** The lines under `## <title>` in a file in the repository, up to the next heading of level 1 or 2 outside a fenced code block. */
export function sectionLines(file: string, title: string): string[] {
  const lines = markedLines(file)
  const start = lines.findIndex((line) => !line.fenced && line.text === `## ${title}`)
  if (start === -1) {
    return []
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => !line.fenced && /^#{1,2} /.test(line.text))
  return (end === -1 ? rest : rest.slice(0, end)).map((line) => line.text)
}

/** The text under `## <title>` in a file in the repository. */
export function section(file: string, title: string): string {
  return sectionLines(file, title).join("\n")
}

/** The rows of the table under `## <title>`, without its header row and the line under it. */
export function tableRows(file: string, title: string): string[] {
  return sectionLines(file, title)
    .filter((line) => line.startsWith("|"))
    .slice(2)
}

/** The collapsed text under `## Status` in README.md. */
export function readmeStatus(): string {
  return section("README.md", "Status").replace(/\s+/g, " ")
}
