import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, runCommand, writeBoard } from "../006-process-state-machine/store.ts"
import { findings, prepareReview, processId, writeFindings } from "./rounds.ts"

const rounds = [
  {
    round: 1,
    draft: "draft-1.md",
    at: "2026-11-20T16:00:00.000Z",
    verdicts: [
      { reviewer: "legal", verdict: "CHANGES" },
      { reviewer: "readability", verdict: "PASS" },
    ],
  },
  {
    round: 2,
    draft: "draft-2.md",
    at: "2026-11-20T17:00:00.000Z",
    verdicts: [
      { reviewer: "legal", verdict: "PASS" },
      { reviewer: "readability", verdict: "PASS" },
    ],
  },
]
const roundLines = ["Rounds:", "  1  draft-1.md  legal CHANGES, readability PASS", "  2  draft-2.md  legal PASS, readability PASS"]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show <process-id> and the recorded rounds", () => {
  it("prints Rounds: and one line per round between the Spec accepted line and the History line", () => {
    writeBoard(project, [
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "approval",
        history: [{ at: "2026-11-20T17:00:00.000Z", stage: "approval" }],
        specAcceptedAt: "2026-11-19T16:20:45.789Z",
        rounds,
      },
    ])

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe(
      [
        processId,
        "Title: Handle a lost laptop",
        "Stage: approval",
        "Spec accepted: 2026-11-19T16:20:45.789Z",
        ...roundLines,
        "History:",
        "  2026-11-20T17:00:00.000Z  approval",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints Rounds: directly after the Stage line for an entry without specAcceptedAt", () => {
    writeBoard(project, [{ id: processId, title: "Handle a lost laptop", stage: "approval", rounds }])

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe([processId, "Title: Handle a lost laptop", "Stage: approval", ...roundLines, "History:", ""].join("\n"))
    expect(result.status).toBe(0)
  })

  it("prints the round that round recorded, and no line Rounds: for an entry without rounds or with an empty list", () => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", findings("legal", "CHANGES", ["high"]))
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", []))
    expect(runCommand(project, ["show", processId]).stdout).not.toContain("Rounds:")

    runCommand(project, ["round", processId])

    const lines = runCommand(project, ["show", processId]).stdout.split("\n")
    expect(lines.slice(2, 7)).toEqual(["Stage: rework", "Owner: Ola", "Rounds:", "  1  draft-1.md  legal CHANGES, readability PASS", "History:"])
    writeBoard(project, [{ id: processId, title: "Handle a lost laptop", stage: "review", rounds: [] }])
    expect(runCommand(project, ["show", processId]).stdout).toBe(`${processId}\nTitle: Handle a lost laptop\nStage: review\nHistory:\n`)
  })
})
