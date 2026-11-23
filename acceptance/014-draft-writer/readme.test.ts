import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says ten stages have a step and what the draft writer does in draft, between the cases stage and the stage published", () => {
    const text = readmeStatus()
    const draft =
      "In `draft` a draft writer agent writes the process document from `spec.md`, the organisation context and the cases to a new file `draft-<n>.md` in the folder `drafts` of the process"
    const otherStages = "In `published` Claude starts a regeneration"
    expect(text).toContain("Ten stages have a step.")
    expect(text).not.toContain("Four stages have a step.")
    expect(text).toContain(draft)
    expect(text).toContain("with the name of a person at every role and every step")
    expect(text).toContain("and the process moves to `review`.")
    expect(text).toContain(otherStages)
    expect(text.indexOf(draft)).toBeGreaterThan(text.indexOf("and the process moves to `draft`."))
    expect(text.indexOf(otherStages)).toBeGreaterThan(text.indexOf(draft))
  })

  it("says init writes the skill, and interviewer.md, questioner.md, spec-writer.md, case-writer.md, draft-writer.md and incident.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md`, `spec-writer.md`, `case-writer.md`, `draft-writer.md` and `incident.md` next to it",
    )
  })

  it("names the six exceptions to the command line as the only writer of the store, the fourth being the draft writer", () => {
    expect(readmeStatus()).toContain(
      "with six exceptions: the questioner writes `questions-<n>.md`, the spec writer writes `spec.md` and `questions-<n>.md`, the case writer writes the files `case-<n>.md` in `cases`, the draft writer writes `draft-<n>.md` in `drafts`, every reviewer writes its findings file in a folder `round-<n>` in `rounds`, and the interview of `/process incident` writes new files `case-<n>.md` in `cases`.",
    )
  })
})
