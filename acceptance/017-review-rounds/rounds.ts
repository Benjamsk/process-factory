import { writeBoard, writeFile } from "../006-process-state-machine/store.ts"

export const processId = "001-handle-a-lost-laptop"
export const processFolder = `processes/${processId}`
export const installedFolder = ".claude/skills/process"
export const reviewerTemplate = "templates/skills/process/reviewer.md"
export const draftWriterTemplate = "templates/skills/process/draft-writer.md"
export const enteredReview = { at: "2026-11-20T15:40:02.456Z", stage: "review" }
export const staysLine = `process-factory: ${processId} stays in review: /process next ${processId} runs a new round`

/** A findings file in the form of `reviewer.md`: the verdict on line 3 and one finding per tag from line 5 on. */
export function findings(name: string, verdict: string, tags: string[]): string {
  const lines = tags.length === 0 ? "No findings.\n" : tags.map((tag) => `- [${tag}] Step 3: the deadline is missing.\n`).join("")
  return `# ${name} review of draft-1.md\n\nVerdict: ${verdict}\n\n${lines}`
}

/** Writes a board with the one process in `stage`, with further keys of its entry in `more`. */
export function writeProcess(project: string, stage = "review", more: Record<string, unknown> = {}): void {
  writeBoard(project, [
    { id: "000-older-process", title: "Older process", stage: "published", owner: "Kari" },
    { id: processId, title: "Handle a lost laptop", stage, history: [enteredReview], owner: "Ola", ...more },
  ])
}

/** Installs these reviewers next to the skill, as `<name>-reviewer.md`, with `reviewer.md` beside them. */
export function installReviewers(project: string, names: string[]): void {
  writeFile(project, `${installedFolder}/reviewer.md`, "# Reviewer\n")
  for (const name of names) {
    writeFile(project, `${installedFolder}/${name}-reviewer.md`, `# ${name} reviewer\n`)
  }
}

/** Writes the drafts `draft-<n>.md` with these numbers. */
export function writeDrafts(project: string, numbers: number[]): void {
  for (const number of numbers) {
    writeFile(project, `${processFolder}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\nDraft ${String(number)}.\n`)
  }
}

/** Writes one file in the folder `round-<n>` of the process. */
export function writeFindings(project: string, round: number, file: string, content: string): void {
  writeFile(project, `${processFolder}/rounds/round-${String(round)}/${file}`, content)
}

/** A process in `review` with the reviewers legal and readability installed and `draft-1.md`. */
export function prepareReview(project: string): void {
  writeProcess(project)
  installReviewers(project, ["legal", "readability"])
  writeDrafts(project, [1])
}

/** The standard error of a refusal of round `round` that names these files with their reasons. */
export function refusal(round: number, reasons: [string, string][]): string {
  const first = `process-factory: cannot record round ${String(round)} of ${processId}: these findings files in ${processFolder}/rounds/round-${String(round)} are missing or malformed`
  return `${[first, ...reasons.map(([file, reason]) => `  ${file}: ${reason}`), staysLine].join("\n")}\n`
}
