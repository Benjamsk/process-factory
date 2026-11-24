import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, history, readFile, runCommand, usage, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { kari, processFolder, processId, timeForm } from "../024-named-owner-and-approval/approval.ts"
import { tree } from "../026-reading-view-on-localhost/view.ts"
import { ownProcess, runWithInput } from "../034-dashboard-decisions/decisions.ts"
import { caseFile, cannotEditSpec, edit, newSpec, oldSpec, prepare, specFile } from "./authoring.ts"

const stored = `Stored ${specFile}\n`
const notInStage = (stage: string): string => `${cannotEditSpec}: it is in the stage ${stage}, not in spec, cases, draft, review, rework or approval\n`
const notAName = (name: string): string => `process-factory: cannot edit ${processId}: ${name} is not spec.md or a case-<n>.md\n`
const regeneration = { version: 1, round: 0, at: "2026-11-23T09:00:00.000Z" }

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The last element of the history of the process on the board. */
function lastChange(): Record<string, unknown> {
  return history(ownProcess(project)).at(-1) ?? {}
}

describe("process-factory edit <process-id> <name> <file> --by <person>", () => {
  it("replaces spec.md of a process in rework with the text of the file, with one kind of line break and one line break at its end, and prints the file and the stage draft", () => {
    prepare(project, "rework")
    writeFile(project, "new.md", `${newSpec.replace(/\n/g, "\r\n")}\r\n\r\n`)

    const result = edit(project, "spec.md", "new.md")

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${stored}draft\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, specFile)).toBe(newSpec)
  })

  it.each(["review", "rework", "approval"])("moves a process in %s back to draft, records the file, the name and the time in its history and marks it as needing a new draft", (stage) => {
    prepare(project, stage)
    writeFile(project, "new.md", newSpec)

    expect(edit(project, "spec.md", "new.md").stdout).toBe(`${stored}draft\n`)

    expect(ownProcess(project).stage).toBe("draft")
    expect(history(ownProcess(project))).toHaveLength(2)
    expect(lastChange()).toEqual({ at: expect.stringMatching(timeForm), stage: "draft", edited: "spec.md", by: kari })
    expect(ownProcess(project).needsDraft).toEqual(["spec.md"])
    expect(ownProcess(project).owner).toBe(kari)
  })

  it.each(["spec", "cases", "draft"])("stores the file of a process in %s, which stays in its stage with the edit in its history", (stage) => {
    prepare(project, stage)
    writeFile(project, "new.md", newSpec)

    const result = edit(project, "spec.md", "new.md")

    expect(result.stdout).toBe(`${stored}${stage}\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, specFile)).toBe(newSpec)
    expect(ownProcess(project).stage).toBe(stage)
    expect(lastChange()).toEqual({ at: expect.stringMatching(timeForm), stage, edited: "spec.md", by: kari })
  })

  it("records the edit of a process without a draft in its history and does not mark it", () => {
    prepare(project, "cases", {}, [])
    writeFile(project, "new.md", newSpec)

    expect(edit(project, "spec.md", "new.md").stdout).toBe(`${stored}cases\n`)

    expect(lastChange()).toEqual({ at: expect.stringMatching(timeForm), stage: "cases", edited: "spec.md", by: kari })
    expect(ownProcess(project)).not.toHaveProperty("needsDraft")
  })

  it("lists every edited file once in the mark, in the order of the first edit of each", () => {
    prepare(project, "cases", {}, [1])
    writeFile(project, "new.md", newSpec)
    writeFile(project, "case.md", "# Case 2: Laptop 2\n\n## Situation\n\nThe laptop is stolen abroad.\n")

    expect(edit(project, "spec.md", "new.md").status).toBe(0)
    expect(ownProcess(project).needsDraft).toEqual(["spec.md"])
    expect(edit(project, "case-2.md", "case.md").status).toBe(0)
    expect(ownProcess(project).needsDraft).toEqual(["spec.md", "case-2.md"])
    writeFile(project, "new.md", oldSpec)
    expect(edit(project, "spec.md", "new.md").status).toBe(0)
    expect(ownProcess(project).needsDraft).toEqual(["spec.md", "case-2.md"])
    expect(history(ownProcess(project)).map((change) => change.edited)).toEqual([undefined, "spec.md", "case-2.md", "spec.md"])
  })

  it("replaces a case with the text on standard input when the file is -", () => {
    prepare(project, "draft")
    const text = "# Case 2: Laptop 2\n\n## Situation\n\nThe laptop is stolen abroad.\n"

    const result = runWithInput(project, ["edit", processId, "case-2.md", "-", "--by", kari], text)

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Stored ${caseFile(2)}\ndraft\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, caseFile(2))).toBe(text)
    expect(lastChange().edited).toBe("case-2.md")
  })

  it("refuses a name that is not in organisation/roles.md for a process without an owner, and accepts one that is", () => {
    prepare(project, "rework", { owner: undefined })
    writeFile(project, "new.md", newSpec)
    const before = tree(project)

    const unknown = edit(project, "spec.md", "new.md", "Nobody Known")

    expect(unknown.stderr).toBe(`${cannotEditSpec}: Nobody Known is not named in organisation/roles.md\n`)
    expect(unknown.stdout).toBe("")
    expect(unknown.status).toBe(1)
    expect(tree(project)).toEqual(before)

    const known = edit(project, "spec.md", "new.md", ` ${kari} `)

    expect(known.status).toBe(0)
    expect(lastChange().by).toBe(kari)
    expect(readFile(project, specFile)).toBe(newSpec)
  })

  it("refuses every name but the owner's for a process that has an owner, also a name that is in organisation/roles.md", () => {
    prepare(project, "rework")
    writeFile(project, "new.md", newSpec)
    const before = tree(project)

    const result = edit(project, "spec.md", "new.md", "Ola Hansen")

    expect(result.stderr).toBe(`${cannotEditSpec}: --by does not name its owner\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })

  it.each<[string, string, Record<string, unknown>, string[], string]>([
    ["an id that is not on the board", "rework", {}, ["009-not-on-the-board", "spec.md", "new.md", "--by", kari], "process-factory: there is no process 009-not-on-the-board\n"],
    ["the name draft-1.md", "rework", {}, [processId, "draft-1.md", "new.md", "--by", kari], notAName("draft-1.md")],
    ["the name case-0.md", "rework", {}, [processId, "case-0.md", "new.md", "--by", kari], notAName("case-0.md")],
    ["the name ../board.json", "rework", {}, [processId, "../board.json", "new.md", "--by", kari], notAName("../board.json")],
    ["a process in intake", "intake", {}, [processId, "spec.md", "new.md", "--by", kari], notInStage("intake")],
    ["a process in clarify", "clarify", {}, [processId, "spec.md", "new.md", "--by", kari], notInStage("clarify")],
    ["a process in published", "published", {}, [processId, "spec.md", "new.md", "--by", kari], notInStage("published")],
    ["a process in regenerate", "regenerate", { regeneration }, [processId, "spec.md", "new.md", "--by", kari], notInStage("regenerate")],
    [
      "a process in review that is being regenerated",
      "review",
      { regeneration },
      [processId, "spec.md", "new.md", "--by", kari],
      `${cannotEditSpec}: it is being regenerated from version 1, and a regeneration keeps the specification and the cases it started with\n`,
    ],
    [
      "a case that is not there",
      "rework",
      {},
      [processId, "case-7.md", "new.md", "--by", kari],
      `process-factory: cannot edit case-7.md of ${processId}: ${processFolder}/cases/case-7.md is not there\n`,
    ],
    ["a name of spaces only", "rework", {}, [processId, "spec.md", "new.md", "--by", "   "], `${cannotEditSpec}: --by must be one line with at least one letter\n`],
    ["a text of whitespace only", "rework", {}, [processId, "spec.md", "empty.md", "--by", kari], `${cannotEditSpec}: the text is empty\n`],
    ["a text that differs only in the kind of its line breaks", "rework", {}, [processId, "spec.md", "same.md", "--by", kari], `${cannotEditSpec}: the text is the same as ${specFile}\n`],
  ])("refuses %s with its line, exits with 1 and changes no file", (_name, stage, more, args, line) => {
    prepare(project, stage, more)
    writeFile(project, "new.md", newSpec)
    writeFile(project, "empty.md", "\n  \r\n\t\n")
    writeFile(project, "same.md", `${oldSpec.replace(/\n/g, "\r\n")}\r\n`)
    const before = tree(project)

    const result = runCommand(project, ["edit", ...args])

    expect(result.stderr).toBe(line)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })

  it("refuses a file that is not there, and changes no file", () => {
    prepare(project, "rework")
    const before = tree(project)

    const result = edit(project, "spec.md", "missing.md")

    expect(result.stderr.startsWith("process-factory: cannot read missing.md: ")).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })

  it("refuses an edit that leaves a section of an accepted specification not decided, and stores the same edit of a process in spec", () => {
    prepare(project, "cases")
    writeFile(project, "open.md", specText(["Scope"]))
    const before = tree(project)

    const refused = edit(project, "spec.md", "open.md")

    expect(refused.stderr).toBe(`${cannotEditSpec}: these sections would not be decided\n  Scope\n`)
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(tree(project)).toEqual(before)

    prepare(project, "spec")
    writeFile(project, "open.md", specText(["Scope"]))

    const kept = edit(project, "spec.md", "open.md")

    expect(kept.stdout).toBe(`${stored}spec\n`)
    expect(kept.status).toBe(0)
    expect(readFile(project, specFile)).toBe(specText(["Scope"]))
  })
})

