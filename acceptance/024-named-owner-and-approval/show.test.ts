import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand } from "../006-process-state-machine/store.ts"
import { kari, processId, writeProcess } from "./approval.ts"

const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr"
const rounds = [{ round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "gdpr", verdict: "CHANGES" }], stopped: reason }]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show <process-id> and the owner", () => {
  it("prints Owner: directly after the Stage line, before Spec accepted, Stopped, Rounds and History", () => {
    writeProcess(project, "approval", { owner: kari, specAcceptedAt: "2026-11-19T16:20:45.789Z", rounds })

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe(
      [
        processId,
        "Title: Handle a lost laptop",
        "Stage: approval",
        "Owner: Kari Nordmann",
        "Spec accepted: 2026-11-19T16:20:45.789Z",
        `Stopped: ${reason}`,
        "Rounds:",
        "  1  draft-1.md  gdpr CHANGES",
        "History:",
        "  2026-11-20T17:00:00.000Z  approval",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints no Owner line for a process without an owner, the owner that owner stored, and no owner on the board", () => {
    writeProcess(project, "review")
    expect(runCommand(project, ["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )

    expect(runCommand(project, ["owner", processId, kari]).status).toBe(0)

    expect(runCommand(project, ["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nOwner: Kari Nordmann\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )
    expect(runCommand(project, ["show"]).stdout).toBe(`000-older-process  published  Older process\n${processId}  review  Handle a lost laptop\n`)
  })
})
