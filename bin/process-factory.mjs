#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"

const skillFolder = ".claude/skills/process"
/** The files of the skill, in the order `init` installs them, before the reviewers the package ships. */
const skillFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "incident.md", "reviewer.md"]
const boardPath = "processes/board.json"
const processFolders = ["cases", "drafts", "rounds", "versions", "feedback"]
/** The files of the organisation context, in the order `org init` creates them. */
const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
/** The eleven sections of a specification, in the order of `spec-writer.md`. */
const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
/** The seven headings of a draft, in the order of `draft-writer.md`. */
const draftHeadings = ["When this applies", "Who does what", "Steps", "Who must be told", "When to hand over", "What to record", "If something does not fit"]
/** The kinds of dependency the command line watches, each with the file of `organisation/` that describes them. */
const dependencyFiles = { Role: "organisation/roles.md", System: "organisation/systems.md", Agreement: "organisation/processors.md", Policy: "organisation/policies.md" }
/** The tags of a finding, in the order `round` counts them. */
const findingTags = ["high", "medium", "low"]
/** The number of review rounds after which `round` stops the loop and moves the process to `approval`. */
const roundLimit = 5
/** The port the reading view listens on when `--port` names none. */
const viewPort = "4173"
/** The port the dashboard listens on when `--port` names none. */
const dashboardPort = "4174"
/** The headers of every page of the reading view. */
const pageHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
}
/** The readable defaults of every page of the reading view. */
const pageStyle = `body { margin: 0 auto; max-width: 40rem; padding: 2rem 1rem; background: #fff; color: #1b1b1b; font-family: system-ui, sans-serif; line-height: 1.5; }
a { color: #11467b; }
dt { font-weight: 700; }
dd { margin: 0 0 0.5rem 0; }
legend { font-weight: 700; }
fieldset label { display: block; }
textarea, #name { box-sizing: border-box; width: 100%; font: inherit; }
:focus { outline: 2px solid #11467b; outline-offset: 2px; }`
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
aside article { border: 0; padding: 0; }
aside label { display: block; }
aside #by { box-sizing: border-box; width: 100%; font: inherit; }`
/** What tells the browser to load a page of the dashboard again every five seconds. */
const refreshElement = '<meta http-equiv="refresh" content="5">'
/** What the reading view shows for an owner, an approver or a date the store does not record. */
const notRecorded = "not recorded"
/** The number of bytes of a post of feedback the reading view reads at most. */
const feedbackBodyLimit = 32768
/** The number of characters the cleaned text of a feedback may have. */
const feedbackTextLimit = 2000
/** The number of characters the cleaned name of a reader may have. */
const feedbackNameLimit = 100
/** The decisions the dashboard takes for a person, each the last part of the address it is posted to. */
const decisionActions = ["answer", "accept-spec", "approve", "send-back", "regenerate"]
/** The five characters of a text from the store that could add markup to a page. */
const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }
/** The ten stages, each with the stages a process may move to from it. */
const allowedMoves = {
  intake: ["clarify", "spec"],
  clarify: ["spec"],
  spec: ["clarify"],
  cases: ["draft"],
  draft: ["review"],
  review: ["rework", "approval"],
  rework: ["review"],
  approval: ["published", "rework"],
  published: ["regenerate"],
  regenerate: ["review", "published"],
}
const packageFolder = path.dirname(import.meta.dirname)

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/** The names of the files `<name>-reviewer.md` in a folder, sorted, empty when the folder cannot be read. */
function reviewerFiles(folder) {
  let names
  try {
    names = readdirSync(folder)
  } catch {
    return []
  }
  return names.filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name)).sort()
}

function installSkill() {
  const templateFolder = path.join(packageFolder, "templates", "skills", "process")
  for (const file of [...skillFiles, ...reviewerFiles(templateFolder)]) {
    const targetFile = path.join(process.cwd(), skillFolder, file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
      copyFileSync(path.join(templateFolder, file), targetFile)
    } catch (error) {
      process.stderr.write(`process-factory: cannot write ${skillFolder}/${file}: ${errorMessage(error)}\n`)
      return 1
    }
    process.stdout.write(`Installed ${skillFolder}/${file}\n`)
  }
  return 0
}

/** The processes on the board, empty when there is no board to read. */
function readProcesses() {
  let text
  try {
    text = readFileSync(path.join(process.cwd(), boardPath), "utf8")
  } catch {
    return []
  }
  const board = JSON.parse(text)
  if (!Array.isArray(board?.processes)) throw new Error("there is no list under processes")
  return board.processes
}

