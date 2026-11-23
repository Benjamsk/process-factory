import { existsSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, history, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { approvalFile, approve, cannotApprove, kari, processFolder, processId } from "../024-named-owner-and-approval/approval.ts"
import {
  change,
  changeList,
  changesFile,
  entry,
  feedbackText,
  firstChange,
  move,
  notChanged,
  prepareInApproval,
  prepareRegenerating,
  reasonsFile,
  refusedMove,
  specText,
  validChanges,
} from "./regeneration.ts"

const feedbackFile = (number: number): string => `${processFolder}/feedback/feedback-${String(number)}.md`
const withoutReason = changeList(2, [firstChange, change(2, ["- Section: Who does what", "- Change: The holder changed."]), notChanged])

let project = ""

/** Every file under a folder of the project with its content, by its path from that folder. */
function filesUnder(folder: string, inside = ""): Record<string, string> {
  const found: Record<string, string> = {}
  for (const name of readdirSync(path.join(project, folder, inside), { withFileTypes: true })) {
    const relative = inside === "" ? name.name : `${inside}/${name.name}`
    if (name.isDirectory()) Object.assign(found, filesUnder(folder, relative))
    else found[relative] = readFile(project, `${folder}/${relative}`)
  }
  return found
}

/** Approves as the owner and publishes; gives the result of the publication. */
function approveAndPublish() {
  expect(approve(project, kari).status).toBe(0)
  return move(project, "published")
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory approve for a process that is being regenerated", () => {
  it("refuses another name than the owner's as before, and records the change list in the approval of the owner", () => {
    prepareInApproval(project)

    expect(approve(project, "Ola Hansen").stderr).toBe(cannotApprove("--by does not name its owner"))
    expect(existsSync(path.join(project, approvalFile(2)))).toBe(false)
    const result = approve(project, kari)

    expect(result.stdout).toBe(`Stored ${approvalFile(2)}\n`)
    expect(result.status).toBe(0)
    const lines = readFile(project, approvalFile(2)).split("\n")
    expect(lines.slice(0, 6)).toEqual(["# Approval of draft-2.md", "", `Process: ${processId}`, "Draft: draft-2.md", "Changes: changes-2.md", `Approved by: ${kari}`])
    expect(lines[6]?.startsWith("Approved at: ")).toBe(true)
  })

  it.each([
    ["is missing", "is missing", undefined],
    ["has a change without a reason", "change 2 needs a line - Reason:", withoutReason],
  ])("refuses the owner while the change list of the newest draft %s, and writes no approval", (_name, problem, changes) => {
    prepareInApproval(project)
    if (changes === undefined) rmSync(path.join(project, changesFile(2)))
    else writeFile(project, changesFile(2), changes)
    const before = readFile(project, boardFile)

    const result = approve(project, kari)

    expect(result.stderr).toBe(cannotApprove(`${changesFile(2)} ${problem}`))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(project, approvalFile(2)))).toBe(false)
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("process-factory move <process-id> published for an approved regeneration", () => {
  it("prints published and writes versions/2 with the draft, the change list as changes.md, the approval, the spec and the cases", () => {
    prepareInApproval(project)
    const first = filesUnder(`${processFolder}/versions/1`)

    const result = approveAndPublish()

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(filesUnder(`${processFolder}/versions/2`)).toEqual({
      "approval.md": readFile(project, approvalFile(2)),
      "cases/case-1.md": readFile(project, `${processFolder}/cases/case-1.md`),
      "cases/case-2.md": readFile(project, `${processFolder}/cases/case-2.md`),
      "changes.md": validChanges(),
      "process.md": readFile(project, `${processFolder}/drafts/draft-2.md`),
      "spec.md": specText,
    })
    expect(filesUnder(`${processFolder}/versions/1`)).toEqual(first)
    expect(Object.keys(first)).not.toContain("changes.md")
    expect(readFile(project, `${processFolder}/spec.md`)).toBe(specText)
  })

  it("closes the feedback that is the reason for a change, with the version that answered it, and leaves the feedback that is not changed open", () => {
    prepareInApproval(project)

    expect(approveAndPublish().status).toBe(0)

    expect(readFile(project, feedbackFile(1))).toBe(feedbackText(1).replace("Status: open\n", "Status: closed\nAnswered by: version 2\n"))
    expect(readFile(project, feedbackFile(2))).toBe(feedbackText(2))
    expect(runCommand(project, ["show"]).stdout).toContain(`${processId}  published  Handle a lost laptop  1 open feedback\n`)
    const shown = runCommand(project, ["show", processId]).stdout.split("\n")
    expect(shown.filter((line) => line.includes("Feedback 1 of a reader."))).toEqual([])
    expect(shown.filter((line) => line.includes("Feedback 2 of a reader."))).toHaveLength(1)
  })

  it("leaves open a feedback that is named on a Reason line and under Not changed, and a feedback that arrived after the start", () => {
    prepareRegenerating(project)
    const partly = "## Not changed\n\n### feedback-2.md\n\nThe specification states no deadline.\n\n### feedback-1.md\n\nIt also asks for a deadline the specification does not state."
    const bothChanged = change(2, ["- Section: Who does what", "- Change: The holder changed.", "- Reason: Role: Data protection officer", "- Reason: case-2.md", "- Reason: feedback-2.md"])
    writeFile(project, `${processFolder}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")
    writeFile(project, changesFile(2), changeList(2, [firstChange, bothChanged, partly]))
    writeFile(project, feedbackFile(3), feedbackText(3))
    move(project, "review")
    move(project, "approval")

    expect(approveAndPublish().status).toBe(0)

    expect(entries(project, `${processFolder}/versions/2`)).toContain("changes.md")
    expect(readFile(project, feedbackFile(1))).toBe(feedbackText(1))
    expect(readFile(project, feedbackFile(2))).toBe(feedbackText(2))
    expect(readFile(project, feedbackFile(3))).toBe(feedbackText(3))
  })

  it("closes every feedback a change names when the change list has no entry under Not changed", () => {
    prepareRegenerating(project)
    const others = change(2, ["- Section: Who does what", "- Change: The holder changed.", "- Reason: Role: Data protection officer", "- Reason: case-2.md", "- Reason: feedback-2.md"])
    writeFile(project, `${processFolder}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")
    writeFile(project, changesFile(2), changeList(2, [firstChange, others]))
    move(project, "review")
    move(project, "approval")

    expect(approveAndPublish().status).toBe(0)

    for (const number of [1, 2]) {
      expect(readFile(project, feedbackFile(number))).toBe(feedbackText(number).replace("Status: open\n", "Status: closed\nAnswered by: version 2\n"))
    }
    expect(runCommand(project, ["show"]).stdout).toContain(`${processId}  published  Handle a lost laptop\n`)
  })

  it("ends the regeneration on the board, lists version 2 and records the dependency as it is now, so check no longer lists the process", () => {
    prepareInApproval(project)
    expect(runCommand(project, ["show", processId]).stdout).toContain("Regenerating: version 1\n")

    expect(approveAndPublish().status).toBe(0)

    const stored = entry(project)
    expect(stored.stage).toBe("published")
    expect(Object.keys(stored)).not.toContain("regeneration")
    expect(stored.versions).toEqual([
      { version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-11-21T09:00:00.000Z" },
      { version: 2, draft: "draft-2.md", approvedBy: kari, at: history(stored).at(-1)?.at },
    ])
    expect(JSON.stringify(stored.dependencies)).toMatch(/^\[\{"kind":"Role","name":"Data protection officer","hash":"[0-9a-f]{64}"\}\]$/)
    expect(JSON.stringify(stored.dependencies)).not.toContain("0".repeat(64))
    expect(runCommand(project, ["check"]).stdout).toBe("No published process has a changed dependency.\n")
    expect(runCommand(project, ["show", processId]).stdout).not.toContain("Regenerating: ")
  })
})

describe("process-factory move <process-id> published for a regeneration that may not be published", () => {
  it.each([
    ["was removed", "is missing", undefined],
    ["was made invalid", "change 2 needs a line - Reason:", withoutReason],
  ])("is refused when the change list %s after the approval, and writes no version and closes no feedback", (_name, problem, changes) => {
    prepareInApproval(project)
    expect(approve(project, kari).status).toBe(0)
    if (changes === undefined) rmSync(path.join(project, changesFile(2)))
    else writeFile(project, changesFile(2), changes)
    const before = readFile(project, boardFile)

    const result = move(project, "published")

    expect(result.stderr).toBe(refusedMove("approval", "published", 2, problem))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, `${processFolder}/versions`)).toEqual(["1", "approval-draft-1.md", "approval-draft-2.md"])
    expect(readFile(project, feedbackFile(1))).toBe(feedbackText(1))
  })

  it("is refused without an approval of the newest draft with the message of before, also with a change list", () => {
    prepareInApproval(project)
    expect(runCommand(project, ["show", processId]).stdout).toContain("Regenerating: version 1\n")

    const result = move(project, "published")

    expect(result.stderr).toBe(
      `process-factory: cannot move ${processId} from approval to published: the newest draft has no approval: only approve ${processId} --by "<person>" records one\n`,
    )
    expect(result.status).toBe(1)
    expect(entries(project, `${processFolder}/versions`)).toEqual(["1", "approval-draft-1.md"])
  })
})

describe("process-factory move <process-id> published from regenerate", () => {
  it("ends the regeneration without a version: the stage is published again and nothing but the board changes", () => {
    prepareRegenerating(project)
    const versions = entry(project).versions
    const files = filesUnder(processFolder)
    expect(Object.keys(files)).toContain("regeneration-1.md")

    const result = move(project, "published")

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const stored = entry(project)
    expect(stored.stage).toBe("published")
    expect(history(stored).map((changed) => changed.stage)).toEqual(["published", "regenerate", "published"])
    expect(Object.keys(stored)).not.toContain("regeneration")
    expect(stored.versions).toEqual(versions)
    expect(filesUnder(processFolder)).toEqual(files)
    expect(readFile(project, reasonsFile)).toContain("## Reasons")
  })

  it("names review and published as the stages allowed from regenerate", () => {
    prepareRegenerating(project)

    const result = move(project, "approval")

    expect(result.stderr).toBe(`process-factory: cannot move ${processId} from regenerate to approval (allowed from regenerate: review, published)\n`)
    expect(result.status).toBe(1)
  })
})
