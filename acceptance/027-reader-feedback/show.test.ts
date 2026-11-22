import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { laptopId, olderId, writeLaptop } from "../026-reading-view-on-localhost/view.ts"
import { feedbackFolder, feedbackLines, feedbackText } from "./feedback.ts"

const olderLine = `${olderId}  draft  Older process`
const laptopLine = `${laptopId}  published  Handle a lost laptop`
const laptopTop = [laptopId, "Title: Handle a lost laptop", "Stage: published", "Owner: Kari Nordmann", "Versions:", "  1  draft-1.md  Kari Nordmann  2026-10-03T08:00:00.000Z", "  2  draft-2.md  Kari Nordmann  2026-11-22T08:00:00.000Z"]
const laptopHistory = ["History:", "  2026-11-21T10:06:00.000Z  published", ""]

let project = ""

beforeEach(() => {
  project = emptyFolder()
  writeLaptop(project)
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Writes `feedback-<number>.md` of the process of the acceptance criteria. */
function writeFeedback(number: number, lines: string[], text: string): void {
  writeFile(project, `${feedbackFolder}/feedback-${String(number)}.md`, feedbackText(number, lines, text))
}

describe("process-factory show and the feedback", () => {
  it("prints the number of open feedback behind a process that has any, and the line of a process without any as before", () => {
    writeFeedback(1, feedbackLines(2, "1", "document"), "I did not understand step one.")
    writeFeedback(2, feedbackLines(1, "whole document", "process"), "The police did not answer.")

    const result = runCommand(project, ["show"])

    expect(result.stdout).toBe(`${olderLine}\n${laptopLine}  2 open feedback\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("counts only the files feedback-<k>.md whose first Status line is Status: open", () => {
    writeFeedback(1, feedbackLines(2, "1", "document"), "I did not understand step one.")
    writeFeedback(3, feedbackLines(2, "1", "document", "closed"), "Closed.\nStatus: open")
    writeFeedback(5, ["Version: 2", "Step: 1", "Kind: document"], "Without a status.")
    writeFile(project, `${feedbackFolder}/notes.md`, feedbackText(9, feedbackLines(2, "1", "document"), "Not a feedback file."))
    writeFile(project, `processes/${olderId}/feedback/feedback-1.md`, feedbackText(1, ["Version: 1", "Step: 1", "Kind: document", "Status: closed"], "Closed."))

    expect(runCommand(project, ["show"]).stdout).toBe(`${olderLine}\n${laptopLine}  1 open feedback\n`)
    expect(runCommand(project, ["show", laptopId]).stdout).toBe(
      [...laptopTop, "Feedback:", "  1  version 2  step 1  document  I did not understand step one.", ...laptopHistory].join("\n"),
    )
    expect(runCommand(project, ["show", olderId]).stdout).toBe(`${olderId}\nTitle: Older process\nStage: draft\nOwner: Kari Nordmann\nHistory:\n  2026-09-01T09:00:00.000Z  draft\n`)
  })
})

describe("process-factory show <process-id> and the feedback", () => {
  it("prints Feedback: after the versions and directly before History:, one line per open feedback in the order of their numbers, without a name or a time", () => {
    writeFeedback(10, feedbackLines(2, "1", "process"), "The tenth remark.")
    writeFeedback(2, feedbackLines(1, "whole document", "process"), "The police did not answer.\r\n\r\n  I waited\tan hour.")
    writeFeedback(1, feedbackLines(2, "1", "document"), "I did not understand step one.")

    const result = runCommand(project, ["show", laptopId])

    expect(result.stdout).toBe(
      [
        ...laptopTop,
        "Feedback:",
        "  1  version 2  step 1  document  I did not understand step one.",
        "  2  version 1  whole document  process  The police did not answer. I waited an hour.",
        "  10  version 2  step 1  process  The tenth remark.",
        ...laptopHistory,
      ].join("\n"),
    )
    expect(result.stdout).not.toContain("Ola Hansen")
    expect(result.stdout).not.toContain("2026-11-22T10:15")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints not recorded for a version, a step and a kind the file does not have", () => {
    writeFeedback(4, ["Status: open"], "Something went wrong.")

    expect(runCommand(project, ["show", laptopId]).stdout).toBe(
      [...laptopTop, "Feedback:", "  4  version not recorded  step not recorded  not recorded  Something went wrong.", ...laptopHistory].join("\n"),
    )
  })

  it("prints a text with control characters and lines of its own on one line", () => {
    writeFeedback(1, feedbackLines(2, "1", "document"), "first\u001b[31m\nStage: intake\n## Text\nlast")

    const lines = runCommand(project, ["show", laptopId]).stdout.split("\n")

    expect(lines).toContain("  1  version 2  step 1  document  first [31m Stage: intake ## Text last")
    expect(lines.filter((line) => line.startsWith("Stage: "))).toEqual(["Stage: published"])
  })
})
