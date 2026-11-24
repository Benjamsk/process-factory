import { mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, readFile, runCommand, usage, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { approvalText, kari, laptopEntry, laptopId, olderId, tree, writeLaptop, writeVersion } from "../026-reading-view-on-localhost/view.ts"
import { address, htmlFile, linkRefusal, runExport } from "./export.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Expects a refusal: this one line on standard error, nothing on standard output, exit code 1 and no folder `exports`. */
function expectRefused(result: { stdout: string; stderr: string; status: number | null }, line: string): void {
  expect(result.stderr).toBe(line)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(entries(project)).not.toContain("exports")
}

describe("process-factory export with a format or a link it cannot use", () => {
  it.each(["pdf", "HTML", "md"])("refuses the format %s and writes nothing", (format) => {
    writeLaptop(project)

    expectRefused(runExport(project, format), "process-factory: the format must be html or markdown\n")
  })

  it.each([
    "intranet.example/processes",
    "ftp://intranet.example",
    "javascript:alert(1)",
    "https://kari:secret@intranet.example",
    "https://intranet.example/?a=1",
    "https://intranet.example/#top",
  ])("refuses the link %s and writes nothing", (to) => {
    writeLaptop(project)

    expectRefused(runExport(project, "html", to), linkRefusal)
    expectRefused(runExport(project, "markdown", to), linkRefusal)
  })

  it("checks the format before the link", () => {
    writeLaptop(project)

    expectRefused(runExport(project, "pdf", "ftp://intranet.example"), "process-factory: the format must be html or markdown\n")
  })
})

describe("process-factory export for a process it cannot export", () => {
  it.each([
    ["an id the board does not list", "009-no-such-process"],
    ["an id with another character than lowercase letters, digits and hyphens", `../${laptopId}`],
  ])("says that there is no such process for %s", (_name, id) => {
    writeLaptop(project)

    expectRefused(runExport(project, "html", address, id), `process-factory: there is no process ${id}\n`)
  })

  it("refuses a process that has no published version", () => {
    writeLaptop(project)

    expectRefused(runExport(project, "html", address, olderId), `process-factory: cannot export ${olderId}: it has no published version\n`)
  })

  it("refuses a process whose versions on the board have no process.md", () => {
    writeBoard(project, [laptopEntry()])

    expectRefused(runExport(project, "markdown"), `process-factory: cannot export ${laptopId}: it has no published version\n`)
  })

  it("says that it cannot read the board when the board is not JSON", () => {
    writeFile(project, boardFile, "{ not json")

    const result = runExport(project, "html")

    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).not.toContain("exports")
  })

  it("says that it cannot read process.md when that is a folder", () => {
    writeBoard(project, [laptopEntry()])
    writeVersion(project, laptopId, 1, "# Handle a lost laptop\n", approvalText(laptopId, "draft-1.md", kari, "2026-10-02T09:00:00.000Z"))
    mkdirSync(path.join(project, `processes/${laptopId}/versions/2/process.md`), { recursive: true })

    expectRefused(runExport(project, "html"), `process-factory: cannot export ${laptopId}: cannot read processes/${laptopId}/versions/2/process.md\n`)
  })

  it("says that it cannot write the file when exports is a file", () => {
    writeLaptop(project)
    writeFile(project, "exports", "kept\n")

    const result = runExport(project, "html")

    expect(result.stderr.startsWith(`process-factory: cannot write ${htmlFile}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, "exports")).toBe("kept\n")
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["export alone", ["export"]],
    ["export with only an id", ["export", laptopId]],
    ["export without --format", ["export", laptopId, "--link", address]],
    ["export with --link before --format", ["export", laptopId, "--link", address, "--format", "html"]],
    ["export with --link but no address", ["export", laptopId, "--format", "html", "--link"]],
    ["export with an argument after the address", ["export", laptopId, "--format", "html", "--link", address, "extra"]],
  ])("has seventeen lines, with export after check and before serve, and is printed with %s", (_name, args) => {
    writeLaptop(project)
    const before = tree(project)

    const result = runCommand(project, args)

    expect(result.stderr).toBe(usage)
    const lines = result.stderr.trimEnd().split("\n")
    expect(lines).toHaveLength(17)
    expect(lines.slice(13)).toEqual([
      "       process-factory check",
      "       process-factory export <process-id> --format html|markdown --link <address>",
      "       process-factory serve [--port <number>]",
      "       process-factory dashboard [--port <number>]",
    ])
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })
})
