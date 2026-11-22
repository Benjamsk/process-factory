import { rmSync } from "node:fs"
import { createServer, type Server } from "node:net"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries } from "../006-process-state-machine/store.ts"
import { openView, request, runServe, startServe, stopViews, usage, writeLaptop } from "./view.ts"

let project = ""
let blocker: Server | undefined

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopViews()
  await new Promise<void>((resolve) => {
    if (blocker === undefined) resolve()
    else blocker.close(() => {
      resolve()
    })
  })
  blocker = undefined
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** Listens on a free port of 127.0.0.1 and gives that port. */
async function takePort(): Promise<number> {
  const server = createServer()
  blocker = server
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  return typeof address === "object" && address !== null ? address.port : 0
}

describe("process-factory serve", () => {
  it("prints one line with the address on 127.0.0.1 and the port it listens on, keeps running and answers GET / with 200", async () => {
    const started = await startServe(project, ["--port", "0"])

    expect(started.stdout).toMatch(/^Reading view on http:\/\/127\.0\.0\.1:[1-9]\d*\n$/)
    expect(started.stderr).toBe("")
    const address = started.stdout.trim().replace("Reading view on ", "")
    const front = await request(address, "/")
    expect(front.status).toBe(200)
    expect(started.isRunning()).toBe(true)
  })

  it("listens on the port that --port names", async () => {
    const port = await takePort()
    await new Promise<void>((resolve) => {
      blocker?.close(() => {
        resolve()
      })
    })
    blocker = undefined

    const started = await startServe(project, ["--port", String(port)])

    expect(started.stdout).toBe(`Reading view on http://127.0.0.1:${String(port)}\n`)
    expect(started.isRunning()).toBe(true)
    expect((await request(`http://127.0.0.1:${String(port)}`, "/")).status).toBe(200)
  })

  it("starts in a folder without processes and creates nothing there", async () => {
    const address = await openView(project)

    expect((await request(address, "/")).status).toBe(200)
    expect(entries(project)).toEqual([])
  })

  it.each([["abc"], ["70000"], ["-1"], ["4173x"], ["1.5"]])("refuses the port %s with one line, starts nothing and exits with 1", (port) => {
    const result = runServe(project, ["--port", port])

    expect(result.stderr).toBe("process-factory: the port must be a number from 0 to 65535\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("says that it cannot serve on a port that is taken, prints nothing to standard output and exits with 1", async () => {
    const port = await takePort()

    const result = runServe(project, ["--port", String(port)])

    expect(result.stderr.startsWith(`process-factory: cannot serve on http://127.0.0.1:${String(port)}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["serve extra", ["extra"]],
    ["serve --port", ["--port"]],
    ["serve --host 0.0.0.0", ["--host", "0.0.0.0"]],
    ["serve --port 0 extra", ["--port", "0", "extra"]],
  ])("has thirteen lines, with serve as the last, and is printed with %s", (_name, args) => {
    const result = runServe(project, args)

    expect(result.stderr).toBe(usage)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(13)
    expect(result.stderr.endsWith("       process-factory check\n       process-factory serve [--port <number>]\n")).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})

describe("every page of the reading view", () => {
  it.each([
    ["the front page", "/", 200, 0],
    ["the page of a process", "/001-handle-a-lost-laptop", 200, 1],
    ["the page of an earlier version", "/001-handle-a-lost-laptop/1", 200, 1],
    ["the page Not found", "/no-such-process", 404, 0],
  ])("is a complete HTML document without script, with the four headers: %s", async (_name, pathname, status, forms) => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, pathname)

    expect(page.status).toBe(status)
    expect(page.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(page.headers.get("cache-control")).toBe("no-store")
    expect(page.headers.get("x-content-type-options")).toBe("nosniff")
    expect(page.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(page.body.toLowerCase().startsWith("<!doctype html>")).toBe(true)
    expect(page.body).toContain('<html lang="en">')
    expect(page.body).toContain('<meta charset="utf-8">')
    expect(page.body).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
    expect(page.body).not.toContain("<script")
    expect(page.body.split("<form").length - 1).toBe(forms)
    expect(page.body).not.toContain("<img")
    expect(page.body).not.toContain("<link")
  })
})
