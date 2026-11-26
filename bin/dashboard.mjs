import { spawnSync } from "node:child_process"
import path from "node:path"
import { organisations } from "./organisation.mjs"
import { boardText, needsDraftMark, openQuestions, processPanel } from "./panel.mjs"
import {
  answerOutsideOrganisation,
  boardProcesses,
  errorPage,
  escapeHtml,
  formBodyLimit,
  htmlPage,
  isOwnOrigin,
  organisationAddress,
  organisationOfPath,
  organisationPage,
  readBody,
  reasonsPage,
  sendAnswer,
  sendPage,
} from "./reading-view.mjs"
import { editableText, editedPath, isEditable, isEditableName, stagesThatMoveToDraft } from "./review.mjs"
import { allowedMoves, cleanedText } from "./state-machine.mjs"
import { currentOrganisation, inOrganisation, notRecorded, storePath } from "./store.mjs"

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

/** A page of the dashboard: a page of `htmlPage` that the browser loads again every five seconds and that has room for the ten sections. */
function dashboardPage(page) {
  return page.replace("<head>\n", `<head>\n${refreshElement}\n`).replace("</style>", `${dashboardStyle}\n</style>`)
}

/** The card of one process: its title, its id, whether it needs a new draft, its owner, its newest recorded round, its open questions and the cases that failed in that round. */
function processCard(entry) {
  const newest = (entry.rounds ?? []).at(-1)
  const failing = (newest?.cases ?? []).filter((stored) => stored.result === "FAIL").map((stored) => `case ${stored.case}`)
  const questions = openQuestions(entry.id).questions.map((question) => `<li value="${question.number}">${escapeHtml(question.text)}</li>`)
  return [
    "<article>",
    `<h3><a href="${organisationAddress(entry.id)}">${escapeHtml(entry.title)}</a></h3>`,
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
  return reasonsPage("Not done", reasons, `<p><a href="${organisationAddress(id)}">Back to the process</a></p>`)
}

/** Runs the commands of a decision one after the other, each on the organisation of the request, and answers the browser: the panel after the last, or the lines of the one that refused. */
function runDecision(response, id, commands, input = "") {
  const command = path.join(import.meta.dirname, "process-factory.mjs")
  for (const args of commands) {
    const run = spawnSync(process.execPath, [command, ...args, "--org", currentOrganisation()], { cwd: process.cwd(), input, encoding: "utf8" })
    if (run.status !== 0) {
      const lines = run.stderr.split("\n").filter((line) => line !== "")
      sendPage(response, 409, organisationPage(notDonePage(id, lines.map(escapeHtml))))
      return
    }
  }
  response.writeHead(303, { Location: organisationAddress(id) })
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
    sendPage(response, status, organisationPage(notDonePage(entry.id, [reason])))
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
  const text = editableText(storePath("processes", target.entry.id, editedPath(target.name)))
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
    `<p><a href="${organisationAddress(entry.id)}">Back to the process</a></p>`,
    `<h1>${title}</h1>`,
    `<p>${boardText(entry.title)}, ${boardText(entry.id)}</p>`,
    `<form method="post" action="${organisationAddress(entry.id, "edit", name)}">`,
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
  const head = [`<p><a href="${organisationAddress(entry.id)}">Back to the process</a></p>`, `<h1>${title}</h1>`, `<p>${boardText(entry.title)}, ${boardText(entry.id)}</p>`]
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
    `<form method="post" action="${organisationAddress(entry.id, "save", name)}">`,
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
    sendPage(response, status, organisationPage(notDonePage(id, [reason])))
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
  else sendPage(response, 200, organisationPage(checkPage(target, newText)))
}

/** The page `Not found` of the dashboard, with the way to the board of `to`. */
function dashboardNotFoundPage(to) {
  return dashboardPage(htmlPage("Not found", `<h1>Not found</h1>\n<p>There is nothing at this address.</p>\n<p><a href="${to}">Dashboard</a></p>`))
}

/** The status and the page of a GET of the dashboard inside an organisation, with the line that names it. */
function answerInsideOrganisation(pathname) {
  let answer
  try {
    const processes = boardProcesses()
    const open = /^\/[a-z0-9-]+$/.test(pathname) ? processes.find((entry) => entry.id === pathname.slice(1)) : undefined
    const edit = open === undefined ? editTarget(pathname) : null
    if (pathname === "/") answer = { status: 200, page: dashboardMainPage(processes) }
    else if (open !== undefined) answer = { status: 200, page: dashboardProcessPage(processes, open) }
    else if (edit !== null) answer = { status: 200, page: editPage(edit) }
    else answer = { status: 404, page: dashboardNotFoundPage(organisationAddress()) }
  } catch {
    answer = { status: 500, page: dashboardPage(errorPage("The dashboard cannot read the processes.")) }
  }
  return { status: answer.status, page: organisationPage(answer.page) }
}

/** Answers a post of a decision or of an edit inside an organisation, or says which methods its address allows. */
function answerDashboardPost(request, response, pathname) {
  let decision = null
  let edit = null
  try {
    if (request.method === "POST") {
      decision = decisionTarget(pathname)
      if (decision === null) edit = editPostTarget(pathname)
    }
  } catch {
    sendPage(response, 500, organisationPage(errorPage("The dashboard cannot read the processes.")))
    return
  }
  if (decision !== null) takeDecision(request, response, decision)
  else if (edit !== null) takeEdit(request, response, edit)
  else {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
  }
}

export function answerDashboardRequest(request, response) {
  const pathname = request.url.split("?")[0]
  const listed = organisations()
  const target = organisationOfPath(pathname, listed)
  if (request.method === "GET" || request.method === "HEAD") {
    const answer =
      target === null
        ? answerOutsideOrganisation(pathname, listed, dashboardNotFoundPage("/"))
        : inOrganisation(target.organisation, () => answerInsideOrganisation(target.pathname))
    sendAnswer(response, answer, request.method)
    return
  }
  if (target === null) {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }
  inOrganisation(target.organisation, () => {
    answerDashboardPost(request, response, target.pathname)
  })
}
