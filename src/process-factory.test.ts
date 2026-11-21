import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
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
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory org init\n       process-factory check\n'
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

describe("process-factory with anything other than a command", () => {
  it.each([[[]], [["help"]], [["init", "extra"]], [["new"]], [["new", "a", "b", "c"]], [["move"]], [["move", "a"]], [["move", "a", "b", "c"]], [["show", "a", "b"]], [["org"]], [["org", "init", "extra"]], [["answer"]], [["answer", "a"]], [["answer", "a", "b", "c"]], [["accept-spec"]], [["accept-spec", "a", "b"]], [["round"]], [["round", "a", "b"]], [["owner", "a"]], [["owner", "a", "b", "c"]], [["approve", "a"]], [["approve", "a", "b"]], [["approve", "a", "--as", "b"]], [["approve", "a", "--by", "b", "c"]], [["check", "extra"]], [["org", "check"]]])(
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
