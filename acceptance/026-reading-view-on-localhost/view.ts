import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { expect } from "vitest"
import { organisationId, projectOf, root, writeBoard, writeFile } from "../006-process-state-machine/store.ts"

export { usage } from "../006-process-state-machine/store.ts"

const commandFile = path.join(root, "bin/process-factory.mjs")
const addressLine = /^Reading view on (http:\/\/127\.0\.0\.1:\d+)\n$/
const running: ChildProcess[] = []

export const laptopId = "001-handle-a-lost-laptop"
export const laptopTitle = "Handle a lost laptop"
export const kari = "Kari Nordmann"
export const olderId = "000-older-process"
/** A process on the board that was never published. */
export const olderEntry = { id: olderId, title: "Older process", stage: "draft", owner: kari, history: [{ at: "2026-09-01T09:00:00.000Z", stage: "draft" }] }
export const firstDocument = "# Handle a lost laptop\n\n## Steps\n\n1. IT manager (Ola Hansen): Call the police first.\n"
export const secondDocument = "# Handle a lost laptop\n\n## Steps\n\n1. IT manager (Ola Hansen): Block the laptop in Intune.\n"

/** The address of the one organisation of an earlier test on a server at `address`. */
export function organisationAddress(address: string): string {
  return `${address}/${organisationId}`
}

/**
 * An address on a page of the organisation as it is from inside it: `/acme/<rest>` as `/<rest>` and `/acme` as `/`.
 * An address without `/acme` in front is marked `UNPREFIXED`, so that no test passes on it.
 */
export function insideAddress(address: string): string {
  if (address === `/${organisationId}`) return "/"
  return address.startsWith(`/${organisationId}/`) ? address.slice(organisationId.length + 1) : `UNPREFIXED${address}`
}

/**
 * A page of the organisation as it is from inside it: without the line that names the organisation as the first
 * element of the body, and with every address of a link and a form through `insideAddress`. A page without that
 * line is marked `NO ORGANISATION LINE`, so that no test passes on it.
 */
export function insidePage(body: string): string {
  if (body === "") return body
  const line = /<body>\s*<p>Organisation: acme<\/p>\s*/
  const named = line.test(body) ? body.replace(line, "<body>\n") : `NO ORGANISATION LINE\n${body}`
  return named.replace(/(href|action)="(\/[^"]*)"/g, (_match, attribute: string, address: string) => `${attribute}="${insideAddress(address)}"`)
}

/** Runs `serve` in the project of `project`, the folder of an organisation, with arguments that must make it exit at once. Gives up after fifteen seconds. */
export function runServe(project: string, args: string[]) {
  return spawnSync(process.execPath, [commandFile, "serve", ...args], { cwd: projectOf(project), encoding: "utf8", timeout: 15_000 })
}

/** Starts `serve` in the project of `project`, the folder of an organisation, and waits until it printed a line to standard output or ended. `isRunning` says whether it still runs when it is called. */
export async function startServe(project: string, args: string[]): Promise<{ stdout: string; stderr: string; isRunning: () => boolean }> {
  const child = spawn(process.execPath, [commandFile, "serve", ...args], { cwd: projectOf(project), stdio: ["ignore", "pipe", "pipe"] })
  running.push(child)
  let stdout = ""
  let stderr = ""
  child.stdout.setEncoding("utf8")
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk
  })
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
  return { stdout, stderr, isRunning: () => child.exitCode === null && child.signalCode === null }
}

/** Starts the reading view of the project of `project`, the folder of an organisation, on a free port and gives the address of that organisation, such as `http://127.0.0.1:50123/acme`. */
export async function openView(project: string): Promise<string> {
  const started = await startServe(project, ["--port", "0"])
  expect(started.stdout).toMatch(addressLine)
  expect(started.stderr).toBe("")
  return organisationAddress(addressLine.exec(started.stdout)?.[1] ?? "")
}

