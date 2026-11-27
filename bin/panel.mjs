import { existsSync } from "node:fs"
import path from "node:path"
import { documentHtml, escapeHtml, numberedItem, organisationAddress } from "./reading-view.mjs"
import { isEditable, roundFindings } from "./review.mjs"
import { caseNumbers, changeListFile, newestQuestionsNumber, openSpecSections } from "./state-machine.mjs"
import {
  draftNumbers,
  editedNames,
  feedbackAbout,
  feedbackTextLine,
  fileLines,
  labelledValue,
  newestDraftNumber,
  notRecorded,
  openFeedbackFiles,
  sectionLines,
  storePath,
} from "./store.mjs"

/** The eight parts of the page of a process, in their order, each with the id of its address and its heading. */
export const processParts = [
  ["decision", "Decision"],
  ["timeline", "Timeline"],
  ["spec", "Specification"],
  ["cases", "Cases"],
  ["draft", "Draft"],
  ["rounds", "Rounds"],
  ["versions", "Versions"],
  ["feedback", "Open feedback"],
]

/** A value the board records as escaped text, also when it is a number. */
export function boardText(value) {
  return escapeHtml(String(value))
}

/**
 * The open questions of a process: the number of its newest `questions-<n>.md` that has no `answers-<n>.md`, and the
 * number and the text of every numbered item under `## Questions` of that file. The number is null when there is none.
 */
export function openQuestions(id) {
  const folder = storePath("processes", id)
  const number = newestQuestionsNumber(folder)
  if (number === null || existsSync(path.join(folder, `answers-${number}.md`))) return { number: null, questions: [] }
  const lines = fileLines(path.join(folder, `questions-${number}.md`))
  const body = lines === null ? null : sectionLines(lines, "Questions")
  const questions = (body ?? []).flatMap((line) => {
    const item = numberedItem(line)
    return item === null ? [] : [{ number: item[1], text: item[2] }]
  })
  return { number, questions }
}

/** The mark of a process that needs a new draft, with the files it was edited since, or nothing when it has none. */
export function needsDraftMark(entry) {
  const names = editedNames(entry)
  return names.length === 0 ? [] : [`<p>Needs a new draft: ${names.map(boardText).join(", ")}</p>`]
}

/** Whether the newest draft of a process is approved already: its approval file stands in the folder `versions`. */
function isNewestDraftApproved(folder) {
  return existsSync(path.join(folder, "versions", `approval-draft-${newestDraftNumber(folder)}.md`))
}

/** The line that says who a process waits for: a person who decides, its owner, nobody, or Claude Code for every other process. */
export function turnLine(entry) {
  const folder = storePath("processes", entry.id)
  if (entry.stage === "clarify" && openQuestions(entry.id).questions.length > 0) return "<p>Waits for a person: answer the open questions.</p>"
  if (entry.stage === "spec" && openSpecSections(folder).length === 0) return "<p>Waits for a person: accept the specification.</p>"
  if (entry.stage === "approval" && entry.owner !== undefined && !isNewestDraftApproved(folder)) return "<p>Waits for the owner: approve the draft or send it back.</p>"
  if (entry.stage === "published") return "<p>Waits for nobody: the process is published.</p>"
  return `<p>Waits for Claude Code: /process next ${boardText(entry.id)}.</p>`
}

/** A verdict or a case result as a badge: the mark `done` for `PASS`, `stop` for `CHANGES` and `FAIL`, and no mark for every other word. */
function stateBadge(word) {
  const stop = word === "CHANGES" || word === "FAIL"
  const mark = word === "PASS" ? " done" : stop ? " stop" : ""
  return `<span class="badge${mark}">${boardText(word)}</span>`
}

/** The stage history of a process as a timeline: one item per element of its history on the board, oldest first, an edit with the file and the person. */
function timelinePart(entry) {
  const history = Array.isArray(entry.history) ? entry.history : []
  if (history.length === 0) return "<p>No stage is recorded.</p>"
  const items = history.map((moved) => {
    const edited = moved.edited === undefined ? "" : `, ${boardText(moved.edited)} edited by ${boardText(moved.by)}`
    return `<li><time>${boardText(moved.at)}</time> ${boardText(moved.stage)}${edited}</li>`
  })
  return `<ol>\n${items.join("\n")}\n</ol>`
}

/** The link that opens the edit page of a file of a process. */
function editLink(id, name) {
  return `<p><a href="${organisationAddress(id, "edit", name)}">Edit ${name}</a></p>`
}

/** The specification of a process, with its edit link above it under the rule of `isEditable`. */
function specificationPart(entry, folder) {
  const lines = fileLines(path.join(folder, "spec.md"))
  if (lines === null) return "<p>No specification yet.</p>"
  const link = isEditable(entry) ? `${editLink(entry.id, "spec.md")}\n` : ""
  return `${link}${documentHtml(lines, 2)}`
}

