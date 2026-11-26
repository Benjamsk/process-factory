import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { installedFilesEqualTheirTemplates, projectDirectory, runCommand, skillFiles, skillFolder, writeProjectFile } from "./command-line.ts"

describe("process-factory init", () => {
  it("copies the templates of the skill byte for byte into an empty folder and reports each one", () => {
    const result = runCommand(["init"])
    expect(result.stdout).toBe(skillFiles.map((file) => `Installed ${skillFolder}/${file}\n`).join(""))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(projectDirectory(), skillFolder)).sort()).toEqual([...skillFiles].sort())
    expect(installedFilesEqualTheirTemplates()).toBe(true)
  })

  it("replaces older copies of the files of the skill", () => {
    for (const file of skillFiles) writeProjectFile(`${skillFolder}/${file}`, "old\n")
    expect(runCommand(["init"]).status).toBe(0)
    expect(installedFilesEqualTheirTemplates()).toBe(true)
  })

  it("keeps other files under .claude", () => {
    writeProjectFile(".claude/skills/factory/SKILL.md", "factory\n")
    writeProjectFile(".claude/settings.json", "{}\n")
    expect(runCommand(["init"]).status).toBe(0)
    expect(readFileSync(path.join(projectDirectory(), ".claude/skills/factory/SKILL.md"), "utf8")).toBe("factory\n")
    expect(readFileSync(path.join(projectDirectory(), ".claude/settings.json"), "utf8")).toBe("{}\n")
    expect(readdirSync(projectDirectory()).sort()).toEqual([".claude", "organisations"])
  })

  it("fails with exit code 1 and one error line when .claude is a file", () => {
    writeProjectFile(".claude", "file\n")
    const result = runCommand(["init"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot write \.claude\/skills\/process\/SKILL\.md: .+\n$/)
  })
})