/** The processes on the board, or null after printing why the board cannot be read. */
function readProcessesOrPrintReason() {
  try {
    return readProcesses()
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${boardPath}: ${errorMessage(error)}\n`)
    return null
  }
}

/** The entry with this id, or undefined after printing that there is no such process. */
function findProcessOrPrintReason(processes, id) {
  const entry = processes.find((candidate) => candidate.id === id)
  if (entry === undefined) process.stderr.write(`process-factory: there is no process ${id}\n`)
  return entry
}

function writeBoard(processes) {
  writeFileSync(path.join(process.cwd(), boardPath), `${JSON.stringify({ processes }, null, 2)}\n`)
}

function processId(processes, title) {
  const highestNumber = processes.reduce((highest, entry) => Math.max(highest, Number.parseInt(entry.id, 10) || 0), 0)
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-")
  return `${String(highestNumber + 1).padStart(3, "0")}-${slug}`
}

function writeProcessFolder(id, title, prompt) {
  const folder = path.join(process.cwd(), "processes", id)
  mkdirSync(path.join(process.cwd(), "processes"), { recursive: true })
  mkdirSync(folder)
  writeFileSync(path.join(folder, "request.md"), prompt === "" ? `# ${title}\n` : `# ${title}\n\n${prompt}\n`)
  for (const name of processFolders) mkdirSync(path.join(folder, name))
}

function createProcess(argument, promptArgument) {
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
function labelledValue(file, label) {
  const prefix = `${label}: `
  const line = (fileLines(file) ?? []).find((text) => text.startsWith(prefix))
  return line === undefined ? undefined : line.slice(prefix.length)
}

/** Copies the approved draft, the spec, the cases and the approval of a process into a new version folder, and returns the version for the board, or null after printing why it cannot be written. */
function writeVersion(id, entry, draftNumber, at) {
  const processFolder = path.join(process.cwd(), "processes", id)
  const listed = (entry.versions ?? []).map((stored) => stored.version)
  const number = Math.max(0, ...folderNumbers(path.join(processFolder, "versions"), /^(\d+)$/), ...listed) + 1
  const folder = `processes/${id}/versions/${number}`
  const versionFolder = path.join(process.cwd(), folder)
  const approvalFile = path.join(processFolder, "versions", `approval-draft-${draftNumber}.md`)
  try {
    mkdirSync(versionFolder)
    copyFileSync(path.join(processFolder, "drafts", `draft-${draftNumber}.md`), path.join(versionFolder, "process.md"))
    if (existsSync(path.join(processFolder, "spec.md"))) copyFileSync(path.join(processFolder, "spec.md"), path.join(versionFolder, "spec.md"))
    mkdirSync(path.join(versionFolder, "cases"))
    for (const caseNumber of folderNumbers(path.join(processFolder, "cases"), /^case-(\d+)\.md$/)) {
      const name = `case-${caseNumber}.md`
      copyFileSync(path.join(processFolder, "cases", name), path.join(versionFolder, "cases", name))
    }
    copyFileSync(approvalFile, path.join(versionFolder, "approval.md"))
    if (entry.regeneration !== undefined) copyFileSync(path.join(process.cwd(), changeListFile(id, draftNumber)), path.join(versionFolder, "changes.md"))
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${folder}: ${errorMessage(error)}\n`)
    return null
  }
  const approved = labelledValue(approvalFile, "Approved by")
  return { version: number, draft: `draft-${draftNumber}.md`, ...(approved === undefined ? {} : { approvedBy: approved }), at }
}

/** The path of the change list of `draft-<n>.md` of a process, from the project's folder. */
function changeListFile(id, draftNumber) {
  return `processes/${id}/drafts/changes-${draftNumber}.md`
}

/** The path of the file that holds the reasons of a regeneration of a version, from the project's folder. */
function reasonsFile(id, version) {
  return `processes/${id}/regeneration-${version}.md`
}

/** The names of the reasons of a regeneration: the texts after `- ` under `## Reasons` of its reasons file. */
function recordedReasons(id, version) {
  const lines = fileLines(path.join(process.cwd(), reasonsFile(id, version)))
  const body = lines === null ? null : sectionLines(lines, "Reasons")
  return (body ?? []).filter((line) => line.startsWith("- ")).map((line) => line.slice(2))
}

/** The changes of a change list: the digits of every line `## Change <digits>` with the lines after it up to the next heading. */
function changeSections(lines) {
  return lines.flatMap((line, index) => {
    const heading = /^## Change (\d+)$/.exec(line)
    if (heading === null) return []
    const body = lines.slice(index + 1)
    const end = body.findIndex((other) => other.startsWith("## "))
    return [{ number: heading[1], body: end === -1 ? body : body.slice(0, end) }]
  })
}

/** The entries under `## Not changed` of a change list: the reason after `### ` of every such heading with the lines after it. */
function notChangedEntries(lines) {
  const section = sectionLines(lines, "Not changed") ?? []
  return section.flatMap((line, index) => {
    if (!line.startsWith("### ")) return []
    const body = section.slice(index + 1)
    const end = body.findIndex((other) => other.startsWith("### ") || other.startsWith("## "))
    return [{ reason: line.slice(4), body: end === -1 ? body : body.slice(0, end) }]
  })
}

/** The text after `<label>: ` of every line `- <label>: <text>` of a change list section. */
function listedValues(body, label) {
  const prefix = `- ${label}: `
  return body.filter((line) => line.startsWith(prefix)).map((line) => line.slice(prefix.length))
}

/** Whether a reason names the findings file of a reviewer, or the stored findings of the owner, of a round the entry recorded after the regeneration started. */
function isRoundReason(entry, reason) {
  const named = /^round-(\d+)\/([a-z0-9-]+)\.md$/.exec(reason)
  if (named === null) return false
  const round = (entry.rounds ?? []).find((recorded) => recorded.round === Number(named[1]))
  if (round === undefined || round.round <= entry.regeneration.round) return false
  if (named[2] === "owner") return existsSync(path.join(process.cwd(), "processes", entry.id, "rounds", `round-${named[1]}`, "owner.md"))
  return (round.verdicts ?? []).some((given) => given.reviewer === named[2])
}

/** The first problem of the lines of a change list of a regeneration, in the order of 3.2 of the spec, or undefined when it has none. */
function problemOfChangeList(lines, entry) {
  if (lines === null) return "is missing"
  const version = entry.regeneration.version
  const changes = changeSections(lines)
  if (changes.length === 0) return "names no change"
  for (const change of changes) {
    const sections = listedValues(change.body, "Section").filter((heading) => draftHeadings.includes(heading))
    if (sections.length !== 1) return `change ${change.number} needs exactly one line - Section: with one of the seven headings of a draft`
    if (listedValues(change.body, "Change").length !== 1) return `change ${change.number} needs exactly one line - Change: with what changed`
    if (listedValues(change.body, "Reason").length === 0) return `change ${change.number} needs a line - Reason:`
  }
  const notChanged = notChangedEntries(lines)
  const named = [...changes.flatMap((change) => listedValues(change.body, "Reason")), ...notChanged.map((changed) => changed.reason)]
  const reasons = recordedReasons(entry.id, version)
  const unknown = named.find((reason) => !reasons.includes(reason) && !isRoundReason(entry, reason))
  if (unknown !== undefined) return `names a reason that is not in ${reasonsFile(entry.id, version)}: ${unknown}`
  const silent = notChanged.find((changed) => changed.body.every((line) => line === ""))
  if (silent !== undefined) return `gives no reason why ${silent.reason} is not changed`
  const left = reasons.filter((reason) => !named.includes(reason))
  if (left.length > 0) return `does not name these reasons of ${reasonsFile(entry.id, version)}: ${left.join(", ")}`
  return undefined
}

/** The change list of the newest draft of a process that is being regenerated with its problem, or undefined when it has none. */
function changeListProblem(entry) {
  const file = changeListFile(entry.id, newestDraftNumber(path.join(process.cwd(), "processes", entry.id)))
  const problem = problemOfChangeList(fileLines(path.join(process.cwd(), file)), entry)
  return problem === undefined ? undefined : `${file} ${problem}`
}

/** The names of the reasons to regenerate a process: its open feedback, its cases that version `<v>` does not hold, and its changed dependencies. */
function regenerationReasons(entry, version) {
  const folder = path.join(process.cwd(), "processes", entry.id)
  const newCases = folderNumbers(path.join(folder, "cases"), /^case-(\d+)\.md$/).filter(
    (number) => !existsSync(path.join(folder, "versions", String(version), "cases", `case-${number}.md`)),
  )
  return [
    ...openFeedbackFiles(entry.id).map((feedback) => `feedback-${feedback.number}.md`),
    ...newCases.map((number) => `case-${number}.md`),
    ...changedDependencies(entry).map((dependency) => dependency.name),
  ]
}

/** Writes the reasons of a regeneration of the newest published version and records it on the entry, or prints why it cannot start. */
function startRegeneration(entry, at) {
  const cannot = `process-factory: cannot move ${entry.id} from published to regenerate`
  const version = (entry.versions ?? []).at(-1)?.version
  if (!Number.isInteger(version) || version < 1) {
    process.stderr.write(`${cannot}: it has no published version\n`)
    return false
  }
  const reasons = regenerationReasons(entry, version)
  if (reasons.length === 0) {
    process.stderr.write(`${cannot}: there is nothing to regenerate it for: no open feedback, no case newer than version ${version} and no changed dependency\n`)
    return false
  }
  const file = reasonsFile(entry.id, version)
  const head = [`# Regeneration of version ${version}`, "", `Process: ${entry.id}`, `Version: ${version}`, `Started at: ${at}`, "", "## Reasons", ""]
  try {
    writeFileSync(path.join(process.cwd(), file), `${[...head, ...reasons.map((reason) => `- ${reason}`)].join("\n")}\n`)
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${file}: ${errorMessage(error)}\n`)
    return false
  }
  entry.regeneration = { version, round: (entry.rounds ?? []).at(-1)?.round ?? 0, at }
  return true
}

/** Closes every feedback a change list names as the reason for a change and as the reason of no not changed entry, or prints why it cannot. */
function closeAnsweredFeedback(id, lines, version) {
  const notChanged = notChangedEntries(lines).map((changed) => changed.reason)
  const answered = changeSections(lines)
    .flatMap((change) => listedValues(change.body, "Reason"))
    .filter((reason) => /^feedback-\d+\.md$/.test(reason) && !notChanged.includes(reason))
  for (const open of openFeedbackFiles(id).filter((feedback) => answered.includes(`feedback-${feedback.number}.md`))) {
    try {
      const text = readFileSync(open.file, "utf8").split("\n")
      text.splice(
        text.findIndex((line) => line.trimEnd() === "Status: open"),
        1,
        "Status: closed",
        `Answered by: version ${version}`,
      )
      writeFileSync(open.file, text.join("\n"))
    } catch (error) {
      process.stderr.write(`process-factory: cannot write processes/${id}/feedback/feedback-${open.number}.md: ${errorMessage(error)}\n`)
      return false
    }
  }
  return true
}

function moveProcess(id, stage) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const allowed = Object.hasOwn(allowedMoves, entry.stage) ? allowedMoves[entry.stage] : []
  if (!allowed.includes(stage)) {
    if (entry.stage === "spec" && stage === "cases") {
      process.stderr.write(`process-factory: cannot move ${id} from spec to cases: only accept-spec ${id} moves a process from spec to cases\n`)
      return 1
    }
    const stages = allowed.join(", ") || "none"
    process.stderr.write(
      `process-factory: cannot move ${id} from ${entry.stage} to ${stage} (allowed from ${entry.stage}: ${stages})\n`,
    )
    return 1
  }
  const at = new Date().toISOString()
  const regenerating = entry.regeneration !== undefined
  if (stage === "regenerate" && !startRegeneration(entry, at)) return 1
  if (stage === "review" && regenerating) {
    const problem = changeListProblem(entry)
    if (problem !== undefined) {
      process.stderr.write(`process-factory: cannot move ${id} from ${entry.stage} to review: ${problem}\n`)
      return 1
    }
  }
  const publishing = stage === "published" && entry.stage === "approval"
  let version
  if (publishing) {
    const folder = `processes/${id}`
    const draftNumber = newestDraftNumber(path.join(process.cwd(), folder))
    if (draftNumber === null || !existsSync(path.join(process.cwd(), folder, "versions", `approval-draft-${draftNumber}.md`))) {
      process.stderr.write(
        `process-factory: cannot move ${id} from ${entry.stage} to published: the newest draft has no approval: only approve ${id} --by "<person>" records one\n`,
      )
      return 1
    }
    const problem = regenerating ? changeListProblem(entry) : undefined
    if (problem !== undefined) {
      process.stderr.write(`process-factory: cannot move ${id} from approval to published: ${problem}\n`)
      return 1
    }
    version = writeVersion(id, entry, draftNumber, at)
    if (version === null) return 1
    const changes = regenerating ? fileLines(path.join(process.cwd(), changeListFile(id, draftNumber))) : null
    if (changes !== null && !closeAnsweredFeedback(id, changes, version.version)) return 1
  }
  entry.stage = stage
  entry.history = [...(entry.history ?? []), { at, stage }]
  if (publishing) {
    entry.dependencies = specDependencies(path.join(process.cwd(), "processes", id)).map((dependency) => ({
      ...dependency,
      hash: dependencyHash(dependency.kind, dependency.name),
    }))
    entry.versions = [...(entry.versions ?? []), version]
  }
  if (stage === "published") delete entry.regeneration
  writeBoard(processes)
  process.stdout.write(`${stage}\n`)
  return 0
}

/** The numbers in the names of a folder that match the pattern, in ascending order, empty when the folder cannot be read. */
function folderNumbers(folder, pattern) {
  let names
  try {
    names = readdirSync(folder)
  } catch {
    return []
  }
  return names
    .flatMap((name) => {
      const match = pattern.exec(name)
      return match === null ? [] : [Number(match[1])]
    })
    .sort((first, second) => first - second)
}

/** The highest number among the names of a folder that match the pattern, or null when there is none. */
function newestNumber(folder, pattern) {
  return folderNumbers(folder, pattern).at(-1) ?? null
}

/** The number of the newest `draft-<n>.md` in the folder `drafts` of a process, or null when there is none. */
function newestDraftNumber(processFolder) {
  return newestNumber(path.join(processFolder, "drafts"), /^draft-(\d+)\.md$/)
}

/** The bytes of a file, or of standard input when the file is `-`. */
function readFileOrStandardInput(file) {
  return readFileSync(file === "-" ? 0 : file)
}

function answerProcess(id, file) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  if (entry.stage !== "clarify") {
    process.stderr.write(`process-factory: cannot answer ${id}: it is in the stage ${entry.stage}, not in clarify\n`)
    return 1
  }
  const folder = `processes/${id}`
  const number = newestNumber(path.join(process.cwd(), folder), /^questions-(\d+)\.md$/)
  if (number === null) {
    process.stderr.write(`process-factory: cannot answer ${id}: there is no questions file in ${folder}\n`)
    return 1
  }
  let answers
  try {
    answers = readFileOrStandardInput(file)
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${file}: ${errorMessage(error)}\n`)
    return 1
  }
  if (answers.toString("utf8").trim() === "") {
    process.stderr.write(`process-factory: cannot answer ${id}: ${file} is empty\n`)
    return 1
  }
  const answersFile = `${folder}/answers-${number}.md`
  try {
    writeFileSync(path.join(process.cwd(), answersFile), answers, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${answersFile}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${answersFile}\n`)
  return moveProcess(id, "spec")
}

/** The lines of a file, each without the whitespace at its end, or null when it cannot be read. */
function fileLines(file) {
  try {
    return readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
  } catch {
    return null
  }
}

/** The lines after `## <heading>` up to the next line that starts with `## `, or null when there is no such heading. */
function sectionLines(lines, heading) {
  const start = lines.indexOf(`## ${heading}`)
  if (start === -1) return null
  const body = lines.slice(start + 1)
  const end = body.findIndex((line) => line.startsWith("## "))
  return end === -1 ? body : body.slice(0, end)
}

/** The sections of a `spec.md` that are not marked decided, in the order of the eleven. */
function openSpecSections(folder) {
  const lines = fileLines(path.join(folder, "spec.md"))
  if (lines === null) return specSections
  return specSections.filter((name) => {
    const body = sectionLines(lines, name)
    return body === null || body.find((line) => line !== "") !== "Status: decided"
  })
}

/** The `Role`, `System`, `Agreement` and `Policy` lines of the section `Dependencies` of a `spec.md`, in their order. */
function specDependencies(folder) {
  const lines = fileLines(path.join(folder, "spec.md"))
  const body = lines === null ? null : sectionLines(lines, "Dependencies")
  if (body === null) return []
  return body.flatMap((line) => {
    const dependency = /^- (Role|System|Agreement|Policy): (.+)$/.exec(line)
    return dependency === null ? [] : [{ kind: dependency[1], name: dependency[2] }]
  })
}

/** The hash of the section `## <name>` in the file of this kind, or null when the file or the section is missing. */
function dependencyHash(kind, name) {
  const lines = fileLines(path.join(process.cwd(), dependencyFiles[kind]))
  const body = lines === null ? null : sectionLines(lines, name)
  return body === null ? null : createHash("sha256").update(body.join("\n").trim()).digest("hex")
}

/** The recorded dependencies of an entry whose section in `organisation/` has changed or is gone, each with its name and what happened. */
function changedDependencies(entry) {
  return (entry.dependencies ?? []).flatMap((dependency) => {
    const hash = dependencyHash(dependency.kind, dependency.name)
    if (hash === dependency.hash) return []
    const file = dependencyFiles[dependency.kind]
    return [{ name: `${dependency.kind}: ${dependency.name}`, what: hash === null ? `removed from ${file}` : `changed in ${file}` }]
  })
}

function acceptSpec(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  if (entry.stage !== "spec") {
    process.stderr.write(`process-factory: cannot accept the spec of ${id}: it is in the stage ${entry.stage}, not in spec\n`)
    return 1
  }
  const folder = `processes/${id}`
  const open = openSpecSections(path.join(process.cwd(), folder))
  if (open.length > 0) {
    process.stderr.write(`process-factory: cannot accept the spec of ${id}: these sections of ${folder}/spec.md are open\n`)
    for (const name of open) process.stderr.write(`  ${name}\n`)
    const number = newestNumber(path.join(process.cwd(), folder), /^questions-(\d+)\.md$/)
    if (number !== null && !existsSync(path.join(process.cwd(), folder, `answers-${number}.md`))) {
      process.stderr.write(`process-factory: ${folder}/questions-${number}.md has no answers yet: ${id} moves to clarify\n`)
      moveProcess(id, "clarify")
      return 1
    }
    process.stderr.write(`process-factory: ${id} stays in spec: /process next ${id} writes the questions for the open sections\n`)
    return 1
  }
  const at = new Date().toISOString()
  entry.stage = "cases"
  entry.history = [...(entry.history ?? []), { at, stage: "cases" }]
  entry.specAcceptedAt = at
  writeBoard(processes)
  process.stdout.write(`Accepted ${folder}/spec.md\ncases\n`)
  return 0
}

/** The verdict and the findings per tag of a findings file, or the reason why it is refused. */
function readFindingsFile(file) {
  const lines = fileLines(file)
  if (lines === null) return { reason: "is missing" }
  const verdictLines = lines.filter((line) => line.startsWith("Verdict:"))
  if (verdictLines.length !== 1 || !["Verdict: PASS", "Verdict: CHANGES"].includes(verdictLines[0])) {
    return { reason: "must have exactly one line Verdict: PASS or Verdict: CHANGES" }
  }
  const wrongLine = lines.findIndex((line) => line.startsWith("- ") && !/^- \[(high|medium|low)\] \S/.test(line))
  if (wrongLine !== -1) {
    return { reason: `line ${wrongLine + 1} starts with "- " but is not a finding tagged [high], [medium] or [low]` }
  }
  const verdict = verdictLines[0].replace("Verdict: ", "")
  const counts = findingTags.map((tag) => lines.filter((line) => line.startsWith(`- [${tag}] `)).length)
  const asksForChanges = counts[0] + counts[1] > 0
  if (verdict === "PASS" && asksForChanges) return { reason: "the verdict is PASS but it has findings tagged high or medium" }
  if (verdict === "CHANGES" && !asksForChanges) return { reason: "the verdict is CHANGES but it has no finding tagged high or medium" }
  return { verdict, counts }
}

/** The result `PASS`, `FAIL` or null of the first section `## Case <n>:` of a `simulation.md` per case number. */
function caseResults(lines) {
  const results = new Map()
  for (const line of lines) {
    const heading = /^## Case (\d+):/.exec(line)
    if (heading === null) continue
    const number = Number(heading[1])
    if (results.has(number)) continue
    const resultLine = (sectionLines(lines, line.slice(3)) ?? []).find((other) => other.startsWith("Result:")) ?? ""
    results.set(number, resultLine === "Result: PASS" ? "PASS" : /^Result: FAIL at .+/.test(resultLine) ? "FAIL" : null)
  }
  return results
}

/** The result of every case stored in `cases/` of a process, in ascending order of the numbers, null for a case without one. */
function storedCaseResults(folder, roundFolder) {
  const results = caseResults(fileLines(path.join(roundFolder, "simulation.md")) ?? [])
  return folderNumbers(path.join(folder, "cases"), /^case-(\d+)\.md$/).map((number) => ({ case: number, result: results.get(number) ?? null }))
}

/** The reason to refuse a `simulation.md` whose results do not fit the stored cases and the verdict, or undefined. */
function caseReason(cases, verdict) {
  const named = (listed) => listed.map((stored) => `case ${stored.case}`).join(", ")
  const without = cases.filter((stored) => stored.result === null)
  if (without.length > 0) return `has no Result: line for ${named(without)}`
  const failing = cases.filter((stored) => stored.result === "FAIL")
  if (verdict === "PASS" && failing.length > 0) return `the verdict is PASS but these cases have the result FAIL: ${named(failing)}`
  return undefined
}

/** One line per case that fails now and passed in an earlier recorded round, naming the draft it last passed in. */
function regressedLines(cases, recorded) {
  return cases
    .filter((stored) => stored.result === "FAIL")
    .flatMap((stored) => {
      const passed = recorded.filter((entered) => (entered.cases ?? []).some((other) => other.case === stored.case && other.result === "PASS")).at(-1)
      return passed === undefined ? [] : [`Regressed: case ${stored.case} last passed in ${passed.draft}`]
    })
}

function recordRound(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const cannot = `process-factory: cannot record a round of ${id}`
  if (entry.stage !== "review") {
    process.stderr.write(`${cannot}: it is in the stage ${entry.stage}, not in review\n`)
    return 1
  }
  const reviewers = reviewerFiles(path.join(process.cwd(), skillFolder)).map((file) => file.replace("-reviewer.md", ""))
  if (reviewers.length === 0) {
    process.stderr.write(`${cannot}: no reviewer is installed in ${skillFolder}\n`)
    return 1
  }
  const folder = `processes/${id}`
  const round = newestNumber(path.join(process.cwd(), folder, "rounds"), /^round-(\d+)$/)
  if (round === null) {
    process.stderr.write(`${cannot}: there is no round folder in ${folder}/rounds\n`)
    return 1
  }
  const recorded = entry.rounds ?? []
  if (recorded.some((entered) => entered.round === round)) {
    process.stderr.write(`${cannot}: round ${round} is already recorded\n`)
    return 1
  }
  const draftNumber = newestDraftNumber(path.join(process.cwd(), folder))
  if (draftNumber === null) {
    process.stderr.write(`${cannot}: there is no draft in ${folder}/drafts\n`)
    return 1
  }
  const roundFolder = `${folder}/rounds/round-${round}`
  const read = reviewers.map((reviewer) => ({ reviewer, ...readFindingsFile(path.join(process.cwd(), roundFolder, `${reviewer}.md`)) }))
  const simulationFile = read.find((file) => file.reviewer === "simulation")
  let cases = null
  if (simulationFile !== undefined && simulationFile.reason === undefined) {
    cases = storedCaseResults(path.join(process.cwd(), folder), path.join(process.cwd(), roundFolder))
    simulationFile.reason = caseReason(cases, simulationFile.verdict)
  }
  const refused = read.filter((file) => file.reason !== undefined)
  if (refused.length > 0) {
    process.stderr.write(`process-factory: cannot record round ${round} of ${id}: these findings files in ${roundFolder} are missing or malformed\n`)
    for (const file of refused) process.stderr.write(`  ${file.reviewer}.md: ${file.reason}\n`)
    process.stderr.write(`process-factory: ${id} stays in review: /process next ${id} runs a new round\n`)
    return 1
  }
  const at = new Date().toISOString()
  const draft = `draft-${draftNumber}.md`
  const asking = read.filter((file) => file.verdict === "CHANGES").map((file) => file.reviewer)
  const sentBackAt = (entry.respecs ?? []).at(-1)?.round ?? 0
  const counting = recorded.filter((entered) => entered.round > sentBackAt)
  const regressed = regressedLines(cases ?? [], counting)
  const sinceStart = counting.filter((entered) => entered.round > (entry.regeneration?.round ?? 0))
  // A case with the result FAIL comes with the verdict CHANGES, so dropping the stop leaves a regressed round in rework.
  const stopped =
    regressed.length === 0 && asking.length > 0 && sinceStart.length + 1 >= roundLimit
      ? `the limit of ${roundLimit} rounds is reached and these reviewers still ask for changes: ${asking.join(", ")}`
      : undefined
  entry.stage = stopped === undefined && asking.length > 0 ? "rework" : "approval"
  entry.history = [...(entry.history ?? []), { at, stage: entry.stage }]
  const verdicts = read.map(({ reviewer, verdict }) => ({ reviewer, verdict }))
  entry.rounds = [...recorded, { round, draft, at, verdicts, ...(cases === null ? {} : { cases }), ...(stopped === undefined ? {} : { stopped }) }]
  writeBoard(processes)
  const counted = read.map((file) => `  ${file.reviewer}  ${file.verdict}  ${file.counts.map((count, index) => `${count} ${findingTags[index]}`).join(", ")}`)
  const stoppedLine = stopped === undefined ? [] : [`Stopped: ${stopped}`]
  process.stdout.write(`${[`Recorded ${roundFolder} for ${draft}`, ...counted, ...regressed, ...stoppedLine, entry.stage].join("\n")}\n`)
  return 0
}

/** The lines of `organisation/roles.md` outside the sections whose heading starts with `## Example:`. */
function rolesLines() {
  let inExample = false
  return (fileLines(path.join(process.cwd(), "organisation", "roles.md")) ?? []).filter((line) => {
    if (line.startsWith("## ")) inExample = line.startsWith("## Example:")
    return !inExample
  })
}

/** Whether a name stands in a line, letter for letter, with no letter and no digit directly before or after it. */
function standsInLine(line, name) {
  const bounds = (character) => !/[\p{L}\p{N}]/u.test(character)
  for (let at = line.indexOf(name); at !== -1; at = line.indexOf(name, at + 1)) {
    if (bounds(line.slice(at - 1, at)) && bounds(line.slice(at + name.length, at + name.length + 1))) return true
  }
  return false
}

/** Whether a name stands in `organisation/roles.md`, outside the example sections. */
function isNamedInRoles(name) {
  return rolesLines().some((line) => standsInLine(line, name))
}

function setOwner(id, personArgument) {
  const person = personArgument.trim()
  if (/[\r\n]/.test(person) || !/\p{L}/u.test(person)) {
    process.stderr.write("process-factory: the owner must be one line with at least one letter\n")
    return 1
  }
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  if (!isNamedInRoles(person)) {
    process.stderr.write(`process-factory: cannot set the owner of ${id}: ${person} is not named in organisation/roles.md\n`)
    return 1
  }
  entry.owner = person
  writeBoard(processes)
  process.stdout.write(`Owner: ${person}\n`)
  return 0
}

function approveDraft(id, byArgument) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const cannot = `process-factory: cannot approve ${id}`
  if (entry.stage !== "approval") {
    process.stderr.write(`${cannot}: it is in the stage ${entry.stage}, not in approval\n`)
    return 1
  }
  if (entry.owner === undefined) {
    process.stderr.write(`${cannot}: it has no owner: owner ${id} "<person>" names one\n`)
    return 1
  }
  if (byArgument.trim() !== entry.owner) {
    process.stderr.write(`${cannot}: --by does not name its owner\n`)
    return 1
  }
  if (!isNamedInRoles(entry.owner)) {
    process.stderr.write(`${cannot}: its owner ${entry.owner} is not named in organisation/roles.md\n`)
    return 1
  }
  const folder = `processes/${id}`
  const draftNumber = newestDraftNumber(path.join(process.cwd(), folder))
  if (draftNumber === null) {
    process.stderr.write(`${cannot}: there is no draft in ${folder}/drafts\n`)
    return 1
  }
  const draft = `draft-${draftNumber}.md`
  const approvalFile = `${folder}/versions/approval-draft-${draftNumber}.md`
  if (existsSync(path.join(process.cwd(), approvalFile))) {
    process.stderr.write(`${cannot}: ${draft} is already approved\n`)
    return 1
  }
  if (entry.regeneration !== undefined) {
    const problem = changeListProblem(entry)
    if (problem !== undefined) {
      process.stderr.write(`${cannot}: ${problem}\n`)
      return 1
    }
  }
  const changes = entry.regeneration === undefined ? "" : `Changes: changes-${draftNumber}.md\n`
  try {
    mkdirSync(path.join(process.cwd(), folder, "versions"), { recursive: true })
    writeFileSync(
      path.join(process.cwd(), approvalFile),
      `# Approval of ${draft}\n\nProcess: ${id}\nDraft: ${draft}\n${changes}Approved by: ${entry.owner}\nApproved at: ${new Date().toISOString()}\n`,
    )
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${approvalFile}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${approvalFile}\n`)
  return 0
}

/** The findings of a reviewer's file of a round, each line as it is in the file, or null when the file cannot be read. */
function roundFindings(roundFolder, reviewer) {
  if (!/^[a-z0-9-]+$/.test(reviewer)) return null
  const lines = fileLines(path.join(process.cwd(), roundFolder, `${reviewer}.md`))
  return lines === null ? null : lines.filter((line) => findingTags.some((tag) => line.startsWith(`- [${tag}] `)))
}

function respecProcess(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const cannot = `process-factory: cannot send ${id} back to spec`
  if (entry.stage !== "rework" && entry.stage !== "approval") {
    process.stderr.write(`${cannot}: it is in the stage ${entry.stage}, not in rework or approval\n`)
    return 1
  }
  if (entry.regeneration !== undefined) {
    process.stderr.write(`${cannot}: it is being regenerated from version ${entry.regeneration.version}, and a regeneration keeps the specification of that version\n`)
    return 1
  }
  const newest = (entry.rounds ?? []).at(-1)
  const round = newest?.round
  if (!Number.isInteger(round) || round < 1) {
    process.stderr.write(`${cannot}: no round is recorded for it\n`)
    return 1
  }
  const folder = `processes/${id}`
  const roundFolder = `${folder}/rounds/round-${round}`
  const sections = []
  for (const given of newest.verdicts ?? []) {
    const found = roundFindings(roundFolder, given.reviewer)
    if (found === null) {
      process.stderr.write(`${cannot}: ${roundFolder}/${given.reviewer}.md is missing\n`)
      return 1
    }
    sections.push({ reviewer: given.reviewer, verdict: given.verdict, found })
  }
  if (sections.every((section) => section.found.length === 0)) {
    process.stderr.write(`${cannot}: round ${round} has no finding\n`)
    return 1
  }
  const at = new Date().toISOString()
  const head = [`# Findings of round ${round}`, "", `Process: ${id}`, `Round: ${round}`, `Draft: ${newest.draft}`, `Sent back at: ${at}`].join("\n")
  const written = sections.map(
    ({ reviewer, verdict, found }) => `## ${reviewer}\n\nVerdict: ${verdict}\n\n${found.length === 0 ? "No findings." : found.join("\n")}`,
  )
  const findingsFile = `${folder}/feedback/findings-round-${round}.md`
  try {
    mkdirSync(path.join(process.cwd(), folder, "feedback"), { recursive: true })
    writeFileSync(path.join(process.cwd(), findingsFile), `${[head, ...written].join("\n\n")}\n`, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${findingsFile}: ${errorMessage(error)}\n`)
    return 1
  }
  entry.stage = "spec"
  entry.history = [...(entry.history ?? []), { at, stage: "spec" }]
  entry.respecs = [...(entry.respecs ?? []), { round, at }]
  delete entry.specAcceptedAt
  writeBoard(processes)
  process.stdout.write(`Stored ${findingsFile}\nspec\n`)
  return 0
}

function sendBackDraft(id, file) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (!/^[a-z0-9-]+$/.test(id)) {
    process.stderr.write(`process-factory: there is no process ${id}\n`)
    return 1
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const cannot = `process-factory: cannot send ${id} back to rework`
  if (entry.stage !== "approval") {
    process.stderr.write(`${cannot}: it is in the stage ${entry.stage}, not in approval\n`)
    return 1
  }
  const newest = (entry.rounds ?? []).at(-1)
  const round = newest?.round
  if (!Number.isInteger(round) || round < 1) {
    process.stderr.write(`${cannot}: no round is recorded for it\n`)
    return 1
  }
  let note
  try {
    note = readFileOrStandardInput(file)
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${file}: ${errorMessage(error)}\n`)
    return 1
  }
  const findings = note.toString("utf8").split(/\r?\n/).map(oneLine).filter((line) => line !== "")
  if (findings.length === 0) {
    process.stderr.write(`${cannot}: the note is empty\n`)
    return 1
  }
  const roundFolder = `processes/${id}/rounds/round-${round}`
  const findingsFile = `${roundFolder}/owner.md`
  const head = ["# Findings of the owner", "", `Process: ${id}`, `Round: ${round}`, `Draft: ${newest.draft}`, `Sent back at: ${new Date().toISOString()}`, "", "Verdict: CHANGES", ""]
  try {
    mkdirSync(path.join(process.cwd(), roundFolder), { recursive: true })
    writeFileSync(path.join(process.cwd(), findingsFile), `${[...head, ...findings.map((line) => `- [high] ${line}`)].join("\n")}\n`, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${findingsFile}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${findingsFile}\n`)
  return moveProcess(id, "rework")
}

/** A text as one line: every control character as a space, every run of whitespace as one space, without the whitespace at its ends. */
function oneLine(text) {
  return text.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim()
}

/** The files `feedback-<k>.md` of a process whose first line `Status: ` says open, each with its number, in ascending order of `<k>`. */
function openFeedbackFiles(id) {
  if (typeof id !== "string" || !/^[a-z0-9-]+$/.test(id)) return []
  const folder = path.join(process.cwd(), "processes", id, "feedback")
  return folderNumbers(folder, /^feedback-(\d+)\.md$/)
    .map((number) => ({ number, file: path.join(folder, `feedback-${number}.md`) }))
    .filter((feedback) => labelledValue(feedback.file, "Status") === "open")
}

/** The text of a feedback file on one line: every line after its first line `## Text`. */
function feedbackTextLine(file) {
  const lines = fileLines(file) ?? []
  const start = lines.indexOf("## Text")
  return start === -1 ? "" : oneLine(lines.slice(start + 1).join("\n"))
}

/** What a feedback is about: the whole document or one step, `not recorded` when the file does not say. */
function feedbackAbout(file) {
  const step = labelledValue(file, "Step")
  return step === "whole document" ? "whole document" : `step ${step ?? notRecorded}`
}

/** The line of one open feedback: its number, its version, the step it is about, its kind and its text. */
function feedbackLine({ number, file }) {
  const parts = [number, `version ${labelledValue(file, "Version") ?? notRecorded}`, feedbackAbout(file), labelledValue(file, "Kind") ?? notRecorded, feedbackTextLine(file)]
  return `  ${parts.join("  ")}`
}

function showProcesses(id) {
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
  for (const change of entry.history ?? []) lines.push(`  ${change.at}  ${change.stage}`)
  process.stdout.write(`${lines.join("\n")}\n`)
  return 0
}

/** Copies the organisation templates into `organisation/`, keeping every file that is already there. */
function initialiseOrganisation() {
  let createdAny = false
  for (const file of organisationFiles) {
    const targetFile = path.join(process.cwd(), "organisation", file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
    } catch (error) {
      process.stderr.write(`process-factory: cannot write organisation/${file}: ${errorMessage(error)}\n`)
      return 1
    }
    try {
      copyFileSync(path.join(packageFolder, "templates", "organisation", file), targetFile, constants.COPYFILE_EXCL)
    } catch (error) {
      if (error.code !== "EEXIST") {
        process.stderr.write(`process-factory: cannot write organisation/${file}: ${errorMessage(error)}\n`)
        return 1
      }
      continue
    }
    process.stdout.write(`Created organisation/${file}\n`)
    createdAny = true
  }
  if (!createdAny) process.stdout.write("No files created.\n")
  return 0
}

/** Lists every published process of which a recorded dependency changed in `organisation/` or is gone. */
function checkDependencies() {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  const listed = []
  for (const entry of processes) {
    if (entry.stage !== "published") continue
    const changed = changedDependencies(entry).map((dependency) => `  ${dependency.name}  ${dependency.what}`)
    if (changed.length > 0) listed.push(`${entry.id}  ${entry.title}`, ...changed)
  }
  if (listed.length === 0) process.stdout.write("No published process has a changed dependency.\n")
  else process.stdout.write(`Work waiting for the owner:\n${listed.join("\n")}\n`)
  return 0
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => htmlEscapes[character])
}

/** A value the board records as escaped text, also when it is a number. */
function boardText(value) {
  return escapeHtml(String(value))
}

/** The path of a file in the folder of a version of a process. */
function versionFile(id, number, name) {
  return path.join(process.cwd(), "processes", id, "versions", String(number), name)
}

/** The versions a board entry lists whose `process.md` is there, in ascending order. */
function publishedVersions(entry) {
  const listed = Array.isArray(entry.versions) ? entry.versions : []
  return listed
    .map((stored) => stored.version)
    .filter((number) => Number.isInteger(number) && number >= 1 && existsSync(versionFile(entry.id, number, "process.md")))
    .sort((first, second) => first - second)
}

/** The entries of the board whose id is a name a folder of a process may have, in the order of the board. */
function boardProcesses() {
  return readProcesses().filter((entry) => typeof entry.id === "string" && /^[a-z0-9-]+$/.test(entry.id))
}

/** The processes of the board that have a published version, each with its published versions, in the order of the board. */
function publishedProcesses() {
  return boardProcesses()
    .map((entry) => ({ entry, versions: publishedVersions(entry) }))
    .filter((published) => published.versions.length > 0)
}

/** Who approved a version and on which date, each `not recorded` when `approval.md` does not give it. */
function versionApproval(id, number) {
  const file = versionFile(id, number, "approval.md")
  const approver = labelledValue(file, "Approved by")
  const date = /^\d{4}-\d{2}-\d{2}/.exec(labelledValue(file, "Approved at") ?? "")
  return { by: approver === undefined ? notRecorded : escapeHtml(approver), on: date === null ? notRecorded : date[0] }
}

/** The number and the text of a numbered item of a document, or null when the line is not one. */
function numberedItem(line) {
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
function documentHtml(lines, headingShift = 0) {
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
function htmlPage(title, body) {
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
    return `<li><a href="/${entry.id}">${escapeHtml(entry.title)}</a> Owner: ${owner}. Version ${number}. Approved on: ${approved.on}.</li>`
  })
  const list = items.length === 0 ? "<p>No process is published yet.</p>" : `<ul>\n${items.join("\n")}\n</ul>`
  return htmlPage("Published processes", `<h1>Published processes</h1>\n${list}`)
}

/** The form under the document of a version, with one option per step of that version and the whole document as the first. */
function feedbackForm(id, number, steps) {
  return [
    "<h2>Feedback</h2>",
    `<form method="post" action="/${id}/${number}/feedback">`,
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
    `<p><a href="/${entry.id}/${number}">Back to the document</a></p>`,
  ]
  return htmlPage("Feedback received", body.join("\n"))
}

/** A page that says why something was not done: its title as its heading, one item per reason and the way back. */
function reasonsPage(title, reasons, back) {
  const body = [`<h1>${title}</h1>`, `<ul>\n${reasons.map((reason) => `<li>${reason}</li>`).join("\n")}\n</ul>`, back]
  return htmlPage(title, body.join("\n"))
}

/** The page that says why a post of feedback was refused, with the way back to the document. */
function notStoredPage(entry, number, reasons) {
  return reasonsPage("Feedback not stored", reasons, `<p><a href="/${entry.id}/${number}">Back to the document</a></p>`)
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
    return `<li><a href="/${entry.id}/${other}">Version ${other}</a> Approved by: ${approvedOther.by}. Approved on: ${approvedOther.on}.${shown}</li>`
  })
  const notice =
    number === current
      ? []
      : [`<p class="notice">This is version ${number}, not the current version. <a href="/${entry.id}">Read the current version, version ${current}.</a></p>`]
  const body = [
    '<p><a href="/">All processes</a></p>',
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
function errorPage(sentence) {
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
  const notFound = '<h1>Not found</h1>\n<p>There is no published process at this address.</p>\n<p><a href="/">All processes</a></p>'
  return { status: 404, page: htmlPage("Not found", notFound) }
}

function sendPage(response, status, page) {
  response.writeHead(status, pageHeaders)
  response.end(page)
}

/** The body of a request as text, or null when it is longer than the limit, of which the rest is not read. */
function readBody(request) {
  return new Promise((resolve) => {
    const chunks = []
    let size = 0
    request.on("data", (chunk) => {
      size += chunk.length
      if (size > feedbackBodyLimit) {
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

/** The text of a post as it is stored: one kind of line break, no control character but the tab, without the whitespace at its ends. */
function feedbackText(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/(?![\n\t])\p{Cc}/gu, "")
    .trim()
}

/** Writes one feedback as the next file `feedback-<k>.md` in the folder `feedback` of the process, which is created when it is missing. */
function writeFeedbackFile(id, number, { step, kind, name, text }) {
  const folder = path.join(process.cwd(), "processes", id, "feedback")
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
function isOwnOrigin(request) {
  const origin = request.headers.origin
  const port = request.socket.localPort
  return origin === undefined || origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`
}

/** Reads a post of feedback, stores it when every check of it passes, and answers the reader. */
async function storeFeedback(request, response, { entry, number }) {
  const refuse = (status, reasons) => {
    sendPage(response, status, notStoredPage(entry, number, reasons))
  }
  if (!isOwnOrigin(request)) {
    refuse(403, ["Feedback can only be sent from the reading view itself."])
    return
  }
  const body = await readBody(request)
  if (body === null) {
    refuse(413, ["The feedback is too long."])
    return
  }
  const posted = new URLSearchParams(body)
  const kind = posted.get("kind")
  const step = posted.get("step")
  const text = feedbackText(posted.get("text") ?? "")
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
    sendPage(response, 500, errorPage("The feedback could not be stored."))
    return
  }
  response.writeHead(303, { Location: `/${entry.id}/${number}/feedback` })
  response.end()
}

function answerRequest(request, response) {
  const pathname = request.url.split("?")[0]
  if (request.method === "GET" || request.method === "HEAD") {
    let answer
    try {
      answer = answerPath(pathname)
    } catch {
      answer = { status: 500, page: errorPage("The reading view cannot read the processes.") }
    }
    sendPage(response, answer.status, request.method === "HEAD" ? undefined : answer.page)
    return
  }
  let target
  try {
    target = feedbackTarget(pathname)
  } catch {
    sendPage(response, 500, errorPage("The reading view cannot read the processes."))
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
  const number = newestNumber(folder, /^questions-(\d+)\.md$/)
  if (number === null || existsSync(path.join(folder, `answers-${number}.md`))) return { number: null, questions: [] }
  const lines = fileLines(path.join(folder, `questions-${number}.md`))
  const body = lines === null ? null : sectionLines(lines, "Questions")
  const questions = (body ?? []).flatMap((line) => {
    const item = numberedItem(line)
    return item === null ? [] : [{ number: item[1], text: item[2] }]
  })
  return { number, questions }
}

/** The card of one process: its title, its id, its owner, its newest recorded round, its open questions and the cases that failed in that round. */
function processCard(entry) {
  const newest = (entry.rounds ?? []).at(-1)
  const failing = (newest?.cases ?? []).filter((stored) => stored.result === "FAIL").map((stored) => `case ${stored.case}`)
  const questions = openQuestions(entry.id).questions.map((question) => `<li value="${question.number}">${escapeHtml(question.text)}</li>`)
  return [
    "<article>",
    `<h3><a href="/${entry.id}">${escapeHtml(entry.title)}</a></h3>`,
    `<p>${escapeHtml(entry.id)}</p>`,
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

/** The stage history of a process as a timeline: one item per element of its history on the board, oldest first. */
function panelTimeline(entry) {
  const history = Array.isArray(entry.history) ? entry.history : []
  if (history.length === 0) return "<p>No stage is recorded.</p>"
  const items = history.map((moved) => `<li><time>${boardText(moved.at)}</time> ${boardText(moved.stage)}</li>`)
  return `<ol>\n${items.join("\n")}\n</ol>`
}

/** Every case of a process in the panel: one article per file `case-<n>.md`, in ascending order of `<n>`. */
function panelCases(folder) {
  const numbers = folderNumbers(path.join(folder, "cases"), /^case-(\d+)\.md$/)
  if (numbers.length === 0) return "<p>No case yet.</p>"
  return numbers.map((number) => `<article>\n${documentHtml(fileLines(path.join(folder, "cases", `case-${number}.md`)) ?? [], 3)}\n</article>`).join("\n")
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

/** The panel of one process: where it stands, links to its seven parts, and each part as the store has it at this moment. */
function processPanel(entry) {
  const folder = path.join(process.cwd(), "processes", entry.id)
  const spec = fileLines(path.join(folder, "spec.md"))
  const decision = decisionPart(entry, folder)
  const waits = `<p>After a decision the process waits in its new stage until /process next ${entry.id} is run in Claude Code.</p>`
  const parts = [
    ...(decision === null ? [] : [["decision", "Decision", `${decision}\n${waits}`]]),
    ["timeline", "Timeline", panelTimeline(entry)],
    ["spec", "Specification", spec === null ? "<p>No specification yet.</p>" : documentHtml(spec, 3)],
    ["cases", "Cases", panelCases(folder)],
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

/** Runs the commands of a decision one after the other and answers the browser: the panel after the last, or the lines of the one that refused. */
function runDecision(response, id, commands, input) {
  for (const args of commands) {
    const run = spawnSync(process.execPath, [import.meta.filename, ...args], { cwd: process.cwd(), input, encoding: "utf8" })
    if (run.status !== 0) {
      const lines = run.stderr.split("\n").filter((line) => line !== "")
      sendPage(response, 409, reasonsPage("Not done", lines.map(escapeHtml), `<p><a href="/${id}">Back to the process</a></p>`))
      return
    }
  }
  response.writeHead(303, { Location: `/${id}` })
  response.end()
}

/** The answers of a post as the answers file of the open questions of a process, or null when no field holds an answer. */
function answersFileText(id, posted) {
  const { number, questions } = openQuestions(id)
  const answers = questions.map((question) => ({ ...question, answer: feedbackText(posted.get(`answer-${question.number}`) ?? "") }))
  if (answers.every((given) => given.answer === "")) return null
  const sections = answers.flatMap((given) => [`## ${given.number}. ${given.text}`, "", given.answer === "" ? "Not known." : given.answer, ""])
  return [`# Answers ${number}`, "", ...sections].join("\n")
}

/** Reads a post of a decision and runs the command line for it, which takes the decision or refuses it. */
async function takeDecision(request, response, { entry, action }) {
  const refuse = (status, reason) => {
    sendPage(response, status, reasonsPage("Not done", [reason], `<p><a href="/${entry.id}">Back to the process</a></p>`))
  }
  if (!isOwnOrigin(request)) {
    refuse(403, "A decision can only be sent from the dashboard itself.")
    return
  }
  const body = await readBody(request)
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
  } else if (action === "accept-spec") runDecision(response, id, [["accept-spec", id]], "")
  else if (action === "approve") runDecision(response, id, [["approve", id, "--by", posted.get("by") ?? ""], ["move", id, "published"]], "")
  else if (action === "send-back") runDecision(response, id, [["send-back", id, "-"]], posted.get("note") ?? "")
  else runDecision(response, id, [["move", id, "regenerate"]], "")
}

function answerDashboardRequest(request, response) {
  const pathname = request.url.split("?")[0]
  if (request.method === "GET" || request.method === "HEAD") {
    const notFound = '<h1>Not found</h1>\n<p>There is nothing at this address.</p>\n<p><a href="/">Dashboard</a></p>'
    let answer
    try {
      const processes = boardProcesses()
      const open = /^\/[a-z0-9-]+$/.test(pathname) ? processes.find((entry) => entry.id === pathname.slice(1)) : undefined
      if (pathname === "/") answer = { status: 200, page: dashboardMainPage(processes) }
      else if (open === undefined) answer = { status: 404, page: dashboardPage(htmlPage("Not found", notFound)) }
      else answer = { status: 200, page: dashboardProcessPage(processes, open) }
    } catch {
      answer = { status: 500, page: dashboardPage(errorPage("The dashboard cannot read the processes.")) }
    }
    sendPage(response, answer.status, request.method === "HEAD" ? undefined : answer.page)
    return
  }
  let target
  try {
    target = request.method === "POST" ? decisionTarget(pathname) : null
  } catch {
    sendPage(response, 500, errorPage("The dashboard cannot read the processes."))
    return
  }
  if (target === null) {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }
  takeDecision(request, response, target)
}

/** Starts a server of the command line on `127.0.0.1` and keeps running until the process is stopped. */
function serveOnLocalhost(name, defaultPort, handler, portArgument) {
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

function printUsage() {
  process.stderr.write(
    'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory send-back <process-id> <file>\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n',
  )
  return 1
}

const commandArguments = process.argv.slice(2)
if (commandArguments.length === 1 && commandArguments[0] === "init") process.exitCode = installSkill()
else if ((commandArguments.length === 2 || commandArguments.length === 3) && commandArguments[0] === "new") process.exitCode = createProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "move") process.exitCode = moveProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "answer") process.exitCode = answerProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 2 && commandArguments[0] === "accept-spec") process.exitCode = acceptSpec(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "round") process.exitCode = recordRound(commandArguments[1])
else if (commandArguments.length === 3 && commandArguments[0] === "owner") process.exitCode = setOwner(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 4 && commandArguments[0] === "approve" && commandArguments[2] === "--by") process.exitCode = approveDraft(commandArguments[1], commandArguments[3])
else if (commandArguments.length === 2 && commandArguments[0] === "respec") process.exitCode = respecProcess(commandArguments[1])
else if (commandArguments.length === 3 && commandArguments[0] === "send-back") process.exitCode = sendBackDraft(commandArguments[1], commandArguments[2])
else if (commandArguments.length <= 2 && commandArguments[0] === "show") process.exitCode = showProcesses(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "init") process.exitCode = initialiseOrganisation()
else if (commandArguments.length === 1 && commandArguments[0] === "check") process.exitCode = checkDependencies()
else if (commandArguments[0] === "serve" && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Reading view", viewPort, answerRequest, commandArguments[2])
else if (commandArguments[0] === "dashboard" && (commandArguments.length === 1 || (commandArguments.length === 3 && commandArguments[1] === "--port")))
  process.exitCode = serveOnLocalhost("Dashboard", dashboardPort, answerDashboardRequest, commandArguments[2])
else process.exitCode = printUsage()
