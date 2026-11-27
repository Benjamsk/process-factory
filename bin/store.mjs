import { AsyncLocalStorage } from "node:async_hooks"
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const boardPath = "processes/board.json"
const processFolders = ["cases", "drafts", "rounds", "versions", "feedback"]
/**
 * The organisation the running code works on. A server keeps it per request, not in a plain variable, so that it
 * still holds the organisation of a post after its body is read while another request is answered in between.
 */
const chosenOrganisation = new AsyncLocalStorage()
/** The folder of the working directory that holds one folder per organisation. */
export const organisationsFolder = "organisations"
/** What the command line, the reading view, the dashboard and an export show for a value the store does not record. */
export const notRecorded = "not recorded"
export const packageFolder = path.dirname(import.meta.dirname)

/** Runs an action on one organisation: every path of the store then lies in the folder of that organisation. */
export function inOrganisation(organisation, action) {
  return chosenOrganisation.run(organisation, action)
}

/** The id of the organisation the running code works on. */
export function currentOrganisation() {
  return chosenOrganisation.getStore()
}

/** The absolute path of a file of an organisation of the working directory. */
export function organisationPath(organisation, ...parts) {
  return path.join(process.cwd(), organisationsFolder, organisation, ...parts)
}

/** The absolute path of a file of the organisation the running code works on. */
export function storePath(...parts) {
  return organisationPath(currentOrganisation(), ...parts)
}

