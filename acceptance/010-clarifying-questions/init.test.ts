import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, emptyFolder, entries, installedFolder, questionerTemplate, root, runCommand, runNode, skillFiles } from "./clarify.ts"

const installedLines = skillFiles.map((file) => `Installed ${installedFolder}/${file}\n`).join("")

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init in an empty working directory", () => {
  it("prints the six Installed lines in order, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
  })

  it("creates .claude/skills/process with exactly SKILL.md, case-writer.md, draft-writer.md, interviewer.md, questioner.md and spec-writer.md, each byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([...skillFiles].sort())
    for (const file of skillFiles) {
      const template = readFileSync(path.join(root, "templates/skills/process", file))
      expect(readFileSync(path.join(project, installedFolder, file)).equals(template)).toBe(true)
    }
  })
})

describe("process-factory init from an installed copy", () => {
  it("takes questioner.md from the copy under node_modules", () => {
    expect(existsSync(path.join(root, questionerTemplate))).toBe(true)
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
    appendFileSync(path.join(packageFolder, questionerTemplate), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
    const installed = readFileSync(path.join(project, installedFolder, "questioner.md"))
    expect(installed.equals(readFileSync(path.join(packageFolder, questionerTemplate)))).toBe(true)
    expect(installed.equals(readFileSync(path.join(root, questionerTemplate)))).toBe(false)
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has SKILL.md, interviewer.md, questioner.md, spec-writer.md, case-writer.md and draft-writer.md in .claude/skills/process, each byte-identical to its template", () => {
    for (const file of skillFiles) {
      const template = path.join(root, "templates/skills/process", file)
      const copy = path.join(root, installedFolder, file)
      expect(existsSync(template)).toBe(true)
      expect(existsSync(copy)).toBe(true)
      expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
    }
  })
})
