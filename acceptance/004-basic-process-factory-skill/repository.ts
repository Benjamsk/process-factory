import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

export const root = path.resolve(import.meta.dirname, "../..")
export const templateFile = "templates/skills/process/SKILL.md"
export const installedFile = ".claude/skills/process/SKILL.md"
export const binFile = "bin/process-factory.mjs"

/** The content of a file in the repository, or an empty string when it does not exist. */
export function readText(file: string): string {
  const absolute = path.join(root, file)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** package.json of the repository as a record. */
export function manifest(): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readText("package.json"))
  if (!isRecord(parsed)) {
    throw new Error("package.json is not an object")
  }
  return parsed
}

/** A new empty folder outside the repository. */
export function emptyFolder(): string {
  return mkdtempSync(path.join(tmpdir(), "process-factory-"))
}

/** Runs `node <script> <args>` with `cwd` as the working directory. */
export function runNode(cwd: string, script: string, args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" })
}

/** Runs the repository's command line with `cwd` as the working directory. */
export function runCommand(cwd: string, args: string[]) {
  return runNode(cwd, path.join(root, binFile), args)
}
