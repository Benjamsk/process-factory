import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { findings, installReviewers, processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { recordedRound, simulation, writeCases } from "../023-case-regression-gate/gate.ts"
import { entry, fiveRounds, limitReason, prepareRespec } from "./respec.ts"

const respecs = [{ round: 5, at: "2026-11-22T14:00:00.000Z" }]

let project = ""

/** Writes the draft and the findings file of legal for this round, with the verdict CHANGES, and records the round. */
function recordChanges(round: number) {
  writeDrafts(project, [round])
  writeFindings(project, round, "legal.md", findings("legal", "CHANGES", ["high"]))
  return runCommand(project, ["round", processId])
}

/** Writes the draft and the `simulation.md` of this round with these results of the cases 1 and 2, and records the round. */
function recordCases(round: number, first: string, second: string) {
  const failed = first !== "Result: PASS" || second !== "Result: PASS"
  writeDrafts(project, [round])
  writeFindings(
    project,
    round,
    "simulation.md",
    simulation(failed ? "CHANGES" : "PASS", [
      [1, first],
      [2, second],
    ]),
  )
  return runCommand(project, ["round", processId])
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show and accept-spec after a respec", () => {
  it("shows the stage spec, no accepted spec and still the five rounds, and accept-spec moves the process forward again", () => {
    prepareRespec(project)
    const before = runCommand(project, ["show", processId]).stdout
    runCommand(project, ["respec", processId])

    const shown = runCommand(project, ["show", processId]).stdout.split("\n")

    expect(before).toContain("Spec accepted: ")
    expect(shown).toContain("Stage: spec")
    expect(shown.filter((line) => line.startsWith("Spec accepted: "))).toEqual([])
    expect(shown.filter((line) => /^ {2}\d {2}draft-\d\.md {2}/.test(line))).toHaveLength(5)

    writeFile(project, `${processFolder}/spec.md`, specText())
    const accepted = runCommand(project, ["accept-spec", processId])

    expect(accepted.stdout).toBe(`Accepted ${processFolder}/spec.md\ncases\n`)
    expect(accepted.status).toBe(0)
    expect(runCommand(project, ["show", processId]).stdout).toContain("Spec accepted: ")
    expect(runCommand(project, ["move", processId, "draft"]).stdout).toBe("draft\n")
  })
})

describe("the limit of five rounds after a respec at round 5", () => {
  it("moves round 6 with a verdict of CHANGES to rework, without a stop", () => {
    writeProcess(project, "review", { rounds: fiveRounds(), respecs })
    installReviewers(project, ["legal"])

    const result = recordChanges(6)

    expect(result.stdout).not.toContain("Stopped: ")
    expect(result.stdout.endsWith("\nrework\n")).toBe(true)
    expect(result.status).toBe(0)
    expect(entry(project).stage).toBe("rework")
  })

  it("moves the rounds 7, 8 and 9 to rework too, and stops at round 10, the fifth after the respec", () => {
    writeProcess(project, "review", { rounds: fiveRounds(), respecs })
    installReviewers(project, ["legal"])

    for (const round of [6, 7, 8, 9]) {
      const result = recordChanges(round)
      expect(result.stdout).not.toContain("Stopped: ")
      expect(entry(project).stage).toBe("rework")
      runCommand(project, ["move", processId, "review"])
    }
    const tenth = recordChanges(10)

    expect(tenth.stdout).toContain(`Stopped: ${limitReason}\n`)
    expect(tenth.stdout.endsWith("\napproval\n")).toBe(true)
    expect(entry(project).stage).toBe("approval")
  })
})

describe("the regression of a case after a respec at round 5", () => {
  const passedBefore = [1, 2, 3, 4, 5].map((round) =>
    recordedRound(round, [
      [1, "PASS"],
      [2, "PASS"],
    ]),
  )

  it("does not count a case that passed only before the respec as regressed when it fails in round 6", () => {
    writeProcess(project, "review", { rounds: passedBefore, respecs })
    installReviewers(project, ["simulation"])
    writeCases(project, [1, 2])

    const result = recordCases(6, "Result: FAIL at step 2", "Result: PASS")

    expect(result.stdout).not.toContain("Regressed: ")
    expect(result.stdout.endsWith("\nrework\n")).toBe(true)
    expect(result.status).toBe(0)
  })

  it("counts a case that passed in round 6 and fails in round 7 as regressed, and no case that passed only before the respec", () => {
    const sixth = recordedRound(6, [
      [1, "FAIL"],
      [2, "PASS"],
    ])
    writeProcess(project, "review", { rounds: [...passedBefore, sixth], respecs })
    installReviewers(project, ["simulation"])
    writeCases(project, [1, 2])

    const result = recordCases(7, "Result: FAIL at step 2", "Result: FAIL at step 4")

    expect(result.stdout.split("\n").filter((line) => line.startsWith("Regressed: "))).toEqual(["Regressed: case 2 last passed in draft-6.md"])
    expect(result.stdout.endsWith("\nrework\n")).toBe(true)
    expect(entry(project).stage).toBe("rework")
  })
})