describe("the mark that a process needs a new draft", () => {
  it("goes when the process moves to review, and move still refuses the way back to draft", () => {
    prepare(project, "rework")
    writeFile(project, "new.md", newSpec)
    expect(edit(project, "spec.md", "new.md").status).toBe(0)
    expect(ownProcess(project).needsDraft).toEqual(["spec.md"])

    const moved = runCommand(project, ["move", processId, "review"])

    expect(moved.stdout).toBe("review\n")
    expect(ownProcess(project).stage).toBe("review")
    expect(ownProcess(project)).not.toHaveProperty("needsDraft")
    const back = runCommand(project, ["move", processId, "draft"])
    expect(back.status).toBe(1)
    expect(back.stderr).toBe(`process-factory: cannot move ${processId} from review to draft (allowed from review: rework, approval)\n`)
  })

  it("is printed by show with the edited files, and the edit as the last line of the history with the file and the name", () => {
    prepare(project, "rework")
    const quiet = runCommand(project, ["show", processId]).stdout
    expect(quiet).toContain("Stage: rework\n")
    expect(quiet).not.toContain("Needs a new draft")
    writeFile(project, "new.md", newSpec)
    expect(edit(project, "spec.md", "new.md").status).toBe(0)

    const shown = runCommand(project, ["show", processId]).stdout

    expect(shown).toContain("\nStage: draft\n")
    expect(shown).toContain("\nNeeds a new draft: spec.md\n")
    expect(shown.indexOf("Needs a new draft: spec.md")).toBeLessThan(shown.indexOf("History:"))
    expect(shown.trimEnd().split("\n").at(-1)).toMatch(/^ {2}\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z {2}draft {2}spec\.md edited by Kari Nordmann$/)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["edit alone", ["edit"]],
    ["edit with four arguments", ["edit", processId, "spec.md", "new.md", "--by"]],
    ["edit with another option than --by", ["edit", processId, "spec.md", "new.md", "--from", kari]],
  ])("has seventeen lines, with edit directly after send-back and before org init, and is printed with %s", (_name, args) => {
    prepare(project, "rework")
    writeFile(project, "new.md", newSpec)
    const before = tree(project)

    const result = runCommand(project, args)

    expect(result.stderr).toBe(usage)
    const lines = result.stderr.trimEnd().split("\n")
    expect(lines).toHaveLength(17)
    expect(lines.slice(10, 13)).toEqual([
      "       process-factory send-back <process-id> <file>",
      '       process-factory edit <process-id> <name> <file> --by "<person>"',
      "       process-factory org init",
    ])
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })
})
