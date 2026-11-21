import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, historyStages, runCommand } from "../006-process-state-machine/store.ts"
import { findings, processFolder, processId, writeDrafts, writeFindings } from "../017-review-rounds/rounds.ts"
import { backToReview, entry, limitReason, prepare, recordedRound, rounds, simulation } from "./gate.ts"

const legalPass = "  legal  PASS  0 high, 0 medium, 0 low"
const simulationChanges = "  simulation  CHANGES  1 high, 0 medium, 0 low"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Writes round `round` with legal passing the draft and the simulation reviewer failing case 3 at step 2. */
function writeFailingRound(round: number): void {
  writeFindings(project, round, "legal.md", findings("legal", "PASS", []))
  writeFindings(project, round, "simulation.md", simulation("CHANGES", [[3, "Result: FAIL at step 2"]]))
}

describe("process-factory round with a case that passed in an earlier round and fails now", () => {
  it("prints Regressed: with the case and the draft it last passed in, between the reviewer lines and the stage rework", () => {
    prepare(project, [recordedRound(1, [[3, "PASS"]])], ["legal", "simulation"], [3])
    writeFailingRound(2)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [`Recorded ${processFolder}/rounds/round-2 for draft-2.md`, legalPass, simulationChanges, "Regressed: case 3 last passed in draft-1.md", "rework", ""].join("\n"),
    )
    expect(result.status).toBe(0)
    expect(entry(project).stage).toBe("rework")
  })

  it("names the draft of the last recorded round in which the case passed", () => {
    prepare(project, [recordedRound(1, [[3, "FAIL"]]), recordedRound(2, [[3, "PASS"]]), recordedRound(3, [[3, "PASS"]])], ["legal", "simulation"], [3])
    writeFailingRound(4)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout.split("\n").filter((line) => line.startsWith("Regressed:"))).toEqual(["Regressed: case 3 last passed in draft-3.md"])
  })

  it("prints one line per regressed case, in ascending order of the case numbers, each with its own draft", () => {
    const recorded = [
      recordedRound(1, [
        [3, "PASS"],
        [10, "FAIL"],
      ]),
      recordedRound(2, [
        [3, "FAIL"],
        [10, "PASS"],
      ]),
    ]
    prepare(project, recorded, ["simulation"], [3, 10])
    writeFindings(project, 3, "simulation.md", simulation("CHANGES", [[10, "Result: FAIL at step 4"], [3, "Result: FAIL at step 2"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [
        `Recorded ${processFolder}/rounds/round-3 for draft-3.md`,
        simulationChanges,
        "Regressed: case 3 last passed in draft-1.md",
        "Regressed: case 10 last passed in draft-2.md",
        "rework",
        "",
      ].join("\n"),
    )
  })

  it("does not count a recorded round without cases as a round in which the case passed", () => {
    const before = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "simulation", verdict: "PASS" }] }
    prepare(project, [before], ["legal", "simulation"], [3])
    writeFailingRound(2)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe([`Recorded ${processFolder}/rounds/round-2 for draft-2.md`, legalPass, simulationChanges, "rework", ""].join("\n"))
    expect(rounds(project)[1]?.cases).toEqual([{ case: 3, result: "FAIL" }])
  })
})

describe("process-factory round with a regressed case at the limit of five rounds", () => {
  it("moves a fifth round with a regressed case to rework instead of approval, without a stop", () => {
    const recorded = [recordedRound(1, [[3, "FAIL"]]), recordedRound(2, [[3, "PASS"]]), recordedRound(3, [[3, "FAIL"]]), recordedRound(4, [[3, "FAIL"]])]
    prepare(project, recorded, ["legal", "simulation"], [3])
    writeFailingRound(5)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [`Recorded ${processFolder}/rounds/round-5 for draft-5.md`, legalPass, simulationChanges, "Regressed: case 3 last passed in draft-2.md", "rework", ""].join("\n"),
    )
    expect(result.status).toBe(0)
    expect(entry(project).stage).toBe("rework")
    expect(historyStages(entry(project)).at(-1)).toBe("rework")
    expect(Object.keys(rounds(project)[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases"])
  })

  it("moves a sixth round with a regressed case to rework too, without a stop", () => {
    const recorded = [1, 2, 3, 4, 5].map((round) => recordedRound(round, [[3, round === 1 ? "PASS" : "FAIL"]]))
    prepare(project, recorded, ["legal", "simulation"], [3])
    writeFailingRound(6)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [`Recorded ${processFolder}/rounds/round-6 for draft-6.md`, legalPass, simulationChanges, "Regressed: case 3 last passed in draft-1.md", "rework", ""].join("\n"),
    )
    expect(entry(project).stage).toBe("rework")
    expect(rounds(project)[5]).not.toHaveProperty("stopped")
  })

  it("stops a fifth round in which a case fails that never passed, as before, and stores cases before stopped", () => {
    prepare(
      project,
      [1, 2, 3, 4].map((round) => recordedRound(round, [[3, "FAIL"]])),
      ["legal", "simulation"],
      [3],
    )
    writeFailingRound(5)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [`Recorded ${processFolder}/rounds/round-5 for draft-5.md`, legalPass, simulationChanges, `Stopped: ${limitReason}simulation`, "approval", ""].join("\n"),
    )
    expect(entry(project).stage).toBe("approval")
    expect(Object.keys(rounds(project)[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases", "stopped"])
    expect(rounds(project)[4]?.cases).toEqual([{ case: 3, result: "FAIL" }])
    expect(rounds(project)[4]?.stopped).toBe(`${limitReason}simulation`)
  })
})

describe("process-factory round after a round with a regressed case at the limit", () => {
  /** Records a fifth round in which case 3 regressed, and brings the process back to `review` with `draft-6.md`. */
  function reworkAfterRegression(): void {
    prepare(
      project,
      [1, 2, 3, 4].map((round) => recordedRound(round, [[3, "PASS"]])),
      ["legal", "simulation"],
      [3],
    )
    writeFailingRound(5)
    expect(runCommand(project, ["round", processId]).status).toBe(0)
    expect(entry(project).stage).toBe("rework")
    backToReview(project)
    expect(entry(project).stage).toBe("review")
    writeDrafts(project, [6])
  }

  it("stops the next round as before when every case passes and another reviewer still asks for changes", () => {
    reworkAfterRegression()
    writeFindings(project, 6, "legal.md", findings("legal", "CHANGES", ["medium"]))
    writeFindings(project, 6, "simulation.md", simulation("PASS", [[3, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [
        `Recorded ${processFolder}/rounds/round-6 for draft-6.md`,
        "  legal  CHANGES  0 high, 1 medium, 0 low",
        "  simulation  PASS  0 high, 0 medium, 0 low",
        `Stopped: ${limitReason}legal`,
        "approval",
        "",
      ].join("\n"),
    )
    expect(entry(project).stage).toBe("approval")
  })

  it("moves the next round to approval without a stop when every case and every reviewer passes", () => {
    reworkAfterRegression()
    writeFindings(project, 6, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 6, "simulation.md", simulation("PASS", [[3, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe([`Recorded ${processFolder}/rounds/round-6 for draft-6.md`, legalPass, "  simulation  PASS  0 high, 0 medium, 0 low", "approval", ""].join("\n"))
    expect(entry(project).stage).toBe("approval")
    expect(rounds(project)[5]).not.toHaveProperty("stopped")
  })
})
