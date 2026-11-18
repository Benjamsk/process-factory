import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const repositoryRoot = path.resolve(import.meta.dirname, "..")
const commandFile = path.join(repositoryRoot, "bin", "process-factory.mjs")
const templateFile = path.join(repositoryRoot, "templates", "skills", "process", "SKILL.md")
const skillPath = ".claude/skills/process/SKILL.md"

let workingDirectory = ""

beforeEach(() => {
  workingDirectory = mkdtempSync(path.join(tmpdir(), "process-factory-unit-"))
})

afterEach(() => {
  rmSync(workingDirectory, { recursive: true, force: true })
})

function runCommand(commandArguments: string[]) {
  return spawnSync(process.execPath, [commandFile, ...commandArguments], { cwd: workingDirectory, encoding: "utf8" })
}

function writeWorkingFile(file: string, content: string): void {
  const absolute = path.join(workingDirectory, file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

function installedSkill(): Buffer {
  return readFileSync(path.join(workingDirectory, skillPath))
}

describe("process-factory init", () => {
  it("copies the template byte for byte into an empty folder and reports it", () => {
    const result = runCommand(["init"])
    expect(result.stdout).toBe(`Installed ${skillPath}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(installedSkill().equals(readFileSync(templateFile))).toBe(true)
  })

  it("replaces an older copy of the skill", () => {
    writeWorkingFile(skillPath, "old\n")
    expect(runCommand(["init"]).status).toBe(0)
    expect(installedSkill().equals(readFileSync(templateFile))).toBe(true)
  })

  it("keeps other files under .claude", () => {
    writeWorkingFile(".claude/skills/factory/SKILL.md", "factory\n")
    writeWorkingFile(".claude/settings.json", "{}\n")
    expect(runCommand(["init"]).status).toBe(0)
    expect(readFileSync(path.join(workingDirectory, ".claude/skills/factory/SKILL.md"), "utf8")).toBe("factory\n")
    expect(readFileSync(path.join(workingDirectory, ".claude/settings.json"), "utf8")).toBe("{}\n")
    expect(readdirSync(workingDirectory)).toEqual([".claude"])
  })

  it("fails with exit code 1 and one error line when .claude is a file", () => {
    writeWorkingFile(".claude", "file\n")
    const result = runCommand(["init"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot write \.claude\/skills\/process\/SKILL\.md: .+\n$/)
  })
})

describe("process-factory with anything other than init", () => {
  it.each([[[]], [["help"]], [["init", "extra"]]])("prints the usage and writes nothing for %j", (commandArguments) => {
    const result = runCommand(commandArguments)
    expect(result.stderr).toBe("Usage: process-factory init\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(workingDirectory)).toEqual([])
  })
})
