import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { organisationFolder, runCommand } from "../006-process-state-machine/store.ts"

export const root = path.resolve(import.meta.dirname, "../..")

/** The content of a file in the repository, or an empty string when it does not exist. */
export function readText(file: string): string {
  const absolute = path.join(root, file)
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : ""
}

function templateLines(): string[] {
  return readText("templates/skills/process/SKILL.md").split(/\r?\n/)
}

/** The lines between the two --- lines at the start of the template. */
export function frontmatterLines(): string[] {
  const lines = templateLines()
  const end = lines.indexOf("---", 1)
  return lines[0] !== "---" || end === -1 ? [] : lines.slice(1, end)
}

/** The value of the description key in the frontmatter, or an empty string. */
export function description(): string {
  const prefix = "description: "
  return frontmatterLines().find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? ""
}

function bodyLines(): string[] {
  const lines = templateLines()
  const end = lines.indexOf("---", 1)
  return end === -1 ? [] : lines.slice(end + 1)
}

/** Everything after the frontmatter block. */
export function body(): string {
  return bodyLines().join("\n")
}

/** The titles of the level 2 headings of the body, in their order. */
export function sectionTitles(): string[] {
  return bodyLines()
    .filter((line) => line.startsWith("## "))
    .map((line) => line.slice(3))
}

function sectionLines(title: string): string[] {
  const lines = bodyLines()
  const start = lines.indexOf(`## ${title}`)
  if (start === -1) {
    return []
  }
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,2} /.test(line))
  return end === -1 ? rest : rest.slice(0, end)
}

/** The text under `## <title>` in the body, up to the next heading of level 1 or 2. */
export function section(title: string): string {
  return sectionLines(title).join("\n")
}

/** The rows of the table under `## <title>`, without its header row and the line under it. */
export function tableRows(title: string): string[] {
  return sectionLines(title)
    .filter((line) => line.startsWith("|"))
    .slice(2)
}

/** The stages in the first column of the table under `## Run the stage`, without their backticks. */
export function tableStages(): string[] {
  return tableRows("Run the stage").map((row) => (row.split("|")[1] ?? "").trim().replace(/`/g, ""))
}

/** A new folder of an organisation, in a new project outside the repository, whose board holds one process in `stage`. */
export function folderWithProcess(id: string, stage: string): string {
  const folder = organisationFolder("process-factory-skill-")
  mkdirSync(path.join(folder, "processes"))
  const processes = [{ id, title: "Handle a breach", stage, history: [{ at: "2026-11-18T17:02:11.123Z", stage }] }]
  writeFileSync(path.join(folder, "processes/board.json"), `${JSON.stringify({ processes }, null, 2)}\n`)
  return folder
}

export { runCommand }
