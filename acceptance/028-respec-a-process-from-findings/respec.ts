import { history, processes, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { simulation } from "../023-case-regression-gate/gate.ts"

export const findingsFile = `${processFolder}/feedback/findings-round-5.md`
export const cannot = `process-factory: cannot send ${processId} back to spec`
export const specAcceptedAt = "2026-11-19T15:45:00.000Z"
export const highFinding = "- [high] Step 3: the deadline for telling the authority is missing. It is not in spec.md either."
export const mediumFinding = "- [medium] Who must be told: the law the duty rests on is not named."
export const lowFinding = "- [low] Step 2: two actions in one step."
export const earlierFinding = "- [high] Step 9: a finding of round 4 that round 5 no longer has."
export const limitReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: legal"

/** A round entry as the command line records it, with these verdicts. */
export function recorded(round: number, verdicts: [string, string][], more: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    round,
    draft: `draft-${String(round)}.md`,
    at: `2026-11-20T16:0${String(round % 10)}:00.000Z`,
    verdicts: verdicts.map(([reviewer, verdict]) => ({ reviewer, verdict })),
    ...more,
  }
}

/** The five rounds of the process of the criteria: legal asks for changes in each, and the fifth stopped at the limit. */
export function fiveRounds(): Record<string, unknown>[] {
  const verdicts: [string, string][] = [
    ["legal", "CHANGES"],
    ["readability", "PASS"],
    ["simulation", "PASS"],
  ]
  return [1, 2, 3, 4, 5].map((round) => recorded(round, verdicts, round === 5 ? { stopped: limitReason } : {}))
}

/**
 * The process of the criteria in `stage`: five recorded rounds, the drafts 1 to 5, a `spec.md`, one case, a published
 * version, the findings files of round 5, a `conflicts.md` beside them and a findings file of round 4.
 */
export function prepareRespec(project: string, stage = "approval", more: Record<string, unknown> = {}): void {
  writeProcess(project, stage, { specAcceptedAt, rounds: fiveRounds(), ...more })
  writeDrafts(project, [1, 2, 3, 4, 5])
  writeFile(project, `${processFolder}/spec.md`, "# Specification: Handle a lost laptop\n")
  writeFile(project, `${processFolder}/cases/case-1.md`, "# Case 1: The IT manager is away\n")
  writeFile(project, `${processFolder}/versions/1/process.md`, "# Handle a lost laptop\n\nVersion 1.\n")
  writeFindings(project, 4, "legal.md", `# legal review of draft-4.md\n\nVerdict: CHANGES\n\n${earlierFinding}\n`)
  writeFindings(project, 5, "legal.md", `# legal review of draft-5.md\n\nVerdict: CHANGES\n\n${highFinding}\n${mediumFinding}\n`)
  writeFindings(project, 5, "readability.md", `# readability review of draft-5.md\n\nVerdict: PASS\n\n${lowFinding}  \n`)
  writeFindings(project, 5, "simulation.md", simulation("PASS", [[1, "Result: PASS"]]))
  writeFindings(
    project,
    5,
    "conflicts.md",
    "# Conflicts of round 5\n\n## Conflict 1\n\n- Dropped: readability.md: [low] Step 4: shorten the step.\n- Followed: legal.md: [high] Step 4: name the law.\n- Reason: both cannot be met.\n",
  )
}

/** The findings file of 3.1 for the process of the criteria, sent back at `at`. */
export function expectedFindings(at: string): string {
  return [
    "# Findings of round 5",
    "",
    `Process: ${processId}`,
    "Round: 5",
    "Draft: draft-5.md",
    `Sent back at: ${at}`,
    "",
    "## legal",
    "",
    "Verdict: CHANGES",
    "",
    highFinding,
    mediumFinding,
    "",
    "## readability",
    "",
    "Verdict: PASS",
    "",
    lowFinding,
    "",
    "## simulation",
    "",
    "Verdict: PASS",
    "",
    "No findings.",
    "",
  ].join("\n")
}

/** The second entry on the board, which is the process of the criteria. */
export function entry(project: string): Record<string, unknown> {
  return processes(project)[1] ?? {}
}

/** The date and time of the last history entry of the process. */
export function lastChange(project: string): string {
  const at: unknown = history(entry(project)).at(-1)?.at
  return typeof at === "string" ? at : ""
}

/** Writes the board again with these keys of the process replaced. */
export function changeEntry(project: string, keys: Record<string, unknown>): void {
  const [older = {}, current = {}] = processes(project)
  writeBoard(project, [older, { ...current, ...keys }])
}
