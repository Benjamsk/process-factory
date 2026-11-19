import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, emptyFolder, installedFile, root, runCommand, runNode, templateFile } from "./repository.ts"

const installedLine = "Installed .claude/skills/process/SKILL.md\nInstalled .claude/skills/process/interviewer.md\nInstalled .claude/skills/process/questioner.md\nInstalled .claude/skills/process/spec-writer.md\n"
const usageLine =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory org init\n'

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

function template(): Buffer {
  return readFileSync(path.join(root, templateFile))
}

function installed(): Buffer {
  return readFileSync(path.join(project, installedFile))
}

function writeProjectFile(file: string, content: string): void {
  const absolute = path.join(project, file)
  mkdirSync(path.dirname(absolute), { recursive: true })
  writeFileSync(absolute, content)
}

describe("process-factory init", () => {
  it("writes .claude/skills/process/SKILL.md into an empty working directory, byte-identical to the template", () => {
    const result = runCommand(project, ["init"])
    expect(result.status).toBe(0)
    expect(existsSync(path.join(project, installedFile))).toBe(true)
    expect(installed().equals(template())).toBe(true)
  })

  it("prints one Installed line per file to standard output and nothing to standard error", () => {
    const result = runCommand(project, ["init"])
    expect(result.stdout).toBe(installedLine)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("works from a copy of the package under node_modules and takes the template from that copy", () => {
    expect(existsSync(path.join(root, binFile))).toBe(true)
    expect(existsSync(path.join(root, templateFile))).toBe(true)
    const repositoryTemplate = template()
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
    appendFileSync(path.join(packageFolder, templateFile), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(installedLine)
    expect(result.status).toBe(0)
    expect(installed().equals(readFileSync(path.join(packageFolder, templateFile)))).toBe(true)
    expect(template().equals(repositoryTemplate)).toBe(true)
  })

  it("replaces an existing copy whose content differs from the template", () => {
    writeProjectFile(installedFile, "an older version of the skill\n")
    const result = runCommand(project, ["init"])
    expect(result.status).toBe(0)
    expect(installed().equals(template())).toBe(true)
  })

  it("leaves the factory skill, .claude/settings.json and the rest of the working directory as they were", () => {
    writeProjectFile(".claude/skills/factory/SKILL.md", "the factory skill\n")
    writeProjectFile(".claude/settings.json", '{ "permissions": {} }\n')
    writeProjectFile("notes.txt", "notes\n")

    const result = runCommand(project, ["init"])

    expect(result.status).toBe(0)
    expect(readFileSync(path.join(project, ".claude/skills/factory/SKILL.md"), "utf8")).toBe("the factory skill\n")
    expect(readFileSync(path.join(project, ".claude/settings.json"), "utf8")).toBe('{ "permissions": {} }\n')
    expect(readFileSync(path.join(project, "notes.txt"), "utf8")).toBe("notes\n")
    expect(readdirSync(project).sort()).toEqual([".claude", "notes.txt"])
    expect(readdirSync(path.join(project, ".claude")).sort()).toEqual(["settings.json", "skills"])
    expect(readdirSync(path.join(project, ".claude/skills")).sort()).toEqual(["factory", "process"])
  })

  it("exits with 1 and names the file it cannot write when .claude is a file", () => {
    writeProjectFile(".claude", "not a folder\n")
    const result = runCommand(project, ["init"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot write .claude/skills/process/SKILL.md: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFileSync(path.join(project, ".claude"), "utf8")).toBe("not a folder\n")
  })
})

describe("process-factory without the one command init", () => {
  it.each([
    ["no argument", []],
    ["the argument help", ["help"]],
    ["the arguments init extra", ["init", "extra"]],
  ])("prints the usage to standard error, exits with 1 and creates nothing with %s", (_name, args) => {
    const result = runCommand(project, args)
    expect(result.stderr).toBe(usageLine)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(project)).toEqual([])
  })
})
