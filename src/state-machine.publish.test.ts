import { readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  boardPath,
  isRecord,
  readWorkingFile,
  runCommand,
  storedHistory,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory owner and process-factory approve", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const rolesText =
    "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n\n## Example: Head of IT\n\nPer Olsen is the head of IT.\n"
  const approvalFile = `processes/${processId}/versions/approval-draft-2.md`

  /** Writes `organisation/roles.md` and a board with the process in `stage`, with further keys in `more`. */
  function writeProcess(stage: string, more: Record<string, unknown> = {}): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage, history: [{ at: "2026-11-20T17:00:00.000Z", stage }], ...more }])
  }

  function writeDrafts(): void {
    for (const number of [1, 2]) writeWorkingFile(`processes/${processId}/drafts/draft-${String(number)}.md`, `# Draft ${String(number)}\n`)
  }

  it("prints Owner: with the name it stored on the entry, and changes nothing else", () => {
    writeProcess("intake")

    const result = runCommand(["owner", processId, `  ${owner}  `])

    expect(result.stdout).toBe("Owner: Kari Nordmann\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]).toEqual({
      id: processId,
      title: "Handle a lost laptop",
      stage: "intake",
      history: [{ at: "2026-11-20T17:00:00.000Z", stage: "intake" }],
      owner,
    })
  })

  it.each([
    ["only stands in an example section", "Per Olsen"],
    ["ends in the middle of a word", "Kari Nord"],
    ["has other capitals", "kari nordmann"],
  ])("refuses an owner that %s and leaves the board as it was", (_name, person) => {
    writeProcess("approval")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["owner", processId, person])

    expect(result.stderr).toBe(`process-factory: cannot set the owner of ${processId}: ${person} is not named in organisation/roles.md\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("says the owner must be one line with at least one letter for a name with a line break", () => {
    writeProcess("approval")

    const result = runCommand(["owner", processId, "Kari\nNordmann"])

    expect(result.stderr).toBe("process-factory: the owner must be one line with at least one letter\n")
    expect(result.status).toBe(1)
  })

  it("prints the line Owner: of show directly after the stage, and no such line without an owner", () => {
    writeProcess("review")
    expect(runCommand(["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )

    expect(runCommand(["owner", processId, owner]).status).toBe(0)

    expect(runCommand(["show", processId]).stdout).toBe(
      `${processId}\nTitle: Handle a lost laptop\nStage: review\nOwner: Kari Nordmann\nHistory:\n  2026-11-20T17:00:00.000Z  review\n`,
    )
  })

  it("writes who approved the newest draft and when, and leaves the board as it was", () => {
    writeProcess("approval", { owner })
    writeDrafts()
    const before = readWorkingFile(boardPath)

    const result = runCommand(["approve", processId, "--by", `  ${owner}  `])

    expect(result.stdout).toBe(`Stored ${approvalFile}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const lines = readWorkingFile(approvalFile).split("\n")
    expect(lines.slice(0, 5)).toEqual(["# Approval of draft-2.md", "", `Process: ${processId}`, "Draft: draft-2.md", `Approved by: ${owner}`])
    expect(lines[5]?.replace("Approved at: ", "")).toMatch(timeForm)
    expect(lines.slice(6)).toEqual([""])
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    {
      name: "a process that is not in approval",
      prepare: () => {
        writeProcess("review", { owner })
        writeDrafts()
      },
      by: owner,
      reason: "it is in the stage review, not in approval",
    },
    {
      name: "a process without an owner",
      prepare: () => {
        writeProcess("approval")
        writeDrafts()
      },
      by: owner,
      reason: `it has no owner: owner ${processId} "<person>" names one`,
    },
    {
      name: "a name that is not the owner",
      prepare: () => {
        writeProcess("approval", { owner })
        writeDrafts()
      },
      by: "Ola Hansen",
      reason: "--by does not name its owner",
    },
    {
      name: "an owner who is not named in organisation/roles.md",
      prepare: () => {
        writeProcess("approval", { owner: "Nina Berg" })
        writeDrafts()
      },
      by: "Nina Berg",
      reason: "its owner Nina Berg is not named in organisation/roles.md",
    },
    {
      name: "a process without a draft",
      prepare: () => {
        writeProcess("approval", { owner })
      },
      by: owner,
      reason: `there is no draft in processes/${processId}/drafts`,
    },
    {
      name: "a draft that is already approved",
      prepare: () => {
        writeProcess("approval", { owner })
        writeDrafts()
        runCommand(["approve", processId, "--by", owner])
      },
      by: owner,
      reason: "draft-2.md is already approved",
    },
  ])("refuses to approve $name", ({ prepare, by, reason }) => {
    prepare()
    const before = readWorkingFile(boardPath)

    const result = runCommand(["approve", processId, "--by", by])

    expect(result.stderr).toBe(`process-factory: cannot approve ${processId}: ${reason}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("refuses a move to published until the newest draft has its approval file", () => {
    writeProcess("approval", { owner })
    writeDrafts()
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", processId, "published"])

    expect(refused.stderr).toBe(
      `process-factory: cannot move ${processId} from approval to published: the newest draft has no approval: only approve ${processId} --by "<person>" records one\n`,
    )
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)

    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("published")
  })

  it("moves a process from approval to rework without an approval", () => {
    writeProcess("approval", { owner })
    writeDrafts()

    expect(runCommand(["move", processId, "rework"]).stdout).toBe("rework\n")
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })
})

describe("the version that process-factory move to published writes", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const processFolder = `processes/${processId}`
  const draftText = "# Handle a lost laptop\n\nDraft 2.\n"
  const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n"

  /** Writes a board with the process in approval, the drafts 1 and 2 and the approval of `draft-2.md`, with further keys of the entry in `more`. */
  function prepareApproval(more: Record<string, unknown> = {}): void {
    writeBoardFile([
      { id: processId, title: "Handle a lost laptop", stage: "approval", history: [{ at: "2026-11-20T17:00:00.000Z", stage: "approval" }], owner, ...more },
    ])
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, "# Handle a lost laptop\n\nDraft 1.\n")
    writeWorkingFile(`${processFolder}/drafts/draft-2.md`, draftText)
    writeWorkingFile(`${processFolder}/versions/approval-draft-2.md`, `# Approval of draft-2.md\n\nApproved by: ${owner}\nApproved at: 2026-11-21T10:00:00.000Z\n`)
  }

  function writeSpecAndCases(): void {
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The laptop is stolen\n")
  }

  function publish() {
    return runCommand(["move", processId, "published"])
  }

  /** The names in a folder of the working directory, sorted. */
  function names(folder: string): string[] {
    return readdirSync(path.join(workingDirectory, folder)).sort()
  }

  /** The list under `versions` of the entry of the process, or an empty list when it has none. */
  function storedVersions(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.versions
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("copies the newest draft, the spec, the cases and the approval into versions/1 and leaves the originals where they were", () => {
    prepareApproval()
    writeSpecAndCases()
    writeWorkingFile(`${processFolder}/cases/notes.md`, "Notes.\n")
    const approval = readWorkingFile(`${processFolder}/versions/approval-draft-2.md`)

    const result = publish()

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(names(`${processFolder}/versions/1`)).toEqual(["approval.md", "cases", "process.md", "spec.md"])
    expect(names(`${processFolder}/versions/1/cases`)).toEqual(["case-1.md", "case-2.md"])
    expect(readWorkingFile(`${processFolder}/versions/1/process.md`)).toBe(draftText)
    expect(readWorkingFile(`${processFolder}/versions/1/spec.md`)).toBe(specText)
    expect(readWorkingFile(`${processFolder}/versions/1/cases/case-1.md`)).toBe("# Case 1: The laptop is lost on a train\n")
    expect(readWorkingFile(`${processFolder}/versions/1/approval.md`)).toBe(approval)
    expect(names(`${processFolder}/drafts`)).toEqual(["draft-1.md", "draft-2.md"])
    expect(readWorkingFile(`${processFolder}/spec.md`)).toBe(specText)
    expect(readWorkingFile(`${processFolder}/versions/approval-draft-2.md`)).toBe(approval)
  })

  it("writes a version with an empty folder cases and no spec.md for a process that has neither", () => {
    prepareApproval()

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/1`)).toEqual(["approval.md", "cases", "process.md"])
    expect(names(`${processFolder}/versions/1/cases`)).toEqual([])
  })

  it("writes versions/2 for a second publication with the spec as it is then and leaves versions/1 as it was", () => {
    prepareApproval()
    writeSpecAndCases()
    expect(publish().status).toBe(0)
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, "# Feedback 1\n\nStatus: open\n\n## Text\n\nStep 1 is unclear.\n")
    writeWorkingFile(`${processFolder}/drafts/changes-2.md`, "# Changes of draft-2.md against version 1\n\n## Change 1\n\n- Section: Steps\n- Change: Step 1 is clearer now.\n- Reason: feedback-1.md\n")
    for (const stage of ["regenerate", "review", "approval"]) expect(runCommand(["move", processId, stage]).status).toBe(0)
    const changedSpec = `${specText}\n- Role: Head of IT\n`
    writeWorkingFile(`${processFolder}/spec.md`, changedSpec)

    expect(publish().status).toBe(0)

    expect(readWorkingFile(`${processFolder}/versions/2/spec.md`)).toBe(changedSpec)
    expect(readWorkingFile(`${processFolder}/versions/1/spec.md`)).toBe(specText)
    expect(storedVersions().map((stored) => stored.version)).toEqual([1, 2])
  })

  it("takes the number above a version folder that is already there, which it leaves as it was, and above the versions on the board", () => {
    prepareApproval()
    writeWorkingFile(`${processFolder}/versions/1/kept.md`, "Kept.\n")

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/1`)).toEqual(["kept.md"])
    expect(names(`${processFolder}/versions/2`)).toEqual(["approval.md", "cases", "process.md"])
    expect(storedVersions().map((stored) => stored.version)).toEqual([2])

    prepareApproval({ versions: [{ version: 7, draft: "draft-1.md", at: "2026-11-20T18:00:00.000Z" }] })

    expect(publish().status).toBe(0)

    expect(names(`${processFolder}/versions/8`)).toEqual(["approval.md", "cases", "process.md"])
    expect(storedVersions().map((stored) => stored.version)).toEqual([7, 8])
  })

  it("stores the version with its draft, who approved it and the time of the history entry", () => {
    prepareApproval()

    expect(publish().status).toBe(0)

    const published = storedHistory(storedProcesses()[0]).at(-1)
    expect(published?.stage).toBe("published")
    expect(storedVersions()).toEqual([{ version: 1, draft: "draft-2.md", approvedBy: owner, at: published?.at }])
    expect(String(published?.at)).toMatch(timeForm)
  })

  it("leaves approvedBy out when the approval file has no line that starts with Approved by:", () => {
    prepareApproval()
    writeWorkingFile(`${processFolder}/versions/approval-draft-2.md`, "# Approval of draft-2.md\n")

    expect(publish().status).toBe(0)

    const versions = storedVersions()
    expect(Object.keys(versions[0] ?? {}).sort()).toEqual(["at", "draft", "version"])
    expect(versions[0]).toMatchObject({ version: 1, draft: "draft-2.md" })
  })

  it("prints Versions: with one line per version between the lines of Rounds: and the line History:, and only for a process with versions", () => {
    writeBoardFile([
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "published",
        history: [{ at: "2026-11-20T17:00:00.000Z", stage: "published" }],
        rounds: [{ round: 1, draft: "draft-2.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }],
        versions: [
          { version: 1, draft: "draft-2.md", approvedBy: owner, at: "2026-11-21T10:05:00.000Z" },
          { version: 2, draft: "draft-3.md", at: "2026-11-22T09:00:00.000Z" },
        ],
      },
    ])

    const lines = runCommand(["show", processId]).stdout.split("\n")

    expect(lines.slice(3, 9)).toEqual([
      "Rounds:",
      "  1  draft-2.md  legal PASS",
      "Versions:",
      "  1  draft-2.md  Kari Nordmann  2026-11-21T10:05:00.000Z",
      "  2  draft-3.md  2026-11-22T09:00:00.000Z",
      "History:",
    ])
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage: "published", versions: [] }])
    expect(runCommand(["show", processId]).stdout).not.toContain("Versions:")
  })
})