/** The path of a file of the organisation the running code works on, as every message of the command line shows it. */
export function printedPath(...parts) {
  return [organisationsFolder, currentOrganisation(), ...parts].join("/")
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/** The names in a folder, empty when the folder cannot be read. */
export function folderNames(folder) {
  try {
    return readdirSync(folder)
  } catch {
    return []
  }
}

/** The processes on the board, empty when there is no board to read. */
export function readProcesses() {
  let text
  try {
    text = readFileSync(storePath(boardPath), "utf8")
  } catch {
    return []
  }
  const board = JSON.parse(text)
  if (!Array.isArray(board?.processes)) throw new Error("there is no list under processes")
  return board.processes
}

/** The processes on the board, or null after printing why the board cannot be read. */
export function readProcessesOrPrintReason() {
  try {
    return readProcesses()
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${printedPath(boardPath)}: ${errorMessage(error)}\n`)
    return null
  }
}

/** The entry with this id, or undefined after printing that there is no such process. */
export function findProcessOrPrintReason(processes, id) {
  const entry = processes.find((candidate) => candidate.id === id)
  if (entry === undefined) process.stderr.write(`process-factory: there is no process ${id}\n`)
  return entry
}

export function writeBoard(processes) {
  writeFileSync(storePath(boardPath), `${JSON.stringify({ processes }, null, 2)}\n`)
}

/** A title as a name: lower case, every run of other characters than `a-z0-9` as one `-`, none at the ends, the first six parts. */
export function titleSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-")
}

function processId(processes, title) {
  const highestNumber = processes.reduce((highest, entry) => Math.max(highest, Number.parseInt(entry.id, 10) || 0), 0)
  return `${String(highestNumber + 1).padStart(3, "0")}-${titleSlug(title)}`
}

function writeProcessFolder(id, title, prompt) {
  const folder = storePath("processes", id)
  mkdirSync(storePath("processes"), { recursive: true })
  mkdirSync(folder)
  writeFileSync(path.join(folder, "request.md"), prompt === "" ? `# ${title}\n` : `# ${title}\n\n${prompt}\n`)
  for (const name of processFolders) mkdirSync(path.join(folder, name))
}

export function createProcess(argument, promptArgument) {
  const title = argument.trim()
  if (/[\r\n]/.test(title) || !/[a-zA-Z0-9]/.test(title)) {
    process.stderr.write("process-factory: the title must be one line with at least one letter or digit\n")
    return 1
  }
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  const id = processId(processes, title)
  try {
    writeProcessFolder(id, title, (promptArgument ?? "").trim())
    const entry = { id, title, stage: "intake", history: [{ at: new Date().toISOString(), stage: "intake" }] }
    writeBoard([...processes, entry])
  } catch (error) {
    process.stderr.write(`process-factory: cannot create process ${id}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`${id}\n`)
  return 0
}

/** The text after `<label>: ` in the first such line of a file, or undefined when it has none. */
export function labelledValue(file, label) {
  const prefix = `${label}: `
  const line = (fileLines(file) ?? []).find((text) => text.startsWith(prefix))
  return line === undefined ? undefined : line.slice(prefix.length)
}

/** The numbers in the names of a folder that match the pattern, in ascending order, empty when the folder cannot be read. */
export function folderNumbers(folder, pattern) {
  return folderNames(folder)
    .flatMap((name) => {
      const match = pattern.exec(name)
      return match === null ? [] : [Number(match[1])]
    })
    .sort((first, second) => first - second)
}

/** The highest number among the names of a folder that match the pattern, or null when there is none. */
export function newestNumber(folder, pattern) {
  return folderNumbers(folder, pattern).at(-1) ?? null
}

/** The numbers of the files `draft-<n>.md` in the folder `drafts` of a process, in ascending order. */
export function draftNumbers(processFolder) {
  return folderNumbers(path.join(processFolder, "drafts"), /^draft-(\d+)\.md$/)
}

/** The number of the newest `draft-<n>.md` in the folder `drafts` of a process, or null when there is none. */
export function newestDraftNumber(processFolder) {
  return draftNumbers(processFolder).at(-1) ?? null
}

/** The bytes of a file, or of standard input when the file is `-`, or null after printing why it cannot be read. */
export function readInputOrPrintReason(file) {
  try {
    return readFileSync(file === "-" ? 0 : file)
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${file}: ${errorMessage(error)}\n`)
    return null
  }
}

/** The lines of a file, each without the whitespace at its end, or null when it cannot be read. */
export function fileLines(file) {
  try {
    return readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
  } catch {
    return null
  }
}

/** The lines after `## <heading>` up to the next line that starts with `## `, or null when there is no such heading. */
export function sectionLines(lines, heading) {
  const start = lines.indexOf(`## ${heading}`)
  if (start === -1) return null
  const body = lines.slice(start + 1)
  const end = body.findIndex((line) => line.startsWith("## "))
  return end === -1 ? body : body.slice(0, end)
}

/** The files a process was edited since its newest draft was written, empty when it needs no new draft. */
export function editedNames(entry) {
  return Array.isArray(entry.needsDraft) ? entry.needsDraft : []
}

/** A text as one line: every control character as a space, every run of whitespace as one space, without the whitespace at its ends. */
export function oneLine(text) {
  return text.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim()
}

/** The files `feedback-<k>.md` of a process whose first line `Status: ` says open, each with its number, in ascending order of `<k>`. */
export function openFeedbackFiles(id) {
  if (typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) return []
  const folder = storePath("processes", id, "feedback")
  return folderNumbers(folder, /^feedback-(\d+)\.md$/)
    .map((number) => ({ number, file: path.join(folder, `feedback-${number}.md`) }))
    .filter((feedback) => labelledValue(feedback.file, "Status") === "open")
}

/** The text of a feedback file on one line: every line after its first line `## Text`. */
export function feedbackTextLine(file) {
  const lines = fileLines(file) ?? []
  const start = lines.indexOf("## Text")
  return start === -1 ? "" : oneLine(lines.slice(start + 1).join("\n"))
}

/** What a feedback is about: the whole document or one step, `not recorded` when the file does not say. */
export function feedbackAbout(file) {
  const step = labelledValue(file, "Step")
  return step === "whole document" ? "whole document" : `step ${step ?? notRecorded}`
}

/** The line of one open feedback: its number, its version, the step it is about, its kind and its text. */
function feedbackLine({ number, file }) {
  const parts = [number, `version ${labelledValue(file, "Version") ?? notRecorded}`, feedbackAbout(file), labelledValue(file, "Kind") ?? notRecorded, feedbackTextLine(file)]
  return `  ${parts.join("  ")}`
}

export function showProcesses(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (id === undefined) {
    if (processes.length === 0) process.stdout.write("No processes.\n")
    else {
      for (const entry of processes) {
        const open = openFeedbackFiles(entry.id).length
        process.stdout.write(`${entry.id}  ${entry.stage}  ${entry.title}${open === 0 ? "" : `  ${open} open feedback`}\n`)
      }
    }
    return 0
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const lines = [entry.id, `Title: ${entry.title}`, `Stage: ${entry.stage}`]
  if (entry.owner !== undefined) lines.push(`Owner: ${entry.owner}`)
  if (entry.specAcceptedAt !== undefined) lines.push(`Spec accepted: ${entry.specAcceptedAt}`)
  const marked = editedNames(entry)
  if (marked.length > 0) lines.push(`Needs a new draft: ${marked.join(", ")}`)
  if (entry.regeneration !== undefined) lines.push(`Regenerating: version ${entry.regeneration.version}`)
  const rounds = entry.rounds ?? []
  const stopped = rounds.at(-1)?.stopped
  if (stopped !== undefined) lines.push(`Stopped: ${stopped}`)
  if (rounds.length > 0) {
    lines.push("Rounds:")
    for (const round of rounds) lines.push(`  ${round.round}  ${round.draft}  ${round.verdicts.map((given) => `${given.reviewer} ${given.verdict}`).join(", ")}`)
  }
  const versions = entry.versions ?? []
  if (versions.length > 0) {
    lines.push("Versions:")
    for (const version of versions) {
      lines.push(`  ${[version.version, version.draft, ...(version.approvedBy === undefined ? [] : [version.approvedBy]), version.at].join("  ")}`)
    }
  }
  const feedback = openFeedbackFiles(entry.id)
  if (feedback.length > 0) {
    lines.push("Feedback:")
    for (const open of feedback) lines.push(feedbackLine(open))
  }
  lines.push("History:")
  for (const change of entry.history ?? []) {
    lines.push(`  ${change.at}  ${change.stage}${change.edited === undefined ? "" : `  ${change.edited} edited by ${change.by}`}`)
  }
  process.stdout.write(`${lines.join("\n")}\n`)
  return 0
}
