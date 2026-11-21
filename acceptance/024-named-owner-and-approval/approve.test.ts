import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import {
  approvalFile,
  approve,
  cannotApprove,
  kari,
  prepareApproval,
  processFolder,
  processId,
  rolesFile,
  rolesText,
  timeForm,
  usage,
  versionsFolder,
  writeDrafts,
  writeProcess,
} from "./approval.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Runs `approve` for a refusal: standard error must be `stderr`, and the board and `versions/` must stay as they were. */
function expectRefused(by: string, stderr: string): void {
  const before = readFile(project, boardFile)
  const versions = entries(project, versionsFolder)

  const result = approve(project, by)

  expect(result.stderr).toBe(stderr)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(readFile(project, boardFile)).toBe(before)
  expect(entries(project, versionsFolder)).toEqual(versions)
}

describe("process-factory approve by the owner", () => {
  it("prints the file it stored and writes who approved the newest draft and when", () => {
    prepareApproval(project, [1, 2, 3])
    const before = Date.now()

    const result = approve(project, kari)

    const after = Date.now()
    expect(result.stdout).toBe(`Stored ${processFolder}/versions/approval-draft-3.md\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, versionsFolder)).toEqual(["approval-draft-3.md"])
    const text = readFile(project, approvalFile(3))
    const lines = text.split("\n")
    expect(lines).toHaveLength(7)
    expect(lines.slice(0, 5)).toEqual(["# Approval of draft-3.md", "", `Process: ${processId}`, "Draft: draft-3.md", "Approved by: Kari Nordmann"])
    expect(lines[5]?.startsWith("Approved at: ")).toBe(true)
    const at = lines[5]?.slice("Approved at: ".length) ?? ""
    expect(at).toMatch(timeForm)
    expect(Date.parse(at)).toBeGreaterThanOrEqual(before)
    expect(Date.parse(at)).toBeLessThanOrEqual(after)
    expect(lines[6]).toBe("")
  })

  it("leaves the board byte for byte as it was: the process stays in approval without a new history entry", () => {
    prepareApproval(project)
    const before = readFile(project, boardFile)

    expect(approve(project, kari).status).toBe(0)

    expect(readFile(project, boardFile)).toBe(before)
    expect(runCommand(project, ["show", processId]).stdout).toContain("Stage: approval\n")
  })

  it("takes the name after --by without the whitespace at its start and its end", () => {
    prepareApproval(project, [1])

    const result = approve(project, "  Kari Nordmann  ")

    expect(result.status).toBe(0)
    expect(readFile(project, approvalFile(1))).toContain("\nApproved by: Kari Nordmann\n")
  })

  it("approves a draft whose round stopped at the limit with open findings like any other", () => {
    const stopped = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr"
    writeProcess(project, "approval", {
      owner: kari,
      rounds: [{ round: 5, draft: "draft-5.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "gdpr", verdict: "CHANGES" }], stopped }],
    })
    writeDrafts(project, [5])

    const result = approve(project, kari)

    expect(result.stdout).toBe(`Stored ${processFolder}/versions/approval-draft-5.md\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, approvalFile(5))).toContain("\nDraft: draft-5.md\nApproved by: Kari Nordmann\n")
  })

  it("refuses a second approval of the same draft, and approves a newer draft next to the first approval", () => {
    prepareApproval(project, [1, 2, 3])
    expect(approve(project, kari).status).toBe(0)
    const first = readFile(project, approvalFile(3))

    expectRefused(kari, cannotApprove("draft-3.md is already approved"))
    expect(readFile(project, approvalFile(3))).toBe(first)

    writeDrafts(project, [4])
    const result = approve(project, kari)

    expect(result.stdout).toBe(`Stored ${processFolder}/versions/approval-draft-4.md\n`)
    expect(result.status).toBe(0)
    expect(entries(project, versionsFolder)).toEqual(["approval-draft-3.md", "approval-draft-4.md"])
    expect(readFile(project, approvalFile(3))).toBe(first)
  })
})

