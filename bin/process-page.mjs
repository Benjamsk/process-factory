import { boardText, needsDraftMark, processPart, processParts, turnLine } from "./panel.mjs"
import { organisationAddress } from "./reading-view.mjs"
import { allowedMoves } from "./state-machine.mjs"
import { notRecorded } from "./store.mjs"

/** The ten stages of the state machine as a trail: the stage a process is in as the current one, every other stage of its history as passed. */
export function progressTrail(entry) {
  const passed = (Array.isArray(entry.history) ? entry.history : []).map((moved) => moved.stage)
  const items = Object.keys(allowedMoves).map((stage) => {
    if (stage === entry.stage) return `<li class="now" aria-current="step">${stage}: current</li>`
    return passed.includes(stage) ? `<li class="done">${stage}: passed</li>` : `<li>${stage}</li>`
  })
  return `<ol class="trail">\n${items.join("\n")}\n</ol>`
}

/** The address of one part of the page of a process: the address of the process itself for the decision. */
function partAddress(id, part) {
  return part === "decision" ? organisationAddress(id) : organisationAddress(id, part)
}

/** The header every address of a process has: the way back, its title, its facts, who it waits for, its progress, the eight tabs and whether the page reloads. */
function processHeader(entry, part, reloads) {
  const tabs = processParts.map(([id, heading]) => {
    const current = id === part ? ' aria-current="page"' : ""
    return `<li><a href="${partAddress(entry.id, id)}"${current}>${heading}</a></li>`
  })
  const reload = reloads ? "<p>This page reloads every 5 seconds.</p>" : "<p>This page does not reload, so that what you type is kept. Load it again to see what has changed.</p>"
  return [
    "<header>",
    `<p><a href="${organisationAddress()}">Back to the board</a></p>`,
    `<h1>${boardText(entry.title)}</h1>`,
    `<p>${boardText(entry.id)}</p>`,
    "<dl>",
    `<dt>Stage</dt><dd>${boardText(entry.stage)}</dd>`,
    `<dt>Owner</dt><dd>${boardText(entry.owner ?? notRecorded)}</dd>`,
    "</dl>",
    ...needsDraftMark(entry),
    turnLine(entry),
    progressTrail(entry),
    "<nav>",
    "<ul>",
    ...tabs,
    "</ul>",
    "</nav>",
    reload,
    "</header>",
  ].join("\n")
}

/**
 * The title, the body and whether it reloads of the page of a process: `/<process-id>` with the part Decision,
 * `/<process-id>/<part>` with that part and `/<process-id>/draft/<n>` with that draft chosen. It is null for every
 * other address, among them an id that is not among the processes it is given.
 */
export function processPage(pathname, processes) {
  const [id, part, number, ...rest] = pathname.slice(1).split("/")
  const entry = processes.find((candidate) => candidate.id === id)
  const chosen = part ?? "decision"
  const heading = processParts.find(([name]) => name === chosen)?.[1]
  if (entry === undefined || rest.length > 0 || heading === undefined || part === "decision") return null
  if (number !== undefined && (chosen !== "draft" || !/^[1-9]\d*$/.test(number))) return null
  const found = processPart(entry, chosen, number === undefined ? undefined : Number(number))
  if (found === null) return null
  const reloads = !found.hasForm
  return {
    title: part === undefined ? boardText(entry.title) : `${boardText(entry.title)}: ${heading}`,
    body: `${processHeader(entry, chosen, reloads)}\n<main>\n<h2>${heading}</h2>\n${found.html}\n</main>`,
    reloads,
  }
}
