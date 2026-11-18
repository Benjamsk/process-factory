import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, entries, emptyFolder, readFile, root, runCommand, usage, writeBoard, writeFile } from "./store.ts"

const breachId = "001-handle-a-personal-data-breach"
const breachTitle = "Handle a personal data breach"
const breachEntry = {
  id: breachId,
  title: breachTitle,
  stage: "clarify",
  history: [
    { at: "2026-11-18T17:02:11.123Z", stage: "intake" },
    { at: "2026-11-18T17:05:40.456Z", stage: "clarify" },
  ],
}

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory show without a process id", () => {
  it("prints one line per process with id, stage and title, in the board's order", () => {
    runCommand(project, ["new", breachTitle])
    runCommand(project, ["new", "Onboard a new colleague"])
    runCommand(project, ["move", breachId, "clarify"])

    const result = runCommand(project, ["show"])

    expect(result.stdout).toBe(
      `${breachId}  clarify  ${breachTitle}\n002-onboard-a-new-colleague  intake  Onboard a new colleague\n`,
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints No processes. and creates nothing when there is no board", () => {
    const result = runCommand(project, ["show"])
    expect(result.stdout).toBe("No processes.\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project)).toEqual([])
  })

  it("prints No processes. when the board lists no process", () => {
    writeBoard(project, [])
    const result = runCommand(project, ["show"])
    expect(result.stdout).toBe("No processes.\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, "processes")).toEqual(["board.json"])
  })
})

describe("process-factory show with a process id", () => {
  it("prints the id, the title, the stage and one line per history entry, oldest first", () => {
    writeBoard(project, [{ id: "000-other-process", title: "Other process", stage: "intake" }, breachEntry])

    const result = runCommand(project, ["show", breachId])

    expect(result.stdout).toBe(
      [
        breachId,
        `Title: ${breachTitle}`,
        "Stage: clarify",
        "History:",
        "  2026-11-18T17:02:11.123Z  intake",
        "  2026-11-18T17:05:40.456Z  clarify",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("ends with the line History: for a process stored without a history", () => {
    writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const result = runCommand(project, ["show", "001-handle-a-breach"])
    expect(result.stdout).toBe("001-handle-a-breach\nTitle: Handle a breach\nStage: intake\nHistory:\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("says there is no process for an id that is not on the board", () => {
    writeBoard(project, [breachEntry])
    const result = runCommand(project, ["show", "002-handle-a-breach"])
    expect(result.stderr).toBe("process-factory: there is no process 002-handle-a-breach\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("process-factory show and the board file", () => {
  it("leaves the board byte for byte as it was, with and without a process id", () => {
    writeBoard(project, [breachEntry])
    const before = readFile(project, boardFile)

    expect(runCommand(project, ["show"]).status).toBe(0)
    expect(runCommand(project, ["show", breachId]).status).toBe(0)

    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, "processes")).toEqual(["board.json"])
  })

  it.each([
    ["show when the board is not valid JSON", ["show"], "{ not json\n"],
    ["show when the board has no list under processes", ["show"], '{ "processes": "none" }\n'],
    ["show <process-id> when the board is not valid JSON", ["show", breachId], "{ not json\n"],
    ["show <process-id> when the board has no list under processes", ["show", breachId], '{ "processes": "none" }\n'],
  ])("exits with 1 and names processes/board.json for %s", (_name, args, content) => {
    writeFile(project, boardFile, content)
    const result = runCommand(project, args)
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, boardFile)).toBe(content)
  })
})

describe("process-factory with arguments that are no command", () => {
  it.each([
    ["no argument", []],
    ["the argument help", ["help"]],
    ["the arguments init extra", ["init", "extra"]],
    ["new without a title", ["new"]],
    ["the arguments new a b", ["new", "a", "b"]],
    ["move alone", ["move"]],
    ["the arguments move a", ["move", "a"]],
    ["the arguments move a b c", ["move", "a", "b", "c"]],
    ["the arguments show a b", ["show", "a", "b"]],
  ])("prints the four usage lines to standard error, exits with 1 and creates nothing with %s", (_name, args) => {
    const result = runCommand(project, args)
    expect(result.stderr).toBe(usage)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})

describe("the Status section of README.md", () => {
  it("names the ten stages, move and show, and keeps what it said about the store", () => {
    const lines = readFile(root, "README.md").split(/\r?\n/)
    const rest = lines.slice(lines.indexOf("## Status") + 1)
    const end = rest.findIndex((line) => /^#{1,6} /.test(line))
    const status = (end === -1 ? rest : rest.slice(0, end)).join(" ").replace(/\s+/g, " ")
    expect(lines).toContain("## Status")
    for (const stage of ["intake", "clarify", "spec", "cases", "draft", "review", "rework", "approval", "published", "regenerate"]) {
      expect(status).toContain(`\`${stage}\``)
    }
    expect(status).toContain("process-factory move <process-id> <stage>")
    expect(status).toContain("`process-factory show`")
    expect(status).toContain("process-factory show <process-id>")
    expect(status).toContain('process-factory new "<title>"')
    expect(status).toContain("command line writes the store")
    expect(status).toContain("pnpm exec process-factory init")
  })
})
