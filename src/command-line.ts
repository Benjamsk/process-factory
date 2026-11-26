import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { request as httpRequest, type IncomingHttpHeaders } from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach } from "vitest"

export const repositoryRoot = path.resolve(import.meta.dirname, "..")
const commandFile = path.join(repositoryRoot, "bin", "process-factory.mjs")
export const skillFolder = ".claude/skills/process"
export const skillFiles = [
  "SKILL.md",
  "interviewer.md",
  "questioner.md",
  "spec-writer.md",
  "case-writer.md",
  "draft-writer.md",
  "incident.md",
  "reviewer.md",
  ...readdirSync(path.join(repositoryRoot, "templates", "skills", "process"))
    .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
    .sort(),
]
export const boardPath = "processes/board.json"
export const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"] [--org <org-id>]\n       process-factory move <process-id> <stage> [--org <org-id>]\n       process-factory show [<process-id>] [--org <org-id>]\n       process-factory answer <process-id> <file> [--org <org-id>]\n       process-factory accept-spec <process-id> [--org <org-id>]\n       process-factory round <process-id> [--org <org-id>]\n       process-factory owner <process-id> "<person>" [--org <org-id>]\n       process-factory approve <process-id> --by "<person>" [--org <org-id>]\n       process-factory respec <process-id> [--org <org-id>]\n       process-factory send-back <process-id> <file> [--org <org-id>]\n       process-factory edit <process-id> <name> <file> --by "<person>" [--org <org-id>]\n       process-factory org new "<name>"\n       process-factory org list\n       process-factory org init [--org <org-id>]\n       process-factory check [--org <org-id>]\n       process-factory export <process-id> --format html|markdown --link <address> [--org <org-id>]\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n'
export const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
export const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
/** The id of the one organisation the tests of one store work in. */
export const organisationId = "acme"

/** The folder `organisations/acme` of a new project: the folder of the organisation every path below is a path in. */
export let workingDirectory = ""

beforeEach(() => {
  workingDirectory = path.join(mkdtempSync(path.join(tmpdir(), "process-factory-unit-")), "organisations", organisationId)
  mkdirSync(workingDirectory, { recursive: true })
})

afterEach(() => {
  rmSync(projectDirectory(), { recursive: true, force: true })
})

/** The project the folder of the organisation lies in: the working directory of every command and of every server. */
export function projectDirectory(): string {
  return path.resolve(workingDirectory, "../..")
}

/**
 * What a command printed, with every path of the store as it is from the folder of the organisation:
 * `organisations/acme/processes/...` as `processes/...`. A store path printed without `organisations/acme/`
 * in front is marked `UNPREFIXED-`, so that no test passes on it.
 */
function inside(text: string): string {
  return text.replace(/(organisations\/acme\/)?\b(processes|organisation|exports)\//g, (_match, prefix: string | undefined, name: string) =>
    prefix === undefined ? `UNPREFIXED-${name}/` : `${name}/`,
  )
}

export function runCommand(commandArguments: string[], input?: string) {
  const result = spawnSync(process.execPath, [commandFile, ...commandArguments], { cwd: projectDirectory(), encoding: "utf8", input })
  return { ...result, stdout: inside(result.stdout), stderr: inside(result.stderr) }
}

/** The projects a test made for itself, beside the one of `workingDirectory`, which are removed when it ends. */
const ownProjects: string[] = []

afterEach(() => {
  for (const project of ownProjects.splice(0)) rmSync(project, { recursive: true, force: true })
})

/** A new empty project outside the repository, which is removed when the test ends. */
export function emptyProject(): string {
  const project = mkdtempSync(path.join(tmpdir(), "process-factory-project-"))
  ownProjects.push(project)
  return project
}

/** Runs the command line in a project, with everything it printed as it printed it. */
export function runInProject(project: string, commandArguments: string[]) {
  return spawnSync(process.execPath, [commandFile, ...commandArguments], { cwd: project, encoding: "utf8" })
}

const startedServers: ChildProcess[] = []

/** Starts a server command of the command line on a free port of the project and gives the line it printed. */
export async function startServer(command: string): Promise<string> {
  const child = spawn(process.execPath, [commandFile, command, "--port", "0"], { cwd: projectDirectory(), stdio: ["ignore", "pipe", "pipe"] })
  startedServers.push(child)
  child.stdout.setEncoding("utf8")
  let printed = ""
  await new Promise<void>((resolve) => {
    child.stdout.on("data", (chunk: string) => {
      printed += chunk
      if (printed.includes("\n")) resolve()
    })
    child.once("close", resolve)
  })
  return printed
}

