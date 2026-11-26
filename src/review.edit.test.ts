import { mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  boardPath,
  readWorkingFile,
  runCommand,
  storedHistory,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeProjectFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory edit", () => {
  const processId = "001-handle-a-lost-laptop"
  const processFolder = `processes/${processId}`
  const specFile = `${processFolder}/spec.md`
  const caseFile = `${processFolder}/cases/case-2.md`
  const owner = "Kari Nordmann"
  const cannotLine = `process-factory: cannot edit spec.md of ${processId}`
  const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
  const regeneration = { version: 1, round: 0, at: "2026-11-23T09:00:00.000Z" }
  const caseText = "# Case 2: Laptop 2\n\n## Situation\n\nThe laptop is lost abroad.\n"

  /** A `spec.md` of the eleven sections with this line under `Deadlines`, each section decided except those named in `open`. */
  function specText(deadline: string, open: string[] = []): string {
    const section = (name: string): string => `## ${name}\n\nStatus: ${open.includes(name) ? "open" : "decided"}\n\n${name === "Deadlines" ? deadline : "Settled."}\n`
    return `# Specification: Handle a lost laptop\n\n${specSections.map(section).join("\n")}`
  }

  const oldSpec = specText("The laptop is blocked within 48 hours.")
  const newSpec = specText("The laptop is blocked within 24 hours.")

  /** The process in `stage`, owned by Kari Nordmann unless `more` says otherwise, with its specification, the case 2, these drafts and a `new.md` of the new text in the project. */
  function prepareEdit(stage: string, more: Record<string, unknown> = {}, drafts: number[] = [1]): void {
    writeWorkingFile("organisation/roles.md", `# Roles\n\n## Data protection officer\n\n${owner} is the data protection officer. Ola Hansen steps in when she is away.\n`)
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage, owner, history: [{ at: "2026-11-22T10:00:00.000Z", stage }], ...more }])
    writeWorkingFile(specFile, oldSpec)
    writeWorkingFile(caseFile, caseText)
    for (const number of drafts) writeWorkingFile(`${processFolder}/drafts/draft-${String(number)}.md`, `# Draft ${String(number)}\n`)
    writeProjectFile("new.md", newSpec)
  }

  function runEdit(name: string, file: string, by = owner) {
    return runCommand(["edit", processId, name, file, "--by", by])
  }

  it("replaces the file, prints it with the stage draft, records the edit in the history and marks the process", () => {
    prepareEdit("rework")
    writeProjectFile("new.md", `${newSpec.replace(/\n/g, "\r\n")}\r\n\r\n`)

    const result = runEdit("spec.md", "new.md")

    expect(result.stdout).toBe(`Stored ${specFile}\ndraft\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile(specFile)).toBe(newSpec)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("draft")
    expect(entry?.owner).toBe(owner)
    expect(entry?.needsDraft).toEqual(["spec.md"])
    expect(storedHistory(entry).at(-1)).toEqual({ at: expect.stringMatching(timeForm), stage: "draft", edited: "spec.md", by: owner })
  })

  it("keeps the stage of a process in cases and names every edited file once in the mark", () => {
    prepareEdit("cases")

    expect(runEdit("spec.md", "new.md").stdout).toBe(`Stored ${specFile}\ncases\n`)
    expect(storedProcesses()[0]?.needsDraft).toEqual(["spec.md"])
    writeProjectFile("new.md", "# Case 2: Laptop 2\n\n## Situation\n\nThe laptop is stolen abroad.\n")
    expect(runEdit("case-2.md", "new.md").status).toBe(0)
    expect(storedProcesses()[0]?.needsDraft).toEqual(["spec.md", "case-2.md"])
    writeProjectFile("new.md", oldSpec)
    expect(runEdit("spec.md", "new.md").status).toBe(0)

    expect(storedProcesses()[0]?.needsDraft).toEqual(["spec.md", "case-2.md"])
    expect(storedProcesses()[0]?.stage).toBe("cases")
    expect(storedHistory(storedProcesses()[0]).map((change) => change.edited)).toEqual([undefined, "spec.md", "case-2.md", "spec.md"])
  })

  it("records the edit of a process without a draft in its history and marks it not at all", () => {
    prepareEdit("draft", {}, [])

    expect(runEdit("spec.md", "new.md").stdout).toBe(`Stored ${specFile}\ndraft\n`)

    expect(storedHistory(storedProcesses()[0]).at(-1)).toEqual({ at: expect.stringMatching(timeForm), stage: "draft", edited: "spec.md", by: owner })
    expect(storedProcesses()[0]).not.toHaveProperty("needsDraft")
  })

  it("replaces a case with the text on standard input when the file is -", () => {
    prepareEdit("review")
    const text = "# Case 2: Laptop 2\n\n## Situation\n\nThe laptop is stolen abroad.\n"

    const result = runCommand(["edit", processId, "case-2.md", "-", "--by", owner], text)

    expect(result.stdout).toBe(`Stored ${caseFile}\ndraft\n`)
    expect(result.status).toBe(0)
    expect(readWorkingFile(caseFile)).toBe(text)
    expect(storedProcesses()[0]?.needsDraft).toEqual(["case-2.md"])
  })

  /** Each edit that is refused: what is wrong with it, the stage and further keys of the entry, the arguments after `edit` and the line it prints. */
  const refusals: [string, string, Record<string, unknown>, string[], string][] = [
    ["an id that is not on the board", "rework", {}, ["009-not-on-the-board", "spec.md", "new.md", "--by", owner], "process-factory: there is no process 009-not-on-the-board"],
    ["the name draft-1.md", "rework", {}, [processId, "draft-1.md", "new.md", "--by", owner], `process-factory: cannot edit ${processId}: draft-1.md is not spec.md or a case-<n>.md`],
    ["the name case-0.md", "rework", {}, [processId, "case-0.md", "new.md", "--by", owner], `process-factory: cannot edit ${processId}: case-0.md is not spec.md or a case-<n>.md`],
    ["the name ../board.json", "rework", {}, [processId, "../board.json", "new.md", "--by", owner], `process-factory: cannot edit ${processId}: ../board.json is not spec.md or a case-<n>.md`],
    ["a process in published", "published", {}, [processId, "spec.md", "new.md", "--by", owner], `${cannotLine}: it is in the stage published, not in spec, cases, draft, review, rework or approval`],
    [
      "a process that is being regenerated",
      "review",
      { regeneration },
      [processId, "spec.md", "new.md", "--by", owner],
      `${cannotLine}: it is being regenerated from version 1, and a regeneration keeps the specification and the cases it started with`,
    ],
    ["a case that is not there", "rework", {}, [processId, "case-7.md", "new.md", "--by", owner], `process-factory: cannot edit case-7.md of ${processId}: ${processFolder}/cases/case-7.md is not there`],
    ["a name of spaces only", "rework", {}, [processId, "spec.md", "new.md", "--by", "   "], `${cannotLine}: --by must be one line with at least one letter`],
    ["a name that is not the owner's", "rework", {}, [processId, "spec.md", "new.md", "--by", "Ola Hansen"], `${cannotLine}: --by does not name its owner`],
    ["a name that is in no role", "rework", { owner: undefined }, [processId, "spec.md", "new.md", "--by", "Nobody Known"], `${cannotLine}: Nobody Known is not named in organisation/roles.md`],
    ["a text of whitespace only", "rework", {}, [processId, "spec.md", "empty.md", "--by", owner], `${cannotLine}: the text is empty`],
    ["a text that only has other line breaks", "rework", {}, [processId, "spec.md", "same.md", "--by", owner], `${cannotLine}: the text is the same as ${specFile}`],
  ]

  it.each(refusals)("refuses %s with one line, exits with 1 and changes no file", (_name, stage, more, commandArguments, line) => {
    prepareEdit(stage, more)
    writeProjectFile("empty.md", "\n  \r\n\t\n")
    writeProjectFile("same.md", `${oldSpec.replace(/\n/g, "\r\n")}\r\n`)
    const board = readWorkingFile(boardPath)

    const result = runCommand(["edit", ...commandArguments])

    expect(result.stderr).toBe(`${line}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(specFile)).toBe(oldSpec)
    expect(readWorkingFile(caseFile)).toBe(caseText)
    expect(readWorkingFile(boardPath)).toBe(board)
  })

  it("accepts the owner's name with spaces around it, and refuses a file it cannot read and one it cannot write", () => {
    prepareEdit("rework")

    const missing = runEdit("spec.md", "missing.md")

    expect(missing.stderr.startsWith("process-factory: cannot read missing.md: ")).toBe(true)
    expect(missing.status).toBe(1)
    expect(runEdit("spec.md", "new.md", `  ${owner}  `).status).toBe(0)
    expect(storedHistory(storedProcesses()[0]).at(-1)?.by).toBe(owner)
    prepareEdit("rework")
    rmSync(path.join(workingDirectory, caseFile))
    mkdirSync(path.join(workingDirectory, caseFile))

    const unwritable = runEdit("case-2.md", "new.md")

    expect(unwritable.stderr.startsWith(`process-factory: cannot write ${caseFile}: `)).toBe(true)
    expect(unwritable.stdout).toBe("")
    expect(unwritable.status).toBe(1)
  })

  it("refuses a specification that would leave a section open unless the process is in spec", () => {
    prepareEdit("cases")
    writeProjectFile("open.md", specText("The laptop is blocked within 24 hours.", ["Scope", "Records"]))

    const refused = runEdit("spec.md", "open.md")

    expect(refused.stderr).toBe(`${cannotLine}: these sections would not be decided\n  Scope\n  Records\n`)
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(specFile)).toBe(oldSpec)

    prepareEdit("spec")
    writeProjectFile("open.md", specText("The laptop is blocked within 24 hours.", ["Scope", "Records"]))

    const stored = runEdit("spec.md", "open.md")

    expect(stored.stdout).toBe(`Stored ${specFile}\nspec\n`)
    expect(stored.status).toBe(0)
    expect(readWorkingFile(specFile)).toBe(specText("The laptop is blocked within 24 hours.", ["Scope", "Records"]))
  })

  it("drops the mark when the process moves to review, and show prints the mark and the edit until then", () => {
    prepareEdit("rework")
    expect(runEdit("spec.md", "new.md").status).toBe(0)

    const shown = runCommand(["show", processId]).stdout

    expect(shown).toContain("\nStage: draft\n")
    expect(shown).toContain("\nNeeds a new draft: spec.md\n")
    expect(shown.indexOf("Needs a new draft")).toBeLessThan(shown.indexOf("History:"))
    expect(shown.trimEnd().split("\n").at(-1)).toMatch(/^ {2}\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z {2}draft {2}spec\.md edited by Kari Nordmann$/)

    expect(runCommand(["move", processId, "review"]).stdout).toBe("review\n")

    expect(storedProcesses()[0]).not.toHaveProperty("needsDraft")
    expect(runCommand(["show", processId]).stdout).not.toContain("Needs a new draft")
  })
})
