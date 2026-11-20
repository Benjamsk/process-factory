import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const repositoryRoot = path.resolve(import.meta.dirname, "..")
const commandFile = path.join(repositoryRoot, "bin", "process-factory.mjs")
const skillFolder = ".claude/skills/process"
const skillFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md"]
const boardPath = "processes/board.json"
const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory org init\n'
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
  it("copies the five templates byte for byte into an empty folder and reports each one", () => {
    const result = runCommand(["init"])
    expect(result.stdout).toBe(skillFiles.map((file) => `Installed ${skillFolder}/${file}\n`).join(""))
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, skillFolder)).sort()).toEqual([...skillFiles].sort())
    expect(installedFilesEqualTheirTemplates()).toBe(true)
  })

  it("replaces older copies of the five files of the skill", () => {
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
  const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records"]
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

  it("names the open sections in the order of the ten, leaves the process in spec and the board as it was", () => {
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

  it("names all ten sections for a process without a spec.md", () => {
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
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b", "c"]], [["move"]], [["move", "a"]], [["move", "a", "b", "c"]], [["show", "a", "b"]], [["org"]], [["org", "init", "extra"]], [["answer"]], [["answer", "a"]], [["answer", "a", "b", "c"]], [["accept-spec"]], [["accept-spec", "a", "b"]]])(
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
