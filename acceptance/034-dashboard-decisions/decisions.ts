import path from "node:path"
import { processes, root, runInProject, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { kari, ownEntry, processFolder, processId, rolesFile, rolesText, writeDrafts } from "../024-named-owner-and-approval/approval.ts"
import { compact } from "../026-reading-view-on-localhost/view.ts"
import { answeredQuestion, firstQuestion, questionsText, round, secondQuestion } from "../032-dashboard-on-localhost/dashboard.ts"

export const ownerFile = `${processFolder}/rounds/round-2/owner.md`
export const firstLine = "Step 3 must name the IT manager."
export const secondLine = "Shorten the first section."
export const waitSentence = `<p>After a decision the process waits in its new stage until /process next ${processId} is run in Claude Code.</p>`
export const notDone = "<h1>Not done</h1>"
export const backLink = `<p><a href="/${processId}">Back to the process</a></p>`
export const acceptForm = `
  <form method="post" action="/${processId}/accept-spec">
  <p>Every section of the specification is decided. Read it under Specification before you accept it.</p>
  <p><button type="submit">Accept the specification</button></p>
  </form>`
export const approveForm = `
  <form method="post" action="/${processId}/approve">
  <p><label for="by">Your full name</label>
  <input id="by" name="by" required></p>
  <p><button type="submit">Approve and publish</button></p>
  </form>`
export const sendBackForm = `
  <form method="post" action="/${processId}/send-back">
  <p><label for="note">What must change in the draft</label>
  <textarea id="note" name="note" rows="6" required></textarea></p>
  <p><button type="submit">Send back for one more round</button></p>
  </form>`
export const regenerateForm = `
  <form method="post" action="/${processId}/regenerate">
  <p>A regeneration writes the published document again with only the changes that open feedback, new cases and changed dependencies ask for. The command line refuses it when there is none of these.</p>
  <p><button type="submit">Start a regeneration</button></p>
  </form>`

/** The answer form of the spec for these questions, numbered from 1, each already escaped. */
export function answerForm(questions: string[]): string {
  const fields = questions.map((question, index) => {
    const number = String(index + 1)
    return `<p><label for="answer-${number}">${number}. ${question}</label>\n<textarea id="answer-${number}" name="answer-${number}" rows="4"></textarea></p>`
  })
  return [
    `<form method="post" action="/${processId}/answer">`,
    ...fields,
    "<p>A field left empty is stored as Not known.</p>",
    '<p><button type="submit">Store the answers</button></p>',
    "</form>",
  ].join("\n")
}

/** What the part Decision of the page of a process is when nobody has to decide. */
export const nothingToDecide = "<h2>Decision</h2><p>There is nothing to decide here now.</p>"

/** What stands inside the part Decision of the page of a process with these parts, without the whitespace between its elements. */
export function decision(...parts: string[]): string {
  return compact(["<h2>Decision</h2>", ...parts, waitSentence].join("\n"))
}

/** Writes `organisation/roles.md` and a board with the one process in `stage`, owned by Kari Nordmann unless `more` says otherwise. */
export function writeStore(project: string, stage: string, more: Record<string, unknown> = {}): void {
  writeFile(project, rolesFile, rolesText)
  writeBoard(project, [ownEntry(stage, { owner: kari, ...more })])
}

/** The process in `clarify` with an answered `questions-1.md` and a `questions-2.md` of these questions without answers. */
export function prepareClarify(project: string, questions: string[] = [firstQuestion, secondQuestion]): void {
  writeStore(project, "clarify")
  writeFile(project, `${processFolder}/questions-1.md`, questionsText(1, [answeredQuestion]))
  writeFile(project, `${processFolder}/answers-1.md`, "# Answers 1\n\n## 1. Who reports a lost laptop?\n\nWhoever lost it.\n")
  writeFile(project, `${processFolder}/questions-2.md`, questionsText(2, questions))
}

/** The process in `approval` with the recorded rounds 1 and 2 and these drafts, of which none is approved. */
export function prepareApproval(project: string, more: Record<string, unknown> = {}, drafts: number[] = [1, 2]): void {
  writeStore(project, "approval", { rounds: [round(1), round(2)], ...more })
  writeDrafts(project, drafts)
}

/** The process as published version 1, with nothing to regenerate it for. */
export function preparePublishedQuiet(project: string): void {
  writeStore(project, "published", { versions: [{ version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-11-21T09:00:00.000Z" }] })
  writeDrafts(project, [1])
  writeFile(project, `${processFolder}/versions/1/process.md`, "# Handle a lost laptop\n\nDraft 1.\n")
}

/** The board entry of the process, or an empty record when it is not on the board. */
export function ownProcess(project: string): Record<string, unknown> {
  return processes(project).find((entry) => entry.id === processId) ?? {}
}

/** Runs the repository's command line in the project of `project`, the folder of an organisation, with a text on standard input. */
export function runWithInput(project: string, args: string[], input: string) {
  return runInProject(project, path.join(root, "bin/process-factory.mjs"), args, input)
}