/** Stops every view the tests started and waits until each has ended. */
export async function stopViews(): Promise<void> {
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

/** The headers of an answer of the organisation, with the address of a redirect through `insideAddress`. */
export function insideHeaders(headers: Headers): Headers {
  const inside = new Headers(headers)
  const location = headers.get("location")
  if (location !== null) inside.set("location", insideAddress(location))
  return inside
}

/**
 * Requests a path of the view, without following a redirect. At the address of an organisation, such as
 * `http://127.0.0.1:50123/acme`, the path is a path inside it, `/` is the organisation itself, and the answer is
 * given through `insideHeaders` and `insidePage`.
 */
export async function request(address: string, pathname: string, method = "GET"): Promise<{ status: number; headers: Headers; body: string }> {
  const isInside = address.endsWith(`/${organisationId}`)
  const isOrganisation = pathname === "/" || pathname.startsWith("/?")
  const response = await fetch(`${address}${isInside && isOrganisation ? pathname.slice(1) : pathname}`, { method, redirect: "manual" })
  if (!isInside) return { status: response.status, headers: response.headers, body: await response.text() }
  return { status: response.status, headers: insideHeaders(response.headers), body: insidePage(await response.text()) }
}

/** The text of an approval file as `approve` writes it. */
export function approvalText(id: string, draft: string, by: string, at: string): string {
  return `# Approval of ${draft}\n\nProcess: ${id}\nDraft: ${draft}\nApproved by: ${by}\nApproved at: ${at}\n`
}

/** Writes the folder `versions/<version>` of a process, with `process.md` and, when given, `approval.md`. */
export function writeVersion(project: string, id: string, version: number, document: string, approval?: string): void {
  const folder = `processes/${id}/versions/${String(version)}`
  writeFile(project, `${folder}/process.md`, document)
  if (approval !== undefined) writeFile(project, `${folder}/approval.md`, approval)
}

/** The board entry of the process of the acceptance criteria: owned by Kari Nordmann, with the versions 1 and 2. */
export function laptopEntry(more: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: laptopId,
    title: laptopTitle,
    stage: "published",
    owner: kari,
    history: [{ at: "2026-11-21T10:06:00.000Z", stage: "published" }],
    versions: [
      { version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-10-03T08:00:00.000Z" },
      { version: 2, draft: "draft-2.md", approvedBy: kari, at: "2026-11-22T08:00:00.000Z" },
    ],
    ...more,
  }
}

/** Writes the two version folders of the process of the acceptance criteria. The board lists them a day after their approval. */
export function writeLaptopVersions(project: string, newestDocument = secondDocument): void {
  writeVersion(project, laptopId, 1, firstDocument, approvalText(laptopId, "draft-1.md", kari, "2026-10-02T09:00:00.000Z"))
  writeVersion(project, laptopId, 2, newestDocument, approvalText(laptopId, "draft-2.md", kari, "2026-11-21T10:05:00.000Z"))
}

/** Writes the store of the acceptance criteria: a process that was never published, and the process with two versions. */
export function writeLaptop(project: string, more: Record<string, unknown> = {}, newestDocument = secondDocument): void {
  writeBoard(project, [olderEntry, laptopEntry(more)])
  writeLaptopVersions(project, newestDocument)
}

/** A page without the whitespace between its elements. */
export function compact(html: string): string {
  return html.replace(/>\s+</g, "><").trim()
}

/** What stands between `<li>` and `</li>` of every such item in a piece of HTML, in order. */
export function items(html: string): string[] {
  return [...html.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => (match[1] ?? "").trim())
}

/** The items of the list under `<h2>Version history</h2>` of a page. */
export function historyItems(body: string): string[] {
  const start = body.indexOf("<h2>Version history</h2>")
  return start === -1 ? [] : items(body.slice(start))
}

/** What stands inside the `<main>` element of a page, without the whitespace between its elements. */
export function mainOf(body: string): string {
  return compact(/<main>(.*)<\/main>/s.exec(body)?.[1] ?? "")
}

/** The text a reader sees on a page: without the style element and the tags, with single spaces. */
export function visibleText(body: string): string {
  return body
    .replace(/<style[^>]*>.*?<\/style>/gs, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Every file under a folder with its content, by its path relative to that folder. */
export function tree(folder: string, prefix = ""): Record<string, string> {
  const files: Record<string, string> = {}
  for (const name of readdirSync(path.join(folder, prefix)).sort()) {
    const relative = prefix === "" ? name : `${prefix}/${name}`
    if (statSync(path.join(folder, relative)).isDirectory()) Object.assign(files, tree(folder, relative), { [`${relative}/`]: "" })
    else files[relative] = readFileSync(path.join(folder, relative), "utf8")
  }
  return files
}
