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
const usage =
  'Usage: process-factory init\n       process-factory new "<title>"\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory org init\n'
const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

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

function writeBoardFile(processes: Record<string, unknown>[]): void {
  writeWorkingFile(boardPath, `${JSON.stringify({ processes }, null, 2)}\n`)
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

  it("lists the process on the board in the stage intake with one dated history entry and writes nothing else", () => {
    runCommand(["new", "Handle a personal data breach"])
    const text = readWorkingFile(boardPath)
    const parsed: unknown = JSON.parse(text)
    expect(parsed).toEqual({
      processes: [
        {
          id: "001-handle-a-personal-data-breach",
          title: "Handle a personal data breach",
          stage: "intake",
          history: [{ at: expect.stringMatching(timeForm), stage: "intake" }],
        },
      ],
    })
    expect(text).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
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
          history: [{ at: expect.stringMatching(timeForm), stage: "intake" }],
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

describe("process-factory move", () => {
  it("prints the new stage, stores it and appends a dated history entry", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "intake", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }] },
    ])

    const result = runCommand(["move", "001-handle-a-breach", "spec"])

    expect(result.stdout).toBe("spec\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "spec",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "intake" },
            { at: expect.stringMatching(timeForm), stage: "spec" },
          ],
        },
      ],
    })
  })

  it("keeps the other entries and the keys it does not know", () => {
    const older = { id: "001-older-process", title: "Older process", stage: "review", owner: "Kari" }
    writeBoardFile([older, { id: "002-handle-a-breach", title: "Handle a breach", stage: "cases", owner: "Ola" }])

    expect(runCommand(["move", "002-handle-a-breach", "draft"]).status).toBe(0)

    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        older,
        {
          id: "002-handle-a-breach",
          title: "Handle a breach",
          stage: "draft",
          owner: "Ola",
          history: [{ at: expect.stringMatching(timeForm), stage: "draft" }],
        },
      ],
    })
  })

  it.each([
    ["published", "intake", "(allowed from intake: clarify, spec)"],
    ["intake", "intake", "(allowed from intake: clarify, spec)"],
    ["done", "review", "(allowed from review: rework, approval)"],
    ["intake", "archived", "(allowed from archived: none)"],
  ])("refuses the move to %s from %s and leaves the board as it was", (to, from, allowed) => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: from }])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", "001-handle-a-breach", to])

    expect(result.stderr).toBe(`process-factory: cannot move 001-handle-a-breach from ${from} to ${to} ${allowed}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("says there is no process and writes nothing when there is no board", () => {
    const result = runCommand(["move", "../../outside", "clarify"])
    expect(result.stderr).toBe("process-factory: there is no process ../../outside\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])(
    "names the board it cannot read and writes nothing for %j",
    (content) => {
      writeWorkingFile(boardPath, content)
      const result = runCommand(["move", "001-handle-a-breach", "clarify"])
      expect(result.status).toBe(1)
      expect(result.stdout).toBe("")
      expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
      expect(readWorkingFile(boardPath)).toBe(content)
    },
  )
})

describe("process-factory show", () => {
  it("prints one line per process with id, stage and title, in the board's order", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify" },
      { id: "002-onboard-a-new-colleague", title: "Onboard a new colleague", stage: "intake" },
    ])
    const result = runCommand(["show"])
    expect(result.stdout).toBe("001-handle-a-breach  clarify  Handle a breach\n002-onboard-a-new-colleague  intake  Onboard a new colleague\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints No processes. and creates nothing when there is no board", () => {
    const result = runCommand(["show"])
    expect(result.stdout).toBe("No processes.\n")
    expect(result.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it("prints one process with its history, oldest first, and leaves the board as it was", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }, { at: "2026-11-18T17:05:40.456Z", stage: "clarify" }] },
    ])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["show", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      "001-handle-a-breach\nTitle: Handle a breach\nStage: clarify\nHistory:\n  2026-11-18T17:02:11.123Z  intake\n  2026-11-18T17:05:40.456Z  clarify\n",
    )
    expect(result.status).toBe(0)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("ends with the line History: for a process stored without a history", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const result = runCommand(["show", "001-handle-a-breach"])
    expect(result.stdout).toBe("001-handle-a-breach\nTitle: Handle a breach\nStage: intake\nHistory:\n")
    expect(result.status).toBe(0)
  })

  it("says there is no process for an id that is not on the board", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const result = runCommand(["show", "002-handle-a-breach"])
    expect(result.stderr).toBe("process-factory: there is no process 002-handle-a-breach\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("process-factory org init", () => {
  it("creates the five files in the fixed order, reports each one and copies the templates", () => {
    const result = runCommand(["org", "init"])
    expect(result.stdout).toBe(organisationFiles.map((file) => `Created organisation/${file}\n`).join(""))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual(["organisation"])
    for (const file of organisationFiles) {
      const template = readFileSync(path.join(repositoryRoot, "templates", "organisation", file), "utf8")
      expect(readWorkingFile(`organisation/${file}`)).toBe(template)
    }
  })

  it("prints No files created. on a second run and leaves what the user wrote", () => {
    expect(runCommand(["org", "init"]).status).toBe(0)
    writeWorkingFile("organisation/policies.md", "# Policies\n\nWhat the user wrote.\n")

    const result = runCommand(["org", "init"])

    expect(result.stdout).toBe("No files created.\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile("organisation/policies.md")).toBe("# Policies\n\nWhat the user wrote.\n")
  })

  it("keeps a file that is already there and creates the four that are missing", () => {
    writeWorkingFile("organisation/roles.md", "# Roles\n\nKari is the managing director.\n")

    const result = runCommand(["org", "init"])

    expect(result.stdout).toBe(
      "Created organisation/systems.md\nCreated organisation/processors.md\nCreated organisation/policies.md\nCreated organisation/authority.md\n",
    )
    expect(result.status).toBe(0)
    expect(readWorkingFile("organisation/roles.md")).toBe("# Roles\n\nKari is the managing director.\n")
    expect(readdirSync(path.join(workingDirectory, "organisation")).sort()).toEqual([...organisationFiles].sort())
  })

  it("fails with exit code 1 and names roles.md when organisation is a file", () => {
    writeWorkingFile("organisation", "not a folder\n")
    const result = runCommand(["org", "init"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot write organisation\/roles\.md: .+\n$/)
    expect(readWorkingFile("organisation")).toBe("not a folder\n")
  })
})

describe("process-factory with anything other than a command", () => {
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b"]], [["move"]], [["move", "a"]], [["move", "a", "b", "c"]], [["show", "a", "b"]], [["org"]], [["org", "init", "extra"]]])(
    "prints the usage and writes nothing for %j",
    (commandArguments) => {
      const result = runCommand(commandArguments)
      expect(result.stderr).toBe(usage)
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(readdirSync(workingDirectory)).toEqual([])
    },
  )
})
