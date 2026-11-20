import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, firstProcess, readFile, runCommand, usage } from "./clarify.ts"

const id = "001-handle-a-breach"
const title = "Handle a breach"
const requestFile = `processes/${id}/request.md`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory new with a prompt", () => {
  it("prints the id and writes the prompt under the title in request.md, with its line break", () => {
    const result = runCommand(project, ["new", title, "A laptop was lost.\nWho do we tell?"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${id}\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, requestFile)).toBe(`# ${title}\n\nA laptop was lost.\nWho do we tell?\n`)
  })

  it("trims the prompt", () => {
    const result = runCommand(project, ["new", title, "  \n A laptop was lost. \n\n"])
    expect(result.status).toBe(0)
    expect(readFile(project, requestFile)).toBe(`# ${title}\n\nA laptop was lost.\n`)
  })

  it.each([
    ["an empty prompt", ""],
    ["a prompt of only whitespace", " \n  "],
  ])("writes request.md as the title alone with %s, as it does without a prompt", (_name, prompt) => {
    const result = runCommand(project, ["new", title, prompt])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`${id}\n`)
    expect(result.status).toBe(0)
    expect(readFile(project, requestFile)).toBe(`# ${title}\n`)
    expect(runCommand(project, ["new", "Another process"]).status).toBe(0)
    expect(readFile(project, "processes/002-another-process/request.md")).toBe("# Another process\n")
  })

  it("stores exactly the keys id, title, stage and history on the board, and not the prompt", () => {
    const result = runCommand(project, ["new", title, "A laptop was lost."])
    expect(result.status).toBe(0)
    expect(Object.keys(firstProcess(project))).toEqual(["id", "title", "stage", "history"])
    expect(firstProcess(project).stage).toBe("intake")
    expect(readFile(project, "processes/board.json")).not.toContain("A laptop was lost.")
  })
})

describe("process-factory with arguments that are no command", () => {
  it.each([
    ["no argument", []],
    ["the argument help", ["help"]],
    ["the arguments new a b c", ["new", "a", "b", "c"]],
    ["answer alone", ["answer"]],
    ["the arguments answer a", ["answer", "a"]],
    ["the arguments answer a b c", ["answer", "a", "b", "c"]],
  ])("prints the nine usage lines to standard error, exits with 1 and creates nothing with %s", (_name, args) => {
    const result = runCommand(project, args)
    expect(result.stderr).toBe(usage)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})
