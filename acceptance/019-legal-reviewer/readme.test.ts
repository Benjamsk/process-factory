import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const legal =
  "The legal reviewer checks the draft against the laws, agreements, policies, deadlines and duties that `spec.md` names and against who may decide what in `organisation/authority.md`, and ends every finding with the rule it comes from."

describe("the Status section of README.md", () => {
  it("says what the legal reviewer checks, after the rework stage and before every other stage", () => {
    const text = readmeStatus()
    expect(text).toContain(legal)
    expect(text.indexOf(legal)).toBeGreaterThan(text.indexOf("and the process moves back to `review`."))
    expect(text.indexOf("For every other stage `next` reports the stage and moves nothing.")).toBeGreaterThan(text.indexOf(legal))
  })
})
