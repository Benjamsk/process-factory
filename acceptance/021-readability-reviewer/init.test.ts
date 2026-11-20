import { existsSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, root, runCommand } from "../010-clarifying-questions/clarify.ts"
import { installedFolder, reviewerFile, template } from "./readability.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init with the readability reviewer", () => {
  it("prints the Installed line of readability-reviewer.md after the one of reviewer.md, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const lines = result.stdout.split("\n")
    const shared = lines.indexOf(`Installed ${installedFolder}/reviewer.md`)
    expect(shared).not.toBe(-1)
    expect(lines.indexOf(`Installed ${installedFolder}/${reviewerFile}`)).toBeGreaterThan(shared)
  })

  it("writes readability-reviewer.md byte-identical to the template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    const installed = path.join(project, installedFolder, reviewerFile)
    expect(existsSync(installed)).toBe(true)
    expect(readFileSync(installed).equals(readFileSync(path.join(root, template)))).toBe(true)
  })
})

describe("the copy that Claude Code loads in this repository", () => {
  it("has readability-reviewer.md in .claude/skills/process, byte-identical to its template", () => {
    const copy = path.join(root, installedFolder, reviewerFile)
    expect(existsSync(path.join(root, template))).toBe(true)
    expect(existsSync(copy)).toBe(true)
    expect(readFileSync(copy).equals(readFileSync(path.join(root, template)))).toBe(true)
  })
})
