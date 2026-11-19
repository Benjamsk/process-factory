#!/usr/bin/env node
import { constants, copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const skillFolder = ".claude/skills/process"
/** The files of the skill, in the order `init` installs them. */
const skillFiles = ["SKILL.md", "interviewer.md", "questioner.md"]
const boardPath = "processes/board.json"
const processFolders = ["cases", "drafts", "rounds", "versions", "feedback"]
/** The files of the organisation context, in the order `org init` creates them. */
const organisationFiles = ["roles.md", "systems.md", "processors.md", "policies.md", "authority.md"]
/** The ten stages, each with the stages a process may move to from it. */
const allowedMoves = {
  intake: ["clarify", "spec"],
  clarify: ["spec"],
  spec: ["clarify", "cases"],
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

function installSkill() {
  for (const file of skillFiles) {
    const targetFile = path.join(process.cwd(), skillFolder, file)
    try {
      mkdirSync(path.dirname(targetFile), { recursive: true })
      copyFileSync(path.join(packageFolder, "templates", "skills", "process", file), targetFile)
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
    const stages = allowed.join(", ") || "none"
    process.stderr.write(
      `process-factory: cannot move ${id} from ${entry.stage} to ${stage} (allowed from ${entry.stage}: ${stages})\n`,
    )
    return 1
  }
  entry.stage = stage
  entry.history = [...(entry.history ?? []), { at: new Date().toISOString(), stage }]
  writeBoard(processes)
  process.stdout.write(`${stage}\n`)
  return 0
}

/** The highest number among the files `questions-<n>.md` in the folder, or null when there is none. */
function newestQuestionsNumber(folder) {
  let names
  try {
    names = readdirSync(folder)
  } catch {
    return null
  }
  const numbers = names.flatMap((name) => {
    const match = /^questions-(\d+)\.md$/.exec(name)
    return match === null ? [] : [Number(match[1])]
  })
  return numbers.length === 0 ? null : Math.max(...numbers)
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
  const number = newestQuestionsNumber(path.join(process.cwd(), folder))
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
  const lines = [entry.id, `Title: ${entry.title}`, `Stage: ${entry.stage}`, "History:"]
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

function printUsage() {
  process.stderr.write(
    'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory org init\n',
  )
  return 1
}

const commandArguments = process.argv.slice(2)
if (commandArguments.length === 1 && commandArguments[0] === "init") process.exitCode = installSkill()
else if ((commandArguments.length === 2 || commandArguments.length === 3) && commandArguments[0] === "new") process.exitCode = createProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "move") process.exitCode = moveProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length === 3 && commandArguments[0] === "answer") process.exitCode = answerProcess(commandArguments[1], commandArguments[2])
else if (commandArguments.length <= 2 && commandArguments[0] === "show") process.exitCode = showProcesses(commandArguments[1])
else if (commandArguments.length === 2 && commandArguments[0] === "org" && commandArguments[1] === "init") process.exitCode = initialiseOrganisation()
else process.exitCode = printUsage()
