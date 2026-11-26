import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { boardProcesses, documentHtml, errorPage, escapeHtml, formBodyLimit, htmlPage, isOwnOrigin, numberedItem, readBody, reasonsPage, sendPage } from "./reading-view.mjs"
import {
  allowedMoves,
  caseNumbers,
  changeListFile,
  cleanedText,
  editableText,
  editedPath,
  isEditable,
  isEditableName,
  newestQuestionsNumber,
  openSpecSections,
  roundFindings,
  stagesThatMoveToDraft,
} from "./state-machine.mjs"
import { editedNames, feedbackAbout, feedbackTextLine, fileLines, labelledValue, newestDraftNumber, notRecorded, openFeedbackFiles, sectionLines } from "./store.mjs"

/** The port the dashboard listens on when `--port` names none. */
export const dashboardPort = "4174"
/** What the dashboard adds to those defaults: its ten sections stand next to each other, so the page scrolls sideways on a narrow screen. */
const dashboardStyle = `body { max-width: none; min-width: 100rem; }
section { display: inline-block; vertical-align: top; width: 9rem; margin-right: 1rem; }
h2 { font-size: 1rem; }
article { margin-bottom: 1rem; border: 1px solid #c4c4c4; padding: 0.5rem; }
h3 { font-size: 1rem; margin-top: 0; }`
/** What an open panel adds to the look of the dashboard: it stands at the right edge over the board, scrolls on its own, and leaves the board room beside it. */
const panelStyle = `body { padding-right: 32rem; }
aside { position: fixed; top: 0; right: 0; box-sizing: border-box; width: 30rem; max-width: 100%; height: 100%; overflow-y: auto; padding: 1rem 1.5rem; background: #fff; border-left: 1px solid #c4c4c4; box-shadow: -0.25rem 0 0.75rem rgba(0, 0, 0, 0.15); }
aside section { display: block; width: auto; margin-right: 0; }
aside article { border: 0; padding: 0; }`
/** What tells the browser to load a page of the dashboard again every five seconds. */
const refreshElement = '<meta http-equiv="refresh" content="5">'
/** The decisions the dashboard takes for a person, each the last part of the address it is posted to. */
const decisionActions = ["answer", "accept-spec", "approve", "send-back", "regenerate"]
/** The number of bytes of a post of an edit the dashboard reads at most. */
const editBodyLimit = 524288

/** A value the board records as escaped text, also when it is a number. */
function boardText(value) {
  return escapeHtml(String(value))
}

/** A page of the dashboard: a page of `htmlPage` that the browser loads again every five seconds and that has room for the ten sections. */
function dashboardPage(page) {
  return page.replace("<head>\n", `<head>\n${refreshElement}\n`).replace("</style>", `${dashboardStyle}\n</style>`)
}

/**
 * The open questions of a process: the number of its newest `questions-<n>.md` that has no `answers-<n>.md`, and the
 * number and the text of every numbered item under `## Questions` of that file. The number is null when there is none.
 */
