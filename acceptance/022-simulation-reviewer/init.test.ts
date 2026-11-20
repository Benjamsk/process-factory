import { existsSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, installedFolder, root, runCommand } from "../010-clarifying-questions/clarify.ts"
import { simulationCopy, simulationTemplate } from "./simulation.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init in an empty working directory", () => {
  it("prints the Installed line of simulation-reviewer.md after the line of reviewer.md, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    const lines = result.stdout.split("\n")
    expect(lines).toContain(`Installed ${installedFolder}/simulation-reviewer.md`)
    expect(lines.indexOf(`Installed ${installedFolder}/simulation-reviewer.md`)).toBeGreaterThan(lines.indexOf(`Installed ${installedFolder}/reviewer.md`))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("installs simulation-reviewer.md byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    const installed = path.join(project, installedFolder, "simulation-reviewer.md")
    expect(existsSync(installed)).toBe(true)
    expect(readFileSync(installed).equals(readFileSync(path.join(root, simulationTemplate)))).toBe(true)
  })
})

describe("the copy that Claude Code loads in this repository", () => {
  it("has .claude/skills/process/simulation-reviewer.md byte-identical to its template", () => {
    expect(existsSync(path.join(root, simulationTemplate))).toBe(true)
    expect(existsSync(path.join(root, simulationCopy))).toBe(true)
    expect(readFileSync(path.join(root, simulationCopy)).equals(readFileSync(path.join(root, simulationTemplate)))).toBe(true)
  })
})
