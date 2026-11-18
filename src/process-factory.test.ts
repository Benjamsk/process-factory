import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const repositoryRoot = path.resolve(import.meta.dirname, "..")
const commandFile = path.join(repositoryRoot, "bin", "process-factory.mjs")
const templateFile = path.join(repositoryRoot, "templates", "skills", "process", "SKILL.md")
const skillPath = ".claude/skills/process/SKILL.md"
const boardPath = "processes/board.json"

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

function readWorkingFile(file: string): string {
  return readFileSync(path.join(workingDirectory, file), "utf8")
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

describe("process-factory new", () => {
  it("prints the id and creates the process folder, request.md and the five empty folders", () => {
    const result = runCommand(["new", "Handle a personal data breach"])
    expect(result.stdout).toBe("001-handle-a-personal-data-breach\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const folder = "processes/001-handle-a-personal-data-breach"
    expect(readdirSync(path.join(workingDirectory, folder)).sort()).toEqual([
      "cases",
      "drafts",
      "feedback",
      "request.md",
      "rounds",
      "versions",
    ])
    expect(readdirSync(path.join(workingDirectory, folder, "cases"))).toEqual([])
    expect(readWorkingFile(`${folder}/request.md`)).toBe("# Handle a personal data breach\n")
  })

  it("lists the process on the board in the stage intake and writes nothing else", () => {
    runCommand(["new", "Handle a personal data breach"])
    expect(readWorkingFile(boardPath)).toBe(
      `${JSON.stringify(
        { processes: [{ id: "001-handle-a-personal-data-breach", title: "Handle a personal data breach", stage: "intake" }] },
        null,
        2,
      )}\n`,
    )
    expect(readdirSync(workingDirectory)).toEqual(["processes"])
  })

  it("takes the next number after the highest on the board, trims the title and keeps six words", () => {
    writeWorkingFile(boardPath, `${JSON.stringify({ processes: [{ id: "007-older-process", owner: "Kari" }] }, null, 2)}\n`)
    const result = runCommand(["new", "  Onboard a new colleague, step by step, in two weeks  "])
    expect(result.stdout).toBe("008-onboard-a-new-colleague-step-by\n")
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        { id: "007-older-process", owner: "Kari" },
        {
          id: "008-onboard-a-new-colleague-step-by",
          title: "Onboard a new colleague, step by step, in two weeks",
          stage: "intake",
        },
      ],
    })
  })

  it("keeps a title with dots and slashes inside the store", () => {
    expect(runCommand(["new", "../../outside"]).stdout).toBe("001-outside\n")
    expect(readdirSync(path.join(workingDirectory, "processes")).sort()).toEqual(["001-outside", "board.json"])
  })

  it.each([[""], ["   "], ["???"], ["Handle a breach\nand more"]])(
    "refuses the title %j and writes nothing",
    (title) => {
      const result = runCommand(["new", title])
      expect(result.stderr).toBe("process-factory: the title must be one line with at least one letter or digit\n")
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(readdirSync(workingDirectory)).toEqual([])
    },
  )

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])(
    "names the board it cannot read and writes nothing for %j",
    (content) => {
      writeWorkingFile(boardPath, content)
      const result = runCommand(["new", "Handle a breach"])
      expect(result.status).toBe(1)
      expect(result.stdout).toBe("")
      expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
      expect(readWorkingFile(boardPath)).toBe(content)
      expect(readdirSync(path.join(workingDirectory, "processes"))).toEqual(["board.json"])
    },
  )

  it("names the process it cannot create when processes is a file", () => {
    writeWorkingFile("processes", "not a folder\n")
    const result = runCommand(["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot create process 001-handle-a-breach: .+\n$/)
    expect(readWorkingFile("processes")).toBe("not a folder\n")
  })

  it("keeps an existing process folder and writes no board", () => {
    writeWorkingFile("processes/001-handle-a-breach/notes.txt", "kept\n")
    const result = runCommand(["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/^process-factory: cannot create process 001-handle-a-breach: .+\n$/)
    expect(readWorkingFile("processes/001-handle-a-breach/notes.txt")).toBe("kept\n")
    expect(readdirSync(path.join(workingDirectory, "processes"))).toEqual(["001-handle-a-breach"])
  })
})

describe("process-factory with anything other than init", () => {
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b"]]])(
    "prints the usage and writes nothing for %j",
    (commandArguments) => {
      const result = runCommand(commandArguments)
      expect(result.stderr).toBe('Usage: process-factory init\n       process-factory new "<title>"\n')
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(readdirSync(workingDirectory)).toEqual([])
    },
  )
})
