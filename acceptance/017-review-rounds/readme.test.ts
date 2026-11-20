import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says seven stages have a step and what happens in review and in rework, between the draft stage and every other stage", () => {
    const text = readmeStatus()
    const review = "In `review` every reviewer that is installed reads the newest draft at the same time"
    const rework = "In `rework` the draft writer reads the reviewed draft and every finding of the round"
    const otherStages = "For every other stage `next` reports the stage and moves nothing."
    expect(text).toContain("Seven stages have a step.")
    expect(text).not.toContain("Five stages have a step.")
    expect(text).toContain(review)
    expect(text).toContain("with a verdict of `PASS` or `CHANGES` and findings tagged `high`, `medium` or `low`")
    expect(text).toContain(rework)
    expect(text).toContain("and the process moves back to `review`.")
    expect(text).toContain(otherStages)
    expect(text.indexOf(review)).toBeGreaterThan(text.indexOf("and the process moves to `review`."))
    expect(text.indexOf(rework)).toBeGreaterThan(text.indexOf(review))
    expect(text.indexOf(otherStages)).toBeGreaterThan(text.indexOf(rework))
  })

  it("no longer says no reviewer is part of the package, and says what next does without an installed reviewer", () => {
    expect(readmeStatus()).not.toContain("No reviewer is part of the package yet")
    expect(readmeStatus()).toContain("`next` on a process in `review` says so and moves nothing.")
  })

  it("says init also writes reviewer.md and one file for every reviewer the package ships", () => {
    expect(readmeStatus()).toContain(
      "`draft-writer.md` next to it, together with `reviewer.md` and one file `<name>-reviewer.md` for every reviewer the package ships",
    )
  })

  it("names the five exceptions to the command line as the only writer of the store, the fifth being the reviewers", () => {
    expect(readmeStatus()).toContain(
      "with five exceptions: the questioner writes `questions-<n>.md`, the spec writer writes `spec.md` and `questions-<n>.md`, the case writer writes the files `case-<n>.md` in `cases`, the draft writer writes `draft-<n>.md` in `drafts`, and every reviewer writes its findings file in a folder `round-<n>` in `rounds`.",
    )
  })

  it("describes process-factory round after the sentence about move from spec to cases", () => {
    const text = readmeStatus()
    const round = "`process-factory round <process-id>` records the newest round of a process in `review` on the board"
    expect(text).toContain(round)
    expect(text.indexOf(round)).toBeGreaterThan(text.indexOf("`move` never moves a process from `spec` to `cases`."))
  })
})
