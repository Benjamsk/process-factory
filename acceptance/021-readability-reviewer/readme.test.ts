import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const readability =
  "The readability reviewer checks that the employee who meets the draft for the first time in a real incident can follow it: one action per step, no term left undefined, no sentence that needs rereading, every decision point with a clear answer, and the first thing to do first."

describe("the Status section of README.md", () => {
  it("says what the readability reviewer checks, before the sentence about every other stage", () => {
    const text = readmeStatus()
    expect(text).toContain(readability)
    expect(text.indexOf("For every other stage")).toBeGreaterThan(text.indexOf(readability))
  })

  it("no longer says that no reviewer is part of the package, and still says what next does without a reviewer", () => {
    const text = readmeStatus()
    // The sentence 3.3 puts where "No reviewer is part of the package yet ..." stood.
    expect(text).toContain(readability)
    expect(text).not.toContain("No reviewer is part of the package yet")
    expect(text).toContain("`next` on a process in `review` says so and moves nothing")
  })
})