/** Every case of a process: one article per file `case-<n>.md`, in ascending order of `<n>`, each with its edit link under the rule of `isEditable`. */
function casesPart(entry, folder) {
  const numbers = caseNumbers(folder)
  if (numbers.length === 0) return "<p>No case yet.</p>"
  const editId = isEditable(entry) ? entry.id : null
  return numbers
    .map((number) => {
      const link = editId === null ? "" : `${editLink(editId, `case-${number}.md`)}\n`
      return `<article>\n${link}${documentHtml(fileLines(path.join(folder, "cases", `case-${number}.md`)) ?? [], 2)}\n</article>`
    })
    .join("\n")
}

/** The rounds of the board that reviewed `draft-<n>.md`, each as `round <r>`, or that no round reviewed it yet. */
function reviewedIn(entry, number) {
  const rounds = (Array.isArray(entry.rounds) ? entry.rounds : []).filter((round) => round.draft === `draft-${number}.md`)
  return rounds.length === 0 ? "no round yet" : rounds.map((round) => `round ${boardText(round.round)}`).join(", ")
}

/**
 * The drafts of a process: every draft as a link, the newest first, then the number of the chosen draft, the rounds
 * that reviewed it and its document. The chosen draft is `number`, or the newest when `number` is undefined. It is
 * null when `number` is no draft of the process.
 */
function draftsPart(entry, folder, number) {
  const numbers = draftNumbers(folder)
  const chosen = number ?? numbers.at(-1)
  if (chosen === undefined) return "<p>No draft yet.</p>"
  if (!numbers.includes(chosen)) return null
  const items = [...numbers].reverse().map((found) => {
    const current = found === chosen ? ' aria-current="page"' : ""
    return `<li><a href="${organisationAddress(entry.id, "draft", found)}"${current}>draft-${found}.md</a></li>`
  })
  return [
    `<ul>\n${items.join("\n")}\n</ul>`,
    `<dl>\n<dt>Draft</dt><dd>${chosen}</dd>\n<dt>Reviewed in</dt><dd>${reviewedIn(entry, chosen)}</dd>\n</dl>`,
    documentHtml(fileLines(path.join(folder, "drafts", `draft-${chosen}.md`)) ?? [], 2),
  ].join("\n")
}

/** The findings of a reviewer of a round: one item per tagged line of its file, without the `- ` of the line. */
function reviewerFindings(roundFolder, reviewer) {
  const found = roundFindings(roundFolder, reviewer)
  if (found === null) return "<p>The findings file cannot be read.</p>"
  if (found.length === 0) return "<p>No findings.</p>"
  return `<ul>\n${found.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("\n")}\n</ul>`
}

/** One recorded round: its draft, when it was recorded, why it stopped the loop, the verdict and the findings of each reviewer and the result of each case. */
function recordedRound(id, round) {
  const roundFolder = `processes/${id}/rounds/round-${round.round}`
  const facts = [`<dt>Draft</dt><dd>${boardText(round.draft)}</dd>`, `<dt>Recorded at</dt><dd>${boardText(round.at)}</dd>`]
  if (round.stopped !== undefined) facts.push(`<dt>Stopped</dt><dd>${boardText(round.stopped)}</dd>`)
  const reviews = (round.verdicts ?? []).flatMap((given) => [`<h4>${boardText(given.reviewer)}: ${stateBadge(given.verdict)}</h4>`, reviewerFindings(roundFolder, given.reviewer)])
  const results = Array.isArray(round.cases) ? round.cases.map((stored) => `case ${boardText(stored.case)} ${stateBadge(stored.result)}`) : []
  const cases = results.length === 0 ? [] : ["<h4>Cases</h4>", `<p>${results.join(", ")}</p>`]
  return ["<article>", `<h3>Round ${round.round}</h3>`, "<dl>", ...facts, "</dl>", ...reviews, ...cases, "</article>"].join("\n")
}

/** The recorded rounds of a process, the newest first, without an element of the board whose round is no number of a round. */
function roundsPart(entry) {
  const rounds = (Array.isArray(entry.rounds) ? entry.rounds : []).filter((round) => Number.isInteger(round.round) && round.round >= 1)
  if (rounds.length === 0) return "<p>No round is recorded.</p>"
  return rounds
    .reverse()
    .map((round) => recordedRound(entry.id, round))
    .join("\n")
}

/** The published versions of a process: one row per version of the board with the facts it records. */
function versionsPart(entry) {
  const versions = Array.isArray(entry.versions) ? entry.versions : []
  if (versions.length === 0) return "<p>No version is published.</p>"
  const rows = versions.map(
    (stored) =>
      `<tr><td>${boardText(stored.version)}</td><td>${boardText(stored.draft)}</td><td>${boardText(stored.approvedBy ?? notRecorded)}</td><td>${boardText(stored.at)}</td></tr>`,
  )
  return `<table>\n<tr><th>Version</th><th>Draft</th><th>Approved by</th><th>Approved at</th></tr>\n${rows.join("\n")}\n</table>`
}

