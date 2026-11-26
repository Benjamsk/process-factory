import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { organisationFolder, runInProject } from "../006-process-state-machine/store.ts"

export const root = path.resolve(import.meta.dirname, "../..")
export const binFile = "bin/process-factory.mjs"
export const boardFile = "processes/board.json"

/** A new empty folder of an organisation, in a new project outside the repository. */
export function emptyFolder(): string {
  return organisationFolder("process-factory-store-")
}

/** Runs `node <script> <args>` in the project of `cwd`, the folder of an organisation; a relative script lies in `cwd`. */
export function runNode(cwd: string, script: string, args: string[]) {
  return runInProject(cwd, script, args)
}

/** Runs the repository's command line in the project of `cwd`, the folder of an organisation. */
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

/** The parsed board of `folder`, or undefined when there is no board. */
export function board(folder: string): unknown {
  const text = readFile(folder, boardFile)
  return text === "" ? undefined : JSON.parse(text)
}

/** The text the command line writes for a board. */
export function boardText(processes: Record<string, string>[]): string {
  return `${JSON.stringify({ processes }, null, 2)}\n`
}

/** A parsed board without the times in the histories, which differ on every run. */
export function withoutTimes(parsed: unknown): unknown {
  return JSON.parse(JSON.stringify(parsed, (key, value: unknown) => (key === "at" ? undefined : value)))
}
