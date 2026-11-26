import { mkdirSync, writeFileSync } from "node:fs"
import { boardProcesses, documentHtml, escapeHtml, htmlPage, publishedVersions, versionApproval, versionFile } from "./reading-view.mjs"
import { currentOrganisation, errorMessage, fileLines, findProcessOrPrintReason, labelledValue, notRecorded, printedPath, readProcessesOrPrintReason, storePath } from "./store.mjs"

/** The address of the reading view without the slashes at the end of its path, or null when it is not an address an export can link to. */
function readingViewAddress(address) {
  let parsed
  try {
    parsed = new URL(address)
  } catch {
    return null
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
  if (parsed.username !== "" || parsed.password !== "" || parsed.search !== "" || parsed.hash !== "") return null
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`
}

/** The six values of the stamp of an export, as the store holds them: each format escapes them as it needs. */
function exportStamp(entry, number, link) {
  const approver = labelledValue(versionFile(entry.id, number, "approval.md"), "Approved by")
  return {
    title: entry.title,
    number,
    owner: entry.owner ?? notRecorded,
    by: approver ?? notRecorded,
    on: versionApproval(entry.id, number).on,
    link,
  }
}

/** The six paragraphs of the stamp of an HTML export, with every value escaped. */
function htmlStamp(stamp) {
  return [
    `<p><strong>${escapeHtml(stamp.title)}</strong></p>`,
    `<p>Version ${stamp.number}</p>`,
    `<p>Owner: ${escapeHtml(stamp.owner)}</p>`,
    `<p>Approved by: ${escapeHtml(stamp.by)}</p>`,
    `<p>Approved on: ${escapeHtml(stamp.on)}</p>`,
    `<p>This is a copy. The reading view is the source of truth, and the current version is at <a href="${escapeHtml(stamp.link)}">${escapeHtml(stamp.link)}</a>.</p>`,
  ].join("\n")
}

/** The HTML export of a version: the stamp, the document as the reading view shows it, and the stamp again. */
function htmlExport(stamp, lines) {
  const paragraphs = htmlStamp(stamp)
  const body = [`<header>\n${paragraphs}\n</header>`, `<main>\n${documentHtml(lines)}\n</main>`, `<footer>\n${paragraphs}\n</footer>`]
  return htmlPage(`${escapeHtml(stamp.title)}, version ${stamp.number}`, body.join("\n"))
}

/** A value of the stamp of a Markdown export, with a backslash before every character that could add markup. */
function markdownText(value) {
  return value.replace(/[\\`*_[\]<>&]/g, (character) => `\\${character}`)
}

/** The stamp of a Markdown export, with every value of the board and of the approval escaped. */
function markdownStamp(stamp) {
  return [
    `**${markdownText(stamp.title)}**`,
    "",
    `- Version ${stamp.number}`,
    `- Owner: ${markdownText(stamp.owner)}`,
    `- Approved by: ${markdownText(stamp.by)}`,
    `- Approved on: ${stamp.on}`,
    "",
    `This is a copy. The reading view is the source of truth, and the current version is at <${stamp.link}>.`,
  ].join("\n")
}

/** The Markdown export of a version: the stamp, the document between two lines `---`, and the stamp again. */
function markdownExport(stamp, lines) {
  const text = markdownStamp(stamp)
  const document = lines.join("\n").replace(/^\n+|\n+$/g, "")
  return `${text}\n\n---\n\n${document}\n\n---\n\n${text}\n`
}

/** Writes the newest published version of a process as one file in `exports`, or prints why it cannot be exported. */
export function exportVersion(id, format, address) {
  if (format !== "html" && format !== "markdown") {
    process.stderr.write("process-factory: the format must be html or markdown\n")
    return 1
  }
  const viewAddress = readingViewAddress(address)
  if (viewAddress === null) {
    process.stderr.write("process-factory: the link must be an address that starts with http:// or https://, without a user name, a query or a fragment\n")
    return 1
  }
  if (readProcessesOrPrintReason() === null) return 1
  const entry = findProcessOrPrintReason(boardProcesses(), id)
  if (entry === undefined) return 1
  const number = publishedVersions(entry).at(-1)
  if (number === undefined) {
    process.stderr.write(`process-factory: cannot export ${id}: it has no published version\n`)
    return 1
  }
  const lines = fileLines(versionFile(id, number, "process.md"))
  if (lines === null) {
    process.stderr.write(`process-factory: cannot export ${id}: cannot read ${printedPath("processes", id, "versions", String(number), "process.md")}\n`)
    return 1
  }
  const asHtml = format === "html"
  const name = `${id}-v${number}.${asHtml ? "html" : "md"}`
  const stamp = exportStamp(entry, number, `${viewAddress}/${currentOrganisation()}/${id}/${number}`)
  try {
    mkdirSync(storePath("exports"), { recursive: true })
    writeFileSync(storePath("exports", name), asHtml ? htmlExport(stamp, lines) : markdownExport(stamp, lines))
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath("exports", name)}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`${printedPath("exports", name)}\n`)
  return 0
}
