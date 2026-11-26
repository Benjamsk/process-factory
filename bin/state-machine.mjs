import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { changedDependencies, dependencyHash, specDependencies } from "./dependencies.mjs"
import { isNamedInRoles } from "./organisation.mjs"
import { reviewerFiles, skillFolder } from "./skill.mjs"
import {
  editedNames,
  errorMessage,
  fileLines,
  findProcessOrPrintReason,
  folderNumbers,
  labelledValue,
  newestDraftNumber,
  newestNumber,
  oneLine,
  openFeedbackFiles,
  readInputOrPrintReason,
  readProcessesOrPrintReason,
  sectionLines,
  writeBoard,
} from "./store.mjs"

/** The eleven sections of a specification, in the order of `spec-writer.md`. */
const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
/** The seven headings of a draft, in the order of `draft-writer.md`. */
const draftHeadings = ["When this applies", "Who does what", "Steps", "Who must be told", "When to hand over", "What to record", "If something does not fit"]
/** The tags of a finding, in the order `round` counts them. */
const findingTags = ["high", "medium", "low"]
/** The number of review rounds after which `round` stops the loop and moves the process to `approval`. */
const roundLimit = 5
/** The stages in which the specification and the cases of a process can be edited. */
const editStages = ["spec", "cases", "draft", "review", "rework", "approval"]
/** The stages from which an edit moves a process back to `draft`, so that a new draft is written from the edited files. */
export const stagesThatMoveToDraft = ["review", "rework", "approval"]
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
function readEntryOrPrintReason(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return null
  const entry = findProcessOrPrintReason(/^[a-z0-9-]+$/.test(id) ? processes : [], id)
  return entry === undefined ? null : { processes, entry }
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
    for (const caseNumber of caseNumbers(processFolder)) {
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
export function changeListFile(id, draftNumber) {
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
  const number = newestQuestionsNumber(path.join(process.cwd(), folder))
  if (number === null) {
    process.stderr.write(`process-factory: cannot answer ${id}: there is no questions file in ${folder}\n`)
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
    writeFileSync(path.join(process.cwd(), answersFile), answers, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${answersFile}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${answersFile}\n`)
  return moveProcess(id, "spec")
}

/** The sections these lines of a specification do not mark decided, in the order of the eleven. */
function openSections(lines) {
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
  const open = openSpecSections(path.join(process.cwd(), folder))
  if (open.length > 0) {
    process.stderr.write(`process-factory: cannot accept the spec of ${id}: these sections of ${folder}/spec.md are open\n`)
    for (const name of open) process.stderr.write(`  ${name}\n`)
    const number = newestQuestionsNumber(path.join(process.cwd(), folder))
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
  return caseNumbers(folder).map((number) => ({ case: number, result: results.get(number) ?? null }))
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

export function recordRound(id) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { processes, entry } = found
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
    process.stderr.write(`process-factory: cannot set the owner of ${id}: ${person} is not named in organisation/roles.md\n`)
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
export function roundFindings(roundFolder, reviewer) {
  if (!/^[a-z0-9-]+$/.test(reviewer)) return null
  const lines = fileLines(path.join(process.cwd(), roundFolder, `${reviewer}.md`))
  return lines === null ? null : lines.filter((line) => findingTags.some((tag) => line.startsWith(`- [${tag}] `)))
}

export function respecProcess(id) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { processes, entry } = found
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

export function sendBackDraft(id, file) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { entry } = found
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
  const note = readInputOrPrintReason(file)
  if (note === null) return 1
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

/** Whether a name is one of the files of a process a person may edit: `spec.md` or a case. */
export function isEditableName(name) {
  return name === "spec.md" || /^case-[1-9]\d*\.md$/.test(name)
}

/** The path of an edited file in the folder of a process. */
export function editedPath(name) {
  return name === "spec.md" ? name : `cases/${name}`
}

/** Whether the specification and the cases of a process may be edited now: it is in an edit stage and is not being regenerated. */
export function isEditable(entry) {
  return editStages.includes(entry.stage) && entry.regeneration === undefined
}

/** A posted or a stored text as it is stored and compared: one kind of line break, no control character but the tab, without the whitespace at its ends. */
export function cleanedText(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/(?![\n\t])\p{Cc}/gu, "")
    .trim()
}

/** The text of a file through `cleanedText`, or null when it cannot be read. */
export function editableText(file) {
  try {
    return cleanedText(readFileSync(file, "utf8"))
  } catch {
    return null
  }
}

export function editProcessFile(id, name, file, byArgument) {
  const found = readEntryOrPrintReason(id)
  if (found === null) return 1
  const { processes, entry } = found
  if (!isEditableName(name)) {
    process.stderr.write(`process-factory: cannot edit ${id}: ${name} is not spec.md or a case-<n>.md\n`)
    return 1
  }
  const cannot = `process-factory: cannot edit ${name} of ${id}`
  if (!editStages.includes(entry.stage)) {
    process.stderr.write(`${cannot}: it is in the stage ${entry.stage}, not in spec, cases, draft, review, rework or approval\n`)
    return 1
  }
  if (entry.regeneration !== undefined) {
    process.stderr.write(`${cannot}: it is being regenerated from version ${entry.regeneration.version}, and a regeneration keeps the specification and the cases it started with\n`)
    return 1
  }
  const stored = `processes/${id}/${editedPath(name)}`
  if (!existsSync(path.join(process.cwd(), stored))) {
    process.stderr.write(`${cannot}: ${stored} is not there\n`)
    return 1
  }
  const by = byArgument.trim()
  if (/[\r\n]/.test(by) || !/\p{L}/u.test(by)) {
    process.stderr.write(`${cannot}: --by must be one line with at least one letter\n`)
    return 1
  }
  if (entry.owner !== undefined && by !== entry.owner) {
    process.stderr.write(`${cannot}: --by does not name its owner\n`)
    return 1
  }
  if (!isNamedInRoles(by)) {
    process.stderr.write(`${cannot}: ${by} is not named in organisation/roles.md\n`)
    return 1
  }
  const posted = readInputOrPrintReason(file)
  if (posted === null) return 1
  const text = cleanedText(posted.toString("utf8"))
  if (text === "") {
    process.stderr.write(`${cannot}: the text is empty\n`)
    return 1
  }
  if (text === editableText(path.join(process.cwd(), stored))) {
    process.stderr.write(`${cannot}: the text is the same as ${stored}\n`)
    return 1
  }
  const open = name === "spec.md" && entry.stage !== "spec" ? openSections(text.split("\n").map((line) => line.trimEnd())) : []
  if (open.length > 0) {
    process.stderr.write(`${cannot}: these sections would not be decided\n`)
    for (const section of open) process.stderr.write(`  ${section}\n`)
    return 1
  }
  try {
    writeFileSync(path.join(process.cwd(), stored), `${text}\n`)
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${stored}: ${errorMessage(error)}\n`)
    return 1
  }
  if (stagesThatMoveToDraft.includes(entry.stage)) entry.stage = "draft"
  entry.history = [...(entry.history ?? []), { at: new Date().toISOString(), stage: entry.stage, edited: name, by }]
  if (newestDraftNumber(path.join(process.cwd(), "processes", id)) !== null) {
    const marked = editedNames(entry)
    entry.needsDraft = marked.includes(name) ? marked : [...marked, name]
  }
  writeBoard(processes)
  process.stdout.write(`Stored ${stored}\n${entry.stage}\n`)
  return 0
}
