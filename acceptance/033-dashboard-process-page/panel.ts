import { expect } from "vitest"
import { writeFile } from "../006-process-state-machine/store.ts"
import { compact, request } from "../026-reading-view-on-localhost/view.ts"
import { entry, kari, laptopId, laptopTitle } from "../032-dashboard-on-localhost/dashboard.ts"

export const parts: [string, string][] = [
  ["decision", "Decision"],
  ["timeline", "Timeline"],
  ["spec", "Specification"],
  ["cases", "Cases"],
  ["draft", "Draft"],
  ["rounds", "Rounds"],
  ["versions", "Versions"],
  ["feedback", "Open feedback"],
]
export const stillSentence = "<p>This page does not reload, so that what you type is kept. Load it again to see what has changed.</p>"
export const reloadSentence = "<p>This page reloads every 5 seconds.</p>"
export const stopReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr, readability"
export const specText = [
  "# Specification: Handle a lost laptop",
  "",
  "## Trigger",
  "",
  "Status: decided",
  "",
  "An employee reports that a laptop is lost.",
  "",
  "### Detail",
  "",
  "#### Deeper",
  "",
  "## Steps",
  "",
  "1. The employee tells the IT manager.",
  "2. The IT manager blocks the laptop.",
  "",
].join("\n")

/** The address of a part of the page of a process: the address of the process for the decision, and `/<process-id>/<part>` for the other seven. */
export function partAddress(id: string, name: string): string {
  return name === "decision" ? `/${id}` : `/${id}/${name}`
}

/** What stands inside the one `<header>` of a page, or an empty string when the page has none or more than one. */
export function headerOf(body: string): string {
  const found = [...body.matchAll(/<header>(.*?)<\/header>/gs)]
  return found.length === 1 ? (found[0]?.[1] ?? "") : ""
}

/** What stands inside the one `<main>` of a page, or an empty string when the page has none or more than one. */
export function mainOf(body: string): string {
  const found = [...body.matchAll(/<main>(.*?)<\/main>/gs)]
  return found.length === 1 ? (found[0]?.[1] ?? "") : ""
}

/** What stands inside the section of `openPanel` with this id, the `<main>` of the page of that part, without the whitespace between its elements, or `missing`. */
export function part(panel: string, id: string): string {
  const found = new RegExp(`<section id="${id}">(.*?)</section>`, "s").exec(panel)
  return found === null ? "missing" : compact(found[1] ?? "")
}

/**
 * The page of a process, read at the eight addresses of its parts, each of which must answer 200 with one header and
 * one main. `body` is the eight pages after each other. `panel` is the header of the first page and then, per part,
 * what stands inside the `<main>` of its page, wrapped by this helper in `<section id="<part>">` so that `part` finds it.
 */
export async function openPanel(address: string, id: string): Promise<{ body: string; panel: string }> {
  const pages: string[] = []
  const sections: string[] = []
  for (const [name] of parts) {
    const page = await request(address, partAddress(id, name))
    expect(page.status).toBe(200)
    expect(headerOf(page.body)).not.toBe("")
    expect(mainOf(page.body)).not.toBe("")
    pages.push(page.body)
    sections.push(`<section id="${name}">${mainOf(page.body)}</section>`)
  }
  return { body: pages.join("\n"), panel: `${headerOf(pages[0] ?? "")}\n${sections.join("\n")}` }
}

/** The text of a case file with one heading under its title. */
export function caseText(number: number): string {
  return `# Case ${String(number)}: Laptop ${String(number)}\n\n## Situation\n\nThe laptop of case ${String(number)} is lost.\n`
}

/** What a case of `caseText` is in the part Cases. */
export function caseHtml(number: number): string {
  return `<h3>Case ${String(number)}: Laptop ${String(number)}</h3><h4>Situation</h4><p>The laptop of case ${String(number)} is lost.</p>`
}

/** The text of a findings file of a reviewer, with these lines after its verdict. */
export function findingsText(reviewer: string, verdict: string, lines: string[]): string {
  return [`# ${reviewer} review of the draft`, "", `Verdict: ${verdict}`, "", ...lines, ""].join("\n")
}

/** The text of a feedback file as the reading view writes it, with these lines between its heading and its text. */
export function feedbackFile(number: number, lines: string[], text: string): string {
  return [`# Feedback ${String(number)}`, "", ...lines, "", "## Text", "", text, ""].join("\n")
}

