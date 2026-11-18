#!/usr/bin/env node
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const skillPath = ".claude/skills/process/SKILL.md"
const boardPath = "processes/board.json"
const processFolders = ["cases", "drafts", "rounds", "versions", "feedback"]
const packageFolder = path.dirname(import.meta.dirname)
const templateFile = path.join(packageFolder, "templates", "skills", "process", "SKILL.md")

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function installSkill() {
  const targetFile = path.join(process.cwd(), skillPath)
  try {
    mkdirSync(path.dirname(targetFile), { recursive: true })
    copyFileSync(templateFile, targetFile)
  } catch (error) {
    process.stderr.write(`process-factory: cannot write ${skillPath}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`Installed ${skillPath}\n`)
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

function writeProcessFolder(id, title) {
  const folder = path.join(process.cwd(), "processes", id)
  mkdirSync(path.join(process.cwd(), "processes"), { recursive: true })
  mkdirSync(folder)
  writeFileSync(path.join(folder, "request.md"), `# ${title}\n`)
  for (const name of processFolders) mkdirSync(path.join(folder, name))
}

function createProcess(argument) {
  const title = argument.trim()
  if (/[\r\n]/.test(title) || !/[a-zA-Z0-9]/.test(title)) {
    process.stderr.write("process-factory: the title must be one line with at least one letter or digit\n")
    return 1
  }
  let processes
  try {
    processes = readProcesses()
  } catch (error) {
    process.stderr.write(`process-factory: cannot read ${boardPath}: ${errorMessage(error)}\n`)
    return 1
  }
  const id = processId(processes, title)
  try {
    writeProcessFolder(id, title)
    const board = { processes: [...processes, { id, title, stage: "intake" }] }
    writeFileSync(path.join(process.cwd(), boardPath), `${JSON.stringify(board, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`process-factory: cannot create process ${id}: ${errorMessage(error)}\n`)
    return 1
  }
  process.stdout.write(`${id}\n`)
  return 0
}

function printUsage() {
  process.stderr.write('Usage: process-factory init\n       process-factory new "<title>"\n')
  return 1
}

const commandArguments = process.argv.slice(2)
if (commandArguments.length === 1 && commandArguments[0] === "init") process.exitCode = installSkill()
else if (commandArguments.length === 2 && commandArguments[0] === "new") process.exitCode = createProcess(commandArguments[1])
else process.exitCode = printUsage()
