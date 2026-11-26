import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, historyStages, projectOf, readFile, runCommand, usage, writeFile } from "../006-process-state-machine/store.ts"
import { processFolder, processId } from "../024-named-owner-and-approval/approval.ts"
import { tree } from "../026-reading-view-on-localhost/view.ts"
import { change, changeEntry, changeList, entry, firstChange, firstRound, move, notChanged, prepareRegenerating, reasonsFile, refusedMove, secondChange, writeDraft } from "../031-controlled-regeneration/regeneration.ts"
import { firstLine, ownProcess, ownerFile, prepareApproval, prepareClarify, runWithInput, secondLine, writeStore } from "./decisions.ts"

const note = `${firstLine}\n\n  Shorten the first   section. \n`
const cannot = `process-factory: cannot send ${processId} back to rework`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** Checks that `owner.md` of round 2 is the findings file of the spec for the note of the criteria. */
function expectOwnerFile(): void {
  expect(readFile(project, ownerFile).split("\n")).toEqual([
    "# Findings of the owner",
    "",
    `Process: ${processId}`,
    "Round: 2",
    "Draft: draft-2.md",
    expect.stringMatching(/^Sent back at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    "",
    "Verdict: CHANGES",
    "",
    `- [high] ${firstLine}`,
    `- [high] ${secondLine}`,
    "",
  ])
}

describe("process-factory send-back <process-id> <file>", () => {
  it("stores every line of the note as a finding of the owner in owner.md of the newest recorded round, and prints the file and the stage rework", () => {
    prepareApproval(project)
    writeFile(projectOf(project), "note.md", note)

    const result = runCommand(project, ["send-back", processId, "note.md"])

    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Stored ${ownerFile}\nrework\n`)
    expectOwnerFile()
  })

  it("moves the process to rework, with the stage in its history, and show prints it", () => {
    prepareApproval(project)
    writeFile(projectOf(project), "note.md", note)

    expect(runCommand(project, ["send-back", processId, "note.md"]).status).toBe(0)

    expect(ownProcess(project).stage).toBe("rework")
    expect(historyStages(ownProcess(project))).toEqual(["approval", "rework"])
    expect(runCommand(project, ["show", processId]).stdout).toContain("Stage: rework\n")
  })

  it.each([
    ["an id that is not on the board", "approval", {}, "009-not-on-the-board", "note.md", "process-factory: there is no process 009-not-on-the-board\n"],
    ["a process in rework", "rework", {}, processId, "note.md", `${cannot}: it is in the stage rework, not in approval\n`],
    ["a process in approval without a recorded round", "approval", { rounds: [] }, processId, "note.md", `${cannot}: no round is recorded for it\n`],
    ["a note with only empty lines", "approval", {}, processId, "empty.md", `${cannot}: the note is empty\n`],
  ])("refuses %s with its line, exits with 1 and changes no file", (_name, stage, more, id, file, line) => {
    prepareApproval(project, { stage, ...more })
    writeFile(projectOf(project), "note.md", note)
    writeFile(projectOf(project), "empty.md", "\n   \n\t\n")
    const before = tree(project)

    const result = runCommand(project, ["send-back", id, file])

    expect(result.stderr).toBe(line)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })

  it("refuses a file that is not there and a round folder that already holds owner.md, and changes no file", () => {
    prepareApproval(project)
    writeFile(projectOf(project), "note.md", note)
    const empty = tree(project)

    const missing = runCommand(project, ["send-back", processId, "missing.md"])

    expect(missing.stderr.startsWith("process-factory: cannot read missing.md: ")).toBe(true)
    expect(missing.status).toBe(1)
    expect(tree(project)).toEqual(empty)

    writeFile(project, ownerFile, "# Findings of the owner\n\nAn earlier note.\n")
    const held = tree(project)

    const second = runCommand(project, ["send-back", processId, "note.md"])

    expect(second.stderr.startsWith(`process-factory: cannot write ${ownerFile}: `)).toBe(true)
    expect(second.stdout).toBe("")
    expect(second.status).toBe(1)
    expect(tree(project)).toEqual(held)
  })

  it("reads the note from standard input when the file is -", () => {
    prepareApproval(project)

    const result = runWithInput(project, ["send-back", processId, "-"], note)

    expect(result.status).toBe(0)
    expect(result.stdout).toBe(`Stored ${ownerFile}\nrework\n`)
    expectOwnerFile()
    expect(ownProcess(project).stage).toBe("rework")
  })
})

describe("process-factory answer <process-id> -", () => {
  it("stores the text on standard input as the answers of the newest questions file and moves the process to spec", () => {
    prepareClarify(project)
    const answers = "# Answers 2\n\n## 1. Who decides that the police are called?\n\nThe IT manager.\n"

    const result = runWithInput(project, ["answer", processId, "-"], answers)

    expect(result.status).toBe(0)
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Stored ${processFolder}/answers-2.md\nspec\n`)
    expect(readFile(project, `${processFolder}/answers-2.md`)).toBe(answers)
    expect(ownProcess(project).stage).toBe("spec")
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["send-back alone", ["send-back"]],
    ["send-back with one argument", ["send-back", processId]],
    ["send-back with three arguments", ["send-back", processId, "note.md", "extra"]],
  ])("has nineteen lines, with send-back directly after respec and before edit, and is printed with %s", (_name, args) => {
    writeStore(project, "approval")
    const before = tree(project)

    const result = runCommand(project, args)

    expect(result.stderr).toBe(usage)
    const lines = result.stderr.trimEnd().split("\n")
    expect(lines).toHaveLength(19)
    expect(lines.slice(9, 13)).toEqual([
      "       process-factory respec <process-id> [--org <org-id>]",
      "       process-factory send-back <process-id> <file> [--org <org-id>]",
      '       process-factory edit <process-id> <name> <file> --by "<person>" [--org <org-id>]',
      '       process-factory org new "<name>"',
    ])
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(tree(project)).toEqual(before)
  })
})

describe("the change list of a regeneration after a note of the owner", () => {
  it("may name round-<r>/owner.md as the reason of a change when that file is there, and not without it", () => {
    prepareRegenerating(project)
    const secondRound = { round: 2, draft: "draft-2.md", at: "2026-11-23T10:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }
    changeEntry(project, { stage: "rework", rounds: [firstRound, secondRound] })
    const ownerChange = change(3, ["- Section: Steps", "- Change: Step 1 now names the IT manager.", "- Reason: round-2/owner.md"])
    writeDraft(project, 3, changeList(3, [firstChange, secondChange, ownerChange, notChanged]))

    const without = move(project, "review")

    expect(without.stderr).toBe(refusedMove("rework", "review", 3, `names a reason that is not in ${reasonsFile}: round-2/owner.md`))
    expect(without.status).toBe(1)
    expect(entry(project).stage).toBe("rework")

    writeFile(project, ownerFile, `# Findings of the owner\n\nVerdict: CHANGES\n\n- [high] ${firstLine}\n`)

    const withFile = move(project, "review")

    expect(withFile.stderr).toBe("")
    expect(withFile.stdout).toBe("review\n")
    expect(withFile.status).toBe(0)
    expect(entry(project).stage).toBe("review")
  })
})
