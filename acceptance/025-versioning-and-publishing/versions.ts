import { processes, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { approve, kari, prepareApproval, processFolder, processId } from "../024-named-owner-and-approval/approval.ts"

export const specText = "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n\n- Role: Data protection officer\n"
export const versionFolder = (number: number): string => `${processFolder}/versions/${String(number)}`

/** The text of `case-<n>.md` as the tests store it. */
export function caseText(number: number): string {
  return `# Case ${String(number)}: The laptop is lost on a train\n\nStored case ${String(number)}.\n`
}

/** Writes `spec.md` and the cases `case-<n>.md` with these numbers. */
export function writeSpecAndCases(project: string, cases: number[] = [1, 2]): void {
  writeFile(project, `${processFolder}/spec.md`, specText)
  for (const number of cases) {
    writeFile(project, `${processFolder}/cases/case-${String(number)}.md`, caseText(number))
  }
}

/** The process of the criteria: in `approval`, with the drafts 1 to 3, a `spec.md`, two cases and Kari Nordmann's approval of `draft-3.md`. */
export function prepareApproved(project: string): void {
  prepareApproval(project)
  writeSpecAndCases(project)
  approve(project, kari)
}

/** Runs `move <process-id> published`. */
export function publish(project: string) {
  return runCommand(project, ["move", processId, "published"])
}

/** Moves the published process through `regenerate` and `review` back to `approval`. */
export function backToApproval(project: string): void {
  for (const stage of ["regenerate", "review", "approval"]) {
    runCommand(project, ["move", processId, stage])
  }
}

/** The board entry of the process, the second on the board. */
export function ownStored(project: string): Record<string, unknown> | undefined {
  return processes(project)[1]
}

/** The list under `versions` of the board entry of the process, or an empty list when it has none. */
export function storedVersions(project: string): Record<string, unknown>[] {
  const list: unknown = ownStored(project)?.versions
  return Array.isArray(list) ? list.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : []
}
