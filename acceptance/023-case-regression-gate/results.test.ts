import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand } from "../006-process-state-machine/store.ts"
import { findings, installReviewers, processFolder, processId, refusal, writeDrafts, writeFindings } from "../017-review-rounds/rounds.ts"
import { backToReview, entry, prepare, recordedRound, rounds, simulation } from "./gate.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory round with the simulation reviewer: the results of the cases on the board", () => {
  it("records a round in which every stored case has Result: PASS and stores the result of every case under cases", () => {
    prepare(project, [], ["simulation"], [1, 2])
    writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"], [2, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  simulation  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(result.status).toBe(0)
    expect(rounds(project)[0]?.cases).toEqual([
      { case: 1, result: "PASS" },
      { case: 2, result: "PASS" },
    ])
  })

  it("stores cases after verdicts, a line Result: FAIL at <step> as FAIL, and the cases in ascending order of their numbers", () => {
    prepare(project, [], ["simulation"], [2, 10])
    writeFindings(project, 1, "simulation.md", simulation("CHANGES", [[10, "Result: FAIL at step 2"], [2, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entry(project).stage).toBe("rework")
    expect(Object.keys(rounds(project)[0] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases"])
    expect(rounds(project)[0]?.cases).toEqual([
      { case: 2, result: "PASS" },
      { case: 10, result: "FAIL" },
    ])
  })

  it("ignores the section of a case that has no file in cases: it is not stored and causes no refusal", () => {
    prepare(project, [], ["simulation"], [1])
    writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"], [9, "Result: FAIL at step 4"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(rounds(project)[0]?.cases).toEqual([{ case: 1, result: "PASS" }])
  })

  it("records a simulation.md without a case section for a process without cases, with an empty list under cases", () => {
    prepare(project, [], ["simulation"], [])
    writeFindings(project, 1, "simulation.md", findings("simulation", "PASS", []))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  simulation  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(result.status).toBe(0)
    expect(rounds(project)[0]?.cases).toEqual([])
  })

  it("stores no cases and prints no Regressed: line without the simulation reviewer, and stores cases once it is installed", () => {
    prepare(project, [recordedRound(1, [[3, "PASS"]])], ["legal"], [3])
    writeFindings(project, 2, "legal.md", findings("legal", "PASS", []))

    const without = runCommand(project, ["round", processId])

    expect(without.stderr).toBe("")
    expect(without.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-2.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(Object.keys(rounds(project)[1] ?? {})).toEqual(["round", "draft", "at", "verdicts"])

    installReviewers(project, ["legal", "simulation"])
    backToReview(project)
    writeDrafts(project, [3])
    writeFindings(project, 3, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 3, "simulation.md", simulation("PASS", [[3, "Result: PASS"]]))

    const withReviewer = runCommand(project, ["round", processId])

    expect(withReviewer.stderr).toBe("")
    expect(withReviewer.status).toBe(0)
    expect(rounds(project)[2]?.cases).toEqual([{ case: 3, result: "PASS" }])
  })
})

describe("process-factory round with the simulation reviewer: a simulation.md it refuses", () => {
  it("refuses a simulation.md without a result for the stored cases 2 and 5, names them and leaves the process in review", () => {
    prepare(project, [], ["legal", "simulation"], [1, 2, 5])
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe(refusal(1, [["simulation.md", "has no Result: line for case 2, case 5"]]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entry(project).stage).toBe("review")
    expect(entry(project).rounds).toBeUndefined()
  })

  it("lists simulation.md with its reason after the refused file of another reviewer, in the order of the reviewers", () => {
    prepare(project, [], ["legal", "simulation"], [1, 2])
    writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe(
      refusal(1, [
        ["legal.md", "is missing"],
        ["simulation.md", "has no Result: line for case 2"],
      ]),
    )
    expect(result.status).toBe(1)
  })

  it.each(["Result: FAIL", "Result: passed", "Result: FAIL at", null])(
    "gives a case no result for a section with the line %s and refuses the round with that case named",
    (line) => {
      prepare(project, [], ["simulation"], [1, 2])
      writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"], [2, line]]))

      const result = runCommand(project, ["round", processId])

      expect(result.stderr).toBe(refusal(1, [["simulation.md", "has no Result: line for case 2"]]))
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(entry(project).stage).toBe("review")
    },
  )

  it("refuses a simulation.md with the verdict PASS in which a stored case has the result FAIL, and names the case", () => {
    prepare(project, [], ["simulation"], [1, 3])
    writeFindings(project, 1, "simulation.md", simulation("PASS", [[1, "Result: PASS"], [3, "Result: FAIL at step 2"]]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe(refusal(1, [["simulation.md", "the verdict is PASS but these cases have the result FAIL: case 3"]]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entry(project).stage).toBe("review")
    expect(entry(project).rounds).toBeUndefined()
  })
})
