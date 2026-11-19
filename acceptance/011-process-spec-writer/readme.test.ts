import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says three stages have a step and what the spec writer does in spec", () => {
    const text = readmeStatus()
    expect(text).toContain("Three stages have a step.")
    expect(text).toContain(
      "In `spec` a spec writer agent writes `spec.md` in the folder of the process, with ten sections that are each marked decided or open.",
    )
    expect(text).toContain("moves the process to `cases` after the user accepts it")
    expect(text).toContain("For every other stage `next` reports the stage and moves nothing.")
    expect(text).not.toContain("Two stages have a step.")
  })

  it("says init writes the skill, and interviewer.md, questioner.md and spec-writer.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md` and `spec-writer.md` next to it",
    )
  })

  it("names the two exceptions to the command line as the only writer of the store", () => {
    expect(readmeStatus()).toContain(
      "with two exceptions: the questioner writes `questions-<n>.md`, and the spec writer writes `spec.md` and `questions-<n>.md`",
    )
  })
})
