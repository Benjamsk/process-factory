import { rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, readFile, writeBoard } from "../006-process-state-machine/store.ts"
import { kari, laptopEntry, laptopId, laptopTitle, tree, writeLaptop, writeLaptopVersions, writeVersion } from "../026-reading-view-on-localhost/view.ts"
import { link, markdownFile, markdownStamp, runExport } from "./export.ts"

let project = ""
const stamp = markdownStamp(laptopTitle, 2, kari, kari, "2026-11-21", link)
const document = "# Handle a lost laptop\n\n## Steps\n\n1. IT manager (Ola Hansen): Block the laptop in Intune."

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory export with --format markdown", () => {
  it("writes exports/<process-id>-v<n>.md, prints that path and exits with 0", () => {
    writeLaptop(project)

    const result = runExport(project, "markdown")

    expect(result.stdout).toBe(`${markdownFile}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.md`])
  })

  it("writes the stamp, a line ---, the published process.md, a line --- and the stamp again", () => {
    writeLaptop(project)

    runExport(project, "markdown")

    expect(readFile(project, markdownFile)).toBe(`${stamp}\n\n---\n\n${document}\n\n---\n\n${stamp}\n`)
  })

  it("leaves out the empty lines at the start and at the end of the document, and the whitespace at the end of its lines", () => {
    writeLaptop(project, {}, "\r\n\r\n# Handle a lost laptop  \r\n\r\n## Steps\r\n\r\n1. IT manager (Ola Hansen): Block the laptop in Intune.\r\n\r\n\r\n")

    runExport(project, "markdown")

    expect(readFile(project, markdownFile)).toBe(`${stamp}\n\n---\n\n${document}\n\n---\n\n${stamp}\n`)
  })

  it("exports the newest published version while the process is in the stage regenerate", () => {
    writeLaptop(project, { stage: "regenerate" })

    const result = runExport(project, "markdown")

    expect(result.stdout).toBe(`${markdownFile}\n`)
    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.md`])
  })

  it("says not recorded for an owner the board does not have and for an approval the version does not have", () => {
    writeBoard(project, [{ ...laptopEntry(), owner: undefined }])
    writeVersion(project, laptopId, 2, "# Handle a lost laptop\n")

    runExport(project, "markdown")

    const expected = markdownStamp(laptopTitle, 2, "not recorded", "not recorded", "not recorded", link)
    expect(readFile(project, markdownFile)).toBe(`${expected}\n\n---\n\n# Handle a lost laptop\n\n---\n\n${expected}\n`)
  })

  it("puts a backslash before the characters of a title that could add markup to the stamp", () => {
    writeBoard(project, [laptopEntry({ title: "Tom & <b>Jerry</b>" })])
    writeLaptopVersions(project)

    runExport(project, "markdown")

    const lines = readFile(project, markdownFile).split("\n")
    expect(lines[0]).toBe("**Tom \\& \\<b\\>Jerry\\</b\\>**")
    expect(lines.filter((line) => line === "**Tom \\& \\<b\\>Jerry\\</b\\>**")).toHaveLength(2)
  })

  it("keeps the html export of the same version next to the markdown export", () => {
    writeLaptop(project)

    runExport(project, "html")
    runExport(project, "markdown")

    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.html`, `${laptopId}-v2.md`])
  })

  it("changes nothing in the store", () => {
    writeLaptop(project)
    const before = tree(path.join(project, "processes"))

    const result = runExport(project, "markdown")

    expect(result.status).toBe(0)
    expect(tree(path.join(project, "processes"))).toEqual(before)
  })
})
