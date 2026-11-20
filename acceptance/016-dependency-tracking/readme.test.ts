import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says the specification has eleven sections and that accept-spec refuses while one of the eleven is not decided", () => {
    const text = readmeStatus()
    expect(text).toContain("with eleven sections that are each marked decided or open")
    expect(text).toContain("It refuses while one of the eleven sections is not marked decided")
  })

  it("says what the section Dependencies lists, after the sentence about move from spec to cases", () => {
    const text = readmeStatus()
    const sentence = "The eleventh section, `Dependencies`, lists what the process rests on: laws and rules, roles, systems, agreements, policies and other processes."
    expect(text).toContain(sentence)
    expect(text.indexOf(sentence)).toBeGreaterThan(text.indexOf("`move` never moves a process from `spec` to `cases`."))
  })

  it("says a move to published records the dependencies and what check lists, and still says no process can be generated yet", () => {
    const text = readmeStatus()
    expect(text).toContain("A move to `published` records on the board how the sections of `organisation/` describe the roles, systems, agreements and policies on that list.")
    expect(text).toContain(
      "`process-factory check` lists every published process of which such a section has changed or is gone since then, and which one, as work waiting for the owner.",
    )
    expect(text).toContain("It cannot generate processes yet.")
  })
})
