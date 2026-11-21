import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand, writeBoard } from "../006-process-state-machine/store.ts"
import { findings, installReviewers, processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"

const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr, readability"
const verdicts = [
  { reviewer: "gdpr", verdict: "CHANGES" },
  { reviewer: "readability", verdict: "CHANGES" },
]
const open = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts }
const stopped = { round: 2, draft: "draft-2.md", at: "2026-11-20T17:00:00.000Z", verdicts, stopped: reason }
const roundLines = ["Rounds:", "  1  draft-1.md  gdpr CHANGES, readability CHANGES", "  2  draft-2.md  gdpr CHANGES, readability CHANGES"]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show <process-id> and a stopped round", () => {
  it("prints Stopped: with the reason between the Spec accepted line and the line Rounds: when the newest round stopped", () => {
    writeBoard(project, [
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "approval",
        history: [{ at: "2026-11-20T17:00:00.000Z", stage: "approval" }],
        specAcceptedAt: "2026-11-19T16:20:45.789Z",
        rounds: [open, stopped],
      },
    ])

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe(
      [
        processId,
        "Title: Handle a lost laptop",
        "Stage: approval",
        "Spec accepted: 2026-11-19T16:20:45.789Z",
        `Stopped: ${reason}`,
        ...roundLines,
        "History:",
        "  2026-11-20T17:00:00.000Z  approval",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints Stopped: directly after the Stage line for an entry without specAcceptedAt, and no such line when only an earlier round stopped", () => {
    writeBoard(project, [{ id: processId, title: "Handle a lost laptop", stage: "approval", rounds: [open, stopped] }])

    expect(runCommand(project, ["show", processId]).stdout).toBe(
      [processId, "Title: Handle a lost laptop", "Stage: approval", `Stopped: ${reason}`, ...roundLines, "History:", ""].join("\n"),
    )

    const later = { round: 3, draft: "draft-3.md", at: "2026-11-20T18:00:00.000Z", verdicts: [{ reviewer: "gdpr", verdict: "PASS" }] }
    writeBoard(project, [{ id: processId, title: "Handle a lost laptop", stage: "approval", rounds: [open, stopped, later] }])

    expect(runCommand(project, ["show", processId]).stdout).toBe(
      [processId, "Title: Handle a lost laptop", "Stage: approval", ...roundLines, "  3  draft-3.md  gdpr PASS", "History:", ""].join("\n"),
    )
  })

  it("prints the reason that round recorded, and keeps the newest round as the last line under Rounds:", () => {
    const earlier = [1, 2, 3, 4].map((round) => ({ ...open, round, draft: `draft-${String(round)}.md` }))
    writeProcess(project, "review", { rounds: earlier })
    installReviewers(project, ["gdpr", "readability"])
    writeDrafts(project, [5])
    writeFindings(project, 5, "gdpr.md", findings("gdpr", "CHANGES", ["high"]))
    writeFindings(project, 5, "readability.md", findings("readability", "CHANGES", ["medium"]))
    expect(runCommand(project, ["round", processId]).stdout).toContain(`Recorded ${processFolder}/rounds/round-5 for draft-5.md`)

    const lines = runCommand(project, ["show", processId]).stdout.split("\n")

    expect(lines.slice(2, 5)).toEqual(["Stage: approval", `Stopped: ${reason}`, "Rounds:"])
    expect(lines[lines.indexOf("History:") - 1]).toBe("  5  draft-5.md  gdpr CHANGES, readability CHANGES")
  })
})
