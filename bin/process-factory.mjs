#!/usr/bin/env node
import { createHash } from "node:crypto"
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
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
/** The kinds of dependency the command line watches, each with the file of `organisation/` that describes them. */
const dependencyFiles = { Role: "organisation/roles.md", System: "organisation/systems.md", Agreement: "organisation/processors.md", Policy: "organisation/policies.md" }
/** The tags of a finding, in the order `round` counts them. */
const findingTags = ["high", "medium", "low"]
/** The number of review rounds after which `round` stops the loop and moves the process to `approval`. */
const roundLimit = 5
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
  regenerate: ["review"],
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
  entry.stage = stage
  entry.history = [...(entry.history ?? []), { at: new Date().toISOString(), stage }]
  if (stage === "published") {
    entry.dependencies = specDependencies(path.join(process.cwd(), "processes", id)).map((dependency) => ({
      ...dependency,
      hash: dependencyHash(dependency.kind, dependency.name),
    }))
  }
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
    answers = readFileSync(file)
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
  const draftNumber = newestNumber(path.join(process.cwd(), folder, "drafts"), /^draft-(\d+)\.md$/)
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
  const regressed = regressedLines(cases ?? [], recorded)
  // A case with the result FAIL comes with the verdict CHANGES, so dropping the stop leaves a regressed round in rework.
  const stopped =
    regressed.length === 0 && asking.length > 0 && recorded.length + 1 >= roundLimit
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

function showProcesses(id) {
  const processes = readProcessesOrPrintReason()
  if (processes === null) return 1
  if (id === undefined) {
    if (processes.length === 0) process.stdout.write("No processes.\n")
    else for (const entry of processes) process.stdout.write(`${entry.id}  ${entry.stage}  ${entry.title}\n`)
    return 0
  }
  const entry = findProcessOrPrintReason(processes, id)
  if (entry === undefined) return 1
  const lines = [entry.id, `Title: ${entry.title}`, `Stage: ${entry.stage}`]
  if (entry.specAcceptedAt !== undefined) lines.push(`Spec accepted: ${entry.specAcceptedAt}`)
  const rounds = entry.rounds ?? []
  const stopped = rounds.at(-1)?.stopped
  if (stopped !== undefined) lines.push(`Stopped: ${stopped}`)
  if (rounds.length > 0) {
    lines.push("Rounds:")
    for (const round of rounds) lines.push(`  ${round.round}  ${round.draft}  ${round.verdicts.map((given) => `${given.reviewer} ${given.verdict}`).join(", ")}`)
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
    const changed = (entry.dependencies ?? []).flatMap((dependency) => {
      const hash = dependencyHash(dependency.kind, dependency.name)
      if (hash === dependency.hash) return []
      const file = dependencyFiles[dependency.kind]
      const what = hash === null ? `removed from ${file}` : `changed in ${file}`
      return [`  ${dependency.kind}: ${dependency.name}  ${what}`]
    })
    if (changed.length > 0) listed.push(`${entry.id}  ${entry.title}`, ...changed)
  }
  if (listed.length === 0) process.stdout.write("No published process has a changed dependency.\n")
  else process.stdout.write(`Work waiting for the owner:\n${listed.join("\n")}\n`)
  return 0
}

function printUsage() {
  process.stderr.write(
    'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory org init\n       process-factory check\n',
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
else if (commandArguments.length <= 2 && commandArguments[0] === "show") process.exitCode = showProcesses(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "init") process.exitCode = initialiseOrganisation()
else if (commandArguments.length === 1 && commandArguments[0] === "check") process.exitCode = checkDependencies()
else process.exitCode = printUsage()
