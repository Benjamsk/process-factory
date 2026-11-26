import { existsSync } from "node:fs"
import path from "node:path"
import { documentHtml, escapeHtml, numberedItem, organisationAddress } from "./reading-view.mjs"
import { isEditable, roundFindings } from "./review.mjs"
import { caseNumbers, changeListFile, newestQuestionsNumber, openSpecSections } from "./state-machine.mjs"
import {
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

/** The stage history of a process as a timeline: one item per element of its history on the board, oldest first, an edit with the file and the person. */
function panelTimeline(entry) {
  const history = Array.isArray(entry.history) ? entry.history : []
  if (history.length === 0) return "<p>No stage is recorded.</p>"
  const items = history.map((moved) => {
    const edited = moved.edited === undefined ? "" : `, ${boardText(moved.edited)} edited by ${boardText(moved.by)}`
    return `<li><time>${boardText(moved.at)}</time> ${boardText(moved.stage)}${edited}</li>`
  })
  return `<ol>\n${items.join("\n")}\n</ol>`
}

/** The link of the panel that opens the edit page of a file of a process. */
function editLink(id, name) {
  return `<p><a href="${organisationAddress(id, "edit", name)}">Edit ${name}</a></p>`
}

/** Every case of a process in the panel: one article per file `case-<n>.md`, in ascending order of `<n>`, each with its edit link when `editId` names the process. */
function panelCases(folder, editId) {
  const numbers = caseNumbers(folder)
  if (numbers.length === 0) return "<p>No case yet.</p>"
  return numbers
    .map((number) => {
      const link = editId === null ? "" : `${editLink(editId, `case-${number}.md`)}\n`
      return `<article>\n${link}${documentHtml(fileLines(path.join(folder, "cases", `case-${number}.md`)) ?? [], 3)}\n</article>`
    })
    .join("\n")
}

/** The newest draft of a process in the panel: its name and its document. */
function panelDraft(folder) {
  const number = newestDraftNumber(folder)
  if (number === null) return "<p>No draft yet.</p>"
  return `<p>draft-${number}.md</p>\n${documentHtml(fileLines(path.join(folder, "drafts", `draft-${number}.md`)) ?? [], 3)}`
}

/** The findings of a reviewer of a round in the panel: one item per tagged line of its file, without the `- ` of the line. */
function panelFindings(roundFolder, reviewer) {
  const found = roundFindings(roundFolder, reviewer)
  if (found === null) return "<p>The findings file cannot be read.</p>"
  if (found.length === 0) return "<p>No findings.</p>"
  return `<ul>\n${found.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("\n")}\n</ul>`
}

/** One recorded round in the panel: its draft, when it was recorded, why it stopped the loop, the verdict and the findings of each reviewer and the result of each case. */
function panelRound(id, round) {
  const roundFolder = `processes/${id}/rounds/round-${round.round}`
  const facts = [`<dt>Draft</dt><dd>${boardText(round.draft)}</dd>`, `<dt>Recorded at</dt><dd>${boardText(round.at)}</dd>`]
  if (round.stopped !== undefined) facts.push(`<dt>Stopped</dt><dd>${boardText(round.stopped)}</dd>`)
  const reviews = (round.verdicts ?? []).flatMap((given) => [`<h5>${boardText(given.reviewer)}: ${boardText(given.verdict)}</h5>`, panelFindings(roundFolder, given.reviewer)])
  const results = Array.isArray(round.cases) ? round.cases.map((stored) => `case ${boardText(stored.case)} ${boardText(stored.result)}`) : []
  const cases = results.length === 0 ? [] : ["<h5>Cases</h5>", `<p>${results.join(", ")}</p>`]
  return ["<article>", `<h4>Round ${round.round}</h4>`, "<dl>", ...facts, "</dl>", ...reviews, ...cases, "</article>"].join("\n")
}

/** The recorded rounds of a process in the panel, the newest first, without an element of the board whose round is no number of a round. */
function panelRounds(entry) {
  const rounds = (Array.isArray(entry.rounds) ? entry.rounds : []).filter((round) => Number.isInteger(round.round) && round.round >= 1)
  if (rounds.length === 0) return "<p>No round is recorded.</p>"
  return rounds
    .reverse()
    .map((round) => panelRound(entry.id, round))
    .join("\n")
}

/** The published versions of a process in the panel: one row per version of the board with the facts it records. */
function panelVersions(entry) {
  const versions = Array.isArray(entry.versions) ? entry.versions : []
  if (versions.length === 0) return "<p>No version is published.</p>"
  const rows = versions.map(
    (stored) =>
      `<tr><td>${boardText(stored.version)}</td><td>${boardText(stored.draft)}</td><td>${boardText(stored.approvedBy ?? notRecorded)}</td><td>${boardText(stored.at)}</td></tr>`,
  )
  return `<table>\n<tr><th>Version</th><th>Draft</th><th>Approved by</th><th>Approved at</th></tr>\n${rows.join("\n")}\n</table>`
}

/** The open feedback of a process in the panel: one article per open file, with its version, what it is about, its kind and its whole text. */
function panelFeedback(id) {
  const open = openFeedbackFiles(id)
  if (open.length === 0) return "<p>No open feedback.</p>"
  return open
    .map(({ number, file }) =>
      [
        "<article>",
        `<h4>Feedback ${number}</h4>`,
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

/** The form of the panel that stores an answer to every open question of a process in `clarify`. */
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

/** The form of the panel that accepts the specification of a process in `spec`. */
function acceptForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "accept-spec")}">`,
    "<p>Every section of the specification is decided. Read it under Specification before you accept it.</p>",
    '<p><button type="submit">Accept the specification</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel in which the owner of a process in `approval` approves its newest draft and publishes it. */
function approveForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "approve")}">`,
    '<p><label for="by">Your full name</label>',
    '<input id="by" name="by" required></p>',
    '<p><button type="submit">Approve and publish</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel that sends the draft of a process in `approval` back for one more round, with a note. */
function sendBackForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "send-back")}">`,
    '<p><label for="note">What must change in the draft</label>',
    '<textarea id="note" name="note" rows="6" required></textarea></p>',
    '<p><button type="submit">Send back for one more round</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel that starts a regeneration of a published process. */
function regenerateForm(id) {
  return [
    `<form method="post" action="${organisationAddress(id, "regenerate")}">`,
    "<p>A regeneration writes the published document again with only the changes that open feedback, new cases and changed dependencies ask for. The command line refuses it when there is none of these.</p>",
    '<p><button type="submit">Start a regeneration</button></p>',
    "</form>",
  ].join("\n")
}

/** What the panel of a process in `approval` says about its approval: the approve form, or why its draft cannot be approved here. */
function approvalPart(entry, folder) {
  const number = newestDraftNumber(folder)
  if (entry.owner === undefined) return `<p>This process has no owner, so its draft cannot be approved here. /process next ${entry.id} in Claude Code names one.</p>`
  if (existsSync(path.join(folder, "versions", `approval-draft-${number}.md`))) {
    return `<p>draft-${number}.md is already approved. /process next ${entry.id} in Claude Code publishes it.</p>`
  }
  const changes = entry.regeneration === undefined ? null : fileLines(storePath(changeListFile(entry.id, number)))
  const shown = changes === null ? [] : [`<p>changes-${number}.md</p>`, documentHtml(changes, 3)]
  return [...shown, approveForm(entry.id)].join("\n")
}

/** What the panel asks the person who waits for a process to decide, or null when the process waits for nobody. */
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

/** The panel of one process: where it stands, links to the decision it waits for and to its seven parts, and each of them as the store has it at this moment. */
export function processPanel(entry) {
  const folder = storePath("processes", entry.id)
  const spec = fileLines(path.join(folder, "spec.md"))
  const decision = decisionPart(entry, folder)
  const waits = `<p>After a decision the process waits in its new stage until /process next ${entry.id} is run in Claude Code.</p>`
  const editId = isEditable(entry) ? entry.id : null
  const specHtml = spec === null ? "<p>No specification yet.</p>" : `${editId === null ? "" : `${editLink(editId, "spec.md")}\n`}${documentHtml(spec, 3)}`
  const parts = [
    ...(decision === null ? [] : [["decision", "Decision", `${decision}\n${waits}`]]),
    ["timeline", "Timeline", panelTimeline(entry)],
    ["spec", "Specification", specHtml],
    ["cases", "Cases", panelCases(folder, editId)],
    ["draft", "Draft", panelDraft(folder)],
    ["rounds", "Rounds", panelRounds(entry)],
    ["versions", "Versions", panelVersions(entry)],
    ["feedback", "Open feedback", panelFeedback(entry.id)],
  ]
  return [
    "<aside>",
    `<p><a href="${organisationAddress()}">Close</a></p>`,
    `<h2>${boardText(entry.title)}</h2>`,
    `<p>${boardText(entry.id)}</p>`,
    "<p>The dashboard does not reload while a process is open. Load the page again to see what has changed.</p>",
    "<dl>",
    `<dt>Stage</dt><dd>${boardText(entry.stage)}</dd>`,
    `<dt>Owner</dt><dd>${boardText(entry.owner ?? notRecorded)}</dd>`,
    "</dl>",
    ...needsDraftMark(entry),
    "<nav>",
    "<ul>",
    ...parts.map(([id, heading]) => `<li><a href="#${id}">${heading}</a></li>`),
    "</ul>",
    "</nav>",
    ...parts.map(([id, heading, html]) => `<section id="${id}">\n<h3>${heading}</h3>\n${html}\n</section>`),
    "</aside>",
  ].join("\n")
}
