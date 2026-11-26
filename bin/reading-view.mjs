import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"
import { migrateOldLayout, organisations } from "./organisation.mjs"
import { cleanedText } from "./state-machine.mjs"
import { currentOrganisation, errorMessage, fileLines, inOrganisation, labelledValue, newestNumber, notRecorded, oneLine, readProcesses, storePath } from "./store.mjs"

/** The port the reading view listens on when `--port` names none. */
export const viewPort = "4173"
/** The headers of every page of the reading view and of the dashboard. */
const pageHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
}
/** The readable defaults of every page of the reading view, of the dashboard and of an HTML export. */
const pageStyle = `body { margin: 0 auto; max-width: 40rem; padding: 2rem 1rem; background: #fff; color: #1b1b1b; font-family: system-ui, sans-serif; line-height: 1.5; }
a { color: #11467b; }
dt { font-weight: 700; }
dd { margin: 0 0 0.5rem 0; }
legend { font-weight: 700; }
form label { display: block; }
textarea, #name, #by { box-sizing: border-box; width: 100%; font: inherit; }
:focus { outline: 2px solid #11467b; outline-offset: 2px; }`
/** The number of bytes that are read at most of a post of feedback to the reading view and of a post of a decision to the dashboard. */
export const formBodyLimit = 32768
/** The number of characters the cleaned text of a feedback may have. */
const feedbackTextLimit = 2000
/** The number of characters the cleaned name of a reader may have. */
const feedbackNameLimit = 100
/** The five characters of a text from the store that could add markup to a page. */
const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => htmlEscapes[character])
}

/** The path of a file in the folder of a version of a process. */
export function versionFile(id, number, name) {
  return storePath("processes", id, "versions", String(number), name)
}

/** An address of a page of the organisation the running code works on: `/<org-id>` and the parts of the path inside it. */
export function organisationAddress(...parts) {
  return `/${[currentOrganisation(), ...parts].join("/")}`
}

/** A page of the organisation the running code works on, with the line that names it as the first element of its body. */
export function organisationPage(page) {
  const listed = organisations()
  const name = escapeHtml(listed.find((other) => other.id === currentOrganisation())?.name ?? currentOrganisation())
  const others = listed.length > 1 ? ' (<a href="/">all organisations</a>)' : ""
  return page.replace("<body>\n", `<body>\n<p>Organisation: ${name}${others}</p>\n`)
}

/** The versions a board entry lists whose `process.md` is there, in ascending order. */
export function publishedVersions(entry) {
  const listed = Array.isArray(entry.versions) ? entry.versions : []
  return listed
    .map((stored) => stored.version)
    .filter((number) => Number.isInteger(number) && number >= 1 && existsSync(versionFile(entry.id, number, "process.md")))
    .sort((first, second) => first - second)
}

/** The entries of the board whose id is a name a folder of a process may have, in the order of the board. */
export function boardProcesses() {
  return readProcesses().filter((entry) => typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id))
}

/** The processes of the board that have a published version, each with its published versions, in the order of the board. */
function publishedProcesses() {
  return boardProcesses()
    .map((entry) => ({ entry, versions: publishedVersions(entry) }))
    .filter((published) => published.versions.length > 0)
}

/** Who approved a version and on which date, each `not recorded` when `approval.md` does not give it. */
export function versionApproval(id, number) {
  const file = versionFile(id, number, "approval.md")
  const approver = labelledValue(file, "Approved by")
  const date = /^\d{4}-\d{2}-\d{2}/.exec(labelledValue(file, "Approved at") ?? "")
  return { by: approver === undefined ? notRecorded : escapeHtml(approver), on: date === null ? notRecorded : date[0] }
}

/** The number and the text of a numbered item of a document, or null when the line is not one. */
export function numberedItem(line) {
  return /^(\d+)\. (.*)$/.exec(line)
}

