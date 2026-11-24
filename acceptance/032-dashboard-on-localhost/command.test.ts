import { rmSync } from "node:fs"
import { createServer, type Server } from "node:net"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries } from "../006-process-state-machine/store.ts"
import { request, usage } from "../026-reading-view-on-localhost/view.ts"
import { openDashboard, runDashboard, startDashboard, stopDashboards } from "./dashboard.ts"

let project = ""
let blocker: Server | undefined

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  await new Promise<void>((resolve) => {
    if (blocker === undefined) resolve()
    else
      blocker.close(() => {
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

describe("process-factory dashboard", () => {
  it("prints one line with the address on 127.0.0.1 and the port it listens on, keeps running and answers GET / with 200", async () => {
    const started = await startDashboard(project, ["--port", "0"])

    expect(started.stdout).toMatch(/^Dashboard on http:\/\/127\.0\.0\.1:[1-9]\d*\n$/)
    expect(started.stderr).toBe("")
    const address = started.stdout.trim().replace("Dashboard on ", "")
    expect((await request(address, "/")).status).toBe(200)
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

    const started = await startDashboard(project, ["--port", String(port)])

    expect(started.stdout).toBe(`Dashboard on http://127.0.0.1:${String(port)}\n`)
    expect(started.isRunning()).toBe(true)
    expect((await request(`http://127.0.0.1:${String(port)}`, "/")).status).toBe(200)
  })

  it("starts in a folder without processes and creates nothing there", async () => {
    const address = await openDashboard(project)

    expect((await request(address, "/")).status).toBe(200)
    expect(entries(project)).toEqual([])
  })

  it.each([["abc"], ["70000"], ["-1"], ["4174x"], ["1.5"]])("refuses the port %s with one line, starts nothing and exits with 1", (port) => {
    const result = runDashboard(project, ["--port", port])

    expect(result.stderr).toBe("process-factory: the port must be a number from 0 to 65535\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("says that it cannot serve on a port that is taken, prints nothing to standard output and exits with 1", async () => {
    const port = await takePort()

    const result = runDashboard(project, ["--port", String(port)])

    expect(result.stderr.startsWith(`process-factory: cannot serve on http://127.0.0.1:${String(port)}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["dashboard extra", ["extra"]],
    ["dashboard --port", ["--port"]],
    ["dashboard --host 0.0.0.0", ["--host", "0.0.0.0"]],
    ["dashboard --port 0 extra", ["--port", "0", "extra"]],
  ])("has fifteen lines, with dashboard as the last, directly after serve, and is printed with %s", (_name, args) => {
    const result = runDashboard(project, args)

    expect(result.stderr).toBe(usage)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(15)
    expect(result.stderr.endsWith("       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n")).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})
