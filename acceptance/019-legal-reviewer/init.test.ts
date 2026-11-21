import { existsSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, root, runCommand } from "../010-clarifying-questions/clarify.ts"
import { copy, installedFolder, template } from "./legal.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init in an empty working directory", () => {
  it("prints the Installed line of legal-reviewer.md after the line of reviewer.md and exits with 0", () => {
    const result = runCommand(project, ["init"])
    const lines = result.stdout.split("\n")
    expect(lines).toContain(`Installed ${installedFolder}/legal-reviewer.md`)
    expect(lines.indexOf(`Installed ${installedFolder}/legal-reviewer.md`)).toBeGreaterThan(lines.indexOf(`Installed ${installedFolder}/reviewer.md`))
    expect(result.status).toBe(0)
  })

  it("writes .claude/skills/process/legal-reviewer.md byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    const installed = path.join(project, installedFolder, "legal-reviewer.md")
    expect(existsSync(installed)).toBe(true)
    expect(readFileSync(installed).equals(readFileSync(path.join(root, template)))).toBe(true)
  })
})

describe("the copy .claude/skills/process/legal-reviewer.md in this repository", () => {
  it("is byte-identical to its template", () => {
    expect(existsSync(path.join(root, template))).toBe(true)
    expect(existsSync(path.join(root, copy))).toBe(true)
    expect(readFileSync(path.join(root, copy)).equals(readFileSync(path.join(root, template)))).toBe(true)
  })
})
