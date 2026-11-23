import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const simulation =
  "The simulation reviewer plays the person in every case of the process with the draft and only what that person knows, and writes per case what they would do, where they would stop, what they would get wrong, and whether the case passes or fails and at which step."

describe("the Status section of README.md", () => {
  it("says what the simulation reviewer does, after the rework stage and before the stage published, and no longer says that no reviewer is part of the package",() => {
    const text = readmeStatus()
    expect(text).toContain(simulation)
    expect(text.indexOf(simulation)).toBeGreaterThan(text.indexOf("and the process moves back to `review`."))
    expect(text.indexOf("In `published` Claude starts a regeneration")).toBeGreaterThan(text.indexOf(simulation))
    expect(text).not.toContain("No reviewer is part of the package yet")
    expect(text).toContain("on a process in `review` says so and moves nothing.")
  })
})
