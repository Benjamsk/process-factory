import { describe, expect, it } from "vitest"
import { readFile, readmeStatus, root } from "../010-clarifying-questions/clarify.ts"

const approvalEnd = "and Claude then publishes the approved draft as a numbered version, which moves the process to `published`."
const regenerationStages =
  "In `published` Claude starts a regeneration when the process has open reader feedback, a case that is newer than its published version or a changed dependency, and in `regenerate` the draft writer writes the published document again with only the changes those reasons ask for, together with a change list, and the process moves to `review`."
const incidentStart = "`/process incident <process-id>` interviews the user about a real event the process was used in"
const feedbackEnd = "lists each open feedback with its version, its step, its kind and its text."
const sentences = [
  "A published process changes only through a regeneration.",
  "`move <process-id> regenerate` refuses a published process that has no open feedback, no case that is missing from its newest version and no changed dependency; otherwise it writes those reasons to `regeneration-<v>.md` in the folder of the process, with `<v>` the newest version, and records the regeneration on the board.",
  "The draft writer then writes the next `draft-<n>.md` as the document of that version with only the changes the reasons ask for, and `changes-<n>.md` next to it: a change list with one entry per change that names the section of the document, what changed and the reason behind it, and that names every reason that changed nothing and why.",
  "While a process is being regenerated, `move <process-id> review`, `approve` and `move <process-id> published` refuse a newest draft whose change list is missing or malformed, names a reason that is not in `regeneration-<v>.md` or leaves one of its reasons out, the limit of five rounds counts only the rounds of the regeneration, and `respec` is refused, because the specification stays as it was published.",
  "In `approval` the owner is shown the change list instead of the whole draft, and the one approval covers both.",
  "The publication copies the change list into the version folder as `changes.md` and closes every feedback the list names as the reason for a change, with the status `closed` and the version that answered it, while feedback the list names as not changed stays open; from `regenerate`, `move <process-id> published` ends a regeneration in which no reason led to a change, without a new version.",
]

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const text = readFile(root, "README.md").replace(/\r\n/g, "\n")
  const status = text.slice(text.indexOf("\n## Status\n") + "\n## Status\n".length)
  return status
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("says ten stages have a step, and no longer eight", () => {
    expect(readmeStatus()).toContain("Ten stages have a step.")
    expect(readmeStatus()).not.toContain("Eight stages have a step.")
  })

  it("says what happens in published and in regenerate, between the sentence about approval and the sentence about /process incident", () => {
    expect(readmeStatus()).toContain(`${approvalEnd} ${regenerationStages} ${incidentStart}`)
    expect(readmeStatus()).not.toContain("For every other stage `next` reports the stage and moves nothing.")
  })

  it("ends its fourth paragraph with the sentences about a regeneration, directly after the sentence about the open feedback", () => {
    const fourth = statusParagraphs().find((paragraph) => paragraph.startsWith("Every process is in one of the stages")) ?? ""
    expect(fourth.endsWith(`${feedbackEnd} ${sentences.join(" ")}`)).toBe(true)
  })
})
