import { readFileSync } from "node:fs"
import path from "node:path"
import { readFile, root } from "../010-clarifying-questions/clarify.ts"

export const interviewerTemplate = "templates/skills/process/interviewer.md"

/** The text of a file next to the tests of this job, with `\n` as its line ending. */
export function fixture(name: string): string {
  return readFileSync(path.join(import.meta.dirname, name), "utf8").replace(/\r\n/g, "\n")
}

/** The text of a file in the repository, with `\n` as its line ending. */
export function repositoryText(file: string): string {
  return readFile(root, file).replace(/\r\n/g, "\n")
}

/** The text under `## Read a document` as the spec gives it, without the heading. */
export const readADocument = fixture("read-a-document.md").trim()
