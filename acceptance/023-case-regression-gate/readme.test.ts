import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const conflicts = "with the finding that won and why, in `conflicts.md` in the folder of the round."
const results = "When the simulation reviewer is installed, `round` also reads the result of every case from `simulation.md` and keeps it on the board with the round."
const refuses = "It refuses a `simulation.md` that has no result for a case in the folder `cases` of the process, or whose verdict is `PASS` while a case fails, and names the cases."
const regressed =
  "A case that passed in an earlier recorded round and fails in this one has regressed: `round` prints a line such as `Regressed: case 3 last passed in draft-2.md` for it and moves the process to `rework`, also at and past the limit of five rounds, so the loop ends only when no case regresses."

describe("the Status section of README.md", () => {
  it("says after the sentence about conflicts.md that round reads the result of every case and keeps it on the board", () => {
    expect(readmeStatus()).toContain(`${conflicts} ${results}`)
  })

  it("says which simulation.md round refuses", () => {
    expect(readmeStatus()).toContain(`${results} ${refuses}`)
  })

  it("says that a regressed case sends the process to rework, also at and past the limit of five rounds", () => {
    expect(readmeStatus()).toContain(`${refuses} ${regressed}`)
  })
})
