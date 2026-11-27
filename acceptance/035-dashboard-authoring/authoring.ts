import { runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { kari, ownEntry, processFolder, processId, rolesFile, rolesText, writeDrafts } from "../024-named-owner-and-approval/approval.ts"

export const specFile = `${processFolder}/spec.md`
export const oldLine = "The laptop is blocked within 48 hours."
export const firstNewLine = "The laptop is blocked within 24 hours."
export const secondNewLine = "The IT manager confirms it."
/** A specification of which every section is decided, with the line of the spec's example under `Deadlines`. */
export const oldSpec = specText().replace("## Deadlines\n\nStatus: decided\n\nSettled.", `## Deadlines\n\nStatus: decided\n\n${oldLine}`)
/** The same specification with that line replaced by two lines. */
export const newSpec = oldSpec.replace(oldLine, `${firstNewLine}\n${secondNewLine}`)
export const cannotEditSpec = `process-factory: cannot edit spec.md of ${processId}`
export const editAddress = `/${processId}/edit/spec.md`
export const saveAddress = `/${processId}/save/spec.md`
export const backLink = `<a href="/${processId}">Back to the process</a>`
export const needsSentence = "<p>Needs a new draft: spec.md</p>"
export const editSentences =
  "The tab `Specification` of a process in `spec`, `cases`, `draft`, `review`, `rework` or `approval` that is not being regenerated has a link `Edit spec.md` above the specification, and the tab `Cases` a link `Edit case-<n>.md` above each case. The link opens a page with the whole text of the file in one field, and the next page shows every line of the edited text, a removed line marked with `-` and an added line with `+`, and asks for the full name of the person who saves. The dashboard saves through `process-factory edit <process-id> <name> <file> --by \"<person>\"`, where `<name>` is `spec.md` or the `case-<n>.md` of a case that is there and `<file>` holds the new text, or is `-` for standard input. `edit` refuses a name that is not in `organisation/roles.md`, for a process that has an owner every name but the owner's, a text that changes nothing, and for a specification that is accepted a text that leaves a section that is not decided. It replaces the file, records the file, the name and the time in the history of the process on the board, which the tab `Timeline` and `show` display, and marks a process that has a draft as needing a new draft, which the card, the page of the process and `show` say until a draft moves to `review`. A process in `review`, `rework` or `approval` moves back to `draft` with the save, so that `/process next <process-id>` writes a new draft from the edited files."

/** The text of a case file. */
export function caseText(number: number): string {
  return `# Case ${String(number)}: Laptop ${String(number)}\n\n## Situation\n\nThe laptop of case ${String(number)} is lost.\n`
}

/** The path of `case-<n>.md` of the process. */
export function caseFile(number: number): string {
  return `${processFolder}/cases/case-${String(number)}.md`
}

/**
 * Writes `organisation/roles.md` and the one process in `stage`, owned by Kari Nordmann unless `more` says otherwise,
 * with `spec.md` of which every section is decided, the cases 1 and 2 and these drafts.
 */
export function prepare(project: string, stage: string, more: Record<string, unknown> = {}, drafts: number[] = [1, 2]): void {
  writeFile(project, rolesFile, rolesText)
  writeBoard(project, [ownEntry(stage, { owner: kari, ...more })])
  writeFile(project, specFile, oldSpec)
  for (const number of [1, 2]) writeFile(project, caseFile(number), caseText(number))
  writeDrafts(project, drafts)
}

/** Runs `edit` for the process: the name, the file with the new text and the name after `--by`. */
export function edit(project: string, name: string, file: string, by: string = kari) {
  return runCommand(project, ["edit", processId, name, file, "--by", by])
}

/** What stands between `<li>` and `</li>` of every item of a page, in order, as it is. */
export function lineItems(body: string): string[] {
  return [...body.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => match[1] ?? "")
}