/** The steps of a version: the number of every numbered item of its document, each once, in the order of the document. */
function documentSteps(lines) {
  const numbers = lines.flatMap((line) => {
    const item = numberedItem(line.trim())
    return item === null ? [] : [item[1]]
  })
  return [...new Set(numbers)]
}

/** The lines of a document as HTML: headings, numbered and bulleted lists and paragraphs, with every text escaped. `headingShift` lowers every heading by that many levels, to the sixth at most. */
export function documentHtml(lines, headingShift = 0) {
  const parts = []
  let listTag = ""
  let open = null
  const closeElement = () => {
    if (open !== null) parts.push(`${open.before}${escapeHtml(open.text)}${open.after}`)
    open = null
  }
  const closeList = () => {
    closeElement()
    if (listTag !== "") parts.push(`</${listTag}>`)
    listTag = ""
  }
  for (const line of lines.map((text) => text.trim())) {
    const heading = /^(#{1,6}) (.*)$/.exec(line)
    const numbered = numberedItem(line)
    const bulleted = /^- (.*)$/.exec(line)
    if (line === "") closeList()
    else if (heading !== null) {
      closeList()
      const level = Math.min(6, heading[1].length + headingShift)
      parts.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`)
    } else if (numbered !== null || bulleted !== null) {
      const tag = numbered === null ? "ul" : "ol"
      if (listTag === tag) closeElement()
      else {
        closeList()
        parts.push(`<${tag}>`)
        listTag = tag
      }
      open = numbered === null ? { before: "<li>", text: bulleted[1], after: "</li>" } : { before: `<li value="${numbered[1]}">`, text: numbered[2], after: "</li>" }
    } else if (open !== null) open.text += ` ${line}`
    else open = { before: "<p>", text: line, after: "</p>" }
  }
  closeList()
  return parts.join("\n")
}

/** One complete HTML document with an escaped title and a body of escaped parts. */
export function htmlPage(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
${pageStyle}
</style>
</head>
<body>
${body}
</body>
</html>
`
}

/** The front page: one item per process with a published version, with its owner, its current version and its approval date. */
function frontPage(published) {
  const items = published.map(({ entry, versions }) => {
    const number = versions.at(-1)
    const owner = entry.owner === undefined ? notRecorded : escapeHtml(entry.owner)
    const approved = versionApproval(entry.id, number)
    return `<li><a href="${organisationAddress(entry.id)}">${escapeHtml(entry.title)}</a> Owner: ${owner}. Version ${number}. Approved on: ${approved.on}.</li>`
  })
  const list = items.length === 0 ? "<p>No process is published yet.</p>" : `<ul>\n${items.join("\n")}\n</ul>`
  return htmlPage("Published processes", `<h1>Published processes</h1>\n${list}`)
}

/** The form under the document of a version, with one option per step of that version and the whole document as the first. */
function feedbackForm(id, number, steps) {
  return [
    "<h2>Feedback</h2>",
    `<form method="post" action="${organisationAddress(id, number, "feedback")}">`,
    "<fieldset>",
    "<legend>What went wrong?</legend>",
    '<label><input type="radio" name="kind" value="document" required> I did not understand the document</label>',
    '<label><input type="radio" name="kind" value="process" required> The process itself failed me</label>',
    "</fieldset>",
    '<p><label for="step">What is it about?</label>',
    '<select id="step" name="step">',
    '<option value="whole">The whole document</option>',
    ...steps.map((step) => `<option value="${step}">Step ${step}</option>`),
    "</select></p>",
    '<p><label for="text">What happened?</label>',
    `<textarea id="text" name="text" rows="6" maxlength="${feedbackTextLimit}" required></textarea></p>`,
    '<p><label for="name">Your name (may be left empty)</label>',
    `<input id="name" name="name" maxlength="${feedbackNameLimit}"></p>`,
    "<p>Your feedback is stored with this version and is read by the owner of the process. Other readers do not see it.</p>",
    '<p><button type="submit">Send feedback</button></p>',
    "</form>",
  ].join("\n")
}

/** The page that says the feedback on a version of a process is stored, with the way back to the document. */
function receivedPage(entry, number) {
  const body = [
    "<h1>Feedback received</h1>",
    `<p>Thank you. Your feedback on version ${number} of ${escapeHtml(entry.title)} is stored.</p>`,
    `<p><a href="${organisationAddress(entry.id, number)}">Back to the document</a></p>`,
  ]
  return htmlPage("Feedback received", body.join("\n"))
}

/** A page that says why something was not done: its title as its heading, one item per reason and the way back. */
export function reasonsPage(title, reasons, back) {
  const body = [`<h1>${title}</h1>`, `<ul>\n${reasons.map((reason) => `<li>${reason}</li>`).join("\n")}\n</ul>`, back]
  return htmlPage(title, body.join("\n"))
}

/** The page that says why a post of feedback was refused, with the way back to the document. */
function notStoredPage(entry, number, reasons) {
  return reasonsPage("Feedback not stored", reasons, `<p><a href="${organisationAddress(entry.id, number)}">Back to the document</a></p>`)
}

/** The page of one published version: a notice when it is not the current one, the facts, the document and the version history. */
function versionPage({ entry, versions }, number) {
  const current = versions.at(-1)
  const owner = entry.owner === undefined ? notRecorded : escapeHtml(entry.owner)
  const approved = versionApproval(entry.id, number)
  const document = fileLines(versionFile(entry.id, number, "process.md"))
  if (document === null) throw new Error(`cannot read version ${number} of ${entry.id}`)
  const history = [...versions].reverse().map((other) => {
    const approvedOther = versionApproval(entry.id, other)
    const shown = other === number ? " (this version)" : ""
    return `<li><a href="${organisationAddress(entry.id, other)}">Version ${other}</a> Approved by: ${approvedOther.by}. Approved on: ${approvedOther.on}.${shown}</li>`
  })
  const notice =
    number === current
      ? []
      : [
          `<p class="notice">This is version ${number}, not the current version. <a href="${organisationAddress(entry.id)}">Read the current version, version ${current}.</a></p>`,
        ]
  const body = [
    `<p><a href="${organisationAddress()}">All processes</a></p>`,
    ...notice,
    `<dl>\n<dt>Owner</dt><dd>${owner}</dd>\n<dt>Version</dt><dd>${number}</dd>\n<dt>Approved by</dt><dd>${approved.by}</dd>\n<dt>Approved on</dt><dd>${approved.on}</dd>\n</dl>`,
    `<main>\n${documentHtml(document)}\n</main>`,
    feedbackForm(entry.id, number, documentSteps(document)),
    "<h2>Version history</h2>",
    `<ul>\n${history.join("\n")}\n</ul>`,
  ]
  return htmlPage(`${escapeHtml(entry.title)}, version ${number}`, body.join("\n"))
}

/** The page `Error` with the one sentence that says what went wrong, without the reason. */
export function errorPage(sentence) {
  return htmlPage("Error", `<h1>Error</h1>\n<p>${sentence}</p>`)
}

/** The process and the version of the address `/<process-id>/<n>/feedback` of a published version, or null for every other path. */
function feedbackTarget(pathname) {
  const [id, number, last, ...rest] = pathname.slice(1).split("/")
  if (last !== "feedback" || rest.length > 0 || !/^[1-9]\d*$/.test(number)) return null
  const found = publishedProcesses().find((candidate) => candidate.entry.id === id)
  return found === undefined || !found.versions.includes(Number(number)) ? null : { entry: found.entry, number: Number(number) }
}

/** The status and the page for the path of a request, from the board and the versions as they are at that moment. */
function answerPath(pathname) {
  const published = publishedProcesses()
  if (pathname === "/") return { status: 200, page: frontPage(published) }
  const [id, number, ...rest] = pathname.slice(1).split("/")
  const found = published.find((candidate) => candidate.entry.id === id)
  if (found !== undefined && rest.length === 0) {
    if (number === undefined) return { status: 200, page: versionPage(found, found.versions.at(-1)) }
    if (/^[1-9]\d*$/.test(number) && found.versions.includes(Number(number))) return { status: 200, page: versionPage(found, Number(number)) }
  }
  const target = feedbackTarget(pathname)
  if (target !== null) return { status: 200, page: receivedPage(target.entry, target.number) }
  return { status: 404, page: viewNotFoundPage(organisationAddress()) }
}

/** The page `Not found` of the reading view, with the way to every process of `to`. */
function viewNotFoundPage(to) {
  return htmlPage("Not found", `<h1>Not found</h1>\n<p>There is no published process at this address.</p>\n<p><a href="${to}">All processes</a></p>`)
}

/** The page that lists the organisations of the working directory, each with its name, or says there is none. */
function organisationsPage(listed) {
  const items = listed.map((found) => `<li><a href="/${found.id}">${escapeHtml(found.name)}</a></li>`)
  const list = items.length === 0 ? "<p>No organisation yet.</p>" : `<ul>\n${items.join("\n")}\n</ul>`
  return htmlPage("Organisations", `<h1>Organisations</h1>\n${list}`)
}

/** The organisation the first part of a path names, with the path inside it, or null when that part is no organisation. */
export function organisationOfPath(pathname, listed) {
  const parts = pathname.slice(1).split("/")
  const found = listed.find((other) => other.id === parts[0])
  return found === undefined ? null : { organisation: found.id, pathname: `/${parts.slice(1).join("/")}` }
}

/** The answer of a server at `/` and at an address whose first part is no organisation. */
export function answerOutsideOrganisation(pathname, listed, notFound) {
  if (pathname !== "/") return { status: 404, page: notFound }
  if (listed.length === 1) return { status: 302, location: `/${listed[0].id}` }
  return { status: 200, page: organisationsPage(listed) }
}

/** Sends the answer of a server: the page, or the redirect to the only organisation. */
export function sendAnswer(response, answer, method) {
  if (answer.location !== undefined) {
    response.writeHead(302, { Location: answer.location })
    response.end()
    return
  }
  sendPage(response, answer.status, method === "HEAD" ? undefined : answer.page)
}

export function sendPage(response, status, page) {
  response.writeHead(status, pageHeaders)
  response.end(page)
}

/** The body of a request as text, or null when it is longer than `limit` bytes, of which the rest is not read. */
export function readBody(request, limit) {
  return new Promise((resolve) => {
    const chunks = []
    let size = 0
    request.on("data", (chunk) => {
      size += chunk.length
      if (size > limit) {
        request.pause()
        resolve(null)
        return
      }
      chunks.push(chunk)
    })
    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
  })
}

/** Writes one feedback as the next file `feedback-<k>.md` in the folder `feedback` of the process, which is created when it is missing. */
function writeFeedbackFile(id, number, { step, kind, name, text }) {
  const folder = storePath("processes", id, "feedback")
  mkdirSync(folder, { recursive: true })
  const next = (newestNumber(folder, /^feedback-(\d+)\.md$/) ?? 0) + 1
  const lines = [
    `# Feedback ${next}`,
    "",
    `Process: ${id}`,
    `Version: ${number}`,
    `Step: ${step}`,
    `Kind: ${kind}`,
    `From: ${name}`,
    `Received at: ${new Date().toISOString()}`,
    "Status: open",
    "",
    "## Text",
    "",
    text,
  ]
  writeFileSync(path.join(folder, `feedback-${next}.md`), `${lines.join("\n")}\n`, { flag: "wx" })
}

/** Whether a post comes from a page of the server itself, which a post without the header `Origin` counts as. */
export function isOwnOrigin(request) {
  const origin = request.headers.origin
  const port = request.socket.localPort
  return origin === undefined || origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`
}

/** Reads a post of feedback, stores it when every check of it passes, and answers the reader. */
async function storeFeedback(request, response, { entry, number }) {
  const refuse = (status, reasons) => {
    sendPage(response, status, organisationPage(notStoredPage(entry, number, reasons)))
  }
  if (!isOwnOrigin(request)) {
    refuse(403, ["Feedback can only be sent from the reading view itself."])
    return
  }
  const body = await readBody(request, formBodyLimit)
  if (body === null) {
    refuse(413, ["The feedback is too long."])
    return
  }
  const posted = new URLSearchParams(body)
  const kind = posted.get("kind")
  const step = posted.get("step")
  const text = cleanedText(posted.get("text") ?? "")
  const name = oneLine(posted.get("name") ?? "")
  const steps = documentSteps(fileLines(versionFile(entry.id, number, "process.md")) ?? [])
  const reasons = []
  if (kind !== "document" && kind !== "process") reasons.push("Choose what went wrong: the document or the process.")
  if (step !== "whole" && !steps.includes(step)) reasons.push("Choose a step of this version or the whole document.")
  if (text === "") reasons.push("Write what happened.")
  if (text.length > feedbackTextLimit) reasons.push(`The text may be at most ${feedbackTextLimit} characters.`)
  if (name.length > feedbackNameLimit) reasons.push(`The name may be at most ${feedbackNameLimit} characters.`)
  if (reasons.length > 0) {
    refuse(400, reasons)
    return
  }
  try {
    writeFeedbackFile(entry.id, number, { step: step === "whole" ? "whole document" : step, kind, name: name === "" ? "anonymous" : name, text })
  } catch {
    sendPage(response, 500, organisationPage(errorPage("The feedback could not be stored.")))
    return
  }
  response.writeHead(303, { Location: organisationAddress(entry.id, number, "feedback") })
  response.end()
}

/** The status and the page of a GET of the reading view inside an organisation, with the line that names it. */
function answerInsideOrganisation(pathname) {
  let answer
  try {
    answer = answerPath(pathname)
  } catch {
    answer = { status: 500, page: errorPage("The reading view cannot read the processes.") }
  }
  return { status: answer.status, page: organisationPage(answer.page) }
}

/** Answers a post of feedback inside an organisation, or says which methods its address allows. */
function answerFeedbackPost(request, response, pathname) {
  let target
  try {
    target = feedbackTarget(pathname)
  } catch {
    sendPage(response, 500, organisationPage(errorPage("The reading view cannot read the processes.")))
    return
  }
  if (target === null) {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "GET, HEAD, POST" })
    response.end()
    return
  }
  storeFeedback(request, response, target)
}

export function answerRequest(request, response) {
  const pathname = request.url.split("?")[0]
  const listed = organisations()
  const target = organisationOfPath(pathname, listed)
  if (request.method === "GET" || request.method === "HEAD") {
    const answer =
      target === null ? answerOutsideOrganisation(pathname, listed, viewNotFoundPage("/")) : inOrganisation(target.organisation, () => answerInsideOrganisation(target.pathname))
    sendAnswer(response, answer, request.method)
    return
  }
  if (target === null) {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }
  inOrganisation(target.organisation, () => {
    answerFeedbackPost(request, response, target.pathname)
  })
}

/** Starts a server of the command line on `127.0.0.1` and keeps running until the process is stopped. */
export function serveOnLocalhost(name, defaultPort, handler, portArgument) {
  const moved = migrateOldLayout()
  if (moved !== 0) return moved
  const port = portArgument ?? defaultPort
  if (!/^\d+$/.test(port) || Number(port) > 65535) {
    process.stderr.write("process-factory: the port must be a number from 0 to 65535\n")
    return 1
  }
  const server = createServer(handler)
  server.on("error", (error) => {
    process.stderr.write(`process-factory: cannot serve on http://127.0.0.1:${port}: ${errorMessage(error)}\n`)
    process.exitCode = 1
  })
  server.listen(Number(port), "127.0.0.1", () => {
    process.stdout.write(`${name} on http://127.0.0.1:${server.address().port}\n`)
  })
  return 0
}
