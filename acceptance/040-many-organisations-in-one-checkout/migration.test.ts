import { existsSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyProject, names, read, root, run, write } from "./organisations.ts"

const moved = "process-factory: moved organisation/ and processes/ to organisations/fjordlys-laering/\n"
const first = "organisations/fjordlys-laering"
const rolesText = "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n"
const boardText = `${JSON.stringify({ processes: [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }] }] }, null, 2)}\n`

let project = ""

/** Writes the layout of before this job: `organisation/` and `processes/` in the project's folder. */
function writeOldLayout(): void {
  write(project, "organisation/roles.md", rolesText)
  write(project, "processes/board.json", boardText)
  write(project, "processes/001-handle-a-breach/request.md", "# Handle a breach\n")
}

beforeEach(() => {
  project = emptyProject()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("the first command in a project with organisation/ and processes/ in its folder", () => {
  it("moves both into organisations/fjordlys-laering, says so on standard error, and prints what the command prints", () => {
    writeOldLayout()

    const result = run(project, ["show"])

    expect(result.stdout).toBe("001-handle-a-breach  intake  Handle a breach\n")
    expect(result.stderr).toBe(moved)
    expect(result.status).toBe(0)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations")).toEqual(["fjordlys-laering"])
    expect(names(project, first)).toEqual(["organisation", "organisation.json", "processes"])
    expect(JSON.parse(read(project, `${first}/organisation.json`))).toEqual({ name: "Fjordlys Læring AS" })
    expect(read(project, `${first}/organisation/roles.md`)).toBe(rolesText)
    expect(read(project, `${first}/processes/board.json`)).toBe(boardText)
    expect(read(project, `${first}/processes/001-handle-a-breach/request.md`)).toBe("# Handle a breach\n")
  })

  it("names the first organisation Fjordlys Læring AS, and moves nothing a second time", () => {
    writeOldLayout()
    expect(run(project, ["show"]).status).toBe(0)

    const listed = run(project, ["org", "list"])

    expect(listed.stdout).toBe("fjordlys-laering  Fjordlys Læring AS\n")
    expect(listed.stderr).toBe("")
    expect(listed.status).toBe(0)
  })

  it("moves a processes/ folder that stands alone, before org new creates a second organisation", () => {
    write(project, "processes/board.json", boardText)

    const result = run(project, ["org", "new", "Berg AS"])

    expect(result.stdout).toBe("berg-as\n")
    expect(result.stderr).toBe(moved)
    expect(result.status).toBe(0)
    expect(names(project)).toEqual(["organisations"])
    expect(names(project, "organisations")).toEqual(["berg-as", "fjordlys-laering"])
    expect(names(project, first)).toEqual(["organisation.json", "processes"])
    expect(read(project, `${first}/processes/board.json`)).toBe(boardText)
  })

  it("is not init: init leaves both folders where they are, and the next command moves them", () => {
    writeOldLayout()

    expect(run(project, ["init"]).status).toBe(0)

    expect(names(project)).toEqual([".claude", "organisation", "processes"])

    const listed = run(project, ["org", "list"])

    expect(listed.stdout).toBe("fjordlys-laering  Fjordlys Læring AS\n")
    expect(listed.stderr).toBe(moved)
    expect(names(project)).toEqual([".claude", "organisations"])
  })

  it("leaves a root exports/ folder where it is", () => {
    writeOldLayout()
    write(project, "exports/001-handle-a-breach-v1.md", "an earlier export\n")

    expect(run(project, ["show"]).status).toBe(0)

    expect(names(project)).toEqual(["exports", "organisations"])
    expect(read(project, "exports/001-handle-a-breach-v1.md")).toBe("an earlier export\n")
  })
})

describe("the store of this repository", () => {
  it("lies in organisations/fjordlys-laering, named Fjordlys Læring AS, with its context and its two processes, and no longer at the root", () => {
    expect(existsSync(path.join(root, "organisation"))).toBe(false)
    expect(existsSync(path.join(root, "processes"))).toBe(false)
    expect(JSON.parse(read(root, `${first}/organisation.json`) || "{}")).toEqual({ name: "Fjordlys Læring AS" })
    expect(read(root, `${first}/organisation/roles.md`)).not.toBe("")
    const board = read(root, `${first}/processes/board.json`)
    expect(board).toContain('"id": "001-handle-a-personal-data-breach"')
    expect(board).toContain('"id": "002-report-a-lost-laptop"')
    expect(read(root, `${first}/processes/001-handle-a-personal-data-breach/request.md`)).not.toBe("")
    expect(read(root, `${first}/processes/002-report-a-lost-laptop/request.md`)).not.toBe("")
  })
})