/** Stops every server the tests started and waits until each has ended. */
export async function stopServers(): Promise<void> {
  await Promise.all(
    startedServers.splice(0).map(
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

/** The address of the one organisation of these tests on a server at `address`. */
export function organisationAddress(address: string): string {
  return `${address}/${organisationId}`
}

/** An address on a page of the organisation as it is from inside it; one without `/acme` in front is marked `UNPREFIXED`. */
function insideAddress(address: string): string {
  if (address === `/${organisationId}`) return "/"
  return address.startsWith(`/${organisationId}/`) ? address.slice(organisationId.length + 1) : `UNPREFIXED${address}`
}

/**
 * A page of the organisation as it is from inside it: without the line that names the organisation as the first
 * element of its body, and with every address of a link and a form through `insideAddress`. A page without that
 * line is marked `NO ORGANISATION LINE`, so that no test passes on it.
 */
function insidePage(body: string): string {
  if (body === "") return body
  const line = /<body>\s*<p>Organisation: acme<\/p>\s*/
  const named = line.test(body) ? body.replace(line, "<body>\n") : `NO ORGANISATION LINE\n${body}`
  return named.replace(/(href|action)="(\/[^"]*)"/g, (_match, attribute: string, to: string) => `${attribute}="${insideAddress(to)}"`)
}

/** An `Origin` header as a browser sends it: the origin of an address, without its path. */
function originOf(value: string): string {
  try {
    return new URL(value).origin
  } catch {
    return value
  }
}

/** The path inside the organisation of an address such as `http://127.0.0.1:50123/acme`, which `/` is the organisation itself of. */
function organisationPath(address: string, pathname: string): string {
  const organisation = new URL(address).pathname
  return organisation === "/" ? pathname : `${organisation}${pathname === "/" ? "" : pathname}`
}

export async function requestPage(address: string, pathname: string, method = "GET") {
  const url = new URL(address)
  const response = await fetch(`${url.origin}${organisationPath(address, pathname)}`, { method })
  const body = await response.text()
  return { status: response.status, headers: response.headers, body: url.pathname === "/" ? body : insidePage(body) }
}

/** Sends a request with a body to a server on a connection of its own. An answer that arrived counts, also when the server closes the connection early. */
export function send(address: string, pathname: string, body: string, more: { method?: string; headers?: Record<string, string> } = {}) {
  const url = new URL(address)
  const isInside = url.pathname !== "/"
  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(more.headers ?? {})) {
    headers[name] = name.toLowerCase() === "origin" ? originOf(value) : value
  }
  const answerInside = (answer: { status: number; headers: IncomingHttpHeaders; body: string }): { status: number; headers: IncomingHttpHeaders; body: string } => {
    if (!isInside) return answer
    const location = answer.headers.location
    return {
      ...answer,
      headers: location === undefined ? answer.headers : { ...answer.headers, location: insideAddress(location) },
      body: insidePage(answer.body),
    }
  }
  return new Promise<{ status: number; headers: IncomingHttpHeaders; body: string }>((resolve, reject) => {
    let answer: { status: number; headers: IncomingHttpHeaders; body: string } | undefined
    const fail = (error: Error): void => {
      if (answer === undefined) reject(error)
      else resolve(answerInside(answer))
    }
    const sent = httpRequest(
      {
        host: url.hostname,
        port: url.port,
        path: organisationPath(address, pathname),
        method: more.method ?? "POST",
        agent: false,
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(Buffer.byteLength(body)), ...headers },
      },
      (response) => {
        const received = { status: response.statusCode ?? 0, headers: response.headers, body: "" }
        answer = received
        response.setEncoding("utf8")
        response.on("data", (chunk: string) => {
          received.body += chunk
        })
        response.on("end", () => {
          resolve(answerInside(received))
        })
        response.on("error", fail)
      },
    )
    sent.on("error", fail)
    sent.end(body)
  })
}

/** Posts form fields to a server as `application/x-www-form-urlencoded`. */
export function postForm(address: string, pathname: string, values: Record<string, string>, headers: Record<string, string> = {}) {
  return send(address, pathname, new URLSearchParams(values).toString(), { headers })
}

export function writeWorkingFile(file: string, content: string): void {
  const absolute = path.join(workingDirectory, file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

export function readWorkingFile(file: string): string {
  return readFileSync(path.join(workingDirectory, file), "utf8")
}

export function writeProjectFile(file: string, content: string): void {
  const absolute = path.join(projectDirectory(), file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

export function installedFilesEqualTheirTemplates(): boolean {
  return skillFiles.every((file) =>
    readFileSync(path.join(projectDirectory(), skillFolder, file)).equals(
      readFileSync(path.join(repositoryRoot, "templates", "skills", "process", file)),
    ),
  )
}

export function writeBoardFile(processes: Record<string, unknown>[]): void {
  writeWorkingFile(boardPath, `${JSON.stringify({ processes }, null, 2)}\n`)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The entries under `processes` on the board, or an empty list when there is none. */
export function storedProcesses(): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(readWorkingFile(boardPath))
  const list: unknown = isRecord(parsed) ? parsed.processes : []
  return Array.isArray(list) ? list.filter(isRecord) : []
}

/** The history entries of a board entry, or an empty list when it has none. */
export function storedHistory(entry: Record<string, unknown> | undefined): Record<string, unknown>[] {
  const list: unknown = entry?.history
  return Array.isArray(list) ? list.filter(isRecord) : []
}
