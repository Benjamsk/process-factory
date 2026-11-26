import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { expect } from "vitest"

export const root = path.resolve(import.meta.dirname, "../..")
const commandFile = path.join(root, "bin/process-factory.mjs")
const running: ChildProcess[] = []

export const fjord = "fjord-skole"
export const fjordName = "Fjord Skole"
export const berg = "berg-dal-as"
export const bergName = "Berg & Dal AS"
export const laptopId = "001-handle-a-lost-laptop"
export const kari = "Kari Nordmann"
export const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
export const noOrganisation = 'process-factory: there is no organisation: run process-factory org new "<name>" first\n'
export const moreThanOne = `process-factory: there is more than one organisation: name one with --org <org-id>\n  ${berg}  ${bergName}\n  ${fjord}  ${fjordName}\n`

/** A new empty project outside the repository. */
export function emptyProject(): string {
  return mkdtempSync(path.join(tmpdir(), "process-factory-organisations-"))
}

/** Runs the repository's command line with the project as the working directory. Gives up after fifteen seconds. */
export function run(project: string, args: string[]) {
  return spawnSync(process.execPath, [commandFile, ...args], { cwd: project, encoding: "utf8", timeout: 15_000 })
}

/** The content of a file in the project, or an empty string when it does not exist. */
export function read(project: string, file: string): string {
  const absolute = path.join(project, file)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

/** Writes a file in the project and creates the folders above it. */
export function write(project: string, file: string, content: string): void {
  const absolute = path.join(project, file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

/** The sorted names in a folder of the project, or an empty list when it does not exist. */
export function names(project: string, folder = "."): string[] {
  const absolute = path.join(project, folder)
  return existsSync(absolute) ? readdirSync(absolute).sort() : []
}

/** The folder of an organisation, from the project. */
export function store(organisation: string): string {
  return `organisations/${organisation}`
}

/** Creates the organisations Fjord Skole and Berg & Dal AS with `org new`, and expects both to succeed. */
export function createBoth(project: string): void {
  expect(run(project, ["org", "new", fjordName]).stdout).toBe(`${fjord}\n`)
  expect(run(project, ["org", "new", bergName]).stdout).toBe(`${berg}\n`)
}

/** Writes the board of an organisation with these entries, in the layout the command line writes. */
export function writeBoard(project: string, organisation: string, processes: Record<string, unknown>[]): void {
  write(project, `${store(organisation)}/processes/board.json`, `${JSON.stringify({ processes }, null, 2)}\n`)
}

/** The stage of the first process on the board of an organisation, or an empty string when there is none. */
export function firstStage(project: string, organisation: string): string {
  const text = read(project, `${store(organisation)}/processes/board.json`)
  const parsed: unknown = text === "" ? {} : JSON.parse(text)
  const list: unknown = typeof parsed === "object" && parsed !== null && "processes" in parsed ? parsed.processes : []
  const first: unknown = Array.isArray(list) ? list[0] : undefined
  return typeof first === "object" && first !== null && "stage" in first && typeof first.stage === "string" ? first.stage : ""
}

/** Writes the process `001-handle-a-lost-laptop` of an organisation as published version 1 with this title and this document. */
export function writePublished(project: string, organisation: string, title: string, document: string): void {
  const versions = [{ version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-11-21T10:06:00.000Z" }]
  writeBoard(project, organisation, [{ id: laptopId, title, stage: "published", owner: kari, history: [{ at: "2026-11-21T10:06:00.000Z", stage: "published" }], versions }])
  const folder = `${store(organisation)}/processes/${laptopId}/versions/1`
  write(project, `${folder}/process.md`, document)
  write(project, `${folder}/approval.md`, `# Approval of draft-1.md\n\nProcess: ${laptopId}\nDraft: draft-1.md\nApproved by: ${kari}\nApproved at: 2026-11-21T10:05:00.000Z\n`)
}

/** Starts `serve` or `dashboard` in the project on a free port and gives its address, such as `http://127.0.0.1:50123`, or an empty string when it printed none. */
export async function start(project: string, command: "serve" | "dashboard"): Promise<string> {
  const child = spawn(process.execPath, [commandFile, command, "--port", "0"], { cwd: project, stdio: ["ignore", "pipe", "pipe"] })
  running.push(child)
  let stdout = ""
  child.stdout.setEncoding("utf8")
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 15_000)
    const finish = (): void => {
      clearTimeout(timer)
      resolve()
    }
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
      if (stdout.includes("\n")) finish()
    })
    child.on("close", finish)
  })
  return /(http:\/\/127\.0\.0\.1:\d+)\n/.exec(stdout)?.[1] ?? ""
}

/** Stops every server the tests started and waits until each has ended. */
export async function stopAll(): Promise<void> {
  await Promise.all(
    running.splice(0).map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve()
            return
          }
          child.once("exit", () => {
            resolve()
          })
          child.kill()
        }),
    ),
  )
}

/** Requests a path of a server, without following a redirect. */
export async function get(address: string, pathname: string): Promise<{ status: number; location: string | null; body: string }> {
  const response = await fetch(`${address}${pathname}`, { redirect: "manual" })
  return { status: response.status, location: response.headers.get("location"), body: await response.text() }
}

/** The addresses of the links and the forms of a page that start with `/`. */
export function localAddresses(body: string): string[] {
  return [...body.matchAll(/(?:href|action)="(\/[^"]*)"/g)].map((match) => match[1] ?? "")
}
