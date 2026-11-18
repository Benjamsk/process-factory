#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs"
import path from "node:path"

const skillPath = ".claude/skills/process/SKILL.md"
const packageFolder = path.dirname(import.meta.dirname)
const templateFile = path.join(packageFolder, "templates", "skills", "process", "SKILL.md")

function installSkill() {
  const targetFile = path.join(process.cwd(), skillPath)
  try {
    mkdirSync(path.dirname(targetFile), { recursive: true })
    copyFileSync(templateFile, targetFile)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`process-factory: cannot write ${skillPath}: ${message}\n`)
    return 1
  }
  process.stdout.write(`Installed ${skillPath}\n`)
  return 0
}

function printUsage() {
  process.stderr.write("Usage: process-factory init\n")
  return 1
}

const commandArguments = process.argv.slice(2)
const isInit = commandArguments.length === 1 && commandArguments[0] === "init"
process.exitCode = isInit ? installSkill() : printUsage()
