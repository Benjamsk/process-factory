import { processes, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { installReviewers, processFolder, processId, writeDrafts, writeProcess } from "../017-review-rounds/rounds.ts"

export const simulationTemplate = "templates/skills/process/simulation-reviewer.md"
export const limitReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: "

/** Writes the files `case-<n>.md` with these numbers in the folder `cases` of the process. */
export function writeCases(project: string, numbers: number[]): void {
  for (const number of numbers) {
    writeFile(project, `${processFolder}/cases/case-${String(number)}.md`, `# Case ${String(number)}: The IT manager is away\n\nKind: Person away\n`)
  }
}

/**
 * A `simulation.md` in the form of `simulation-reviewer.md`: the verdict, one finding tagged high when the verdict is
 * `CHANGES`, and one section per entry of `sections`, each a case number with the line of its result, or with `null`
 * for a section without such a line.
 */
export function simulation(verdict: string, sections: [number, string | null][]): string {
  const finding = verdict === "CHANGES" ? "- [high] Step 2: it does not say who locks the laptop when the IT manager is away. (case 3)" : "No findings."
  const written = sections.map(([number, result]) =>
    [
      `## Case ${String(number)}: The IT manager is away`,
      "",
      "Would do: Reads step 1 and reports the loss, then looks for who locks the laptop.",
      "Stops at: nowhere",
      "Gets wrong: nothing",
      ...(result === null ? [] : [result]),
      "",
    ].join("\n"),
  )
  return ["# simulation review of draft-1.md", "", `Verdict: ${verdict}`, "", finding, "", ...written].join("\n")
}

/** A round entry as the command line records it with the simulation reviewer installed: the results of the cases under `cases`. */
export function recordedRound(round: number, results: [number, string][]): Record<string, unknown> {
  return {
    round,
    draft: `draft-${String(round)}.md`,
    at: "2026-11-20T16:00:00.000Z",
    verdicts: [{ reviewer: "simulation", verdict: results.some(([, result]) => result === "FAIL") ? "CHANGES" : "PASS" }],
    cases: results.map(([number, result]) => ({ case: number, result })),
  }
}

/**
 * A process in `review` with these rounds already on the board, these reviewers installed, these cases stored and the
 * draft of the next round.
 */
export function prepare(project: string, recorded: Record<string, unknown>[], reviewers: string[], cases: number[]): void {
  writeProcess(project, "review", recorded.length === 0 ? {} : { rounds: recorded })
  installReviewers(project, reviewers)
  writeDrafts(project, [recorded.length + 1])
  writeCases(project, cases)
}

/** The second entry on the board, which is the process the tests record rounds for. */
export function entry(project: string): Record<string, unknown> {
  return processes(project)[1] ?? {}
}

/** The round entries of the process on the board. */
export function rounds(project: string): Record<string, unknown>[] {
  const list: unknown = entry(project).rounds
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : []
}

/** Moves the process from `approval` or `rework` back to `review`, as a person and the step `Rework the draft` do. */
export function backToReview(project: string): void {
  if (entry(project).stage === "approval") runCommand(project, ["move", processId, "rework"])
  runCommand(project, ["move", processId, "review"])
}
