import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  binFile,
  emptyFolder,
  entries,
  installedFolder,
  interviewerTemplate,
  root,
  runCommand,
  runNode,
  skillTemplate,
  writeFile,
} from "./interview.ts"

const installedLines = `Installed ${installedFolder}/SKILL.md\nInstalled ${installedFolder}/interviewer.md\nInstalled ${installedFolder}/questioner.md\nInstalled ${installedFolder}/spec-writer.md\nInstalled ${installedFolder}/case-writer.md\nInstalled ${installedFolder}/draft-writer.md\n`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

function installed(file: string): Buffer {
  return readFileSync(path.join(project, installedFolder, file))
}

describe("process-factory init in an empty working directory", () => {
  it("prints the six Installed lines in order, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
  })

  it("creates .claude/skills/process with exactly SKILL.md, case-writer.md, draft-writer.md, interviewer.md, questioner.md and spec-writer.md, each byte-identical to its template", () => {
    expect(existsSync(path.join(root, interviewerTemplate))).toBe(true)
    expect(runCommand(project, ["init"]).status).toBe(0)
    expect(entries(project)).toEqual([".claude"])
    expect(entries(project, ".claude")).toEqual(["skills"])
    expect(entries(project, ".claude/skills")).toEqual(["process"])
    expect(entries(project, installedFolder)).toEqual(["SKILL.md", "case-writer.md", "draft-writer.md", "interviewer.md", "questioner.md", "spec-writer.md"])
    expect(installed("SKILL.md").equals(readFileSync(path.join(root, skillTemplate)))).toBe(true)
    expect(installed("interviewer.md").equals(readFileSync(path.join(root, interviewerTemplate)))).toBe(true)
  })
})

describe("process-factory init when the interviewer file is already there", () => {
  it("replaces an existing interviewer.md whose content differs from the template", () => {
    expect(existsSync(path.join(root, interviewerTemplate))).toBe(true)
    writeFile(project, `${installedFolder}/interviewer.md`, "an older version of the interviewer\n")
    const result = runCommand(project, ["init"])
    expect(result.status).toBe(0)
    expect(installed("interviewer.md").equals(readFileSync(path.join(root, interviewerTemplate)))).toBe(true)
  })
})

describe("process-factory init from an installed copy", () => {
  it("takes interviewer.md from the copy under node_modules", () => {
    expect(existsSync(path.join(root, interviewerTemplate))).toBe(true)
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
    appendFileSync(path.join(packageFolder, interviewerTemplate), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLines)
    expect(result.status).toBe(0)
    expect(installed("interviewer.md").equals(readFileSync(path.join(packageFolder, interviewerTemplate)))).toBe(true)
    expect(installed("interviewer.md").equals(readFileSync(path.join(root, interviewerTemplate)))).toBe(false)
    expect(entries(packageFolder)).toEqual(["bin", "package.json", "templates"])
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has .claude/skills/process/interviewer.md byte-identical to its template, next to an identical SKILL.md", () => {
    const template = path.join(root, interviewerTemplate)
    const copy = path.join(root, installedFolder, "interviewer.md")
    expect(existsSync(template)).toBe(true)
    expect(existsSync(copy)).toBe(true)
    expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
    expect(readFileSync(path.join(root, installedFolder, "SKILL.md")).equals(readFileSync(path.join(root, skillTemplate)))).toBe(true)
  })
})
