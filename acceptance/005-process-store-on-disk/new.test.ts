import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, board, boardFile, boardText, emptyFolder, entries, readFile, root, runCommand, runNode, writeFile } from "./store.ts"

const breachId = "001-handle-a-personal-data-breach"
const breachTitle = "Handle a personal data breach"
const breachEntry = { id: breachId, title: breachTitle, stage: "intake" }
const titleError = "process-factory: the title must be one line with at least one letter or digit\n"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory new in an empty working directory", () => {
  it("prints the id of the new process and a newline, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["new", breachTitle])
    expect(result.stdout).toBe(`${breachId}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("creates the process folder with request.md and the five empty folders", () => {
    runCommand(project, ["new", breachTitle])
    const folder = `processes/${breachId}`
    expect(entries(project, folder)).toEqual(["cases", "drafts", "feedback", "request.md", "rounds", "versions"])
    for (const name of ["cases", "drafts", "feedback", "rounds", "versions"]) {
      expect(statSync(path.join(project, folder, name)).isDirectory()).toBe(true)
      expect(entries(project, `${folder}/${name}`)).toEqual([])
    }
    expect(readFile(project, `${folder}/request.md`)).toBe(`# ${breachTitle}\n`)
  })

  it("writes processes/board.json with the process in the stage intake and nothing else in the working directory", () => {
    runCommand(project, ["new", breachTitle])
    expect(readFile(project, boardFile)).toBe(boardText([breachEntry]))
    expect(entries(project)).toEqual(["processes"])
    expect(entries(project, "processes")).toEqual([breachId, "board.json"])
  })
})

describe("the id of a new process", () => {
  it("gives a second process the next number, keeps six words of the title and leaves the first process as it was", () => {
    runCommand(project, ["new", breachTitle])
    const title = "Onboard a new colleague, step by step, in two weeks"
    const result = runCommand(project, ["new", title])
    expect(result.stdout).toBe("002-onboard-a-new-colleague-step-by\n")
    expect(result.status).toBe(0)
    expect(board(project)).toEqual({
      processes: [breachEntry, { id: "002-onboard-a-new-colleague-step-by", title, stage: "intake" }],
    })
    expect(readFile(project, `processes/${breachId}/request.md`)).toBe(`# ${breachTitle}\n`)
    expect(entries(project, "processes")).toEqual([breachId, "002-onboard-a-new-colleague-step-by", "board.json"])
  })

  it("gives two processes with the same title different ids", () => {
    expect(runCommand(project, ["new", "Same title"]).stdout).toBe("001-same-title\n")
    expect(runCommand(project, ["new", "Same title"]).stdout).toBe("002-same-title\n")
  })

  it("follows the highest number on the board and trims the title", () => {
    const older = { id: "007-older-process", title: "Older process", stage: "intake" }
    writeFile(project, boardFile, boardText([older]))
    const result = runCommand(project, ["new", "  GDPR: access request (art. 15)  "])
    expect(result.stdout).toBe("008-gdpr-access-request-art-15\n")
    expect(result.status).toBe(0)
    expect(board(project)).toEqual({
      processes: [older, { id: "008-gdpr-access-request-art-15", title: "GDPR: access request (art. 15)", stage: "intake" }],
    })
    expect(readFile(project, "processes/008-gdpr-access-request-art-15/request.md")).toBe(
      "# GDPR: access request (art. 15)\n",
    )
  })

  it("keeps an existing board entry with a key it does not know, before the new entry", () => {
    const owned = { id: "001-older-process", title: "Older process", stage: "intake", owner: "Kari" }
    writeFile(project, boardFile, boardText([owned]))
    const result = runCommand(project, ["new", "Handle a breach"])
    expect(result.stdout).toBe("002-handle-a-breach\n")
    expect(board(project)).toEqual({
      processes: [owned, { id: "002-handle-a-breach", title: "Handle a breach", stage: "intake" }],
    })
  })

  it("cannot leave the store through the title", () => {
    const result = runCommand(project, ["new", "../../outside"])
    expect(result.stdout).toBe("001-outside\n")
    expect(result.status).toBe(0)
    expect(entries(project)).toEqual(["processes"])
    expect(entries(project, "processes")).toEqual(["001-outside", "board.json"])
  })
})

