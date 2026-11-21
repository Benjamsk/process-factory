import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const recordedRounds = "`process-factory show <process-id>` then prints the recorded rounds."
const limit =
  "A process gets at most five review rounds before a person decides: when the fifth recorded round of a process, or a later one, still has a verdict of `CHANGES`, `round` moves the process to `approval` instead of `rework`, records on the board that the loop stopped at the limit and which reviewers still ask for changes, and prints that reason, and `show <process-id>` prints it too."
const back = "From `approval`, `move <process-id> rework` sends the draft back for one more round."
const order =
  "In a rework the finding of a higher reviewer wins over a finding it contradicts, in the order legal, GDPR, simulation, readability, and the draft writer records every finding it dropped for that reason, with the finding that won and why, in `conflicts.md` in the folder of the round."

describe("the Status section of README.md", () => {
  it("says after the sentence about the recorded rounds that a process stops at five rounds and moves to approval with the reason", () => {
    expect(readmeStatus()).toContain(`${recordedRounds} ${limit}`)
  })

  it("says that move sends a stopped draft back for one more round", () => {
    expect(readmeStatus()).toContain(`${limit} ${back}`)
  })

  it("names the order of the reviewers and conflicts.md, and keeps the sentence about round as it was", () => {
    const text = readmeStatus()
    expect(text).toContain(`${back} ${order}`)
    expect(text).toContain("and moves the process to `rework` when a verdict is `CHANGES` and to `approval` when all are `PASS`.")
  })
})
