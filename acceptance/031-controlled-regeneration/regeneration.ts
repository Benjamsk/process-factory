import { processes, runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { approvalFile, kari, olderEntry, ownEntry, processFolder, processId, rolesFile, rolesText } from "../024-named-owner-and-approval/approval.ts"

export const reasonsFile = `${processFolder}/regeneration-1.md`
export const publishedAt = "2026-11-21T09:00:00.000Z"
export const publishedDocument = "# Handle a lost laptop\n\n## Steps\n\n1. Data protection officer (Kari Nordmann): Block the laptop.\n"
export const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n\n- Role: Data protection officer\n"
export const fourReasons = ["feedback-1.md", "feedback-2.md", "case-2.md", "Role: Data protection officer"]
/** A recorded dependency whose section in `organisation/roles.md` is no longer what the board recorded. */
export const changedDependency = { kind: "Role", name: "Data protection officer", hash: "0".repeat(64) }
/** Round 1, the one round that was recorded before the process was published. */
export const firstRound = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }

/** The path of the change list of `draft-<n>.md`. */
export function changesFile(number: number): string {
  return `${processFolder}/drafts/changes-${String(number)}.md`
}

/** The standard error of a move that is refused because of the change list of `draft-<n>.md`. */
export function refusedMove(from: string, to: string, number: number, problem: string): string {
  return `process-factory: cannot move ${processId} from ${from} to ${to}: ${changesFile(number)} ${problem}\n`
}

/** A feedback file as the reading view stores it, with this status. */
export function feedbackText(number: number, status = "open"): string {
  return [
    `# Feedback ${String(number)}`,
    "",
    `Process: ${processId}`,
    "Version: 1",
    "Step: 1",
    "Kind: document",
    "From: Ola Hansen",
    "Received at: 2026-11-22T10:15:00.000Z",
    `Status: ${status}`,
    "",
    "## Text",
    "",
    `Feedback ${String(number)} of a reader.`,
    "",
  ].join("\n")
}

/** A change list in the form of the spec, for `draft-<n>.md` against version 1, with these sections after its title. */
export function changeList(number: number, sections: string[]): string {
  return `${[`# Changes of draft-${String(number)}.md against version 1`, ...sections].join("\n\n")}\n`
}

/** One section `## Change <i>` with these lines. */
export function change(number: number, lines: string[]): string {
  return [`## Change ${String(number)}`, "", ...lines].join("\n")
}

export const firstChange = change(1, [
  "- Section: Steps",
  '- Change: Step 1 said "Block the laptop". It now says "Block the laptop in the device portal so that nobody can sign in".',
  "- Reason: feedback-1.md",
])
export const secondChange = change(2, [
  "- Section: Who does what",
  "- Change: The data protection officer was Kari Nordmann and is now Ola Hansen.",
  "- Reason: Role: Data protection officer",
  "- Reason: case-2.md",
])
export const notChanged = "## Not changed\n\n### feedback-2.md\n\nIt asks for a deadline for telling the police. The specification states none."

/** The change list of 3.2 of the spec, for `draft-<n>.md`. */
export function validChanges(number = 2): string {
  return changeList(number, [firstChange, secondChange, notChanged])
}

/**
 * The process of the acceptance criteria: published as version 1 of `draft-1.md`, owned by Kari Nordmann, with one
 * recorded round, the cases 1 and 2 of which only case 1 is in the version, the open feedback 1 and 2, and a recorded
 * dependency that has changed since the publication. `more` replaces keys of its board entry.
 */
export function preparePublished(project: string, more: Record<string, unknown> = {}): void {
  writeFile(project, rolesFile, rolesText)
  writeBoard(project, [
    olderEntry,
    ownEntry("published", {
      owner: kari,
      rounds: [firstRound],
      versions: [{ version: 1, draft: "draft-1.md", approvedBy: kari, at: publishedAt }],
      dependencies: [changedDependency],
      ...more,
    }),
  ])
  const approval = `# Approval of draft-1.md\n\nProcess: ${processId}\nDraft: draft-1.md\nApproved by: ${kari}\nApproved at: ${publishedAt}\n`
  writeFile(project, `${processFolder}/spec.md`, specText)
  writeFile(project, `${processFolder}/drafts/draft-1.md`, publishedDocument)
  writeFile(project, approvalFile(1), approval)
  writeFile(project, `${processFolder}/versions/1/process.md`, publishedDocument)
  writeFile(project, `${processFolder}/versions/1/spec.md`, specText)
  writeFile(project, `${processFolder}/versions/1/approval.md`, approval)
  writeFile(project, `${processFolder}/versions/1/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
  writeFile(project, `${processFolder}/cases/case-1.md`, "# Case 1: The laptop is lost on a train\n")
  writeFile(project, `${processFolder}/cases/case-2.md`, "# Case 2: The data protection officer is away\n")
  writeFile(project, `${processFolder}/feedback/feedback-1.md`, feedbackText(1))
  writeFile(project, `${processFolder}/feedback/feedback-2.md`, feedbackText(2))
}

/** Runs `move <process-id> <stage>`. */
export function move(project: string, stage: string) {
  return runCommand(project, ["move", processId, stage])
}

/** The process of the criteria after `move <process-id> regenerate`. */
export function prepareRegenerating(project: string, more: Record<string, unknown> = {}): void {
  preparePublished(project, more)
  move(project, "regenerate")
}

/** Writes `draft-<n>.md` and, when one is given, its change list. */
export function writeDraft(project: string, number: number, changes?: string): void {
  writeFile(project, `${processFolder}/drafts/draft-${String(number)}.md`, `${publishedDocument}\nDraft ${String(number)}.\n`)
  if (changes !== undefined) {
    writeFile(project, changesFile(number), changes)
  }
}

/** The process of the criteria, being regenerated and in `approval`, with `draft-2.md` and the change list of 3.2. */
export function prepareInApproval(project: string): void {
  prepareRegenerating(project)
  writeDraft(project, 2, validChanges())
  move(project, "review")
  move(project, "approval")
}

/** The second entry on the board, which is the process of the criteria. */
export function entry(project: string): Record<string, unknown> {
  return processes(project)[1] ?? {}
}

/** Writes the board again with these keys of the process replaced. */
export function changeEntry(project: string, keys: Record<string, unknown>): void {
  writeBoard(project, [olderEntry, { ...entry(project), ...keys }])
}
