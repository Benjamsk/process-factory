import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const withoutReviewer = "Without a reviewer `next` on a process in `review` says so and moves nothing."
const approval =
  "In `approval` Claude asks who the owner of the process is when it has none, shows the newest draft, the verdict of every reviewer and the reason of a stop, and asks the user for their full name and whether they approve; the command line records the approval only when that name is the owner of the process, and Claude then publishes the approved draft as a numbered version, which moves the process to `published`."
const otherStages = "For every other stage `next` reports the stage and moves nothing."
const refusedUntil = "The process stays in `approval`, and `move <process-id> published` is refused until the newest draft has such a file."
const publishes =
  "With that file, `move <process-id> published` publishes the newest draft as a numbered version: it creates the folder `versions/<n>` of the process, with `<n>` one more than the highest version so far, and copies into it the approved draft as `process.md`, `spec.md`, the files `case-<k>.md` as they are at that moment in a folder `cases`, and the approval as `approval.md`, and it lists the version on the board with its draft, who approved it and when."
const show = "`process-factory show <process-id>` prints the versions."
const never =
  "The command line never writes into a version folder that exists: every publication gets the next number, also a second publication of the same draft, so every earlier version stays readable as it was published."

describe("the Status section of README.md", () => {
  it("says that Claude publishes the approved draft as a numbered version in approval, and no longer that the process stays there", () => {
    const text = readmeStatus()
    expect(text).toContain(`${withoutReviewer} ${approval} ${otherStages}`)
    expect(text).not.toContain("is the owner of the process, and the process stays in `approval`.")
  })

  it("says what move <process-id> published writes, directly after the sentence about the refused move", () => {
    expect(readmeStatus()).toContain(`${refusedUntil} ${publishes}`)
  })

  it("says that show prints the versions and that the command line never writes into a version folder that exists", () => {
    expect(readmeStatus()).toContain(`${publishes} ${show} ${never}`)
  })
})
