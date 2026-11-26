import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { changedDependencies, dependencyHash, specDependencies } from "./dependencies.mjs"
import { isNamedInRoles } from "./organisation.mjs"
import {
  errorMessage,
  fileLines,
  findProcessOrPrintReason,
  folderNumbers,
  labelledValue,
  newestDraftNumber,
  newestNumber,
  openFeedbackFiles,
  printedPath,
  readInputOrPrintReason,
  readProcessesOrPrintReason,
  sectionLines,
  storePath,
  writeBoard,
} from "./store.mjs"

/** The eleven sections of a specification, in the order of `spec-writer.md`. */
const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
/** The seven headings of a draft, in the order of `draft-writer.md`. */
const draftHeadings = ["When this applies", "Who does what", "Steps", "Who must be told", "When to hand over", "What to record", "If something does not fit"]
/** The ten stages, each with the stages a process may move to from it. */
export const allowedMoves = {
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

/** The processes of the board and the entry with this id, an id a folder of a process may have, or null after printing why there is none. */
export function readEntryOrPrintReason(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return null
  const entry = findProcessOrPrintReason(/^[a-z0-9-]+$/.test(id) ? processes : [], id)
  return entry === undefined ? null : { processes, entry }
}

/** Copies the approved draft, the spec, the cases and the approval of a process into a new version folder, and returns the version for the board, or null after printing why it cannot be written. */
function writeVersion(id, entry, draftNumber, at) {
  const processFolder = storePath("processes", id)
  const listed = (entry.versions ?? []).map((stored) => stored.version)
  const number = Math.max(0, ...folderNumbers(path.join(processFolder, "versions"), /^(\d+)$/), ...listed) + 1
  const folder = `processes/${id}/versions/${number}`
  const versionFolder = storePath(folder)
  const approvalFile = path.join(processFolder, "versions", `approval-draft-${draftNumber}.md`)
  try {
    mkdirSync(versionFolder)
    copyFileSync(path.join(processFolder, "drafts", `draft-${draftNumber}.md`), path.join(versionFolder, "process.md"))
    if (existsSync(path.join(processFolder, "spec.md"))) copyFileSync(path.join(processFolder, "spec.md"), path.join(versionFolder, "spec.md"))
    mkdirSync(path.join(versionFolder, "cases"))
    for (const caseNumber of caseNumbers(processFolder)) {
      const name = `case-${caseNumber}.md`
      copyFileSync(path.join(processFolder, "cases", name), path.join(versionFolder, "cases", name))
    }
    copyFileSync(approvalFile, path.join(versionFolder, "approval.md"))
    if (entry.regeneration !== undefined) copyFileSync(storePath(changeListFile(id, draftNumber)), path.join(versionFolder, "changes.md"))
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(folder)}: ${errorMessage(error)}\n`)
    return null
  }
  const approved = labelledValue(approvalFile, "Approved by")
  return { version: number, draft: `draft-${draftNumber}.md`, ...(approved === undefined ? {} : { approvedBy: approved }), at }
}

/** The path of the change list of `draft-<n>.md` of a process, from the folder of its organisation. */
export function changeListFile(id, draftNumber) {
  return `processes/${id}/drafts/changes-${draftNumber}.md`
}

/** The path of the file that holds the reasons of a regeneration of a version, from the folder of its organisation. */
function reasonsFile(id, version) {
  return `processes/${id}/regeneration-${version}.md`
}

/** The names of the reasons of a regeneration: the texts after `- ` under `## Reasons` of its reasons file. */
function recordedReasons(id, version) {
  const lines = fileLines(storePath(reasonsFile(id, version)))
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
  if (named[2] === "owner") return existsSync(storePath("processes", entry.id, "rounds", `round-${named[1]}`, "owner.md"))
  return (round.verdicts ?? []).some((given) => given.reviewer === named[2])
}

/** The first problem of the lines of a change list of a regeneration, in the order of the checks below, or undefined when it has none. */
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
  if (unknown !== undefined) return `names a reason that is not in ${printedPath(reasonsFile(entry.id, version))}: ${unknown}`
  const silent = notChanged.find((changed) => changed.body.every((line) => line === ""))
  if (silent !== undefined) return `gives no reason why ${silent.reason} is not changed`
  const left = reasons.filter((reason) => !named.includes(reason))
  if (left.length > 0) return `does not name these reasons of ${printedPath(reasonsFile(entry.id, version))}: ${left.join(", ")}`
  return undefined
}

/** The change list of the newest draft of a process that is being regenerated with its problem, or undefined when it has none. */
function changeListProblem(entry) {
  const file = changeListFile(entry.id, newestDraftNumber(storePath("processes", entry.id)))
  const problem = problemOfChangeList(fileLines(storePath(file)), entry)
  return problem === undefined ? undefined : `${printedPath(file)} ${problem}`
}

/** The names of the reasons to regenerate a process: its open feedback, its cases that version `<v>` does not hold, and its changed dependencies. */
function regenerationReasons(entry, version) {
  const folder = storePath("processes", entry.id)
  const newCases = caseNumbers(folder).filter(
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
    writeFileSync(storePath(file), `${[...head, ...reasons.map((reason) => `- ${reason}`)].join("\n")}\n`)
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(file)}: ${errorMessage(error)}\n`)
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
      process.stderr.write(`process-factory: cannot write ${printedPath("processes", id, "feedback", `feedback-${open.number}.md`)}: ${errorMessage(error)}\n`)
      return false
    }
  }
  return true
}

export function moveProcess(id, stage) {
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
    const draftNumber = newestDraftNumber(storePath(folder))
    if (draftNumber === null || !existsSync(storePath(folder, "versions", `approval-draft-${draftNumber}.md`))) {
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
    const changes = regenerating ? fileLines(storePath(changeListFile(id, draftNumber))) : null
    if (changes !== null && !closeAnsweredFeedback(id, changes, version.version)) return 1
  }
  entry.stage = stage
  entry.history = [...(entry.history ?? []), { at, stage }]
  if (publishing) {
    entry.dependencies = specDependencies(storePath("processes", id)).map((dependency) => ({
      ...dependency,
      hash: dependencyHash(dependency.kind, dependency.name),
    }))
    entry.versions = [...(entry.versions ?? []), version]
  }
  if (stage === "published") delete entry.regeneration
  if (stage === "review") delete entry.needsDraft
  writeBoard(processes)
  process.stdout.write(`${stage}\n`)
  return 0
}

/** The numbers of the files `case-<n>.md` in the folder `cases` of a process, in ascending order. */
export function caseNumbers(processFolder) {
  return folderNumbers(path.join(processFolder, "cases"), /^case-(\d+)\.md$/)
}

/** The number of the newest `questions-<n>.md` in the folder of a process, or null when there is none. */
export function newestQuestionsNumber(processFolder) {
  return newestNumber(processFolder, /^questions-(\d+)\.md$/)
}

export function answerProcess(id, file) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { entry } = found
  if (entry.stage !== "clarify") {
    process.stderr.write(`process-factory: cannot answer ${id}: it is in the stage ${entry.stage}, not in clarify\n`)
    return 1
  }
  const folder = `processes/${id}`
  const number = newestQuestionsNumber(storePath(folder))
  if (number === null) {
    process.stderr.write(`process-factory: cannot answer ${id}: there is no questions file in ${printedPath(folder)}\n`)
    return 1
  }
  const answers = readInputOrPrintReason(file)
  if (answers === null) return 1
  if (answers.toString("utf8").trim() === "") {
    process.stderr.write(`process-factory: cannot answer ${id}: ${file} is empty\n`)
    return 1
  }
  const answersFile = `${folder}/answers-${number}.md`
  try {
    writeFileSync(storePath(answersFile), answers, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(answersFile)}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${printedPath(answersFile)}\n`)
  return moveProcess(id, "spec")
}