function openQuestions(id) {
  const folder = path.join(process.cwd(), "processes", id)
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
function needsDraftMark(entry) {
  const names = editedNames(entry)
  return names.length === 0 ? [] : [`<p>Needs a new draft: ${names.map(boardText).join(", ")}</p>`]
}

/** The card of one process: its title, its id, whether it needs a new draft, its owner, its newest recorded round, its open questions and the cases that failed in that round. */
function processCard(entry) {
  const newest = (entry.rounds ?? []).at(-1)
  const failing = (newest?.cases ?? []).filter((stored) => stored.result === "FAIL").map((stored) => `case ${stored.case}`)
  const questions = openQuestions(entry.id).questions.map((question) => `<li value="${question.number}">${escapeHtml(question.text)}</li>`)
  return [
    "<article>",
    `<h3><a href="/${entry.id}">${escapeHtml(entry.title)}</a></h3>`,
    `<p>${escapeHtml(entry.id)}</p>`,
    ...needsDraftMark(entry),
    "<dl>",
    `<dt>Owner</dt><dd>${entry.owner === undefined ? notRecorded : escapeHtml(entry.owner)}</dd>`,
    `<dt>Round</dt><dd>${newest?.round ?? "none"}</dd>`,
    `<dt>Open questions</dt><dd>${questions.length === 0 ? "none" : `<ol>\n${questions.join("\n")}\n</ol>`}</dd>`,
    `<dt>Failing cases</dt><dd>${failing.length === 0 ? "none" : failing.join(", ")}</dd>`,
    "</dl>",
    "</article>",
  ].join("\n")
}

/** The board: one section per stage, in the order of the state machine, with one card per process of the board in that stage. */
function boardSections(processes) {
  return Object.keys(allowedMoves).map((stage) => {
    const cards = processes.filter((entry) => entry.stage === stage).map(processCard)
    return `<section>\n<h2>${stage}</h2>\n${cards.length === 0 ? "<p>No process.</p>" : cards.join("\n")}\n</section>`
  })
}

/** The dashboard: the board that the browser loads again every five seconds. */
function dashboardMainPage(processes) {
  const body = ["<h1>Dashboard</h1>", "<p>This page reloads every 5 seconds.</p>", ...boardSections(processes)]
  return dashboardPage(htmlPage("Dashboard", body.join("\n")))
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
  return `<p><a href="/${id}/edit/${name}">Edit ${name}</a></p>`
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
    `<form method="post" action="/${id}/answer">`,
    ...fields,
    "<p>A field left empty is stored as Not known.</p>",
    '<p><button type="submit">Store the answers</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel that accepts the specification of a process in `spec`. */
function acceptForm(id) {
  return [
    `<form method="post" action="/${id}/accept-spec">`,
    "<p>Every section of the specification is decided. Read it under Specification before you accept it.</p>",
    '<p><button type="submit">Accept the specification</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel in which the owner of a process in `approval` approves its newest draft and publishes it. */
function approveForm(id) {
  return [
    `<form method="post" action="/${id}/approve">`,
    '<p><label for="by">Your full name</label>',
    '<input id="by" name="by" required></p>',
    '<p><button type="submit">Approve and publish</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel that sends the draft of a process in `approval` back for one more round, with a note. */
function sendBackForm(id) {
  return [
    `<form method="post" action="/${id}/send-back">`,
    '<p><label for="note">What must change in the draft</label>',
    '<textarea id="note" name="note" rows="6" required></textarea></p>',
    '<p><button type="submit">Send back for one more round</button></p>',
    "</form>",
  ].join("\n")
}

/** The form of the panel that starts a regeneration of a published process. */
function regenerateForm(id) {
  return [
    `<form method="post" action="/${id}/regenerate">`,
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
  const changes = entry.regeneration === undefined ? null : fileLines(path.join(process.cwd(), changeListFile(entry.id, number)))
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
function processPanel(entry) {
  const folder = path.join(process.cwd(), "processes", entry.id)
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
    '<p><a href="/">Close</a></p>',
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

/** The board with the panel of one process over it: the sections and cards of the dashboard, the title of the process and the panel after them, and no refresh. */
function dashboardProcessPage(processes, entry) {
  const body = ["<h1>Dashboard</h1>", ...boardSections(processes), processPanel(entry)]
  return htmlPage(boardText(entry.title), body.join("\n")).replace("</style>", `${dashboardStyle}\n${panelStyle}\n</style>`)
}

/** The process and the action of the address `/<process-id>/<action>` of a decision, or null for every other path. */
function decisionTarget(pathname) {
  const [id, action, ...rest] = pathname.slice(1).split("/")
  if (rest.length > 0 || !decisionActions.includes(action)) return null
  const entry = boardProcesses().find((candidate) => candidate.id === id)
  return entry === undefined ? null : { entry, action }
}

/** The page `Not done`: why a decision was not taken or an edit was not saved, with the way back to the process. */
function notDonePage(id, reasons) {
  return reasonsPage("Not done", reasons, `<p><a href="/${id}">Back to the process</a></p>`)
}

/** Runs the commands of a decision one after the other and answers the browser: the panel after the last, or the lines of the one that refused. */
function runDecision(response, id, commands, input = "") {
  for (const args of commands) {
    const run = spawnSync(process.execPath, [path.join(import.meta.dirname, "process-factory.mjs"), ...args], { cwd: process.cwd(), input, encoding: "utf8" })
    if (run.status !== 0) {
      const lines = run.stderr.split("\n").filter((line) => line !== "")
      sendPage(response, 409, notDonePage(id, lines.map(escapeHtml)))
      return
    }
  }
  response.writeHead(303, { Location: `/${id}` })
  response.end()
}

/** The answers of a post as the answers file of the open questions of a process, or null when no field holds an answer. */
function answersFileText(id, posted) {
  const { number, questions } = openQuestions(id)
  const answers = questions.map((question) => ({ ...question, answer: cleanedText(posted.get(`answer-${question.number}`) ?? "") }))
  if (answers.every((given) => given.answer === "")) return null
  const sections = answers.flatMap((given) => [`## ${given.number}. ${given.text}`, "", given.answer === "" ? "Not known." : given.answer, ""])
  return [`# Answers ${number}`, "", ...sections].join("\n")
}

/** Reads a post of a decision and runs the command line for it, which takes the decision or refuses it. */
async function takeDecision(request, response, { entry, action }) {
  const refuse = (status, reason) => {
    sendPage(response, status, notDonePage(entry.id, [reason]))
  }
  if (!isOwnOrigin(request)) {
    refuse(403, "A decision can only be sent from the dashboard itself.")
    return
  }
  const body = await readBody(request, formBodyLimit)
  if (body === null) {
    refuse(413, "The decision is too long.")
    return
  }
  const posted = new URLSearchParams(body)
  const id = entry.id
  if (action === "answer") {
    const answers = answersFileText(id, posted)
    if (answers === null) refuse(400, "Answer at least one question.")
    else runDecision(response, id, [["answer", id, "-"]], answers)
  } else if (action === "accept-spec") runDecision(response, id, [["accept-spec", id]])
  else if (action === "approve") runDecision(response, id, [["approve", id, "--by", posted.get("by") ?? ""], ["move", id, "published"]])
  else if (action === "send-back") runDecision(response, id, [["send-back", id, "-"]], posted.get("note") ?? "")
  else runDecision(response, id, [["move", id, "regenerate"]])
}

/** The process and the name of the address `/<process-id>/<part>/<name>` of a file of a process on the board, or null for every other path. */
function fileTarget(pathname, part) {
  const [id, found, name, ...rest] = pathname.slice(1).split("/")
  if (found !== part || rest.length > 0 || name === undefined || !isEditableName(name)) return null
  const entry = boardProcesses().find((candidate) => candidate.id === id)
  return entry === undefined ? null : { entry, name }
}

/** The address `/<process-id>/edit/<name>` of a file that can be edited now, with the text it holds, or null when there is no such file. */
function editTarget(pathname) {
  const target = fileTarget(pathname, "edit")
  if (target === null || !isEditable(target.entry)) return null
  const text = editableText(path.join(process.cwd(), "processes", target.entry.id, editedPath(target.name)))
  return text === null ? null : { ...target, text }
}

/** What a post of an edit at this address does: the check page against the stored text, the save when that text is null, or null when nothing is posted here. */
function editPostTarget(pathname) {
  const edit = editTarget(pathname)
  if (edit !== null) return edit
  const save = fileTarget(pathname, "save")
  return save === null ? null : { ...save, text: null }
}

/** The page that holds the whole text of a file of a process in one field, which the next page compares with the stored text. */
function editPage({ entry, name, text }) {
  const title = `Edit ${name}`
  const body = [
    `<p><a href="/${entry.id}">Back to the process</a></p>`,
    `<h1>${title}</h1>`,
    `<p>${boardText(entry.title)}, ${boardText(entry.id)}</p>`,
    `<form method="post" action="/${entry.id}/edit/${name}">`,
    `<p><label for="text">The text of ${name}</label>`,
    `<textarea id="text" name="text" rows="30" required>\n${escapeHtml(text)}</textarea></p>`,
    "<p>Nothing is saved yet. The next page shows what changes.</p>",
    '<p><button type="submit">Show what changes</button></p>',
    "</form>",
  ]
  return htmlPage(title, body.join("\n"))
}

/**
 * The old and the new lines in one list, each with the mark `-` when it is removed, `+` when it is added and none when
 * it is in a longest common subsequence of the two. A removed line stands before the added lines of the same change.
 */
function comparedLines(oldLines, newLines) {
  const width = newLines.length + 1
  const common = new Uint32Array((oldLines.length + 1) * width)
  for (let first = oldLines.length - 1; first >= 0; first -= 1) {
    for (let second = newLines.length - 1; second >= 0; second -= 1) {
      common[first * width + second] =
        oldLines[first] === newLines[second]
          ? common[(first + 1) * width + second + 1] + 1
          : Math.max(common[(first + 1) * width + second], common[first * width + second + 1])
    }
  }
  const lines = []
  let first = 0
  let second = 0
  while (first < oldLines.length || second < newLines.length) {
    if (first < oldLines.length && second < newLines.length && oldLines[first] === newLines[second]) {
      lines.push({ mark: "", text: oldLines[first] })
      first += 1
      second += 1
    } else if (second === newLines.length || (first < oldLines.length && common[(first + 1) * width + second] >= common[first * width + second + 1])) {
      lines.push({ mark: "-", text: oldLines[first] })
      first += 1
    } else {
      lines.push({ mark: "+", text: newLines[second] })
      second += 1
    }
  }
  return lines
}

/** One item per compared line: a removed line in `<del>`, an added line in `<ins>`, each after its mark, an unchanged line as it is. */
function comparedItems(lines) {
  return lines.map(({ mark, text }) => {
    if (mark === "") return `<li>${escapeHtml(text)}</li>`
    const tag = mark === "-" ? "del" : "ins"
    return `<li><${tag}>${mark} ${escapeHtml(text)}</${tag}></li>`
  })
}

/** The page that shows line by line what an edit changes in a file and asks for the name of the person who saves it. */
function checkPage({ entry, name, text }, newText) {
  const cleaned = cleanedText(newText)
  const lines = comparedLines(text.split("\n"), cleaned.split("\n"))
  const title = `Check the edit of ${name}`
  const head = [`<p><a href="/${entry.id}">Back to the process</a></p>`, `<h1>${title}</h1>`, `<p>${boardText(entry.title)}, ${boardText(entry.id)}</p>`]
  const marked = (mark) => lines.filter((line) => line.mark === mark).length
  if (marked("-") + marked("+") === 0) return htmlPage(title, [...head, `<p>Nothing changes in ${name}.</p>`].join("\n"))
  const movesBack = stagesThatMoveToDraft.includes(entry.stage)
    ? [`<p>Saving moves the process back to the stage draft, so that /process next ${entry.id} in Claude Code writes a new draft from the edited files.</p>`]
    : []
  const body = [
    ...head,
    `<p>Lines removed: ${marked("-")}. Lines added: ${marked("+")}. A line that starts with - is removed, a line that starts with + is added.</p>`,
    `<ul>\n${comparedItems(lines).join("\n")}\n</ul>`,
    ...movesBack,
    `<form method="post" action="/${entry.id}/save/${name}">`,
    `<input type="hidden" name="text" value="${escapeHtml(cleaned)}">`,
    '<p><label for="by">Your full name</label>',
    '<input id="by" name="by" required></p>',
    '<p><button type="submit">Save</button></p>',
    "</form>",
  ]
  return htmlPage(title, body.join("\n"))
}

/** Reads a post of an edit and answers the browser: the check page, or the save through the command line, which refuses what it may not store. */
async function takeEdit(request, response, target) {
  const id = target.entry.id
  const refuse = (status, reason) => {
    sendPage(response, status, notDonePage(id, [reason]))
  }
  if (!isOwnOrigin(request)) {
    refuse(403, "An edit can only be sent from the dashboard itself.")
    return
  }
  const body = await readBody(request, editBodyLimit)
  if (body === null) {
    refuse(413, "The edit is too long.")
    return
  }
  const posted = new URLSearchParams(body)
  const newText = posted.get("text") ?? ""
  if (target.text === null) runDecision(response, id, [["edit", id, target.name, "-", "--by", posted.get("by") ?? ""]], newText)
  else sendPage(response, 200, checkPage(target, newText))
}

export function answerDashboardRequest(request, response) {
  const pathname = request.url.split("?")[0]
  if (request.method === "GET" || request.method === "HEAD") {
    const notFound = '<h1>Not found</h1>\n<p>There is nothing at this address.</p>\n<p><a href="/">Dashboard</a></p>'
    let answer
    try {
      const processes = boardProcesses()
      const open = /^\/[a-z0-9-]+$/.test(pathname) ? processes.find((entry) => entry.id === pathname.slice(1)) : undefined
      const edit = open === undefined ? editTarget(pathname) : null
      if (pathname === "/") answer = { status: 200, page: dashboardMainPage(processes) }
      else if (open !== undefined) answer = { status: 200, page: dashboardProcessPage(processes, open) }
      else if (edit !== null) answer = { status: 200, page: editPage(edit) }
      else answer = { status: 404, page: dashboardPage(htmlPage("Not found", notFound)) }
    } catch {
      answer = { status: 500, page: dashboardPage(errorPage("The dashboard cannot read the processes.")) }
    }
    sendPage(response, answer.status, request.method === "HEAD" ? undefined : answer.page)
    return
  }
  let decision = null
  let edit = null
  try {
    if (request.method === "POST") {
      decision = decisionTarget(pathname)
      if (decision === null) edit = editPostTarget(pathname)
    }
  } catch {
    sendPage(response, 500, errorPage("The dashboard cannot read the processes."))
    return
  }
  if (decision !== null) takeDecision(request, response, decision)
  else if (edit !== null) takeEdit(request, response, edit)
  else {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
  }
}
