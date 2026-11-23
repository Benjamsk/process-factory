import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, readFile, runCommand } from "../006-process-state-machine/store.ts"
import { findings, installReviewers, processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { recordedRound, simulation, writeCases } from "../023-case-regression-gate/gate.ts"
import { changeEntry, entry, fiveRounds, limitReason } from "../028-respec-a-process-from-findings/respec.ts"
import { move, prepareInApproval } from "./regeneration.ts"

/** A regeneration of version 1 that started after round 5 was recorded. */
const regeneration = { version: 1, round: 5, at: "2026-11-23T10:00:00.000Z" }

let project = ""

/** Writes the draft and the findings file of legal for this round, with the verdict CHANGES, and records the round. */
function recordChanges(round: number) {
  writeDrafts(project, [round])
  writeFindings(project, round, "legal.md", findings("legal", "CHANGES", ["high"]))
  return runCommand(project, ["round", processId])
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("the limit of five rounds for a regeneration that started after round 5", () => {
  it("moves the rounds 6 to 9 with a verdict of CHANGES to rework without a stop, and stops at round 10, the fifth of the regeneration", () => {
    writeProcess(project, "review", { rounds: fiveRounds(), regeneration })
    installReviewers(project, ["legal"])

    for (const round of [6, 7, 8, 9]) {
      const result = recordChanges(round)
      expect(result.stdout).not.toContain("Stopped: ")
      expect(result.stdout.endsWith("\nrework\n")).toBe(true)
      expect(entry(project).stage).toBe("rework")
      changeEntry(project, { stage: "review" })
    }
    const tenth = recordChanges(10)

    expect(tenth.stdout).toContain(`Stopped: ${limitReason}\n`)
    expect(tenth.stdout.endsWith("\napproval\n")).toBe(true)
    expect(entry(project).stage).toBe("approval")
  })

  it("still counts a case that passed with the published draft in round 5 and fails in round 6 as regressed, and does not stop at round 7", () => {
    writeProcess(project, "review", { rounds: [1, 2, 3, 4, 5].map((round) => recordedRound(round, [[1, "PASS"]])), regeneration })
    installReviewers(project, ["simulation"])
    writeCases(project, [1])
    writeDrafts(project, [6])
    writeFindings(project, 6, "simulation.md", simulation("CHANGES", [[1, "Result: FAIL at step 2"]]))

    const sixth = runCommand(project, ["round", processId])

    expect(sixth.stdout.split("\n").filter((line) => line.startsWith("Regressed: "))).toEqual(["Regressed: case 1 last passed in draft-5.md"])
    expect(sixth.stdout.endsWith("\nrework\n")).toBe(true)

    changeEntry(project, { stage: "review" })
    writeDrafts(project, [7])
    writeFindings(project, 7, "simulation.md", simulation("CHANGES", [[1, "Result: PASS"]]))
    const seventh = runCommand(project, ["round", processId])

    expect(seventh.stdout).not.toContain("Regressed: ")
    expect(seventh.stdout).not.toContain("Stopped: ")
    expect(seventh.stdout.endsWith("\nrework\n")).toBe(true)
    expect(entry(project).stage).toBe("rework")
  })
})

describe("process-factory respec for a process that is being regenerated", () => {
  it.each(["approval", "rework"])("is refused in %s, because a regeneration keeps the specification, and writes nothing", (stage) => {
    prepareInApproval(project)
    if (stage === "rework") move(project, "rework")
    const before = readFile(project, boardFile)
    const feedback = entries(project, `${processFolder}/feedback`)

    const result = runCommand(project, ["respec", processId])

    expect(result.stderr).toBe(
      `process-factory: cannot send ${processId} back to spec: it is being regenerated from version 1, and a regeneration keeps the specification of that version\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, `${processFolder}/feedback`)).toEqual(feedback)
  })
})
