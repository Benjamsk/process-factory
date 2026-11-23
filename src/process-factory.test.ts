import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { request as httpRequest, type IncomingHttpHeaders } from "node:http"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const repositoryRoot = path.resolve(import.meta.dirname, "..")
const commandFile = path.join(repositoryRoot, "bin", "process-factory.mjs")
const skillFolder = ".claude/skills/process"
const skillFiles = [
  "SKILL.md",
  "interviewer.md",
  "questioner.md",
  "spec-writer.md",
  "case-writer.md",
  "draft-writer.md",
  "incident.md",
  "reviewer.md",
  ...readdirSync(path.join(repositoryRoot, "templates", "skills", "process"))
    .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
    .sort(),
]
const boardPath = "processes/board.json"
const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n'
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

function installedFilesEqualTheirTemplates(): boolean {
  return skillFiles.every((file) =>
    readFileSync(path.join(workingDirectory, skillFolder, file)).equals(
      readFileSync(path.join(repositoryRoot, "templates", "skills", "process", file)),
    ),
  )
}

function writeBoardFile(processes: Record<string, unknown>[]): void {
  writeWorkingFile(boardPath, `${JSON.stringify({ processes }, null, 2)}\n`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** The entries under `processes` on the board, or an empty list when there is none. */
function storedProcesses(): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(readWorkingFile(boardPath))
  const list: unknown = isRecord(parsed) ? parsed.processes : []
  return Array.isArray(list) ? list.filter(isRecord) : []
}

/** The history entries of a board entry, or an empty list when it has none. */
function storedHistory(entry: Record<string, unknown> | undefined): Record<string, unknown>[] {
  const list: unknown = entry?.history
  return Array.isArray(list) ? list.filter(isRecord) : []
}

describe("process-factory init", () => {
  it("copies the templates of the skill byte for byte into an empty folder and reports each one", () => {
    const result = runCommand(["init"])
    expect(result.stdout).toBe(skillFiles.map((file) => `Installed ${skillFolder}/${file}\n`).join(""))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, skillFolder)).sort()).toEqual([...skillFiles].sort())
    expect(installedFilesEqualTheirTemplates()).toBe(true)
  })

  it("replaces older copies of the files of the skill", () => {
    for (const file of skillFiles) writeWorkingFile(`${skillFolder}/${file}`, "old\n")
    expect(runCommand(["init"]).status).toBe(0)
    expect(installedFilesEqualTheirTemplates()).toBe(true)
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

  it("writes the trimmed prompt under the title in request.md and keeps it off the board", () => {
    const result = runCommand(["new", "Handle a breach", "  A laptop was lost.\nWho do we tell?  "])
    expect(result.stdout).toBe("001-handle-a-breach\n")
    expect(result.status).toBe(0)
    expect(readWorkingFile("processes/001-handle-a-breach/request.md")).toBe("# Handle a breach\n\nA laptop was lost.\nWho do we tell?\n")
    expect(readWorkingFile(boardPath)).not.toContain("A laptop was lost.")
  })

  it("writes request.md as the title alone for a prompt of only whitespace", () => {
    expect(runCommand(["new", "Handle a breach", " \n "]).status).toBe(0)
    expect(readWorkingFile("processes/001-handle-a-breach/request.md")).toBe("# Handle a breach\n")
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

describe("process-factory answer", () => {
  const processFolder = "processes/001-handle-a-breach"
  const answers = "# Answers 1\n\n## 1. Who reports a lost laptop?\n\nThe employee.\n"

  function prepareClarify(questionsFiles: string[]): void {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "clarify" }] },
    ])
    for (const file of questionsFiles) writeWorkingFile(`${processFolder}/${file}`, "# Questions\n")
    writeWorkingFile("my-answers.md", answers)
  }

  it("stores the answers under the number of the newest questions file and moves the process to spec", () => {
    prepareClarify(["questions-9.md", "questions-10.md"])

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stdout).toBe(`Stored ${processFolder}/answers-10.md\nspec\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile(`${processFolder}/answers-10.md`)).toBe(answers)
    expect(readWorkingFile("my-answers.md")).toBe(answers)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "spec",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "clarify" },
            { at: expect.stringMatching(timeForm), stage: "spec" },
          ],
        },
      ],
    })
  })

  it("names the stage when the process is not in clarify and writes nothing", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    writeWorkingFile(`${processFolder}/questions-1.md`, "# Questions\n")
    writeWorkingFile("my-answers.md", answers)
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toBe("process-factory: cannot answer 001-handle-a-breach: it is in the stage intake, not in clarify\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s and writes nothing", (unknown) => {
    prepareClarify(["questions-1.md"])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", unknown, "my-answers.md"])

    expect(result.stderr).toBe(`process-factory: there is no process ${unknown}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it.each([
    ["the folder holds only questions-one.md", "questions-one.md"],
    ["the folder of the process is missing", ""],
  ])("says there is no questions file and leaves the board as it was when %s", (_name, questionsFile) => {
    prepareClarify(questionsFile === "" ? [] : [questionsFile])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toBe(`process-factory: cannot answer 001-handle-a-breach: there is no questions file in ${processFolder}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the file it cannot read and stores nothing", () => {
    prepareClarify(["questions-1.md"])

    const result = runCommand(["answer", "001-handle-a-breach", "missing.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot read missing\.md: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it("says the file is empty when it holds only whitespace", () => {
    prepareClarify(["questions-1.md"])
    writeWorkingFile("blank.md", " \n\t\n")

    const result = runCommand(["answer", "001-handle-a-breach", "blank.md"])

    expect(result.stderr).toBe("process-factory: cannot answer 001-handle-a-breach: blank.md is empty\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["questions-1.md"])
  })

  it("never replaces an answers file that is already there and leaves the process in clarify", () => {
    prepareClarify(["questions-1.md"])
    writeWorkingFile(`${processFolder}/answers-1.md`, "the earlier answers\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot write processes\/001-handle-a-breach\/answers-1\.md: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(`${processFolder}/answers-1.md`)).toBe("the earlier answers\n")
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])("names the board it cannot read for %j", (content) => {
    writeWorkingFile(boardPath, content)

    const result = runCommand(["answer", "001-handle-a-breach", "my-answers.md"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(content)
  })
})

describe("process-factory accept-spec", () => {
  const processFolder = "processes/001-handle-a-breach"
  const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
  const openLine = `process-factory: cannot accept the spec of 001-handle-a-breach: these sections of ${processFolder}/spec.md are open`
  const staysLine = "process-factory: 001-handle-a-breach stays in spec: /process next 001-handle-a-breach writes the questions for the open sections"

  function specText(open: string[] = []): string {
    const sections = specSections.map((name) => `## ${name}\n\nStatus: ${open.includes(name) ? "open" : "decided"}\n`)
    return `# Specification: Handle a breach\n\n${sections.join("\n")}`
  }

  function prepareSpec(spec?: string, stage = "spec"): void {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage, history: [{ at: "2026-11-18T17:02:11.123Z", stage }] }])
    if (spec !== undefined) writeWorkingFile(`${processFolder}/spec.md`, spec)
  }

  it("records the acceptance, moves the process to cases and leaves spec.md as it was", () => {
    prepareSpec(specText())

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Accepted ${processFolder}/spec.md\ncases\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const acceptedAt = storedProcesses()[0]?.specAcceptedAt
    expect(acceptedAt).toMatch(timeForm)
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        {
          id: "001-handle-a-breach",
          title: "Handle a breach",
          stage: "cases",
          history: [
            { at: "2026-11-18T17:02:11.123Z", stage: "spec" },
            { at: acceptedAt, stage: "cases" },
          ],
          specAcceptedAt: acceptedAt,
        },
      ],
    })
    expect(readWorkingFile(`${processFolder}/spec.md`)).toBe(specText())
  })

  it.each([
    ["line ends of \\r\\n", specText().replaceAll("\n", "\r\n")],
    ["spaces at the end of a heading and of a Status line", specText().replaceAll("## Roles\n", "## Roles  \n").replaceAll("Status: decided\n", "Status: decided \n")],
    ["three blank lines under a heading", specText().replaceAll("\n\nStatus: decided", "\n\n\n\nStatus: decided")],
    ["a further level 2 heading", `${specText()}\n## Notes\n\nNothing more.\n`],
  ])("accepts a decided spec.md with %s", (_name, spec) => {
    prepareSpec(spec)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("cases")
  })

  it("names the open sections in the order of the eleven, leaves the process in spec and the board as it was", () => {
    prepareSpec(specText(["Deadlines", "Roles"]))
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Roles\n  Deadlines\n${staysLine}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    ["whose heading is missing", specText().replace("## Steps\n\nStatus: decided\n", "")],
    ["whose first line is not Status: decided", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nStatus: settled")],
    ["whose Status: decided comes after another line", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nThe steps follow.\n\nStatus: decided")],
  ])("names a section %s as open", (_name, spec) => {
    prepareSpec(spec)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Steps\n${staysLine}\n`)
    expect(result.status).toBe(1)
  })

  it("names all eleven sections for a process without a spec.md", () => {
    prepareSpec()

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n${specSections.map((name) => `  ${name}\n`).join("")}${staysLine}\n`)
    expect(result.status).toBe(1)
  })

  it("moves the process to clarify when the newest questions file has no answers", () => {
    prepareSpec(specText(["Roles"]))
    for (const file of ["questions-1.md", "answers-1.md", "questions-2.md"]) writeWorkingFile(`${processFolder}/${file}`, "# Round\n")

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `${openLine}\n  Roles\nprocess-factory: ${processFolder}/questions-2.md has no answers yet: 001-handle-a-breach moves to clarify\n`,
    )
    expect(result.stdout).toBe("clarify\n")
    expect(result.status).toBe(1)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("clarify")
    const changes = storedHistory(entry)
    expect(changes).toHaveLength(2)
    expect(changes[0]).toEqual({ at: "2026-11-18T17:02:11.123Z", stage: "spec" })
    expect(changes[1]?.stage).toBe("clarify")
    expect(changes[1]?.at).toMatch(timeForm)
    expect(Object.keys(entry ?? {})).not.toContain("specAcceptedAt")
  })

  it("leaves the process in spec when the newest questions file has its answers file", () => {
    prepareSpec(specText(["Roles"]))
    for (const file of ["questions-1.md", "questions-2.md", "answers-2.md"]) writeWorkingFile(`${processFolder}/${file}`, "# Round\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${openLine}\n  Roles\n${staysLine}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the stage of a process that is not in spec and writes nothing", () => {
    prepareSpec(specText(), "cases")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toBe("process-factory: cannot accept the spec of 001-handle-a-breach: it is in the stage cases, not in spec\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s and writes nothing", (unknown) => {
    prepareSpec(specText())
    const before = readWorkingFile(boardPath)

    const result = runCommand(["accept-spec", unknown])

    expect(result.stderr).toBe(`process-factory: there is no process ${unknown}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the board it cannot read", () => {
    writeWorkingFile(boardPath, "{ not json\n")

    const result = runCommand(["accept-spec", "001-handle-a-breach"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  it("refuses move to cases from spec, names accept-spec and still allows the move to clarify", () => {
    prepareSpec(specText())
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", "001-handle-a-breach", "cases"])
    expect(refused.stderr).toBe(
      "process-factory: cannot move 001-handle-a-breach from spec to cases: only accept-spec 001-handle-a-breach moves a process from spec to cases\n",
    )
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)

    const toDraft = runCommand(["move", "001-handle-a-breach", "draft"])
    expect(toDraft.stderr).toBe("process-factory: cannot move 001-handle-a-breach from spec to draft (allowed from spec: clarify)\n")

    expect(runCommand(["move", "001-handle-a-breach", "clarify"]).status).toBe(0)
  })

  it("prints Spec accepted between the Stage line and the History line, and only for an accepted process", () => {
    prepareSpec(specText())
    runCommand(["accept-spec", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines[2]).toBe("Stage: cases")
    expect(lines[3]?.slice("Spec accepted: ".length)).toBe(storedProcesses()[0]?.specAcceptedAt)
    expect(lines[4]).toBe("History:")
    writeBoardFile([{ id: "002-handle-a-breach", title: "Handle a breach", stage: "spec" }])
    expect(runCommand(["show", "002-handle-a-breach"]).stdout).not.toContain("Spec accepted:")
  })
})

describe("process-factory round", () => {
  const processFolder = "processes/001-handle-a-breach"
  const cannotLine = "process-factory: cannot record a round of 001-handle-a-breach"
  const staysLine = "process-factory: 001-handle-a-breach stays in review: /process next 001-handle-a-breach runs a new round"

  function findingsText(name: string, verdict: string, tags: string[]): string {
    const findings = tags.length === 0 ? "No findings.\n" : tags.map((tag) => `- [${tag}] Step 3: the deadline is missing.\n`).join("")
    return `# ${name} review of draft-1.md\n\nVerdict: ${verdict}\n\n${findings}`
  }

  /** A process in `review` with these reviewers installed, `draft-1.md` and, for each round, the findings files it names. */
  function prepareReview(reviewers: string[], rounds: Record<number, Record<string, string>>, more: Record<string, unknown> = {}): void {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "review", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "review" }], ...more },
    ])
    writeWorkingFile(`${skillFolder}/reviewer.md`, "# Reviewer\n")
    for (const reviewer of reviewers) writeWorkingFile(`${skillFolder}/${reviewer}-reviewer.md`, `# ${reviewer} reviewer\n`)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, "# Handle a breach\n")
    for (const [round, files] of Object.entries(rounds)) {
      for (const [file, content] of Object.entries(files)) writeWorkingFile(`${processFolder}/rounds/round-${round}/${file}`, content)
    }
  }

  it("records the round with the draft and the verdicts, moves the process to rework and prints the findings per tag", () => {
    prepareReview(["legal", "readability"], {
      1: { "legal.md": findingsText("legal", "CHANGES", ["high", "medium"]), "readability.md": findingsText("readability", "PASS", ["low"]) },
    })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  CHANGES  1 high, 1 medium, 0 low\n  readability  PASS  0 high, 0 medium, 1 low\nrework\n`,
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    const changes = storedHistory(entry)
    expect(changes[1]?.stage).toBe("rework")
    expect(changes[1]?.at).toMatch(timeForm)
    expect(entry?.stage).toBe("rework")
    expect(entry?.rounds).toEqual([
      {
        round: 1,
        draft: "draft-1.md",
        at: changes[1]?.at,
        verdicts: [
          { reviewer: "legal", verdict: "CHANGES" },
          { reviewer: "readability", verdict: "PASS" },
        ],
      },
    ])
  })

  it("moves the process to approval when every verdict is PASS", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("approval")
  })

  it("records the highest round folder after the rounds that are already there and keeps them", () => {
    const first = { round: 1, draft: "draft-1.md", at: "2026-11-18T17:05:40.456Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
    prepareReview(
      ["legal"],
      { 1: { "legal.md": findingsText("legal", "CHANGES", ["high"]) }, 2: { "legal.md": findingsText("legal", "PASS", []) } },
      { rounds: [first] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout.split("\n")[0]).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md`)
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.rounds).toEqual([
      first,
      { round: 2, draft: "draft-1.md", at: expect.stringMatching(timeForm), verdicts: [{ reviewer: "legal", verdict: "PASS" }] },
    ])
  })

  it.each([
    ["a file that is not there", "legal.md", "", "is missing"],
    ["a file without a verdict line", "legal.md", "# legal review of draft-1.md\n\nNo findings.\n", "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    ["a file with two verdict lines", "legal.md", "# legal review of draft-1.md\n\nVerdict: PASS\nVerdict: PASS\n", "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    ["a file with the verdict OK", "legal.md", findingsText("legal", "OK", []), "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    [
      "a line that starts with - but is no finding",
      "legal.md",
      "# legal review of draft-1.md\n\nVerdict: CHANGES\n\n- [urgent] Step 3: the deadline is missing.\n- [high] Step 3: the deadline is missing.\n",
      'line 5 starts with "- " but is not a finding tagged [high], [medium] or [low]',
    ],
    ["a PASS file with a medium finding", "legal.md", findingsText("legal", "PASS", ["medium"]), "the verdict is PASS but it has findings tagged high or medium"],
    ["a CHANGES file with only low findings", "legal.md", findingsText("legal", "CHANGES", ["low"]), "the verdict is CHANGES but it has no finding tagged high or medium"],
  ])("refuses %s, names it and leaves the board as it was", (_name, file, content, reason) => {
    prepareReview(["legal"], { 1: content === "" ? { "notes.md": "nothing\n" } : { [file]: content } })
    const before = readWorkingFile(boardPath)

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  ${file}: ${reason}\n${staysLine}\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names every failing file in the order of the reviewers", () => {
    prepareReview(["legal", "readability"], { 1: { "readability.md": findingsText("readability", "PASS", ["high"]) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  legal.md: is missing\n  readability.md: the verdict is PASS but it has findings tagged high or medium\n${staysLine}\n`,
    )
    expect(result.status).toBe(1)
  })

  it("says there is no process for an id that is not on the board", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "../../outside"])

    expect(result.stderr).toBe("process-factory: there is no process ../../outside\n")
    expect(result.status).toBe(1)
  })

  it("names the stage of a process that is not in review", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "draft" }])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: it is in the stage draft, not in review\n`)
    expect(result.status).toBe(1)
  })

  it("says no reviewer is installed when only reviewer.md lies next to the skill", () => {
    prepareReview([], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: no reviewer is installed in ${skillFolder}\n`)
    expect(result.status).toBe(1)
  })

  it("says there is no round folder and, for a round without a draft, that there is no draft", () => {
    prepareReview(["legal"], {})

    expect(runCommand(["round", "001-handle-a-breach"]).stderr).toBe(`${cannotLine}: there is no round folder in ${processFolder}/rounds\n`)

    writeWorkingFile(`${processFolder}/rounds/round-1/legal.md`, findingsText("legal", "PASS", []))
    rmSync(path.join(workingDirectory, processFolder, "drafts"), { recursive: true })

    expect(runCommand(["round", "001-handle-a-breach"]).stderr).toBe(`${cannotLine}: there is no draft in ${processFolder}/drafts\n`)
  })

  it("says the newest round is already recorded", () => {
    prepareReview(
      ["legal"],
      { 1: { "legal.md": findingsText("legal", "PASS", []) } },
      { rounds: [{ round: 1, draft: "draft-1.md", at: "2026-11-18T17:05:40.456Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: round 1 is already recorded\n`)
    expect(result.status).toBe(1)
  })

  /** The entries of `count` rounds that are already on the board, numbered from 1, each with legal asking for changes. */
  function recordedRounds(count: number): Record<string, unknown>[] {
    return Array.from({ length: count }, (_unused, index) => ({
      round: index + 1,
      draft: "draft-1.md",
      at: "2026-11-18T17:05:40.456Z",
      verdicts: [{ reviewer: "legal", verdict: "CHANGES" }],
    }))
  }

  /** The round entries of the one process on the board. */
  function storedRounds(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.rounds
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("stops the fifth round that asks for changes, moves it to approval and records the reason after the verdicts", () => {
    prepareReview(
      ["legal", "readability"],
      { 5: { "legal.md": findingsText("legal", "PASS", []), "readability.md": findingsText("readability", "CHANGES", ["medium"]) } },
      { rounds: recordedRounds(4) },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: readability"
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\n  readability  CHANGES  0 high, 1 medium, 0 low\nStopped: ${reason}\napproval\n`,
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("approval")
    expect(storedHistory(entry).at(-1)?.stage).toBe("approval")
    expect(Object.keys(storedRounds()[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "stopped"])
    expect(storedRounds()[4]?.stopped).toBe(reason)
  })

  it("leaves a fourth round that asks for changes in rework without a reason", () => {
    prepareReview(["legal"], { 4: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedRounds(3) })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-4 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[3]).not.toHaveProperty("stopped")
  })

  it("does not stop a fifth round in which every verdict is PASS", () => {
    prepareReview(["legal"], { 5: { "legal.md": findingsText("legal", "PASS", []) } }, { rounds: recordedRounds(4) })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(storedProcesses()[0]?.stage).toBe("approval")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("prints Stopped: with the reason of the newest round between the Stage line and the line Rounds:", () => {
    prepareReview(["legal"], { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedRounds(4) })
    runCommand(["round", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines.slice(2, 4)).toEqual(["Stage: approval", "Stopped: the limit of 5 rounds is reached and these reviewers still ask for changes: legal"])
    expect(lines[4]).toBe("Rounds:")
  })

  it("prints Rounds: with one line per round between the Stage line and the History line, and only for a process with rounds", () => {
    prepareReview(["legal", "readability"], {
      1: { "legal.md": findingsText("legal", "CHANGES", ["high"]), "readability.md": findingsText("readability", "PASS", []) },
    })
    runCommand(["round", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines.slice(2, 6)).toEqual(["Stage: rework", "Rounds:", "  1  draft-1.md  legal CHANGES, readability PASS", "History:"])
    writeBoardFile([{ id: "002-handle-a-breach", title: "Handle a breach", stage: "review", rounds: [] }])
    expect(runCommand(["show", "002-handle-a-breach"]).stdout).not.toContain("Rounds:")
  })

  /** A `simulation.md` with this verdict and one section per case number, with the line of its result or none for `""`. */
  function simulationText(verdict: string, sections: [number, string][]): string {
    const finding = verdict === "CHANGES" ? "- [high] Step 2: it does not say who locks the laptop. (case 3)\n" : "No findings.\n"
    const written = sections
      .map(([number, line]) => `## Case ${String(number)}: The IT manager is away\n\nGets wrong: nothing\n${line === "" ? "" : `${line}\n`}`)
      .join("\n")
    return `# simulation review of draft-1.md\n\nVerdict: ${verdict}\n\n${finding}\n${written}`
  }

  /** Writes the files `case-<n>.md` with these numbers in the folder `cases` of the process. */
  function writeCases(numbers: number[]): void {
    for (const number of numbers) writeWorkingFile(`${processFolder}/cases/case-${String(number)}.md`, `# Case ${String(number)}: The IT manager is away\n`)
  }

  /** The entries of one round per result of case 3, numbered from 1, each with the draft of its number and its result under `cases`. */
  function recordedCaseRounds(results: string[]): Record<string, unknown>[] {
    return results.map((result, index) => ({
      round: index + 1,
      draft: `draft-${String(index + 1)}.md`,
      at: "2026-11-18T17:05:40.456Z",
      verdicts: [{ reviewer: "simulation", verdict: result === "FAIL" ? "CHANGES" : "PASS" }],
      cases: [{ case: 3, result }],
    }))
  }

  it("stores the result of every stored case under cases, after the verdicts and in ascending order of the numbers", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("CHANGES", [[10, "Result: FAIL at step 2"], [2, "Result: PASS"]]) } })
    writeCases([2, 10])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(Object.keys(storedRounds()[0] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases"])
    expect(storedRounds()[0]?.cases).toEqual([
      { case: 2, result: "PASS" },
      { case: 10, result: "FAIL" },
    ])
  })

  it("refuses a simulation.md that has no result for a stored case and names the cases", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("PASS", [[1, "Result: PASS"], [2, "Result: FAIL"], [5, ""]]) } })
    writeCases([1, 2, 5])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  simulation.md: has no Result: line for case 2, case 5\n${staysLine}\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.stage).toBe("review")
  })

  it("refuses a simulation.md with the verdict PASS in which a stored case has the result FAIL", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("PASS", [[1, "Result: PASS"], [3, "Result: FAIL at step 2"]]) } })
    writeCases([1, 3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  simulation.md: the verdict is PASS but these cases have the result FAIL: case 3\n${staysLine}\n`,
    )
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.rounds).toBeUndefined()
  })

  it("prints Regressed: with the draft the case last passed in and moves a second round to rework", () => {
    prepareReview(["simulation"], { 2: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } }, { rounds: recordedCaseRounds(["PASS"]) })
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nRegressed: case 3 last passed in draft-1.md\nrework\n`,
    )
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })

  it("moves a fifth round with a regressed case to rework without a stop", () => {
    prepareReview(
      ["simulation"],
      { 5: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["FAIL", "PASS", "FAIL", "FAIL"]) },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nRegressed: case 3 last passed in draft-2.md\nrework\n`,
    )
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("rework")
    expect(storedHistory(entry).at(-1)?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("stops a fifth round in which a case fails that passed in no earlier round", () => {
    prepareReview(
      ["simulation"],
      { 5: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["FAIL", "FAIL", "FAIL", "FAIL"]) },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: simulation"
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nStopped: ${reason}\napproval\n`,
    )
    expect(storedProcesses()[0]?.stage).toBe("approval")
    expect(Object.keys(storedRounds()[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases", "stopped"])
  })

  it("stores no cases and prints no Regressed: line without the simulation reviewer", () => {
    prepareReview(["legal"], { 2: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedCaseRounds(["PASS"]) })
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(Object.keys(storedRounds()[1] ?? {})).toEqual(["round", "draft", "at", "verdicts"])
  })

  it("counts the limit only from the rounds recorded after a respec", () => {
    prepareReview(
      ["legal"],
      { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } },
      { rounds: recordedRounds(4), respecs: [{ round: 3, at: "2026-11-19T09:00:00.000Z" }] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("counts the limit only from the rounds recorded after a regeneration started", () => {
    prepareReview(
      ["legal"],
      { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } },
      { rounds: recordedRounds(4), regeneration: { version: 1, round: 4, at: "2026-11-23T10:00:00.000Z" } },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("prints no Regressed: line for a case that passed only in a round before a respec", () => {
    prepareReview(
      ["simulation"],
      { 2: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["PASS"]), respecs: [{ round: 1, at: "2026-11-19T09:00:00.000Z" }] },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(result.status).toBe(0)
  })
})

describe("process-factory respec", () => {
  const processFolder = "processes/001-handle-a-breach"
  const cannotLine = "process-factory: cannot send 001-handle-a-breach back to spec"
  const findingsFile = `${processFolder}/feedback/findings-round-2.md`
  const highFinding = "- [high] Step 3: the deadline for telling the authority is missing."
  const lowFinding = "- [low] Step 2: two actions in one step."
  const firstRound = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:01:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
  const secondRound = {
    round: 2,
    draft: "draft-2.md",
    at: "2026-11-20T16:02:00.000Z",
    verdicts: [
      { reviewer: "legal", verdict: "CHANGES" },
      { reviewer: "readability", verdict: "PASS" },
    ],
  }

  /** A process in `stage` with two recorded rounds, `specAcceptedAt` and the findings files of both rounds. */
  function prepareRespec(stage = "approval", more: Record<string, unknown> = {}): void {
    writeBoardFile([
      {
        id: "001-handle-a-breach",
        title: "Handle a breach",
        stage,
        history: [{ at: "2026-11-18T17:02:11.123Z", stage: "review" }],
        specAcceptedAt: "2026-11-19T15:45:00.000Z",
        rounds: [firstRound, secondRound],
        ...more,
      },
    ])
    writeWorkingFile(`${processFolder}/rounds/round-1/legal.md`, "# legal review of draft-1.md\n\nVerdict: CHANGES\n\n- [high] A finding of round 1.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/legal.md`, `# legal review of draft-2.md\n\nVerdict: CHANGES\n\n${highFinding}\n`)
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, `# readability review of draft-2.md\n\nVerdict: PASS\n\n${lowFinding}  \n`)
  }

  /** The date and time of the last history entry of the one process on the board. */
  function lastChange(): string {
    const at: unknown = storedHistory(storedProcesses()[0]).at(-1)?.at
    return typeof at === "string" ? at : ""
  }

  /** The findings file the command writes for the round 2 of this process, sent back at `at`. */
  function expectedFindings(at: string): string {
    const head = `# Findings of round 2\n\nProcess: 001-handle-a-breach\nRound: 2\nDraft: draft-2.md\nSent back at: ${at}`
    return `${head}\n\n## legal\n\nVerdict: CHANGES\n\n${highFinding}\n\n## readability\n\nVerdict: PASS\n\n${lowFinding}\n`
  }

  it.each(["approval", "rework"])("writes the findings of the newest round and prints the file and the stage for a process in %s", (stage) => {
    prepareRespec(stage)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Stored ${findingsFile}\nspec\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(lastChange()).toMatch(timeForm)
    expect(readWorkingFile(findingsFile)).toBe(expectedFindings(lastChange()))
  })

  it("copies no other line of a findings file and no finding of an earlier round", () => {
    prepareRespec()

    runCommand(["respec", "001-handle-a-breach"])

    expect(readWorkingFile(findingsFile)).not.toContain("review of draft-2.md")
    expect(readWorkingFile(findingsFile)).not.toContain("A finding of round 1.")
  })

  it("writes No findings. for a reviewer without a finding and leaves out a file of no reviewer of the round", () => {
    prepareRespec()
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, "# readability review of draft-2.md\n\nVerdict: PASS\n\nNo findings.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/conflicts.md`, "# Conflicts of round 2\n\n- Dropped: readability.md: [low] Step 4: shorten the step.\n")

    runCommand(["respec", "001-handle-a-breach"])

    expect(readWorkingFile(findingsFile).endsWith("## readability\n\nVerdict: PASS\n\nNo findings.\n")).toBe(true)
    expect(readWorkingFile(findingsFile)).not.toContain("Dropped:")
  })

  it("moves the process to spec, records the respec, removes specAcceptedAt and keeps the rounds", () => {
    prepareRespec()

    runCommand(["respec", "001-handle-a-breach"])

    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("spec")
    expect(storedHistory(entry).at(-1)).toEqual({ at: lastChange(), stage: "spec" })
    expect(entry?.respecs).toEqual([{ round: 2, at: lastChange() }])
    expect(entry).not.toHaveProperty("specAcceptedAt")
    expect(entry?.rounds).toEqual([firstRound, secondRound])
  })

  it("adds a second element to respecs of a process that was sent back before", () => {
    prepareRespec("rework", { respecs: [{ round: 1, at: "2026-11-19T09:00:00.000Z" }] })

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.respecs).toEqual([{ round: 1, at: "2026-11-19T09:00:00.000Z" }, { round: 2, at: lastChange() }])
  })

  /** Expects this one line on standard error, exit code 1, no folder `feedback` and a board that is as it was. */
  function expectRefused(line: string): void {
    const before = readWorkingFile(boardPath)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${line}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["rounds"])
    expect(readWorkingFile(boardPath)).toBe(before)
  }

  it.each(["intake", "spec", "review", "published"])("refuses a process in %s and writes nothing", (stage) => {
    prepareRespec(stage)

    expectRefused(`${cannotLine}: it is in the stage ${stage}, not in rework or approval`)
  })

  it.each([
    ["no key rounds", undefined],
    ["an empty list of rounds", []],
  ])("refuses a process with %s, because no round is recorded for it", (_name, rounds) => {
    prepareRespec("approval", { rounds })

    expectRefused(`${cannotLine}: no round is recorded for it`)
  })

  it("refuses a process that is being regenerated, because a regeneration keeps the specification", () => {
    prepareRespec("rework", { regeneration: { version: 2, round: 2, at: "2026-11-23T10:00:00.000Z" } })

    expectRefused(`${cannotLine}: it is being regenerated from version 2, and a regeneration keeps the specification of that version`)
  })

  it("refuses when the findings file of a reviewer of the round is not there and names the file", () => {
    prepareRespec()
    rmSync(path.join(workingDirectory, processFolder, "rounds/round-2/readability.md"))

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: ${processFolder}/rounds/round-2/readability.md is missing\n`)
    expect(result.status).toBe(1)
  })

  it("refuses a round in which no findings file has a finding", () => {
    prepareRespec()
    writeWorkingFile(`${processFolder}/rounds/round-2/legal.md`, "# legal review of draft-2.md\n\nVerdict: CHANGES\n\nNo findings.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, "# readability review of draft-2.md\n\nVerdict: PASS\n\nNo findings.\n")

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: round 2 has no finding\n`)
    expect(result.status).toBe(1)
  })

  it.each(["009-no-such-process", "../001-handle-a-breach"])("says there is no process %s", (id) => {
    prepareRespec()

    const result = runCommand(["respec", id])

    expect(result.stderr).toBe(`process-factory: there is no process ${id}\n`)
    expect(result.status).toBe(1)
  })

  it("refuses a findings file that is already there and leaves it and the board as they were", () => {
    prepareRespec()
    writeWorkingFile(findingsFile, "# Kept\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr.startsWith(`process-factory: cannot write ${findingsFile}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(findingsFile)).toBe("# Kept\n")
    expect(readWorkingFile(boardPath)).toBe(before)
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

describe("process-factory move to published and process-factory check", () => {
  const processId = "001-handle-a-breach"
  const rolesText = "# Roles\n\n## Data protection officer\n\nKari Nordmann holds the role.\n\n## Head of IT\n\nPer Olsen holds the role.\n"
  const dependencyLines = [
    "- Law: GDPR article 33",
    "- Role: Data protection officer",
    "- System: Payroll system",
    "- Agreement: Example Payroll AS",
    "- Policy: Information security policy",
    "- Process: Handle a lost laptop",
  ]

  function writeOrganisation(): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeWorkingFile("organisation/systems.md", "# Systems\n\n## Payroll system\n\nIt pays the salaries.\n")
    writeWorkingFile("organisation/processors.md", "# Agreements\n\n## Example Payroll AS\n\nSigned on 1 March 2024.\n")
    writeWorkingFile("organisation/policies.md", "# Policies\n\n## Information security policy\n\nApproved on 15 January 2025.\n")
  }

  /** A `spec.md` whose section `Dependencies` holds these lines, with a line of the same form in two other sections. */
  function specText(lines: string[]): string {
    return `# Specification: Handle a breach\n\n## Roles\n\n- Role: Head of IT\n\n## Dependencies\n\nStatus: decided\n\n${lines.join("\n")}\n\n## Notes\n\n- System: Payroll system\n`
  }

  /** Writes a board with the process in `approval`, its `spec.md` and the approval of its newest draft, and moves it to `published`. */
  function publish(lines: string[] = dependencyLines, spec = true) {
    writeBoardFile([{ id: processId, title: "Handle a breach", stage: "approval" }])
    if (spec) writeWorkingFile(`processes/${processId}/spec.md`, specText(lines))
    writeWorkingFile(`processes/${processId}/drafts/draft-1.md`, "# Handle a breach\n")
    writeWorkingFile(`processes/${processId}/versions/approval-draft-1.md`, "# Approval of draft-1.md\n")
    return runCommand(["move", processId, "published"])
  }

  function recordedDependencies(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.dependencies
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("records the Role, System, Agreement and Policy lines of Dependencies in their order, and no other line", () => {
    writeOrganisation()

    const result = publish()

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(recordedDependencies()).toEqual([
      { kind: "Role", name: "Data protection officer", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "System", name: "Payroll system", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "Agreement", name: "Example Payroll AS", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "Policy", name: "Information security policy", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ])
  })

  it("records hash null for a name that is no heading in the file of its kind and for a missing file", () => {
    writeWorkingFile("organisation/roles.md", rolesText)

    expect(publish(["- Role: Chief of nothing", "- Policy: Information security policy"]).status).toBe(0)

    expect(recordedDependencies()).toEqual([
      { kind: "Role", name: "Chief of nothing", hash: null },
      { kind: "Policy", name: "Information security policy", hash: null },
    ])
  })

  it("records an empty list for a process without a spec.md", () => {
    expect(publish([], false).status).toBe(0)

    expect(storedProcesses()[0]?.dependencies).toEqual([])
  })

  it("adds no dependencies on a move to another stage", () => {
    writeBoardFile([{ id: processId, title: "Handle a breach", stage: "approval" }])
    writeWorkingFile(`processes/${processId}/spec.md`, specText(dependencyLines))

    expect(runCommand(["move", processId, "rework"]).status).toBe(0)

    expect(Object.keys(storedProcesses()[0] ?? {})).not.toContain("dependencies")
  })

  it("prints the one line when every recorded dependency is as it was, and creates nothing without a board", () => {
    const empty = runCommand(["check"])
    expect(empty.stdout).toBe("No published process has a changed dependency.\n")
    expect(empty.stderr).toBe("")
    expect(empty.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual([])
    writeOrganisation()
    publish()

    const result = runCommand(["check"])

    expect(result.stdout).toBe("No published process has a changed dependency.\n")
    expect(result.status).toBe(0)
  })

  it("lists the changed and the removed dependency of a published process and leaves every file as it was", () => {
    writeOrganisation()
    publish()
    writeWorkingFile("organisation/roles.md", rolesText.replace("Kari Nordmann holds the role.", "Ola Hansen holds the role."))
    rmSync(path.join(workingDirectory, "organisation/policies.md"))
    const before = [boardPath, "organisation/roles.md", "organisation/systems.md"].map((file) => readWorkingFile(file))

    const result = runCommand(["check"])

    expect(result.stdout).toBe(
      "Work waiting for the owner:\n001-handle-a-breach  Handle a breach\n  Role: Data protection officer  changed in organisation/roles.md\n  Policy: Information security policy  removed from organisation/policies.md\n",
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect([boardPath, "organisation/roles.md", "organisation/systems.md"].map((file) => readWorkingFile(file))).toEqual(before)
  })

  it("lists no process that is no longer in published", () => {
    writeOrganisation()
    publish()
    writeWorkingFile("organisation/roles.md", rolesText.replace("Kari Nordmann holds the role.", "Ola Hansen holds the role."))
    expect(runCommand(["check"]).stdout).toContain("Work waiting for the owner:\n")

    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    expect(runCommand(["check"]).stdout).toBe("No published process has a changed dependency.\n")
  })

  it("names the board it cannot read and exits with 1", () => {
    writeWorkingFile(boardPath, "{ not json\n")

    const result = runCommand(["check"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("process-factory owner and process-factory approve", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const rolesText =
    "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n\n## Example: Head of IT\n\nPer Olsen is the head of IT.\n"
  const approvalFile = `processes/${processId}/versions/approval-draft-2.md`

  /** Writes `organisation/roles.md` and a board with the process in `stage`, with further keys in `more`. */
  function writeProcess(stage: string, more: Record<string, unknown> = {}): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage, history: [{ at: "2026-11-20T17:00:00.000Z", stage }], ...more }])
  }

  function writeDrafts(): void {
    for (const number of [1, 2]) writeWorkingFile(`processes/${processId}/drafts/draft-${String(number)}.md`, `# Draft ${String(number)}\n`)
  }

  it("prints Owner: with the name it stored on the entry, and changes nothing else", () => {
    writeProcess("intake")

    const result = runCommand(["owner", processId, `  ${owner}  `])

    expect(result.stdout).toBe("Owner: Kari Nordmann\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]).toEqual({
      id: processId,
      title: "Handle a lost laptop",
      stage: "intake",
      history: [{ at: "2026-11-20T17:00:00.000Z", stage: "intake" }],
      owner,
    })
  })

  it.each([
    ["only stands in an example section", "Per Olsen"],
    ["ends in the middle of a word", "Kari Nord"],
    ["has other capitals", "kari nordmann"],
  ])("refuses an owner that %s and leaves the board as it was", (_name, person) => {
    writeProcess("approval")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["owner", processId, person])

    expect(result.stderr).toBe(`process-factory: cannot set the owner of ${processId}: ${person} is not named in organisation/roles.md\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("says the owner must be one line with at least one letter for a name with a line break", () => {
    writeProcess("approval")

    const result = runCommand(["owner", processId, "Kari\nNordmann"])

    expect(result.stderr).toBe("process-factory: the owner must be one line with at least one letter\n")
    expect(result.status).toBe(1)
  })

  it("prints the line Owner: of show directly after the stage, and no such line without an owner", () => {
    writeProcess("review")
    expect(runCommand(["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )

    expect(runCommand(["owner", processId, owner]).status).toBe(0)

    expect(runCommand(["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nOwner: Kari Nordmann\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )
  })

  it("writes who approved the newest draft and when, and leaves the board as it was", () => {
    writeProcess("approval", { owner })
    writeDrafts()
    const before = readWorkingFile(boardPath)

    const result = runCommand(["approve", processId, "--by", `  ${owner}  `])

    expect(result.stdout).toBe(`Stored ${approvalFile}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const lines = readWorkingFile(approvalFile).split("\n")
    expect(lines.slice(0, 5)).toEqual(["# Approval of draft-2.md", "", `Process: ${processId}`, "Draft: draft-2.md", `Approved by: ${owner}`])
    expect(lines[5]?.replace("Approved at: ", "")).toMatch(timeForm)
    expect(lines.slice(6)).toEqual([""])
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    {
      name: "a process that is not in approval",
      prepare: () => {
        writeProcess("review", { owner })
        writeDrafts()
      },
      by: owner,
      reason: "it is in the stage review, not in approval",
    },
    {
      name: "a process without an owner",
      prepare: () => {
        writeProcess("approval")
        writeDrafts()
      },
      by: owner,
      reason: `it has no owner: owner ${processId} "<person>" names one`,
    },
    {
      name: "a name that is not the owner",
      prepare: () => {
        writeProcess("approval", { owner })
        writeDrafts()
      },
      by: "Ola Hansen",
      reason: "--by does not name its owner",
    },
    {
      name: "an owner who is not named in organisation/roles.md",
      prepare: () => {
        writeProcess("approval", { owner: "Nina Berg" })
        writeDrafts()
      },
      by: "Nina Berg",
      reason: "its owner Nina Berg is not named in organisation/roles.md",
    },
    {
      name: "a process without a draft",
      prepare: () => {
        writeProcess("approval", { owner })
      },
      by: owner,
      reason: `there is no draft in processes/${processId}/drafts`,
    },
    {
      name: "a draft that is already approved",
      prepare: () => {
        writeProcess("approval", { owner })
        writeDrafts()
        runCommand(["approve", processId, "--by", owner])
      },
      by: owner,
      reason: "draft-2.md is already approved",
    },
  ])("refuses to approve $name", ({ prepare, by, reason }) => {
    prepare()
    const before = readWorkingFile(boardPath)

    const result = runCommand(["approve", processId, "--by", by])

    expect(result.stderr).toBe(`process-factory: cannot approve ${processId}: ${reason}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("refuses a move to published until the newest draft has its approval file", () => {
    writeProcess("approval", { owner })
    writeDrafts()
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", processId, "published"])

    expect(refused.stderr).toBe(
      `process-factory: cannot move ${processId} from approval to published: the newest draft has no approval: only approve ${processId} --by "<person>" records one\n`,
    )
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)

    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("published")
  })

  it("moves a process from approval to rework without an approval", () => {
    writeProcess("approval", { owner })
    writeDrafts()

    expect(runCommand(["move", processId, "rework"]).stdout).toBe("rework\n")
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })
})

describe("the version that process-factory move to published writes", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const processFolder = `processes/${processId}`
  const draftText = "# Handle a lost laptop\n\nDraft 2.\n"
  const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n"

  /** Writes a board with the process in approval, the drafts 1 and 2 and the approval of `draft-2.md`, with further keys of the entry in `more`. */
  function prepareApproval(more: Record<string, unknown> = {}): void {
    writeBoardFile([
      { id: processId, title: "Handle a lost laptop", stage: "approval", history: [{ at: "2026-11-20T17:00:00.000Z", stage: "approval" }], owner, ...more },
    ])
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, "# Handle a lost laptop\n\nDraft 1.\n")
    writeWorkingFile(`${processFolder}/drafts/draft-2.md`, draftText)
    writeWorkingFile(`${processFolder}/versions/approval-draft-2.md`, `# Approval of draft-2.md\n\nApproved by: ${owner}\nApproved at: 2026-11-21T10:00:00.000Z\n`)
  }

  function writeSpecAndCases(): void {
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The laptop is stolen\n")
  }

  function publish() {
    return runCommand(["move", processId, "published"])
  }

  /** The names in a folder of the working directory, sorted. */
  function names(folder: string): string[] {
    return readdirSync(path.join(workingDirectory, folder)).sort()
  }

  /** The list under `versions` of the entry of the process, or an empty list when it has none. */
  function storedVersions(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.versions
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("copies the newest draft, the spec, the cases and the approval into versions/1 and leaves the originals where they were", () => {
    prepareApproval()
    writeSpecAndCases()
    writeWorkingFile(`${processFolder}/cases/notes.md`, "Notes.\n")
    const approval = readWorkingFile(`${processFolder}/versions/approval-draft-2.md`)

    const result = publish()

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(names(`${processFolder}/versions/1`)).toEqual(["approval.md", "cases", "process.md", "spec.md"])
    expect(names(`${processFolder}/versions/1/cases`)).toEqual(["case-1.md", "case-2.md"])
    expect(readWorkingFile(`${processFolder}/versions/1/process.md`)).toBe(draftText)
    expect(readWorkingFile(`${processFolder}/versions/1/spec.md`)).toBe(specText)
    expect(readWorkingFile(`${processFolder}/versions/1/cases/case-1.md`)).toBe("# Case 1: The laptop is lost on a train\n")
    expect(readWorkingFile(`${processFolder}/versions/1/approval.md`)).toBe(approval)
    expect(names(`${processFolder}/drafts`)).toEqual(["draft-1.md", "draft-2.md"])
    expect(readWorkingFile(`${processFolder}/spec.md`)).toBe(specText)
    expect(readWorkingFile(`${processFolder}/versions/approval-draft-2.md`)).toBe(approval)
  })

  it("writes a version with an empty folder cases and no spec.md for a process that has neither", () => {
    prepareApproval()

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/1`)).toEqual(["approval.md", "cases", "process.md"])
    expect(names(`${processFolder}/versions/1/cases`)).toEqual([])
  })

  it("writes versions/2 for a second publication with the spec as it is then and leaves versions/1 as it was", () => {
    prepareApproval()
    writeSpecAndCases()
    expect(publish().status).toBe(0)
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, "# Feedback 1\n\nStatus: open\n\n## Text\n\nStep 1 is unclear.\n")
    writeWorkingFile(`${processFolder}/drafts/changes-2.md`, "# Changes of draft-2.md against version 1\n\n## Change 1\n\n- Section: Steps\n- Change: Step 1 is clearer now.\n- Reason: feedback-1.md\n")
    for (const stage of ["regenerate", "review", "approval"]) expect(runCommand(["move", processId, stage]).status).toBe(0)
    const changedSpec = `${specText}\n- Role: Head of IT\n`
    writeWorkingFile(`${processFolder}/spec.md`, changedSpec)

    expect(publish().status).toBe(0)

    expect(readWorkingFile(`${processFolder}/versions/2/spec.md`)).toBe(changedSpec)
    expect(readWorkingFile(`${processFolder}/versions/1/spec.md`)).toBe(specText)
    expect(storedVersions().map((stored) => stored.version)).toEqual([1, 2])
  })

  it("takes the number above a version folder that is already there, which it leaves as it was, and above the versions on the board", () => {
    prepareApproval()
    writeWorkingFile(`${processFolder}/versions/1/kept.md`, "Kept.\n")

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/1`)).toEqual(["kept.md"])
    expect(names(`${processFolder}/versions/2`)).toEqual(["approval.md", "cases", "process.md"])
    expect(storedVersions().map((stored) => stored.version)).toEqual([2])

    prepareApproval({ versions: [{ version: 7, draft: "draft-1.md", at: "2026-11-20T18:00:00.000Z" }] })

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/8`)).toEqual(["approval.md", "cases", "process.md"])
    expect(storedVersions().map((stored) => stored.version)).toEqual([7, 8])
  })

  it("stores the version with its draft, who approved it and the time of the history entry", () => {
    prepareApproval()

    expect(publish().status).toBe(0)

    const published = storedHistory(storedProcesses()[0]).at(-1)
    expect(published?.stage).toBe("published")
    expect(storedVersions()).toEqual([{ version: 1, draft: "draft-2.md", approvedBy: owner, at: published?.at }])
    expect(String(published?.at)).toMatch(timeForm)
  })

  it("leaves approvedBy out when the approval file has no line that starts with Approved by:", () => {
    prepareApproval()
    writeWorkingFile(`${processFolder}/versions/approval-draft-2.md`, "# Approval of draft-2.md\n")

    expect(publish().status).toBe(0)

    const versions = storedVersions()
    expect(Object.keys(versions[0] ?? {}).sort()).toEqual(["at", "draft", "version"])
    expect(versions[0]).toMatchObject({ version: 1, draft: "draft-2.md" })
  })

  it("prints Versions: with one line per version between the lines of Rounds: and the line History:, and only for a process with versions", () => {
    writeBoardFile([
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "published",
        history: [{ at: "2026-11-20T17:00:00.000Z", stage: "published" }],
        rounds: [{ round: 1, draft: "draft-2.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }],
        versions: [
          { version: 1, draft: "draft-2.md", approvedBy: owner, at: "2026-11-21T10:05:00.000Z" },
          { version: 2, draft: "draft-3.md", at: "2026-11-22T09:00:00.000Z" },
        ],
      },
    ])

    const lines = runCommand(["show", processId]).stdout.split("\n")

    expect(lines.slice(3, 9)).toEqual([
      "Rounds:",
      "  1  draft-2.md  legal PASS",
      "Versions:",
      "  1  draft-2.md  Kari Nordmann  2026-11-21T10:05:00.000Z",
      "  2  draft-3.md  2026-11-22T09:00:00.000Z",
      "History:",
    ])
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage: "published", versions: [] }])
    expect(runCommand(["show", processId]).stdout).not.toContain("Versions:")
  })
})

describe("the regeneration of a published process", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const processFolder = `processes/${processId}`
  const reasonsFile = `${processFolder}/regeneration-1.md`
  const changesFile = `${processFolder}/drafts/changes-2.md`
  const approvalFile = `${processFolder}/versions/approval-draft-2.md`
  const cannotStart = `process-factory: cannot move ${processId} from published to regenerate`
  const rolesText = "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n"
  const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n\n- Role: Data protection officer\n"
  const document = "# Handle a lost laptop\n\n## Steps\n\n1. Data protection officer (Kari Nordmann): Block the laptop.\n"
  /** A recorded dependency whose section in `organisation/roles.md` is no longer what the board recorded. */
  const changedDependency = { kind: "Role", name: "Data protection officer", hash: "0".repeat(64) }
  const firstRound = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }
  const secondRound = { round: 2, draft: "draft-2.md", at: "2026-11-23T12:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
  const changed = "- Change: Step 1 now says where to block the laptop."
  const firstChange = `## Change 1\n\n- Section: Steps\n${changed}\n- Reason: feedback-1.md\n`
  const secondChange = `## Change 2\n\n- Section: Who does what\n- Change: The data protection officer changed.\n- Reason: Role: Data protection officer\n- Reason: case-2.md\n`
  const notChanged = "## Not changed\n\n### feedback-2.md\n\nThe specification states no deadline.\n"

  /** A change list for `draft-2.md` against version 1 with these sections after its title. */
  function changeList(...sections: string[]): string {
    return `# Changes of draft-2.md against version 1\n\n${sections.join("\n")}`
  }

  const validChanges = changeList(firstChange, secondChange, notChanged)

  /** The change list of the spec with a third change that has this one reason. */
  function changesWithReason(reason: string): string {
    return changeList(firstChange, secondChange, `## Change 3\n\n- Section: Steps\n${changed}\n- Reason: ${reason}\n`, notChanged)
  }

  const sectionProblem = "needs exactly one line - Section: with one of the seven headings of a draft"
  /** Each change list that is refused, with the name of what is wrong with it and the problem the command line gives. */
  const refusedLists: [string, string, string][] = [
    ["has no section ## Change", "names no change", changeList(notChanged)],
    ["has a change without a line - Section:", `change 1 ${sectionProblem}`, changeList(`## Change 1\n\n${changed}\n- Reason: feedback-1.md\n`, secondChange, notChanged)],
    [
      "has a change whose Section is no heading of a draft",
      `change 1 ${sectionProblem}`,
      changeList(`## Change 1\n\n- Section: Legal basis\n${changed}\n- Reason: feedback-1.md\n`, secondChange, notChanged),
    ],
    [
      "has a change without a line - Change:",
      "change 1 needs exactly one line - Change: with what changed",
      changeList("## Change 1\n\n- Section: Steps\n- Reason: feedback-1.md\n", secondChange, notChanged),
    ],
    ["has a change without a line - Reason:", "change 2 needs a line - Reason:", changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n`, notChanged)],
    ["names a reason the regeneration does not have", `names a reason that is not in ${reasonsFile}: feedback-9.md`, changesWithReason("feedback-9.md")],
    ["gives no reason why a not changed entry changed nothing", "gives no reason why feedback-2.md is not changed", changeList(firstChange, secondChange, "## Not changed\n\n### feedback-2.md\n")],
    [
      "leaves two reasons of the regeneration out",
      `does not name these reasons of ${reasonsFile}: feedback-2.md, case-2.md`,
      changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n- Reason: Role: Data protection officer\n`),
    ],
  ]

  /** A feedback file as the reading view stores it, with this status. */
  function feedbackText(number: number, status = "open"): string {
    const head = `# Feedback ${String(number)}\n\nProcess: ${processId}\nVersion: 1\nStep: 1\nKind: document`
    return `${head}\nStatus: ${status}\n\n## Text\n\nFeedback ${String(number)} of a reader.\n`
  }

  /** A board with one entry in `stage` that is owned, has one recorded round and a changed dependency, with further keys in `more`. */
  function writeProcess(stage: string, more: Record<string, unknown> = {}): void {
    writeBoardFile([
      {
        id: processId,
        title: "Handle a lost laptop",
        stage,
        history: [{ at: "2026-11-21T09:00:00.000Z", stage }],
        owner,
        rounds: [firstRound],
        versions: [{ version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-11-21T09:00:00.000Z" }],
        dependencies: [changedDependency],
        ...more,
      },
    ])
  }

  /** The process in `published` as version 1 of `draft-1.md`, with the cases 1 and 2 of which the version holds only case 1, and the open feedback 1 and 2. */
  function preparePublished(more: Record<string, unknown> = {}): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeProcess("published", more)
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, document)
    writeWorkingFile(`${processFolder}/versions/1/process.md`, document)
    writeWorkingFile(`${processFolder}/versions/1/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The officer is away\n")
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1))
    writeWorkingFile(`${processFolder}/feedback/feedback-2.md`, feedbackText(2))
  }

  /** Publishes the process once through the command line, so that its recorded dependency is the section as it is now. */
  function publishOnce(): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeProcess("approval", { versions: undefined, dependencies: undefined })
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, document)
    writeWorkingFile(`${processFolder}/versions/approval-draft-1.md`, `# Approval of draft-1.md\n\nApproved by: ${owner}\n`)
    expect(runCommand(["move", processId, "published"]).status).toBe(0)
  }

  /** The process after the start of its regeneration, with `draft-2.md` and this change list next to it. */
  function prepareRegenerating(changes = validChanges): void {
    preparePublished()
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)
    writeWorkingFile(`${processFolder}/drafts/draft-2.md`, `${document}\nDraft 2.\n`)
    writeWorkingFile(changesFile, changes)
  }

  /** The process being regenerated and in `approval`, with `draft-2.md` and this change list. */
  function prepareInApproval(changes = validChanges): void {
    prepareRegenerating(changes)
    expect(runCommand(["move", processId, "review"]).status).toBe(0)
    expect(runCommand(["move", processId, "approval"]).status).toBe(0)
  }

  /** Writes the board again with these keys of the process replaced. */
  function changeEntry(keys: Record<string, unknown>): void {
    writeBoardFile([{ ...(storedProcesses()[0] ?? {}), ...keys }])
  }

  it("writes the reasons file with the open feedback, the new case and the changed dependency, and records the regeneration", () => {
    preparePublished()

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stdout).toBe("regenerate\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    const at: unknown = storedHistory(entry).at(-1)?.at
    expect(entry?.stage).toBe("regenerate")
    expect(storedHistory(entry)).toHaveLength(2)
    expect(entry?.regeneration).toEqual({ version: 1, round: 1, at })
    const lines = readWorkingFile(reasonsFile).split("\n")
    expect(lines.slice(0, 5)).toEqual(["# Regeneration of version 1", "", `Process: ${processId}`, "Version: 1", `Started at: ${String(at)}`])
    expect(lines.slice(5)).toEqual(["", "## Reasons", "", "- feedback-1.md", "- feedback-2.md", "- case-2.md", "- Role: Data protection officer", ""])
  })

  it("records round 0 for a process without a recorded round", () => {
    preparePublished({ rounds: undefined })

    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    expect(storedProcesses()[0]?.regeneration).toMatchObject({ version: 1, round: 0 })
  })

  it("refuses the move while a closed feedback, a case of the version and an unchanged dependency are all there is", () => {
    publishOnce()
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1, "closed"))
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/versions/1/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stderr).toBe(`${cannotStart}: there is nothing to regenerate it for: no open feedback, no case newer than version 1 and no changed dependency\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, reasonsFile))).toBe(false)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    {
      name: "an open feedback",
      prepare: () => {
        writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1))
      },
      reason: "feedback-1.md",
    },
    {
      name: "a case the version does not hold",
      prepare: () => {
        writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The officer is away\n")
      },
      reason: "case-2.md",
    },
    {
      name: "a changed dependency",
      prepare: () => {
        writeWorkingFile("organisation/roles.md", rolesText.replace("is the data protection officer", "is away"))
      },
      reason: "Role: Data protection officer",
    },
  ])("starts the regeneration with only $name as the reason", ({ prepare, reason }) => {
    publishOnce()
    prepare()

    expect(runCommand(["move", processId, "regenerate"]).stdout).toBe("regenerate\n")

    expect(readWorkingFile(reasonsFile).endsWith(`## Reasons\n\n- ${reason}\n`)).toBe(true)
  })

  it.each([
    ["no key versions", undefined],
    ["an empty list versions", []],
  ])("refuses a published process with %s, because it has no published version", (_name, versions) => {
    preparePublished({ versions })
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stderr).toBe(`${cannotStart}: it has no published version\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, reasonsFile))).toBe(false)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("prints Regenerating: version 1 after the owner and before the rounds, and no such line without a regeneration", () => {
    preparePublished()
    const before = runCommand(["show", processId]).stdout
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    const lines = runCommand(["show", processId]).stdout.split("\n")

    expect(before).not.toContain("Regenerating: ")
    expect(lines.slice(2, 6)).toEqual(["Stage: regenerate", `Owner: ${owner}`, "Regenerating: version 1", "Rounds:"])
  })

  it("refuses the move to review without the change list of the newest draft and moves with it", () => {
    prepareRegenerating()
    rmSync(path.join(workingDirectory, changesFile))
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", processId, "review"])

    expect(refused.stderr).toBe(`process-factory: cannot move ${processId} from regenerate to review: ${changesFile} is missing\n`)
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    writeWorkingFile(changesFile, validChanges)

    const result = runCommand(["move", processId, "review"])

    expect(result.stdout).toBe("review\n")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("review")
  })

  it.each(refusedLists)("refuses the move to review of a change list that %s", (_name, problem, changes) => {
    prepareRegenerating(changes)
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "review"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from regenerate to review: ${changesFile} ${problem}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("accepts the findings file of a reviewer of a round of the regeneration as a reason", () => {
    prepareRegenerating(changesWithReason("round-2/legal.md"))
    changeEntry({ stage: "rework", rounds: [firstRound, secondRound] })

    const result = runCommand(["move", processId, "review"])

    expect(result.stdout).toBe("review\n")
    expect(result.status).toBe(0)
  })

  it.each(["round-1/legal.md", "round-2/nobody.md", "round-3/legal.md"])("refuses the reason %s from rework", (reason) => {
    prepareRegenerating(changesWithReason(reason))
    changeEntry({ stage: "rework", rounds: [firstRound, secondRound] })

    const result = runCommand(["move", processId, "review"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from rework to review: ${changesFile} names a reason that is not in ${reasonsFile}: ${reason}\n`)
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })

  it("writes Changes: directly after Draft: in the approval of the owner", () => {
    prepareInApproval()

    const result = runCommand(["approve", processId, "--by", owner])

    expect(result.stdout).toBe(`Stored ${approvalFile}\n`)
    expect(result.status).toBe(0)
    expect(readWorkingFile(approvalFile).split("\n").slice(3, 6)).toEqual(["Draft: draft-2.md", "Changes: changes-2.md", `Approved by: ${owner}`])
  })

  it("refuses the owner while the change list of the newest draft is missing, and writes no approval", () => {
    prepareInApproval()
    rmSync(path.join(workingDirectory, changesFile))

    const result = runCommand(["approve", processId, "--by", owner])

    expect(result.stderr).toBe(`process-factory: cannot approve ${processId}: ${changesFile} is missing\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, approvalFile))).toBe(false)
  })

  it("copies the change list into the new version, closes the feedback it answers and ends the regeneration", () => {
    prepareInApproval()
    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, `${processFolder}/versions/2`)).sort()).toEqual(["approval.md", "cases", "changes.md", "process.md", "spec.md"])
    expect(readWorkingFile(`${processFolder}/versions/2/changes.md`)).toBe(validChanges)
    expect(existsSync(path.join(workingDirectory, `${processFolder}/versions/1/changes.md`))).toBe(false)
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1).replace("Status: open\n", "Status: closed\nAnswered by: version 2\n"))
    expect(readWorkingFile(`${processFolder}/feedback/feedback-2.md`)).toBe(feedbackText(2))
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("published")
    expect(entry).not.toHaveProperty("regeneration")
  })

  it("refuses the publication while the change list of the approved draft has a problem, and closes no feedback", () => {
    prepareInApproval()
    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)
    writeWorkingFile(changesFile, changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n`, notChanged))
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "published"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from approval to published: ${changesFile} change 2 needs a line - Reason:\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, `${processFolder}/versions/2`))).toBe(false)
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1))
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("ends a regeneration in which no reason led to a change from regenerate, and writes no version", () => {
    preparePublished()
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)
    const versions = storedProcesses()[0]?.versions

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("published")
    expect(storedHistory(entry).map((change) => change.stage)).toEqual(["published", "regenerate", "published"])
    expect(entry).not.toHaveProperty("regeneration")
    expect(entry?.versions).toEqual(versions)
    expect(readdirSync(path.join(workingDirectory, `${processFolder}/versions`))).toEqual(["1"])
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1))
  })
})

describe("the reading view of process-factory serve", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const firstDocument = "# Handle a lost laptop\n\n1. IT manager (Ola Hansen): Call the police first.\n"
  const secondDocument = "# Handle a lost laptop\n\n1. IT manager (Ola Hansen): Block the laptop in Intune.\n"
  const views: ChildProcess[] = []

  afterEach(async () => {
    await Promise.all(
      views.splice(0).map(
        (child) =>
          new Promise<void>((resolve) => {
            if (child.exitCode !== null || child.signalCode !== null) {
              resolve()
              return
            }
            child.once("exit", () => {
              resolve()
            })
            child.kill()
          }),
      ),
    )
  })

  /** Starts the view on a free port of the working directory and gives the address it printed. */
  async function openView(): Promise<string> {
    const child = spawn(process.execPath, [commandFile, "serve", "--port", "0"], { cwd: workingDirectory, stdio: ["ignore", "pipe", "pipe"] })
    views.push(child)
    child.stdout.setEncoding("utf8")
    let printed = ""
    await new Promise<void>((resolve) => {
      child.stdout.on("data", (chunk: string) => {
        printed += chunk
        if (printed.includes("\n")) resolve()
      })
      child.once("close", resolve)
    })
    expect(printed).toMatch(/^Reading view on http:\/\/127\.0\.0\.1:[1-9]\d*\n$/)
    return printed.trim().replace("Reading view on ", "")
  }

  async function requestPage(address: string, pathname: string, method = "GET") {
    const response = await fetch(`${address}${pathname}`, { method })
    return { status: response.status, headers: response.headers, body: await response.text() }
  }

  /** Sends a request with a body to the view on a connection of its own. An answer that arrived counts, also when the server closes the connection early. */
  function send(address: string, pathname: string, body: string, more: { method?: string; headers?: Record<string, string> } = {}) {
    const url = new URL(address)
    return new Promise<{ status: number; headers: IncomingHttpHeaders; body: string }>((resolve, reject) => {
      let answer: { status: number; headers: IncomingHttpHeaders; body: string } | undefined
      const fail = (error: Error): void => {
        if (answer === undefined) reject(error)
        else resolve(answer)
      }
      const sent = httpRequest(
        {
          host: url.hostname,
          port: url.port,
          path: pathname,
          method: more.method ?? "POST",
          agent: false,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": String(Buffer.byteLength(body)), ...more.headers },
        },
        (response) => {
          const received = { status: response.statusCode ?? 0, headers: response.headers, body: "" }
          answer = received
          response.setEncoding("utf8")
          response.on("data", (chunk: string) => {
            received.body += chunk
          })
          response.on("end", () => {
            resolve(received)
          })
          response.on("error", fail)
        },
      )
      sent.on("error", fail)
      sent.end(body)
    })
  }

  /** Posts form fields to the view as `application/x-www-form-urlencoded`. */
  function postFeedback(address: string, pathname: string, values: Record<string, string>, headers: Record<string, string> = {}) {
    return send(address, pathname, new URLSearchParams(values).toString(), { headers })
  }

  /** The text between `<li>` and `</li>` of every such item of a page, in order. */
  function items(body: string): string[] {
    return [...body.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => (match[1] ?? "").trim())
  }

  /** What stands inside `<main>`, without the whitespace between the elements. */
  function documentOf(body: string): string {
    return (/<main>(.*)<\/main>/s.exec(body)?.[1] ?? "").replace(/>\s+</g, "><").trim()
  }

  function writeVersionFolder(number: number, document: string, approval: string | undefined): void {
    writeWorkingFile(`processes/${processId}/versions/${String(number)}/process.md`, document)
    if (approval !== undefined) writeWorkingFile(`processes/${processId}/versions/${String(number)}/approval.md`, approval)
  }

  function approvalText(by: string, at: string): string {
    return `# Approval of a draft\n\nApproved by: ${by}\nApproved at: ${at}\n`
  }

  /** Writes a process that was never published and the laptop process with the published versions 1 and 2. */
  function writeView(more: Record<string, unknown> = {}, newestDocument = secondDocument): void {
    writeBoardFile([
      { id: "000-older-process", title: "Older process", stage: "draft", owner },
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "published",
        owner,
        versions: [
          { version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-10-03T08:00:00.000Z" },
          { version: 2, draft: "draft-2.md", approvedBy: owner, at: "2026-11-22T08:00:00.000Z" },
        ],
        ...more,
      },
    ])
    writeVersionFolder(1, firstDocument, approvalText(owner, "2026-10-02T09:00:00.000Z"))
    writeVersionFolder(2, newestDocument, approvalText(owner, "2026-11-21T10:05:00.000Z"))
  }

  it("says that no process is published yet in a folder without processes, and creates nothing there", async () => {
    const address = await openView()

    const front = await requestPage(address, "/")

    expect(front.status).toBe(200)
    expect(front.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(front.headers.get("cache-control")).toBe("no-store")
    expect(front.headers.get("x-content-type-options")).toBe("nosniff")
    expect(front.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(front.body).toContain("<title>Published processes</title>")
    expect(front.body).toContain("<h1>Published processes</h1>")
    expect(front.body).toContain("<p>No process is published yet.</p>")
    expect(front.body).not.toContain("<li")
    expect(front.body).not.toContain("<script")
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it("lists only the processes with a published version, with the owner, the current version and its approval date", async () => {
    writeView()
    const address = await openView()

    const front = await requestPage(address, "/")

    expect(items(front.body)).toEqual([`<a href="/${processId}">Handle a lost laptop</a> Owner: Kari Nordmann. Version 2. Approved on: 2026-11-21.`])
    expect(front.body).not.toContain("Older process")
  })

  it("shows the current version with its facts, its document and the version history, and no notice", async () => {
    writeView()
    const address = await openView()

    const page = await requestPage(address, `/${processId}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(page.body).toContain('<p><a href="/">All processes</a></p>')
    expect(page.body.replace(/>\s+</g, "><")).toContain(
      "<dl><dt>Owner</dt><dd>Kari Nordmann</dd><dt>Version</dt><dd>2</dd><dt>Approved by</dt><dd>Kari Nordmann</dd><dt>Approved on</dt><dd>2026-11-21</dd></dl>",
    )
    expect(documentOf(page.body)).toBe('<h1>Handle a lost laptop</h1><ol><li value="1">IT manager (Ola Hansen): Block the laptop in Intune.</li></ol>')
    expect(page.body).toContain("<h2>Version history</h2>")
    expect(items(page.body)).toEqual([
      `<a href="/${processId}/2">Version 2</a> Approved by: Kari Nordmann. Approved on: 2026-11-21. (this version)`,
      `<a href="/${processId}/1">Version 1</a> Approved by: Kari Nordmann. Approved on: 2026-10-02.`,
    ])
    expect(page.body).not.toContain("not the current version")
    expect(page.body).toBe((await requestPage(address, `/${processId}/2`)).body)
  })

  it("shows an earlier version with the notice that links to the current one, and marks it in the history", async () => {
    writeView()
    const address = await openView()

    const page = await requestPage(address, `/${processId}/1`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 1</title>")
    expect(page.body).toContain(
      `<p class="notice">This is version 1, not the current version. <a href="/${processId}">Read the current version, version 2.</a></p>`,
    )
    expect(page.body.indexOf('<p class="notice">')).toBeLessThan(page.body.indexOf("<dl>"))
    expect(documentOf(page.body)).toBe('<h1>Handle a lost laptop</h1><ol><li value="1">IT manager (Ola Hansen): Call the police first.</li></ol>')
    expect(items(page.body).at(-1)).toBe(`<a href="/${processId}/1">Version 1</a> Approved by: Kari Nordmann. Approved on: 2026-10-02. (this version)`)
  })

  it("keeps showing the newest published version of a process in regenerate, and nothing of its stage or its new draft", async () => {
    writeView({ stage: "regenerate" })
    writeWorkingFile(`processes/${processId}/drafts/draft-9.md`, "# Handle a lost laptop\n\nUnapproved ninth draft.\n")
    const address = await openView()

    const page = await requestPage(address, `/${processId}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(page.body).not.toContain("Unapproved ninth draft.")
    expect(page.body).not.toContain("regenerate")
  })

  it.each([
    ["a process without a published version", "/000-older-process"],
    ["a version folder the board does not list", `/${processId}/3`],
    ["a path that tries to leave the store", "/..%2f..%2fpackage.json"],
    ["a draft of a process", `/${processId}/drafts/draft-1.md`],
    ["a slash at the end", `/${processId}/`],
  ])("answers 404 with the page Not found for %s", async (_name, pathname) => {
    writeView()
    writeVersionFolder(3, "# Handle a lost laptop\n\nLeft by a failed publication.\n", undefined)
    const address = await openView()

    const page = await requestPage(address, pathname)

    expect(page.status).toBe(404)
    expect(page.body).toContain("<title>Not found</title>")
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain("<p>There is no published process at this address.</p>")
    expect(page.body).toContain('<p><a href="/">All processes</a></p>')
    expect(page.body).not.toContain(pathname)
    expect(page.body).not.toContain("Left by a failed publication.")
  })

  it("escapes the title, the owner and the document, and interprets no inline Markdown", async () => {
    writeView({ title: "Laptops & <phones>", owner: `Kari "K" O'Hara` }, "# Laptops & <phones>\n\nUse **bold** and `code`.\n\n- <script>alert(1)</script>\n")
    const address = await openView()

    const front = await requestPage(address, "/")
    const page = await requestPage(address, `/${processId}`)

    expect(items(front.body)).toEqual([`<a href="/${processId}">Laptops &amp; &lt;phones&gt;</a> Owner: Kari &quot;K&quot; O&#39;Hara. Version 2. Approved on: 2026-11-21.`])
    expect(page.body).toContain("<title>Laptops &amp; &lt;phones&gt;, version 2</title>")
    expect(documentOf(page.body)).toBe(
      "<h1>Laptops &amp; &lt;phones&gt;</h1><p>Use **bold** and `code`.</p><ul><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul>",
    )
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<strong>")
  })

  it("says not recorded for the owner, the approver and the date that the store does not give", async () => {
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage: "published", versions: [{ version: 1, draft: "draft-1.md", at: "2026-11-02T08:00:00.000Z" }] }])
    writeVersionFolder(1, firstDocument, undefined)
    const address = await openView()

    const front = await requestPage(address, "/")
    const page = await requestPage(address, `/${processId}`)

    expect(items(front.body)).toEqual([`<a href="/${processId}">Handle a lost laptop</a> Owner: not recorded. Version 1. Approved on: not recorded.`])
    expect(page.body.replace(/>\s+</g, "><")).toContain("<dt>Owner</dt><dd>not recorded</dd>")
    expect(page.body).toContain("Approved by: not recorded. Approved on: not recorded.")
    expect(page.body).not.toContain("2026-11-02")
  })

  it("answers a method other than GET or HEAD with 405 and Allow: GET, HEAD, and HEAD with 200", async () => {
    writeView()
    const address = await openView()

    const refused = await requestPage(address, "/", "POST")

    expect(refused.status).toBe(405)
    expect(refused.headers.get("allow")).toBe("GET, HEAD")
    expect(refused.body).toBe("")
    expect((await requestPage(address, "/", "HEAD")).status).toBe(200)
  })

  it("answers 500 without the reason while the board cannot be read, and 200 again after it is repaired", async () => {
    writeView()
    const board = readWorkingFile(boardPath)
    const address = await openView()
    writeWorkingFile(boardPath, "{ not json")

    const broken = await requestPage(address, "/")

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<title>Error</title>")
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain("<p>The reading view cannot read the processes.</p>")
    expect(broken.body).not.toContain(boardPath)
    expect(broken.body).not.toContain("JSON")

    writeWorkingFile(boardPath, board)

    expect((await requestPage(address, "/")).status).toBe(200)
  })

  it.each([["abc"], ["70000"], ["-1"], ["4173x"]])("refuses the port %s with one line, starts no server and exits with 1", (port) => {
    const result = runCommand(["serve", "--port", port])

    expect(result.stderr).toBe("process-factory: the port must be a number from 0 to 65535\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  describe("the feedback a reader sends from the page of a version", () => {
    const feedbackFolder = `processes/${processId}/feedback`
    const feedbackPath = `/${processId}/2/feedback`
    const fields = { kind: "document", step: "1", text: "I did not understand step one.", name: "Ola Hansen" }
    const kindReason = "Choose what went wrong: the document or the process."
    const stepReason = "Choose a step of this version or the whole document."
    const textReason = "Write what happened."
    const refusedPosts: [string, Record<string, string>, string][] = [
      ["no kind", { step: fields.step, text: fields.text }, kindReason],
      ["a kind that is neither of the two", { ...fields, kind: "other" }, kindReason],
      ["no step", { kind: fields.kind, text: fields.text }, stepReason],
      ["a step the version does not have", { ...fields, step: "2" }, stepReason],
      ["a step with a leading zero", { ...fields, step: "01" }, stepReason],
      ["no text", { kind: fields.kind, step: fields.step }, textReason],
      ["a text of only whitespace", { ...fields, text: " \r\n\t " }, textReason],
      ["a text of 2001 characters", { ...fields, text: "t".repeat(2001) }, "The text may be at most 2000 characters."],
      ["a name of 101 characters", { ...fields, name: "n".repeat(101) }, "The name may be at most 100 characters."],
    ]

    function storedFeedback(number: number): string {
      return readWorkingFile(`${feedbackFolder}/feedback-${String(number)}.md`)
    }

    /** The sorted names in the folder `feedback` of the laptop process, empty when there is no such folder. */
    function feedbackFiles(): string[] {
      const folder = path.join(workingDirectory, feedbackFolder)
      return existsSync(folder) ? readdirSync(folder).sort() : []
    }

    it("stands with its two kinds, its steps, its text and its name between the document and the version history", async () => {
      writeView()
      const address = await openView()

      const page = await requestPage(address, `/${processId}`)

      const body = page.body.replace(/\s+/g, " ").replace(/> </g, "><")
      const part = body.slice(body.indexOf("</main>"), body.indexOf("<h2>Version history</h2>"))
      expect(part).toContain("<h2>Feedback</h2>")
      expect(part).toContain(`<form method="post" action="${feedbackPath}">`)
      expect(part).toContain('<label><input type="radio" name="kind" value="document" required> I did not understand the document</label>')
      expect(part).toContain('<label><input type="radio" name="kind" value="process" required> The process itself failed me</label>')
      expect(part).toContain('<select id="step" name="step"><option value="whole">The whole document</option><option value="1">Step 1</option></select>')
      expect(part).toContain('<textarea id="text" name="text" rows="6" maxlength="2000" required></textarea>')
      expect(part).toContain('<input id="name" name="name" maxlength="100">')
      expect(part).toContain('<button type="submit">Send feedback</button>')
      expect(part).not.toContain("checked")
      expect(page.body).not.toContain("<script")
    })

    it("posts to the version it is on, and is not on the front page", async () => {
      writeView()
      const address = await openView()

      const earlier = await requestPage(address, `/${processId}/1`)

      expect(earlier.body).toContain(`<form method="post" action="/${processId}/1/feedback">`)
      expect(earlier.body).not.toContain(feedbackPath)
      expect((await requestPage(address, "/")).body).not.toContain("<form")
    })

    it("answers an accepted post with 303 to the address itself and stores it as feedback-1.md", async () => {
      writeView()
      const address = await openView()

      const answer = await postFeedback(address, feedbackPath, fields)

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(feedbackPath)
      expect(answer.body).toBe("")
      expect(storedFeedback(1)).toMatch(
        /^# Feedback 1\n\nProcess: 001-handle-a-lost-laptop\nVersion: 2\nStep: 1\nKind: document\nFrom: Ola Hansen\nReceived at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\nStatus: open\n\n## Text\n\nI did not understand step one\.\n$/,
      )
      const received = await requestPage(address, feedbackPath)
      expect(received.status).toBe(200)
      expect(received.body).toContain("<title>Feedback received</title>")
      expect(received.body).toContain("<p>Thank you. Your feedback on version 2 of Handle a lost laptop is stored.</p>")
      expect(received.body).toContain(`<p><a href="/${processId}/2">Back to the document</a></p>`)
      expect(received.body).not.toContain(fields.text)
      expect(received.body).not.toContain(fields.name)
    })

    it("stores the other kind, the whole document, the version of the address and anonymous for a post without a name", async () => {
      writeView()
      const address = await openView()

      const answer = await postFeedback(address, `/${processId}/1/feedback`, { kind: "process", step: "whole", text: "The police did not answer." })

      expect(answer.status).toBe(303)
      expect(storedFeedback(1)).toContain("\nVersion: 1\nStep: whole document\nKind: process\nFrom: anonymous\n")
    })

    it("gives every feedback the next number and leaves the file that is there as it was", async () => {
      writeView()
      const address = await openView()

      expect((await postFeedback(address, feedbackPath, fields)).status).toBe(303)
      const first = storedFeedback(1)
      expect((await postFeedback(address, feedbackPath, { ...fields, text: "A second remark." })).status).toBe(303)

      expect(feedbackFiles()).toEqual(["feedback-1.md", "feedback-2.md"])
      expect(storedFeedback(1)).toBe(first)
      expect(storedFeedback(2)).toContain("# Feedback 2\n")
      expect(storedFeedback(2)).toContain("\n## Text\n\nA second remark.\n")
    })

    it("stores a text with its lines and its tab but without its other control characters, and a name as one line", async () => {
      writeView()
      const address = await openView()

      const answer = await postFeedback(address, feedbackPath, { ...fields, text: "  first\r\n\u001bsecond\tpart\u0007  ", name: "  Ola\r\nStatus: closed  " })

      expect(answer.status).toBe(303)
      const lines = storedFeedback(1).split("\n")
      expect(lines).toContain("From: Ola Status: closed")
      expect(lines.filter((line) => line.startsWith("Status: "))).toEqual(["Status: open"])
      expect(lines.slice(lines.indexOf("## Text"))).toEqual(["## Text", "", "first", "second\tpart", ""])
    })

    it("stores a text of exactly 2000 characters and a name of exactly 100", async () => {
      writeView()
      const address = await openView()

      const answer = await postFeedback(address, feedbackPath, { ...fields, text: "t".repeat(2000), name: "n".repeat(100) })

      expect(answer.status).toBe(303)
      expect(storedFeedback(1)).toContain(`\nFrom: ${"n".repeat(100)}\n`)
      expect(storedFeedback(1).endsWith(`\n## Text\n\n${"t".repeat(2000)}\n`)).toBe(true)
    })

    it.each(refusedPosts)("answers 400 with the reason and writes no file for %s", async (_name, values, reason) => {
      writeView()
      const address = await openView()

      const answer = await postFeedback(address, feedbackPath, values)

      expect(answer.status).toBe(400)
      expect(answer.body).toContain("<title>Feedback not stored</title>")
      expect(answer.body).toContain("<h1>Feedback not stored</h1>")
      expect(answer.body).toContain(`<li>${reason}</li>`)
      expect(answer.body).toContain(`<p><a href="/${processId}/2">Back to the document</a></p>`)
      expect(feedbackFiles()).toEqual([])
    })

    it("names the kind, the step and the text, in that order, for an empty post, and repeats nothing of it", async () => {
      writeView()
      const address = await openView()

      const answer = await send(address, feedbackPath, "")
      const refused = await postFeedback(address, feedbackPath, { step: fields.step, text: "Nobody else may read this.", name: "Secret Reader" })

      expect(answer.status).toBe(400)
      expect(items(answer.body)).toEqual([kindReason, stepReason, textReason])
      expect(refused.body).not.toContain("Nobody else may read this.")
      expect(refused.body).not.toContain("Secret Reader")
      expect(feedbackFiles()).toEqual([])
    })

    it("answers 403 and writes no file for a post from another origin, and stores one from the view itself", async () => {
      writeView()
      const address = await openView()

      const refused = await postFeedback(address, feedbackPath, fields, { Origin: "http://evil.example" })

      expect(refused.status).toBe(403)
      expect(items(refused.body)).toEqual(["Feedback can only be sent from the reading view itself."])
      expect(feedbackFiles()).toEqual([])
      expect((await postFeedback(address, feedbackPath, fields, { Origin: address })).status).toBe(303)
      expect((await postFeedback(address, feedbackPath, fields, { Origin: address.replace("127.0.0.1", "localhost") })).status).toBe(303)
      expect(feedbackFiles()).toEqual(["feedback-1.md", "feedback-2.md"])
    })

    it("answers 413 and writes no file for a body of 40000 bytes, and answers the next request", async () => {
      writeView()
      const address = await openView()

      const answer = await send(address, feedbackPath, `kind=document&step=1&text=${"a".repeat(40_000)}`)

      expect(answer.status).toBe(413)
      expect(items(answer.body)).toEqual(["The feedback is too long."])
      expect(feedbackFiles()).toEqual([])
      expect((await requestPage(address, "/")).status).toBe(200)
    })

    it.each([["PUT"], ["DELETE"]])("answers %s at the address with 405 and Allow: GET, HEAD, POST", async (method) => {
      writeView()
      const address = await openView()

      const refused = await send(address, feedbackPath, "", { method })

      expect(refused.status).toBe(405)
      expect(refused.headers.allow).toBe("GET, HEAD, POST")
      expect(refused.body).toBe("")
      expect(feedbackFiles()).toEqual([])
    })

    it.each([
      ["a version that is not published", `/${processId}/3/feedback`],
      ["a version with a leading zero", `/${processId}/02/feedback`],
      ["a process without a published version", "/000-older-process/1/feedback"],
      ["a path without a version", `/${processId}/feedback`],
    ])("answers a post with 405 and Allow: GET, HEAD and a GET with 404 for %s", async (_name, pathname) => {
      writeView()
      const address = await openView()

      const refused = await postFeedback(address, pathname, fields)

      expect(refused.status).toBe(405)
      expect(refused.headers.allow).toBe("GET, HEAD")
      expect(refused.body).toBe("")
      const page = await requestPage(address, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(feedbackFiles()).toEqual([])
    })

    it("answers 500 without a path when the feedback cannot be written, and keeps running", async () => {
      writeView()
      writeWorkingFile(feedbackFolder, "a file where the folder should be\n")
      const address = await openView()

      const answer = await postFeedback(address, feedbackPath, fields)

      expect(answer.status).toBe(500)
      expect(answer.body).toContain("<title>Error</title>")
      expect(answer.body).toContain("<p>The feedback could not be stored.</p>")
      expect(answer.body).not.toContain("processes")
      expect((await requestPage(address, "/")).status).toBe(200)
    })
  })
})

describe("process-factory show and the open feedback of a process", () => {
  const laptopId = "001-handle-a-lost-laptop"
  const laptop = { id: laptopId, title: "Handle a lost laptop", stage: "published" }
  const laptopTop = `${laptopId}\nTitle: Handle a lost laptop\nStage: published\n`

  /** The lines above the text of an open feedback, as the reading view writes them. */
  function openLines(version: string, step: string, kind: string): string[] {
    return [`Version: ${version}`, `Step: ${step}`, `Kind: ${kind}`, "From: Ola Hansen", "Received at: 2026-11-22T10:15:00.000Z", "Status: open"]
  }

  /** Writes a feedback file of the laptop process with the lines above its text. */
  function writeFeedback(number: number, lines: string[], text: string): void {
    writeWorkingFile(`processes/${laptopId}/feedback/feedback-${String(number)}.md`, `# Feedback ${String(number)}\n\n${lines.join("\n")}\n\n## Text\n\n${text}\n`)
  }

  it("prints the number of open feedback behind a process that has any, and nothing behind a process without any", () => {
    writeBoardFile([laptop, { id: "002-order-a-badge", title: "Order a badge", stage: "draft" }])
    writeFeedback(1, openLines("2", "1", "document"), "I did not understand step one.")
    writeFeedback(2, openLines("1", "whole document", "process"), "The police did not answer.")

    const result = runCommand(["show"])

    expect(result.stdout).toBe(`${laptopId}  published  Handle a lost laptop  2 open feedback\n002-order-a-badge  draft  Order a badge\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("counts and lists only a file feedback-<k>.md whose first line Status: says open", () => {
    writeBoardFile([laptop])
    writeFeedback(1, openLines("2", "1", "document"), "I did not understand step one.")
    writeFeedback(3, [...openLines("2", "1", "document").slice(0, -1), "Status: closed"], "Closed.\nStatus: open")
    writeFeedback(5, openLines("2", "1", "document").slice(0, -1), "Without a status.")
    writeWorkingFile(`processes/${laptopId}/feedback/notes.md`, "# Notes\n\nStatus: open\n\n## Text\n\nNot a feedback file.\n")

    expect(runCommand(["show"]).stdout).toBe(`${laptopId}  published  Handle a lost laptop  1 open feedback\n`)
    expect(runCommand(["show", laptopId]).stdout).toBe(`${laptopTop}Feedback:\n  1  version 2  step 1  document  I did not understand step one.\nHistory:\n`)
  })

  it("prints no line of feedback for a process whose folder feedback is missing", () => {
    writeBoardFile([laptop])

    expect(runCommand(["show"]).stdout).toBe(`${laptopId}  published  Handle a lost laptop\n`)
    expect(runCommand(["show", laptopId]).stdout).toBe(`${laptopTop}History:\n`)
  })

  it("lists each open feedback on one line, in the order of their numbers, without the name and the time", () => {
    writeBoardFile([laptop])
    writeFeedback(10, openLines("2", "1", "process"), "The tenth remark.")
    writeFeedback(2, openLines("1", "whole document", "process"), "The police\u001b[31m did not answer.\r\n\r\n  I waited\tan hour.")
    writeFeedback(4, ["Status: open"], "Something went wrong.")

    const result = runCommand(["show", laptopId])

    expect(result.stdout).toBe(
      `${laptopTop}Feedback:\n  2  version 1  whole document  process  The police [31m did not answer. I waited an hour.\n  4  version not recorded  step not recorded  not recorded  Something went wrong.\n  10  version 2  step 1  process  The tenth remark.\nHistory:\n`,
    )
    expect(result.stdout).not.toContain("Ola Hansen")
    expect(result.stdout).not.toContain("2026-11-22T10:15")
    expect(result.status).toBe(0)
  })
})

describe("process-factory with anything other than a command", () => {
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b", "c"]], [["move"]], [["move", "a"]], [["move", "a", "b", "c"]], [["show", "a", "b"]], [["org"]], [["org", "init", "extra"]], [["answer"]], [["answer", "a"]], [["answer", "a", "b", "c"]], [["accept-spec"]], [["accept-spec", "a", "b"]], [["round"]], [["round", "a", "b"]], [["owner", "a"]], [["owner", "a", "b", "c"]], [["approve", "a"]], [["approve", "a", "b"]], [["approve", "a", "--as", "b"]], [["approve", "a", "--by", "b", "c"]], [["respec"]], [["respec", "a", "b"]], [["check", "extra"]], [["org", "check"]], [["serve", "extra"]], [["serve", "--port"]], [["serve", "--host", "0.0.0.0"]], [["serve", "--port", "0", "extra"]]])(
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
