import { describe, expect, it } from "vitest"
import { readmeStatus } from "./clarify.ts"

describe("the Status section of README.md", () => {
  it("says the prompt is stored and that intake, clarify and spec have a step", () => {
    const text = readmeStatus()
    expect(text).toContain("stores the prompt with it")
    expect(text).toContain("Three stages have a step.")
    expect(text).toContain("a questioner agent reads the request and the organisation context")
    expect(text).toContain("In `clarify` Claude asks the user those questions one at a time")
    expect(text).toContain("For every other stage `next` reports the stage and moves nothing.")
    expect(text).not.toContain("No stage has a step yet")
  })

  it("says init writes the skill, and interviewer.md, questioner.md and spec-writer.md next to it", () => {
    expect(readmeStatus()).toContain(
      "That writes `.claude/skills/process/SKILL.md`, and `interviewer.md`, `questioner.md` and `spec-writer.md` next to it",
    )
  })

  it("describes new with a prompt and the two exceptions to the command line as the only writer of the store", () => {
    const text = readmeStatus()
    expect(text).toContain('`process-factory new "<title>" "<prompt>"`')
    expect(text).toContain("with two exceptions: the questioner writes `questions-<n>.md`, and the spec writer writes `spec.md` and `questions-<n>.md`")
    expect(text).not.toContain("from a one-line request")
  })

  it("describes process-factory answer after move and show", () => {
    const text = readmeStatus()
    expect(text).toContain("`process-factory answer <process-id> <file>` stores a file as `answers-<n>.md`")
    expect(text.indexOf("process-factory answer <process-id> <file>")).toBeGreaterThan(text.indexOf("process-factory show <process-id>"))
  })
})
