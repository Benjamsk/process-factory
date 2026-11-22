import { runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"

export const processId = "001-handle-a-lost-laptop"
export const processFolder = `processes/${processId}`
export const versionsFolder = `${processFolder}/versions`
export const rolesFile = "organisation/roles.md"
export const kari = "Kari Nordmann"
export const officerSection = "## Data protection officer\n\nKari Nordmann is the data protection officer. Ola Hansen steps in when she is away.\n"
export const exampleSection = "## Example: Head of IT\n\nPer Olsen is the head of IT.\n"
/** The `organisation/roles.md` of the acceptance criteria: one real section and one example section. */
export const rolesText = `# Roles\n\nThe roles in the organisation.\n\n${officerSection}\n${exampleSection}`
export const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
export const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n'

export const olderEntry = { id: "000-older-process", title: "Older process", stage: "published", history: [{ at: "2026-11-19T09:00:00.000Z", stage: "published" }] }

/** The board entry of the process in `stage`, with further keys in `more`. */
export function ownEntry(stage: string, more: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: processId, title: "Handle a lost laptop", stage, history: [{ at: "2026-11-20T17:00:00.000Z", stage }], ...more }
}

/** Writes `organisation/roles.md` and a board with an older process and the process in `stage`, with further keys in `more`. */
export function writeProcess(project: string, stage: string, more: Record<string, unknown> = {}): void {
  writeFile(project, rolesFile, rolesText)
  writeBoard(project, [olderEntry, ownEntry(stage, more)])
}

/** Writes the drafts `draft-<n>.md` with these numbers. */
export function writeDrafts(project: string, numbers: number[]): void {
  for (const number of numbers) {
    writeFile(project, `${processFolder}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\nDraft ${String(number)}.\n`)
  }
}

/** A process in `approval` that Kari Nordmann owns, with these drafts. */
export function prepareApproval(project: string, drafts: number[] = [1, 2, 3]): void {
  writeProcess(project, "approval", { owner: kari })
  writeDrafts(project, drafts)
}

/** Runs `approve` for the process with this name after `--by`. */
export function approve(project: string, by: string) {
  return runCommand(project, ["approve", processId, "--by", by])
}

/** The path of the approval file of `draft-<n>.md`. */
export function approvalFile(number: number): string {
  return `${versionsFolder}/approval-draft-${String(number)}.md`
}

/** The standard error of a refused `approve` with this reason. */
export function cannotApprove(reason: string): string {
  return `process-factory: cannot approve ${processId}: ${reason}\n`
}
