import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, emptyFolder, entries, installedFolder, root, runCommand, runNode } from "../010-clarifying-questions/clarify.ts"

const incidentTemplate = "templates/skills/process/incident.md"
const eightFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "incident.md", "reviewer.md"]
const installedLines =
  "Installed .claude/skills/process/SKILL.md\n" +
  "Installed .claude/skills/process/interviewer.md\n" +
  "Installed .claude/skills/process/questioner.md\n" +
  "Installed .claude/skills/process/spec-writer.md\n" +
  "Installed .claude/skills/process/case-writer.md\n" +
  "Installed .claude/skills/process/draft-writer.md\n" +
  "Installed .claude/skills/process/incident.md\n" +
  "Installed .claude/skills/process/reviewer.md\n"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init in an empty working directory", () => {
  it("prints the eight Installed lines in order, with incident.md as the seventh, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
  })

  it("creates .claude/skills/process with exactly the eight files, each byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([
      "SKILL.md",
      "case-writer.md",
      "draft-writer.md",
      "incident.md",
      "interviewer.md",
      "questioner.md",
      "reviewer.md",
      "spec-writer.md",
    ])
    for (const file of eightFiles) {
      const template = readFileSync(path.join(root, "templates/skills/process", file))
      expect(readFileSync(path.join(project, installedFolder, file)).equals(template)).toBe(true)
    }
  })
})

describe("process-factory init from an installed copy", () => {
  it("takes incident.md from the copy under node_modules", () => {
    expect(existsSync(path.join(root, incidentTemplate))).toBe(true)
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
    appendFileSync(path.join(packageFolder, incidentTemplate), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
    const installed = readFileSync(path.join(project, installedFolder, "incident.md"))
    expect(installed.equals(readFileSync(path.join(packageFolder, incidentTemplate)))).toBe(true)
    expect(installed.equals(readFileSync(path.join(root, incidentTemplate)))).toBe(false)
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has the eight files in .claude/skills/process, each byte-identical to its template", () => {
    for (const file of eightFiles) {
      const template = path.join(root, "templates/skills/process", file)
      const copy = path.join(root, installedFolder, file)
      expect(existsSync(template)).toBe(true)
      expect(existsSync(copy)).toBe(true)
      expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
    }
  })
})