/** The open feedback of a process: one article per open file, with its version, what it is about, its kind and its whole text. */
function feedbackPart(id) {
  const open = openFeedbackFiles(id)
  if (open.length === 0) return "<p>No open feedback.</p>"
  return open
    .map(({ number, file }) =>
      [
        "<article>",
        `<h3>Feedback ${number}</h3>`,
        "<dl>",
        `<dt>Version</dt><dd>${escapeHtml(labelledValue(file, "Version") ?? notRecorded)}</dd>`,
        `<dt>About</dt><dd>${escapeHtml(feedbackAbout(file))}</dd>`,
        `<dt>Kind</dt><dd>${escapeHtml(labelledValue(file, "Kind") ?? notRecorded)}</dd>`,
        "</dl>",
        `<p>${escapeHtml(feedbackTextLine(file))}</p>`,
        "</article>",
      ].join("\n"),
    )
    .join("\n")
}

/** The form that stores an answer to every open question of a process in `clarify`. */
function answerForm(id, questions) {
  const fields = questions.map(
    ({ number, text }) =>
      `<p><label for="answer-${number}">${number}. ${escapeHtml(text)}</label>\n<textarea id="answer-${number}" name="answer-${number}" rows="4"></textarea></p>`,
  )
  return [
    `<form method="post" action="${organisationAddress(id, "answer")}">`,
    ...fields,
    "<p>A field left empty is stored as Not known.</p>",
    '<p><button type="submit">Store the answers</button></p>',
    "</form>",
  ].join("\n")
}

/** The form that accepts the specification of a process in `spec`. */
function acceptForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "accept-spec")}">`,
    "<p>Every section of the specification is decided. Read it under Specification before you accept it.</p>",
    '<p><button type="submit">Accept the specification</button></p>',
    "</form>",
  ].join("\n")
}

/** The form in which the owner of a process in `approval` approves its newest draft and publishes it. */
function approveForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "approve")}">`,
    '<p><label for="by">Your full name</label>',
    '<input id="by" name="by" required></p>',
    '<p><button type="submit">Approve and publish</button></p>',
    "</form>",
  ].join("\n")
}

/** The form that sends the draft of a process in `approval` back for one more round, with a note. */
function sendBackForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "send-back")}">`,
    '<p><label for="note">What must change in the draft</label>',
    '<textarea id="note" name="note" rows="6" required></textarea></p>',
    '<p><button type="submit">Send back for one more round</button></p>',
    "</form>",
  ].join("\n")
}

/** The form that starts a regeneration of a published process. */
function regenerateForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "regenerate")}">`,
    "<p>A regeneration writes the published document again with only the changes that open feedback, new cases and changed dependencies ask for. The command line refuses it when there is none of these.</p>",
    '<p><button type="submit">Start a regeneration</button></p>',
    "</form>",
  ].join("\n")
}

/** What the decision of a process in `approval` says about its approval: the approve form, or why its draft cannot be approved here. */
function approvalPart(entry, folder) {
  const number = newestDraftNumber(folder)
  if (entry.owner === undefined) return `<p>This process has no owner, so its draft cannot be approved here. /process next ${entry.id} in Claude Code names one.</p>`
  if (isNewestDraftApproved(folder)) return `<p>draft-${number}.md is already approved. /process next ${entry.id} in Claude Code publishes it.</p>`
  const changes = entry.regeneration === undefined ? null : fileLines(storePath(changeListFile(entry.id, number)))
  const shown = changes === null ? [] : [`<p>changes-${number}.md</p>`, documentHtml(changes, 2)]
  return [...shown, approveForm(entry.id)].join("\n")
}

/** What the page asks the person who waits for a process to decide, or null when the process waits for nobody. */
function decisionPart(entry, folder) {
  if (entry.stage === "clarify") {
    const { questions } = openQuestions(entry.id)
    return questions.length === 0 ? null : answerForm(entry.id, questions)
  }
  if (entry.stage === "spec") return openSpecSections(folder).length === 0 ? acceptForm(entry.id) : null
  if (entry.stage === "approval") return [approvalPart(entry, folder), sendBackForm(entry.id)].join("\n")
  if (entry.stage === "published") return regenerateForm(entry.id)
  return null
}

/** One part of the page of a process as the store has it at this moment, and whether it holds a form: the decision, the timeline, the specification, the cases, a draft, the rounds, the versions or the open feedback. */
export function processPart(entry, id, number) {
  const folder = storePath("processes", entry.id)
  if (id === "decision") {
    const decision = decisionPart(entry, folder)
    if (decision === null) return { html: "<p>There is nothing to decide here now.</p>", hasForm: false }
    const waits = `<p>After a decision the process waits in its new stage until /process next ${entry.id} is run in Claude Code.</p>`
    return { html: `${decision}\n${waits}`, hasForm: true }
  }
  const html = {
    timeline: () => timelinePart(entry),
    spec: () => specificationPart(entry, folder),
    cases: () => casesPart(entry, folder),
    draft: () => draftsPart(entry, folder, number),
    rounds: () => roundsPart(entry),
    versions: () => versionsPart(entry),
    feedback: () => feedbackPart(entry.id),
  }[id]()
  return html === null ? null : { html, hasForm: false }
}
