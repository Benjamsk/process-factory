import { readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, projectOf, runCommand } from "../006-process-state-machine/store.ts"
import { boardFile, entries, firstProcess, history, readFile, writeBoard, writeFile } from "./clarify.ts"

const id = "001-handle-a-breach"
const folder = `processes/${id}`
const answers = "# Answers 1\n\n## 1. Who reports a lost laptop?\n\nThe employee, to the service desk.\n\n## 2. How fast?\n\nNot known.\n"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** A process in `stage` with these questions files in its folder and the answers in `my-answers.md` in the project. */
function prepare(stage: string, questionsFiles: string[]): void {
  writeBoard(project, id, stage)
  writeFile(project, `${folder}/request.md`, "# Handle a breach\n")
  for (const file of questionsFiles) {
    writeFile(project, `${folder}/${file}`, "# Questions\n\n## Questions\n\n1. Who reports a lost laptop?\n2. How fast?\n")
  }
  writeFile(projectOf(project), "my-answers.md", answers)
}

describe("process-factory answer for a process in clarify", () => {
  it("prints the stored file and the stage spec, nothing to standard error, and exits with 0", () => {
    prepare("clarify", ["questions-1.md"])
    const result = runCommand(project, ["answer", id, "my-answers.md"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Stored ${folder}/answers-1.md\nspec\n`)
    expect(result.status).toBe(0)
  })

  it("stores answers-1.md byte-identical to the file and leaves the file in place", () => {
    prepare("clarify", ["questions-1.md"])
    expect(runCommand(project, ["answer", id, "my-answers.md"]).status).toBe(0)
    expect(entries(project, folder)).toEqual(["answers-1.md", "questions-1.md", "request.md"])
    expect(readFileSync(path.join(project, folder, "answers-1.md")).equals(Buffer.from(answers))).toBe(true)
    expect(readFile(projectOf(project), "my-answers.md")).toBe(answers)
  })

  it("takes a file given by its absolute path", () => {
    prepare("clarify", ["questions-1.md"])
    const result = runCommand(project, ["answer", id, path.join(projectOf(project), "my-answers.md")])
    expect(result.status).toBe(0)
    expect(readFile(project, `${folder}/answers-1.md`)).toBe(answers)
  })

  it("moves the process to spec and appends one dated history entry", () => {
    prepare("clarify", ["questions-1.md"])
    expect(runCommand(project, ["answer", id, "my-answers.md"]).status).toBe(0)
    const entry = firstProcess(project)
    const changes = history(entry)
    expect(entry.stage).toBe("spec")
    expect(changes.map((change) => change.stage)).toEqual(["clarify", "spec"])
    expect(Object.keys(changes[1] ?? {})).toEqual(["at", "stage"])
    expect(Number.isNaN(Date.parse(String(changes[1]?.at)))).toBe(false)
  })

  it.each([
    ["answers-2.md next to questions-1.md and questions-2.md", ["questions-1.md", "questions-2.md"], "answers-2.md"],
    ["answers-10.md next to questions-9.md and questions-10.md", ["questions-9.md", "questions-10.md"], "answers-10.md"],
  ])("stores %s, the number of the newest questions file", (_name, questionsFiles, stored) => {
    prepare("clarify", questionsFiles)
    const result = runCommand(project, ["answer", id, "my-answers.md"])
    expect(result.stdout).toBe(`Stored ${folder}/${stored}\nspec\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, `${folder}/${stored}`)).toBe(answers)
    expect(entries(project, folder)).toEqual([...questionsFiles, stored, "request.md"].sort())
  })
})

describe("process-factory answer that is refused", () => {
  it("names the stage when the process is not in clarify, and writes nothing", () => {
    prepare("intake", ["questions-1.md"])
    const before = readFile(project, boardFile)
    const result = runCommand(project, ["answer", id, "my-answers.md"])
    expect(result.stderr).toBe(`process-factory: cannot answer ${id}: it is in the stage intake, not in clarify\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, folder)).toEqual(["questions-1.md", "request.md"])
  })

  it.each([["002-another-process"], ["../../outside"]])("says there is no process %s and writes nothing", (unknown) => {
    prepare("clarify", ["questions-1.md"])
    const before = readFile(project, boardFile)
    const result = runCommand(project, ["answer", unknown, "my-answers.md"])
    expect(result.stderr).toBe(`process-factory: there is no process ${unknown}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(projectOf(project))).toEqual(["my-answers.md", "organisations"])
    expect(entries(project)).toEqual(["processes"])
    expect(entries(project, "processes")).toEqual([id, "board.json"])
    expect(entries(project, folder)).toEqual(["questions-1.md", "request.md"])
  })

  it("refuses an id on the board that would leave the store", () => {
    writeBoard(project, "../outside", "clarify")
    writeFile(project, "outside/questions-1.md", "# Questions 1\n")
    writeFile(projectOf(project), "my-answers.md", answers)
    const result = runCommand(project, ["answer", "../outside", "my-answers.md"])
    expect(result.stderr).toBe("process-factory: there is no process ../outside\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project, "outside")).toEqual(["questions-1.md"])
  })

  it.each([
    ["the folder has no questions file", true],
    ["the folder of the process is missing", false],
  ])("says there is no questions file and leaves the board as it was when %s", (_name, withFolder) => {
    writeBoard(project, id, "clarify")
    if (withFolder) {
      writeFile(project, `${folder}/request.md`, "# Handle a breach\n")
      writeFile(project, `${folder}/questions-one.md`, "not a questions file\n")
    }
    writeFile(projectOf(project), "my-answers.md", answers)
    const before = readFile(project, boardFile)
    const result = runCommand(project, ["answer", id, "my-answers.md"])
    expect(result.stderr).toBe(`process-factory: cannot answer ${id}: there is no questions file in ${folder}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, folder)).toEqual(withFolder ? ["questions-one.md", "request.md"] : [])
  })

  it("names the file it cannot read, stores nothing and leaves the process in clarify", () => {
    prepare("clarify", ["questions-1.md"])
    const result = runCommand(project, ["answer", id, "missing.md"])
    expect(result.stderr.startsWith("process-factory: cannot read missing.md: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project, folder)).toEqual(["questions-1.md", "request.md"])
    expect(firstProcess(project).stage).toBe("clarify")
  })

  it("says the file is empty when it holds only whitespace, stores nothing and leaves the process in clarify", () => {
    prepare("clarify", ["questions-1.md"])
    writeFile(projectOf(project), "blank.md", " \n\t\n")
    const result = runCommand(project, ["answer", id, "blank.md"])
    expect(result.stderr).toBe(`process-factory: cannot answer ${id}: blank.md is empty\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project, folder)).toEqual(["questions-1.md", "request.md"])
    expect(firstProcess(project).stage).toBe("clarify")
  })

  it("never replaces an answers file that is already there, and leaves the process in clarify", () => {
    prepare("clarify", ["questions-1.md"])
    writeFile(project, `${folder}/answers-1.md`, "the earlier answers\n")
    const result = runCommand(project, ["answer", id, "my-answers.md"])
    expect(result.stderr.startsWith(`process-factory: cannot write ${folder}/answers-1.md: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, `${folder}/answers-1.md`)).toBe("the earlier answers\n")
    expect(firstProcess(project).stage).toBe("clarify")
  })
})
