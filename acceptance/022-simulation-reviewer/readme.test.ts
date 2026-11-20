import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const simulation =
  "The simulation reviewer plays the person in every case of the process with the draft and only what that person knows, and writes per case what they would do, where they would stop, what they would get wrong, and whether the case passes or fails and at which step."

describe("the Status section of README.md", () => {
  it("says what the simulation reviewer does, after the rework stage and before every other stage", () => {
    const text = readmeStatus()
    expect(text).toContain(simulation)
    expect(text.indexOf(simulation)).toBeGreaterThan(text.indexOf("and the process moves back to `review`."))
    expect(text.indexOf("For every other stage `next` reports the stage and moves nothing.")).toBeGreaterThan(text.indexOf(simulation))
  })

  it("no longer says that no reviewer is part of the package, and still says what next does on a process in review without a reviewer", () => {
    const text = readmeStatus()
    expect(text).not.toContain("No reviewer is part of the package yet")
    expect(text).toContain("on a process in `review` says so and moves nothing.")
  })
})
