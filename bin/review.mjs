import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { isNamedInRoles } from "./organisation.mjs"
import { reviewerFiles, skillFolder } from "./skill.mjs"
import { caseNumbers, cleanedText, moveProcess, openSections, readEntryOrPrintReason } from "./state-machine.mjs"
import {
  editedNames,
  errorMessage,
  fileLines,
  newestDraftNumber,
  newestNumber,
  oneLine,
  printedPath,
  readInputOrPrintReason,
  sectionLines,
  storePath,
  writeBoard,
} from "./store.mjs"

/** The tags of a finding, in the order `round` counts them. */
const findingTags = ["high", "medium", "low"]
/** The number of review rounds after which `round` stops the loop and moves the process to `approval`. */
const roundLimit = 5
/** The stages in which the specification and the cases of a process can be edited. */
const editStages = ["spec", "cases", "draft", "review", "rework", "approval"]
/** The stages from which an edit moves a process back to `draft`, so that a new draft is written from the edited files. */
export const stagesThatMoveToDraft = ["review", "rework", "approval"]

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
  const round = newestNumber(storePath(folder, "rounds"), /^round-(\d+)$/)
  if (round === null) {
    process.stderr.write(`${cannot}: there is no round folder in ${printedPath(folder)}/rounds\n`)
    return 1
  }
  const recorded = entry.rounds ?? []
  if (recorded.some((entered) => entered.round === round)) {
    process.stderr.write(`${cannot}: round ${round} is already recorded\n`)
    return 1
  }
  const draftNumber = newestDraftNumber(storePath(folder))
  if (draftNumber === null) {
    process.stderr.write(`${cannot}: there is no draft in ${printedPath(folder)}/drafts\n`)
    return 1
  }
  const roundFolder = `${folder}/rounds/round-${round}`
  const read = reviewers.map((reviewer) => ({ reviewer, ...readFindingsFile(storePath(roundFolder, `${reviewer}.md`)) }))
  const simulationFile = read.find((file) => file.reviewer === "simulation")
  let cases = null
  if (simulationFile !== undefined && simulationFile.reason === undefined) {
    cases = storedCaseResults(storePath(folder), storePath(roundFolder))
    simulationFile.reason = caseReason(cases, simulationFile.verdict)
  }
  const refused = read.filter((file) => file.reason !== undefined)
  if (refused.length > 0) {
    process.stderr.write(`process-factory: cannot record round ${round} of ${id}: these findings files in ${printedPath(roundFolder)} are missing or malformed\n`)
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
  process.stdout.write(`${[`Recorded ${printedPath(roundFolder)} for ${draft}`, ...counted, ...regressed, ...stoppedLine, entry.stage].join("\n")}\n`)
  return 0
}

/** The findings of a reviewer's file of a round, each line as it is in the file, or null when the file cannot be read. */
export function roundFindings(roundFolder, reviewer) {
  if (!/^[a-z0-9-]+$/.test(reviewer)) return null
  const lines = fileLines(storePath(roundFolder, `${reviewer}.md`))
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
      process.stderr.write(`${cannot}: ${printedPath(roundFolder)}/${given.reviewer}.md is missing\n`)
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
    mkdirSync(storePath(folder, "feedback"), { recursive: true })
    writeFileSync(storePath(findingsFile), `${[head, ...written].join("\n\n")}\n`, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(findingsFile)}: ${errorMessage(error)}\n`)
    return 1
  }
  entry.stage = "spec"
  entry.history = [...(entry.history ?? []), { at, stage: "spec" }]
  entry.respecs = [...(entry.respecs ?? []), { round, at }]
  delete entry.specAcceptedAt
  writeBoard(processes)
  process.stdout.write(`Stored ${printedPath(findingsFile)}\nspec\n`)
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
    mkdirSync(storePath(roundFolder), { recursive: true })
    writeFileSync(storePath(findingsFile), `${[...head, ...findings.map((line) => `- [high] ${line}`)].join("\n")}\n`, { flag: "wx" })
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(findingsFile)}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Stored ${printedPath(findingsFile)}\n`)
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
  if (!existsSync(storePath(stored))) {
    process.stderr.write(`${cannot}: ${printedPath(stored)} is not there\n`)
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
    process.stderr.write(`${cannot}: ${by} is not named in ${printedPath("organisation", "roles.md")}\n`)
    return 1
  }
  const posted = readInputOrPrintReason(file)
  if (posted === null) return 1
  const text = cleanedText(posted.toString("utf8"))
  if (text === "") {
    process.stderr.write(`${cannot}: the text is empty\n`)
    return 1
  }
  if (text === editableText(storePath(stored))) {
    process.stderr.write(`${cannot}: the text is the same as ${printedPath(stored)}\n`)
    return 1
  }
  const open = name === "spec.md" && entry.stage !== "spec" ? openSections(text.split("\n").map((line) => line.trimEnd())) : []
  if (open.length > 0) {
    process.stderr.write(`${cannot}: these sections would not be decided\n`)
    for (const section of open) process.stderr.write(`  ${section}\n`)
    return 1
  }
  try {
    writeFileSync(storePath(stored), `${text}\n`)
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${printedPath(stored)}: ${errorMessage(error)}\n`)
    return 1
  }
  if (stagesThatMoveToDraft.includes(entry.stage)) entry.stage = "draft"
  entry.history = [...(entry.history ?? []), { at: new Date().toISOString(), stage: entry.stage, edited: name, by }]
  if (newestDraftNumber(storePath("processes", id)) !== null) {
    const marked = editedNames(entry)
    entry.needsDraft = marked.includes(name) ? marked : [...marked, name]
  }
  writeBoard(processes)
  process.stdout.write(`Stored ${printedPath(stored)}\n${entry.stage}\n`)
  return 0
}
