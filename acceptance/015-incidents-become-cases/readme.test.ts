import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

describe("the Status section of README.md", () => {
  it("says what /process incident does, after the sentence about every other stage, and says eight stages have a step", () => {
    const text = readmeStatus()
    const incident =
      "`/process incident <process-id>` interviews the user about a real event the process was used in, what the process did not cover and what people actually did"
    const otherStages = "For every other stage `next` reports the stage and moves nothing."
    expect(text).toContain(incident)
    expect(text).toContain(
      "writes each thing it did not cover as a new file `case-<n>.md` in the folder `cases` of the process after the user confirms it",
    )
    expect(text).toContain("as a case every later version of the process must pass.")
    expect(text).toContain(otherStages)
    expect(text.indexOf(incident)).toBeGreaterThan(text.indexOf(otherStages))
    expect(text).toContain("Eight stages have a step.")
  })

  it("says init writes the skill, and interviewer.md, questioner.md, spec-writer.md, case-writer.md, draft-writer.md and incident.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md`, `spec-writer.md`, `case-writer.md`, `draft-writer.md` and `incident.md` next to it, together with `reviewer.md` and one file `<name>-reviewer.md` for every reviewer the package ships",
    )
  })

  it("names the six exceptions to the command line as the only writer of the store, the sixth being the interview of /process incident", () => {
    const text = readmeStatus()
    expect(text).toContain(
      "with six exceptions: the questioner writes `questions-<n>.md`, the spec writer writes `spec.md` and `questions-<n>.md`, the case writer writes the files `case-<n>.md` in `cases`, the draft writer writes `draft-<n>.md` in `drafts`, every reviewer writes its findings file in a folder `round-<n>` in `rounds`, and the interview of `/process incident` writes new files `case-<n>.md` in `cases`.",
    )
    expect(text).not.toContain("with five exceptions")
  })
})
