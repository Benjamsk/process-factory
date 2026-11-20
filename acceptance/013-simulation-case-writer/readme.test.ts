import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says five stages have a step and what the case writer does in cases, between the spec stage and every other stage", () => {
    const text = readmeStatus()
    const cases =
      "In `cases` a case writer agent writes simulation cases from `spec.md` alone, never from a draft, one file `case-<n>.md` per case in the folder `cases` of the process"
    expect(text).toContain("Five stages have a step.")
    expect(text).not.toContain("Three stages have a step.")
    expect(text).toContain(cases)
    expect(text).toContain("and the process moves to `draft`.")
    expect(text).toContain("For every other stage `next` reports the stage and moves nothing.")
    expect(text.indexOf(cases)).toBeGreaterThan(text.indexOf("moves the process to `cases` after the user accepts it"))
    expect(text.indexOf("For every other stage `next` reports the stage and moves nothing.")).toBeGreaterThan(text.indexOf(cases))
  })

  it("says init writes the skill, and interviewer.md, questioner.md, spec-writer.md, case-writer.md and draft-writer.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md`, `spec-writer.md`, `case-writer.md` and `draft-writer.md` next to it",
    )
  })

  it("names the four exceptions to the command line as the only writer of the store, the third being the case writer", () => {
    expect(readmeStatus()).toContain(
      "with four exceptions: the questioner writes `questions-<n>.md`, the spec writer writes `spec.md` and `questions-<n>.md`, the case writer writes the files `case-<n>.md` in `cases`, and the draft writer writes `draft-<n>.md` in `drafts`.",
    )
  })
})