describe("process-factory approve for a process that cannot be approved", () => {
  it("refuses a process that is not in approval and names its stage", () => {
    writeProcess(project, "review", { owner: kari })
    writeDrafts(project, [1])

    expectRefused(kari, cannotApprove("it is in the stage review, not in approval"))
  })

  it("refuses a process without an owner and names the command that sets one", () => {
    writeProcess(project, "approval")
    writeDrafts(project, [1])

    expectRefused(kari, cannotApprove(`it has no owner: owner ${processId} "<person>" names one`))
  })

  it("refuses a process without a draft", () => {
    writeProcess(project, "approval", { owner: kari })

    expectRefused(kari, cannotApprove(`there is no draft in ${processFolder}/drafts`))
  })
})

describe("process-factory approve by anyone but the owner", () => {
  it.each([["Ola Hansen"], ["kari nordmann"], ["Kari"], ["Claude"], ["the factory"], ["process-factory"]])(
    "refuses --by %s without naming the owner, and writes nothing",
    (by) => {
      prepareApproval(project)

      const result = approve(project, by)

      expect(result.stderr).toBe(cannotApprove("--by does not name its owner"))
      expect(result.stderr).not.toContain("Kari Nordmann")
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(entries(project, versionsFolder)).toEqual([])
    },
  )

  it("checks the name before it looks at organisation/roles.md and at the drafts", () => {
    writeProcess(project, "approval", { owner: "Nina Berg" })

    expectRefused(kari, cannotApprove("--by does not name its owner"))
  })
})

describe("process-factory approve by an owner who is not named in organisation/roles.md", () => {
  it("refuses the owner after her name was taken out of organisation/roles.md", () => {
    prepareApproval(project)
    writeFile(project, rolesFile, rolesText.replace("Kari Nordmann is the data protection officer.", "Liv Dahl is the data protection officer."))

    expectRefused(kari, cannotApprove("its owner Kari Nordmann is not named in organisation/roles.md"))
  })

  it.each([
    ["never stood in the file", "Nina Berg"],
    ["only stands in an example section", "Per Olsen"],
  ])("refuses an owner on the board who %s", (_name, owner) => {
    writeProcess(project, "approval", { owner })
    writeDrafts(project, [1])

    expectRefused(owner, cannotApprove(`its owner ${owner} is not named in organisation/roles.md`))
  })
})

describe("process-factory approve in another form or for another id", () => {
  it.each([
    ["without --by", ["approve", processId]],
    ["with a name but no --by", ["approve", processId, kari]],
    ["with --by but no name", ["approve", processId, "--by"]],
    ["with another option than --by", ["approve", processId, "--as", kari]],
    ["with an argument after the name", ["approve", processId, "--by", kari, "extra"]],
    ["as owner without a name", ["owner", processId]],
    ["as owner with an argument after the name", ["owner", processId, kari, "extra"]],
    ["with no argument", []],
  ])("prints the eleven usage lines, with owner and approve after round, and writes nothing %s", (_name, args) => {
    prepareApproval(project)
    const before = readFile(project, boardFile)

    const result = runCommand(project, args)

    expect(result.stderr).toBe(usage)
    expect(result.stderr.split("\n").slice(6, 10)).toEqual([
      "       process-factory round <process-id>",
      '       process-factory owner <process-id> "<person>"',
      '       process-factory approve <process-id> --by "<person>"',
      "       process-factory org init",
    ])
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, versionsFolder)).toEqual([])
  })

  it.each([["002-unknown-process"], ["../../outside"]])("says there is no process %s", (id) => {
    prepareApproval(project)

    const result = runCommand(project, ["approve", id, "--by", kari])

    expect(result.stderr).toBe(`process-factory: there is no process ${id}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project, versionsFolder)).toEqual([])
  })
})
