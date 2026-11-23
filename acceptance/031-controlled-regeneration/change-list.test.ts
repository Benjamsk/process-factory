import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, readFile, writeFile } from "../006-process-state-machine/store.ts"
import { change, changeEntry, changeList, changesFile, entry, firstChange, firstRound, move, notChanged, prepareRegenerating, reasonsFile, refusedMove, secondChange, validChanges, writeDraft } from "./regeneration.ts"

const sectionLine = "needs exactly one line - Section: with one of the seven headings of a draft"
const changeLine = "needs exactly one line - Change: with what changed"
const said = "- Change: Step 1 is clearer now."
/** A second change that names the three reasons the first change of the spec does not name. */
const theOtherThree = change(2, ["- Section: Who does what", said, "- Reason: Role: Data protection officer", "- Reason: case-2.md", "- Reason: feedback-2.md"])
const refusedLists: [string, string, string][] = [
  ["has no section ## Change", "names no change", changeList(2, [notChanged])],
  ["has a change without a Section line", `change 1 ${sectionLine}`, changeList(2, [change(1, [said, "- Reason: feedback-1.md"]), secondChange, notChanged])],
  [
    "has a change with two Section lines",
    `change 1 ${sectionLine}`,
    changeList(2, [change(1, ["- Section: Steps", "- Section: Who does what", said, "- Reason: feedback-1.md"]), secondChange, notChanged]),
  ],
  [
    "has a change with a Section that is no heading of a draft",
    `change 1 ${sectionLine}`,
    changeList(2, [change(1, ["- Section: Legal basis", said, "- Reason: feedback-1.md"]), secondChange, notChanged]),
  ],
  ["has a change without a Change line", `change 1 ${changeLine}`, changeList(2, [change(1, ["- Section: Steps", "- Reason: feedback-1.md"]), secondChange, notChanged])],
  [
    "has a change with a Change line that says nothing",
    `change 1 ${changeLine}`,
    changeList(2, [change(1, ["- Section: Steps", "- Change: ", "- Reason: feedback-1.md"]), secondChange, notChanged]),
  ],
  ["has a change without a Reason line", "change 2 needs a line - Reason:", changeList(2, [firstChange, change(2, ["- Section: Who does what", said]), notChanged])],
  [
    "names a reason the regeneration does not have",
    `names a reason that is not in ${reasonsFile}: feedback-9.md`,
    changeList(2, [firstChange, secondChange, change(3, ["- Section: Steps", said, "- Reason: feedback-9.md"]), notChanged]),
  ],
  [
    "names a reason under Not changed without saying why",
    "gives no reason why feedback-2.md is not changed",
    changeList(2, [firstChange, secondChange, "## Not changed\n\n### feedback-2.md"]),
  ],
  [
    "leaves two reasons of the regeneration out",
    `does not name these reasons of ${reasonsFile}: feedback-2.md, case-2.md`,
    changeList(2, [firstChange, change(2, ["- Section: Who does what", said, "- Reason: Role: Data protection officer"])]),
  ],
]

let project = ""

/** Expects the move to `review` to be refused without the change list of `draft-<n>.md`, and to succeed once this one is written. */
function refusedWithoutAndAcceptedWith(number: number, from: string, changes: string): void {
  writeDraft(project, number)
  expect(move(project, "review").stderr).toBe(refusedMove(from, "review", number, "is missing"))

  writeFile(project, changesFile(number), changes)
  const result = move(project, "review")

  expect(result.stderr).toBe("")
  expect(result.stdout).toBe("review\n")
  expect(result.status).toBe(0)
  expect(entry(project).stage).toBe("review")
}

beforeEach(() => {
  project = emptyFolder()
  prepareRegenerating(project)
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory move <process-id> review for a process that is being regenerated", () => {
  it("is refused without the change list of the newest draft, leaves the board as it was, and moves with the change list of the spec", () => {
    writeDraft(project, 2)
    const before = readFile(project, boardFile)

    const refused = move(project, "review")

    expect(refused.stderr).toBe(refusedMove("regenerate", "review", 2, "is missing"))
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    refusedWithoutAndAcceptedWith(2, "regenerate", validChanges())
  })

  it("asks for the change list of the newest draft, not of an earlier one, also from rework", () => {
    writeDraft(project, 2, validChanges())
    expect(move(project, "review").status).toBe(0)
    expect(move(project, "rework").status).toBe(0)

    refusedWithoutAndAcceptedWith(3, "rework", validChanges(3))
  })

  it.each(refusedLists)("refuses a change list that %s", (_name, problem, changes) => {
    writeDraft(project, 2, changes)
    const before = readFile(project, boardFile)

    const result = move(project, "review")

    expect(result.stderr).toBe(refusedMove("regenerate", "review", 2, problem))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it("accepts a change list without the heading Not changed whose changes name every reason", () => {
    refusedWithoutAndAcceptedWith(2, "regenerate", changeList(2, [firstChange, theOtherThree]))
  })

  it("accepts a reason that is named on a Reason line and under Not changed", () => {
    const partly = "## Not changed\n\n### feedback-2.md\n\nThe specification states no deadline.\n\n### feedback-1.md\n\nIt also asks for a deadline the specification does not state."
    refusedWithoutAndAcceptedWith(2, "regenerate", changeList(2, [firstChange, secondChange, partly]))
  })
})

describe("a change that only a finding of a round of the regeneration asked for", () => {
  const secondRound = { round: 2, draft: "draft-2.md", at: "2026-11-23T12:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }

  /** The process in `rework` after round 2 of the regeneration, with `draft-3.md` and a change list whose third change has this reason. */
  function reworkWith(reason: string): void {
    changeEntry(project, { stage: "rework", rounds: [firstRound, secondRound] })
    writeDraft(project, 3, changeList(3, [firstChange, secondChange, change(3, ["- Section: Steps", said, `- Reason: ${reason}`]), notChanged]))
  }

  it("may name the findings file of a reviewer of that round as its reason", () => {
    changeEntry(project, { stage: "rework", rounds: [firstRound, secondRound] })

    refusedWithoutAndAcceptedWith(3, "rework", changeList(3, [firstChange, secondChange, change(3, ["- Section: Steps", said, "- Reason: round-2/legal.md"]), notChanged]))
  })

  it.each([
    ["a round that was recorded before the regeneration started", "round-1/legal.md"],
    ["a reviewer the round does not have", "round-2/nobody.md"],
    ["a round that is not recorded", "round-3/legal.md"],
  ])("may not name %s", (_name, reason) => {
    reworkWith(reason)

    const result = move(project, "review")

    expect(result.stderr).toBe(refusedMove("rework", "review", 3, `names a reason that is not in ${reasonsFile}: ${reason}`))
    expect(result.status).toBe(1)
    expect(entry(project).stage).toBe("rework")
  })
})