describe("process-factory new with a title it refuses", () => {
  it.each([
    ["an empty title", ""],
    ["a title of only whitespace", "   "],
    ["a title without a letter or digit", "???"],
    ["a title with a line break", "Handle a breach\nand more"],
  ])("prints the title error, exits with 1 and creates nothing with %s", (_name, title) => {
    const result = runCommand(project, ["new", title])
    expect(result.stderr).toBe(titleError)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})

describe("process-factory new when the store cannot be read or written", () => {
  it.each([
    ["is not valid JSON", "{ not json\n"],
    ["has no list under processes", '{ "processes": "none" }\n'],
  ])("exits with 1, names processes/board.json and writes nothing when the board %s", (_name, content) => {
    writeFile(project, boardFile, content)
    const result = runCommand(project, ["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, boardFile)).toBe(content)
    expect(entries(project, "processes")).toEqual(["board.json"])
  })

  it("exits with 1 and names the process it cannot create when processes is a file", () => {
    writeFile(project, "processes", "not a folder\n")
    const result = runCommand(project, ["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot create process 001-handle-a-breach: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, "processes")).toBe("not a folder\n")
  })

  it("exits with 1, keeps the folder and writes no board when the process folder already exists", () => {
    writeFile(project, "processes/001-handle-a-breach/notes.txt", "kept\n")
    const result = runCommand(project, ["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot create process 001-handle-a-breach: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(entries(project, "processes/001-handle-a-breach")).toEqual(["notes.txt"])
    expect(readFile(project, "processes/001-handle-a-breach/notes.txt")).toBe("kept\n")
    expect(entries(project, "processes")).toEqual(["001-handle-a-breach"])
  })
})

describe("process-factory new from an installed copy", () => {
  it("creates the store in the project, not in the package folder under node_modules", () => {
    const packageFolder = path.join(project, "node_modules", "process-factory")
    mkdirSync(packageFolder, { recursive: true })
    cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
    cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
    cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["new", "Handle a breach"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe("001-handle-a-breach\n")
    expect(result.status).toBe(0)
    expect(entries(project, "processes")).toEqual(["001-handle-a-breach", "board.json"])
    expect(existsSync(path.join(packageFolder, "processes"))).toBe(false)
    expect(entries(packageFolder)).toEqual(["bin", "package.json", "templates"])
  })
})

describe("process-factory with arguments that are no command", () => {
  it.each([
    ["no argument", []],
    ["the argument help", ["help"]],
    ["the arguments init extra", ["init", "extra"]],
    ["new without a title", ["new"]],
    ["the arguments new a b", ["new", "a", "b"]],
  ])("prints the two usage lines to standard error, exits with 1 and creates nothing with %s", (_name, args) => {
    const result = runCommand(project, args)
    expect(result.stderr).toBe('Usage: process-factory init\n       process-factory new "<title>"\n')
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})

describe("the Status section of README.md", () => {
  it("describes process-factory new, the store and its one writer", () => {
    const lines = readFile(root, "README.md").split(/\r?\n/)
    const rest = lines.slice(lines.indexOf("## Status") + 1)
    const end = rest.findIndex((line) => /^#{1,6} /.test(line))
    const status = (end === -1 ? rest : rest.slice(0, end)).join(" ").replace(/\s+/g, " ")
    expect(lines).toContain("## Status")
    expect(status).toContain('process-factory new "<title>"')
    expect(status).toContain("processes/<process-id>/")
    expect(status).toContain("processes/board.json")
    expect(status).toContain("intake")
    expect(status).toContain("command line writes the store")
    expect(status).toContain("/process <prompt>")
    expect(status).toContain("pnpm exec process-factory init")
  })
})