/** The board entry of the process of the spec's examples: in `rework`, owned by Kari Nordmann, with three stages, two rounds and two versions. */
export function fullEntry(more: Record<string, unknown> = {}): Record<string, unknown> {
  return entry(laptopId, laptopTitle, "rework", {
    owner: kari,
    history: [
      { at: "2026-11-20T09:00:00.000Z", stage: "intake" },
      { at: "2026-11-20T11:30:00.000Z", stage: "spec" },
      { at: "2026-11-22T10:00:00.000Z", stage: "rework" },
    ],
    rounds: [
      {
        round: 1,
        draft: "draft-1.md",
        at: "2026-11-21T10:00:00.000Z",
        verdicts: [
          { reviewer: "gdpr", verdict: "CHANGES" },
          { reviewer: "legal", verdict: "PASS" },
        ],
        cases: [
          { case: 1, result: "PASS" },
          { case: 3, result: "FAIL" },
          { case: 5, result: "FAIL" },
        ],
      },
      {
        round: 2,
        draft: "draft-2.md",
        at: "2026-11-22T10:00:00.000Z",
        verdicts: [
          { reviewer: "gdpr", verdict: "CHANGES" },
          { reviewer: "legal", verdict: "PASS" },
          { reviewer: "readability", verdict: "CHANGES" },
        ],
        stopped: stopReason,
      },
    ],
    versions: [
      { version: 1, draft: "draft-16.md", approvedBy: "Ingrid Solheim", at: "2026-11-23T09:49:32.525Z" },
      { version: 2, draft: "draft-17.md", at: "2026-11-24T08:00:00.000Z" },
    ],
    ...more,
  })
}

/** Writes the files of the process of `fullEntry`: its specification, four cases, three drafts, the findings of two rounds, a version folder and its feedback. */
export function writeFullFiles(project: string): void {
  const folder = `processes/${laptopId}`
  writeFile(project, `${folder}/spec.md`, specText)
  for (const number of [1, 2, 9, 10]) writeFile(project, `${folder}/cases/case-${String(number)}.md`, caseText(number))
  for (const number of [1, 2, 3]) writeFile(project, `${folder}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\n## Steps\n\n1. Step of draft ${String(number)}.\n`)
  writeFile(
    project,
    `${folder}/rounds/round-1/gdpr.md`,
    findingsText("gdpr", "CHANGES", [
      "- [high] Step 3 does not say who notifies Datatilsynet.",
      "- [medium] Step 5 names no deadline.",
      "A line that is no finding.",
      "- [low] Step 7 uses a word the reader may not know.",
    ]),
  )
  writeFile(project, `${folder}/rounds/round-1/legal.md`, findingsText("legal", "PASS", ["Nothing to report from legal."]))
  writeFile(project, `${folder}/rounds/round-2/gdpr.md`, findingsText("gdpr", "CHANGES", ["- [high] Step 3 still names nobody."]))
  writeFile(project, `${folder}/rounds/round-2/legal.md`, findingsText("legal", "PASS", []))
  writeFile(project, `${folder}/versions/1/process.md`, "# Handle a lost laptop\n\nText of the approved document.\n")
  writeFile(project, `${folder}/feedback/feedback-1.md`, feedbackFile(1, ["Version: 1", "Step: 2", "Kind: document", "From: anonymous", "Status: closed"], "This feedback is closed."))
  writeFile(
    project,
    `${folder}/feedback/feedback-2.md`,
    feedbackFile(2, ["Version: 1", "Step: 4", "Kind: document", "From: Per Hansen", "Status: open"], "I did not understand who to call\nwhen the laptop was stolen abroad."),
  )
  writeFile(project, `${folder}/feedback/feedback-3.md`, feedbackFile(3, ["Status: open"], "A feedback without its facts."))
  writeFile(project, `${folder}/feedback/feedback-10.md`, feedbackFile(10, ["Version: 2", "Step: whole document", "Kind: process", "From: anonymous", "Status: open"], "The process takes too long."))
  writeFile(project, `${folder}/feedback/findings-round-1.md`, "# Findings of round 1\n\nStatus: open\n\n## Text\n\nFindings of a respec.\n")
}
