import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, history, runCommand } from "../006-process-state-machine/store.ts"
import { kari, processId, writeProcess } from "../024-named-owner-and-approval/approval.ts"
import { ownStored, prepareApproved, publish } from "./versions.ts"

const rounds = [{ round: 1, draft: "draft-3.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }, { reviewer: "readability", verdict: "PASS" }] }]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show <process-id> and the versions", () => {
  it("prints Versions: with one line per version, after the rounds and directly before History:", () => {
    writeProcess(project, "published", {
      owner: kari,
      rounds,
      versions: [
        { version: 1, draft: "draft-3.md", approvedBy: "Kari Nordmann", at: "2026-11-21T10:05:00.000Z" },
        { version: 2, draft: "draft-4.md", approvedBy: "Ola Hansen", at: "2026-11-22T09:00:00.000Z" },
      ],
    })

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe(
      [
        processId,
        "Title: Handle a lost laptop",
        "Stage: published",
        "Owner: Kari Nordmann",
        "Rounds:",
        "  1  draft-3.md  legal PASS, readability PASS",
        "Versions:",
        "  1  draft-3.md  Kari Nordmann  2026-11-21T10:05:00.000Z",
        "  2  draft-4.md  Ola Hansen  2026-11-22T09:00:00.000Z",
        "History:",
        "  2026-11-20T17:00:00.000Z  published",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints a version without approvedBy as its number, its draft and its time", () => {
    writeProcess(project, "published", { versions: [{ version: 1, draft: "draft-1.md", at: "2026-11-21T10:05:00.000Z" }] })

    expect(runCommand(project, ["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: published\nVersions:\n  1  draft-1.md  2026-11-21T10:05:00.000Z\nHistory:\n  2026-11-20T17:00:00.000Z  published\n`,
    )
  })

  it("prints the version that a publication stored, no Versions: line before it or for an empty list, and no version on the board", () => {
    prepareApproved(project)
    expect(runCommand(project, ["show", processId]).stdout).not.toContain("Versions:")

    expect(publish(project).status).toBe(0)

    const at = String(history(ownStored(project)).at(-1)?.at)
    const lines = runCommand(project, ["show", processId]).stdout.split("\n")
    const start = lines.indexOf("Versions:")
    expect(start).toBeGreaterThan(-1)
    expect(lines.slice(start, start + 3)).toEqual(["Versions:", `  1  draft-3.md  Kari Nordmann  ${at}`, "History:"])
    expect(runCommand(project, ["show"]).stdout).toBe(`000-older-process  published  Older process\n${processId}  published  Handle a lost laptop\n`)

    writeProcess(project, "published", { versions: [] })
    expect(runCommand(project, ["show", processId]).stdout).toBe(`${processId}\nTitle: Handle a lost laptop\nStage: published\nHistory:\n  2026-11-20T17:00:00.000Z  published\n`)
  })
})
