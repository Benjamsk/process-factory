import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const gdprSentence =
  "The GDPR reviewer checks a draft for a lawful basis, data minimisation, the rights of the people the data is about, the notification of a breach to the authority and to those people in time, a processor agreement for every system the process uses, and what must be logged."

describe("the Status section of README.md", () => {
  it("says what the GDPR reviewer checks, before the sentence about the stage published", () => {
    const text = readmeStatus()
    expect(text).toContain(gdprSentence)
    expect(text.indexOf("In `published` Claude starts a regeneration")).toBeGreaterThan(text.indexOf(gdprSentence))
  })

  it("no longer says that no reviewer is part of the package, and still says what next does without a reviewer", () => {
    const text = readmeStatus()
    expect(text).not.toContain("No reviewer is part of the package yet")
    expect(text).toContain("`next` on a process in `review` says so and moves nothing.")
  })
})
