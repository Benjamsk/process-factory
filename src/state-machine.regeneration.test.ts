import { existsSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { boardPath, readWorkingFile, runCommand, storedHistory, storedProcesses, workingDirectory, writeBoardFile, writeWorkingFile } from "./command-line.ts"

describe("the regeneration of a published process", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const processFolder = `processes/${processId}`
  const reasonsFile = `${processFolder}/regeneration-1.md`
  const changesFile = `${processFolder}/drafts/changes-2.md`
  const approvalFile = `${processFolder}/versions/approval-draft-2.md`
  const cannotStart = `process-factory: cannot move ${processId} from published to regenerate`
  const rolesText = "# Roles\n\n## Data protection officer\n\nKari Nordmann is the data protection officer.\n"
  const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n\n- Role: Data protection officer\n"
  const document = "# Handle a lost laptop\n\n## Steps\n\n1. Data protection officer (Kari Nordmann): Block the laptop.\n"
  /** A recorded dependency whose section in `organisation/roles.md` is no longer what the board recorded. */
  const changedDependency = { kind: "Role", name: "Data protection officer", hash: "0".repeat(64) }
  const firstRound = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }
  const secondRound = { round: 2, draft: "draft-2.md", at: "2026-11-23T12:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
  const changed = "- Change: Step 1 now says where to block the laptop."
  const firstChange = `## Change 1\n\n- Section: Steps\n${changed}\n- Reason: feedback-1.md\n`
  const secondChange = `## Change 2\n\n- Section: Who does what\n- Change: The data protection officer changed.\n- Reason: Role: Data protection officer\n- Reason: case-2.md\n`
  const notChanged = "## Not changed\n\n### feedback-2.md\n\nThe specification states no deadline.\n"

  /** A change list for `draft-2.md` against version 1 with these sections after its title. */
  function changeList(...sections: string[]): string {
    return `# Changes of draft-2.md against version 1\n\n${sections.join("\n")}`
  }

  const validChanges = changeList(firstChange, secondChange, notChanged)

  /** The change list of the spec with a third change that has this one reason. */
  function changesWithReason(reason: string): string {
    return changeList(firstChange, secondChange, `## Change 3\n\n- Section: Steps\n${changed}\n- Reason: ${reason}\n`, notChanged)
  }

  const sectionProblem = "needs exactly one line - Section: with one of the seven headings of a draft"
  /** Each change list that is refused, with the name of what is wrong with it and the problem the command line gives. */
  const refusedLists: [string, string, string][] = [
    ["has no section ## Change", "names no change", changeList(notChanged)],
    ["has a change without a line - Section:", `change 1 ${sectionProblem}`, changeList(`## Change 1\n\n${changed}\n- Reason: feedback-1.md\n`, secondChange, notChanged)],
    [
      "has a change whose Section is no heading of a draft",
      `change 1 ${sectionProblem}`,
      changeList(`## Change 1\n\n- Section: Legal basis\n${changed}\n- Reason: feedback-1.md\n`, secondChange, notChanged),
    ],
    [
      "has a change without a line - Change:",
      "change 1 needs exactly one line - Change: with what changed",
      changeList("## Change 1\n\n- Section: Steps\n- Reason: feedback-1.md\n", secondChange, notChanged),
    ],
    ["has a change without a line - Reason:", "change 2 needs a line - Reason:", changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n`, notChanged)],
    ["names a reason the regeneration does not have", `names a reason that is not in ${reasonsFile}: feedback-9.md`, changesWithReason("feedback-9.md")],
    ["gives no reason why a not changed entry changed nothing", "gives no reason why feedback-2.md is not changed", changeList(firstChange, secondChange, "## Not changed\n\n### feedback-2.md\n")],
    [
      "leaves two reasons of the regeneration out",
      `does not name these reasons of ${reasonsFile}: feedback-2.md, case-2.md`,
      changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n- Reason: Role: Data protection officer\n`),
    ],
  ]

  /** A feedback file as the reading view stores it, with this status. */
  function feedbackText(number: number, status = "open"): string {
    const head = `# Feedback ${String(number)}\n\nProcess: ${processId}\nVersion: 1\nStep: 1\nKind: document`
    return `${head}\nStatus: ${status}\n\n## Text\n\nFeedback ${String(number)} of a reader.\n`
  }

  /** A board with one entry in `stage` that is owned, has one recorded round and a changed dependency, with further keys in `more`. */
  function writeProcess(stage: string, more: Record<string, unknown> = {}): void {
    writeBoardFile([
      {
        id: processId,
        title: "Handle a lost laptop",
        stage,
        history: [{ at: "2026-11-21T09:00:00.000Z", stage }],
        owner,
        rounds: [firstRound],
        versions: [{ version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-11-21T09:00:00.000Z" }],
        dependencies: [changedDependency],
        ...more,
      },
    ])
  }

  /** The process in `published` as version 1 of `draft-1.md`, with the cases 1 and 2 of which the version holds only case 1, and the open feedback 1 and 2. */
  function preparePublished(more: Record<string, unknown> = {}): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeProcess("published", more)
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, document)
    writeWorkingFile(`${processFolder}/versions/1/process.md`, document)
    writeWorkingFile(`${processFolder}/versions/1/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The officer is away\n")
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1))
    writeWorkingFile(`${processFolder}/feedback/feedback-2.md`, feedbackText(2))
  }

  /** Publishes the process once through the command line, so that its recorded dependency is the section as it is now. */
  function publishOnce(): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeProcess("approval", { versions: undefined, dependencies: undefined })
    writeWorkingFile(`${processFolder}/spec.md`, specText)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, document)
    writeWorkingFile(`${processFolder}/versions/approval-draft-1.md`, `# Approval of draft-1.md\n\nApproved by: ${owner}\n`)
    expect(runCommand(["move", processId, "published"]).status).toBe(0)
  }

  /** The process after the start of its regeneration, with `draft-2.md` and this change list next to it. */
  function prepareRegenerating(changes = validChanges): void {
    preparePublished()
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)
    writeWorkingFile(`${processFolder}/drafts/draft-2.md`, `${document}\nDraft 2.\n`)
    writeWorkingFile(changesFile, changes)
  }

  /** The process being regenerated and in `approval`, with `draft-2.md` and this change list. */
  function prepareInApproval(changes = validChanges): void {
    prepareRegenerating(changes)
    expect(runCommand(["move", processId, "review"]).status).toBe(0)
    expect(runCommand(["move", processId, "approval"]).status).toBe(0)
  }

  /** Writes the board again with these keys of the process replaced. */
  function changeEntry(keys: Record<string, unknown>): void {
    writeBoardFile([{ ...(storedProcesses()[0] ?? {}), ...keys }])
  }

  it("writes the reasons file with the open feedback, the new case and the changed dependency, and records the regeneration", () => {
    preparePublished()

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stdout).toBe("regenerate\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    const at: unknown = storedHistory(entry).at(-1)?.at
    expect(entry?.stage).toBe("regenerate")
    expect(storedHistory(entry)).toHaveLength(2)
    expect(entry?.regeneration).toEqual({ version: 1, round: 1, at })
    const lines = readWorkingFile(reasonsFile).split("\n")
    expect(lines.slice(0, 5)).toEqual(["# Regeneration of version 1", "", `Process: ${processId}`, "Version: 1", `Started at: ${String(at)}`])
    expect(lines.slice(5)).toEqual(["", "## Reasons", "", "- feedback-1.md", "- feedback-2.md", "- case-2.md", "- Role: Data protection officer", ""])
  })

  it("records round 0 for a process without a recorded round", () => {
    preparePublished({ rounds: undefined })

    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    expect(storedProcesses()[0]?.regeneration).toMatchObject({ version: 1, round: 0 })
  })

  it("refuses the move while a closed feedback, a case of the version and an unchanged dependency are all there is", () => {
    publishOnce()
    writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1, "closed"))
    writeWorkingFile(`${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    writeWorkingFile(`${processFolder}/versions/1/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stderr).toBe(`${cannotStart}: there is nothing to regenerate it for: no open feedback, no case newer than version 1 and no changed dependency\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, reasonsFile))).toBe(false)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it.each([
    {
      name: "an open feedback",
      prepare: () => {
        writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, feedbackText(1))
      },
      reason: "feedback-1.md",
    },
    {
      name: "a case the version does not hold",
      prepare: () => {
        writeWorkingFile(`${processFolder}/cases/case-2.md`, "# Case 2: The officer is away\n")
      },
      reason: "case-2.md",
    },
    {
      name: "a changed dependency",
      prepare: () => {
        writeWorkingFile("organisation/roles.md", rolesText.replace("is the data protection officer", "is away"))
      },
      reason: "Role: Data protection officer",
    },
  ])("starts the regeneration with only $name as the reason", ({ prepare, reason }) => {
    publishOnce()
    prepare()

    expect(runCommand(["move", processId, "regenerate"]).stdout).toBe("regenerate\n")

    expect(readWorkingFile(reasonsFile).endsWith(`## Reasons\n\n- ${reason}\n`)).toBe(true)
  })

  it.each([
    ["no key versions", undefined],
    ["an empty list versions", []],
  ])("refuses a published process with %s, because it has no published version", (_name, versions) => {
    preparePublished({ versions })
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "regenerate"])

    expect(result.stderr).toBe(`${cannotStart}: it has no published version\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, reasonsFile))).toBe(false)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("prints Regenerating: version 1 after the owner and before the rounds, and no such line without a regeneration", () => {
    preparePublished()
    const before = runCommand(["show", processId]).stdout
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    const lines = runCommand(["show", processId]).stdout.split("\n")

    expect(before).not.toContain("Regenerating: ")
    expect(lines.slice(2, 6)).toEqual(["Stage: regenerate", `Owner: ${owner}`, "Regenerating: version 1", "Rounds:"])
  })

  it("refuses the move to review without the change list of the newest draft and moves with it", () => {
    prepareRegenerating()
    rmSync(path.join(workingDirectory, changesFile))
    const before = readWorkingFile(boardPath)

    const refused = runCommand(["move", processId, "review"])

    expect(refused.stderr).toBe(`process-factory: cannot move ${processId} from regenerate to review: ${changesFile} is missing\n`)
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
    writeWorkingFile(changesFile, validChanges)

    const result = runCommand(["move", processId, "review"])

    expect(result.stdout).toBe("review\n")
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("review")
  })

  it.each(refusedLists)("refuses the move to review of a change list that %s", (_name, problem, changes) => {
    prepareRegenerating(changes)
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "review"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from regenerate to review: ${changesFile} ${problem}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("accepts the findings file of a reviewer of a round of the regeneration as a reason", () => {
    prepareRegenerating(changesWithReason("round-2/legal.md"))
    changeEntry({ stage: "rework", rounds: [firstRound, secondRound] })

    const result = runCommand(["move", processId, "review"])

    expect(result.stdout).toBe("review\n")
    expect(result.status).toBe(0)
  })

  it("accepts round-2/owner.md as a reason once the owner stored findings in that round, and not before", () => {
    prepareRegenerating(changesWithReason("round-2/owner.md"))
    changeEntry({ stage: "rework", rounds: [firstRound, secondRound] })

    const without = runCommand(["move", processId, "review"])

    expect(without.stderr).toBe(`process-factory: cannot move ${processId} from rework to review: ${changesFile} names a reason that is not in ${reasonsFile}: round-2/owner.md\n`)
    expect(without.status).toBe(1)
    writeWorkingFile(`${processFolder}/rounds/round-2/owner.md`, "# Findings of the owner\n\nVerdict: CHANGES\n\n- [high] Step 3 must name the IT manager.\n")

    const withFindings = runCommand(["move", processId, "review"])

    expect(withFindings.stdout).toBe("review\n")
    expect(withFindings.status).toBe(0)
  })

  it.each(["round-1/legal.md", "round-2/nobody.md", "round-3/legal.md"])("refuses the reason %s from rework", (reason) => {
    prepareRegenerating(changesWithReason(reason))
    changeEntry({ stage: "rework", rounds: [firstRound, secondRound] })

    const result = runCommand(["move", processId, "review"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from rework to review: ${changesFile} names a reason that is not in ${reasonsFile}: ${reason}\n`)
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })

  it("writes Changes: directly after Draft: in the approval of the owner", () => {
    prepareInApproval()

    const result = runCommand(["approve", processId, "--by", owner])

    expect(result.stdout).toBe(`Stored ${approvalFile}\n`)
    expect(result.status).toBe(0)
    expect(readWorkingFile(approvalFile).split("\n").slice(3, 6)).toEqual(["Draft: draft-2.md", "Changes: changes-2.md", `Approved by: ${owner}`])
  })

  it("refuses the owner while the change list of the newest draft is missing, and writes no approval", () => {
    prepareInApproval()
    rmSync(path.join(workingDirectory, changesFile))

    const result = runCommand(["approve", processId, "--by", owner])

    expect(result.stderr).toBe(`process-factory: cannot approve ${processId}: ${changesFile} is missing\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, approvalFile))).toBe(false)
  })

  it("copies the change list into the new version, closes the feedback it answers and ends the regeneration", () => {
    prepareInApproval()
    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, `${processFolder}/versions/2`)).sort()).toEqual(["approval.md", "cases", "changes.md", "process.md", "spec.md"])
    expect(readWorkingFile(`${processFolder}/versions/2/changes.md`)).toBe(validChanges)
    expect(existsSync(path.join(workingDirectory, `${processFolder}/versions/1/changes.md`))).toBe(false)
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1).replace("Status: open\n", "Status: closed\nAnswered by: version 2\n"))
    expect(readWorkingFile(`${processFolder}/feedback/feedback-2.md`)).toBe(feedbackText(2))
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("published")
    expect(entry).not.toHaveProperty("regeneration")
  })

  it("refuses the publication while the change list of the approved draft has a problem, and closes no feedback", () => {
    prepareInApproval()
    expect(runCommand(["approve", processId, "--by", owner]).status).toBe(0)
    writeWorkingFile(changesFile, changeList(firstChange, `## Change 2\n\n- Section: Who does what\n${changed}\n`, notChanged))
    const before = readWorkingFile(boardPath)

    const result = runCommand(["move", processId, "published"])

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from approval to published: ${changesFile} change 2 needs a line - Reason:\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, `${processFolder}/versions/2`))).toBe(false)
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1))
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("ends a regeneration in which no reason led to a change from regenerate, and writes no version", () => {
    preparePublished()
    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)
    const versions = storedProcesses()[0]?.versions

    const result = runCommand(["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("published")
    expect(storedHistory(entry).map((change) => change.stage)).toEqual(["published", "regenerate", "published"])
    expect(entry).not.toHaveProperty("regeneration")
    expect(entry?.versions).toEqual(versions)
    expect(readdirSync(path.join(workingDirectory, `${processFolder}/versions`))).toEqual(["1"])
    expect(readWorkingFile(`${processFolder}/feedback/feedback-1.md`)).toBe(feedbackText(1))
  })
})