/** The sections these lines of a specification do not mark decided, in the order of the eleven. */
export function openSections(lines) {
  return specSections.filter((name) => {
    const body = sectionLines(lines, name)
    return body === null || body.find((line) => line !== "") !== "Status: decided"
  })
}

/** The sections of a `spec.md` that are not marked decided, in the order of the eleven. */
export function openSpecSections(folder) {
  const lines = fileLines(path.join(folder, "spec.md"))
  return lines === null ? specSections : openSections(lines)
}

export function acceptSpec(id) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { processes, entry } = found
  if (entry.stage !== "spec") {
    process.stderr.write(`process-factory: cannot accept the spec of ${id}: it is in the stage ${entry.stage}, not in spec\n`)
    return 1
  }
  const folder = `processes/${id}`
  const open = openSpecSections(storePath(folder))
  if (open.length > 0) {
    process.stderr.write(`process-factory: cannot accept the spec of ${id}: these sections of ${printedPath(folder)}/spec.md are open\n`)
    for (const name of open) process.stderr.write(`  ${name}\n`)
    const number = newestQuestionsNumber(storePath(folder))
    if (number !== null && !existsSync(storePath(folder, `answers-${number}.md`))) {
      process.stderr.write(`process-factory: ${printedPath(folder)}/questions-${number}.md has no answers yet: ${id} moves to clarify\n`)
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
  process.stdout.write(`Accepted ${printedPath(folder)}/spec.md\ncases\n`)
  return 0
}

export function setOwner(id, personArgument) {
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
    process.stderr.write(`process-factory: cannot set the owner of ${id}: ${person} is not named in ${printedPath("organisation", "roles.md")}\n`)
    return 1
  }
  entry.owner = person
  writeBoard(processes)
  process.stdout.write(`Owner: ${person}\n`)
  return 0
}

export function approveDraft(id, byArgument) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { entry } = found
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
    process.stderr.write(`${cannot}: its owner ${entry.owner} is not named in ${printedPath("organisation", "roles.md")}\n`)
    return 1
  }
  const folder = `processes/${id}`
  const draftNumber = newestDraftNumber(storePath(folder))
  if (draftNumber === null) {
    process.stderr.write(`${cannot}: there is no draft in ${printedPath(folder)}/drafts\n`)
    return 1
  }
  const draft = `draft-${draftNumber}.md`
  const approvalFile = `${folder}/versions/approval-draft-${draftNumber}.md`
  if (existsSync(storePath(approvalFile))) {
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
    mkdirSync(storePath(folder, "versions"), { recursive: true })
    writeFileSync(
      storePath(approvalFile),
      `# Approval of ${draft}\n\nProcess: ${id}\nDraft: ${draft}\n${changes}Approved by: ${entry.owner}\nApproved at: ${new Date().toISOString()}\n`,
    )
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(approvalFile)}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${printedPath(approvalFile)}\n`)
  return 0
}

/** A posted or a stored text as it is stored and compared: one kind of line break, no control character but the tab, without the whitespace at its ends. */
export function cleanedText(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/(?![\n\t])\p{Cc}/gu, "")
    .trim()
}
