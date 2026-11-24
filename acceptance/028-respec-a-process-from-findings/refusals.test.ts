import { rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { processFolder, processId, writeFindings } from "../017-review-rounds/rounds.ts"
import { cannot, changeEntry, findingsFile, prepareRespec } from "./respec.ts"

const usageLines = [
  "Usage: process-factory init",
  '       process-factory new "<title>" ["<prompt>"]',
  "       process-factory move <process-id> <stage>",
  "       process-factory show [<process-id>]",
  "       process-factory answer <process-id> <file>",
  "       process-factory accept-spec <process-id>",
  "       process-factory round <process-id>",
  '       process-factory owner <process-id> "<person>"',
  '       process-factory approve <process-id> --by "<person>"',
  "       process-factory respec <process-id>",
  "       process-factory send-back <process-id> <file>",
  "       process-factory org init",
  "       process-factory check",
  "       process-factory serve [--port <number>]",
  "       process-factory dashboard [--port <number>]",
]

let project = ""

/** Runs `respec` with these arguments and expects this one line on standard error, exit code 1, no findings file and an unchanged board. */
function expectRefused(args: string[], line: string): void {
  const before = readFile(project, boardFile)

  const result = runCommand(project, ["respec", ...args])

  expect(result.stderr).toBe(`${line}\n`)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(entries(project, `${processFolder}/feedback`)).toEqual([])
  expect(readFile(project, boardFile)).toBe(before)
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory respec for a process in another stage", () => {
  it.each(["intake", "clarify", "spec", "cases", "draft", "review", "published", "regenerate"])("refuses a process in %s and writes nothing", (stage) => {
    prepareRespec(project, stage)

    expectRefused([processId], `${cannot}: it is in the stage ${stage}, not in rework or approval`)
  })
})

describe("process-factory respec without findings to carry", () => {
  it.each([
    ["no key rounds", undefined],
    ["an empty list of rounds", []],
  ])("refuses a process with %s, because no round is recorded for it", (_name, rounds) => {
    prepareRespec(project, "rework", { rounds })

    expectRefused([processId], `${cannot}: no round is recorded for it`)
  })

  it("refuses when the findings file of a reviewer of the round is not there, and names the file", () => {
    prepareRespec(project)
    rmSync(path.join(project, processFolder, "rounds/round-5/readability.md"))

    expectRefused([processId], `${cannot}: ${processFolder}/rounds/round-5/readability.md is missing`)
  })

  it("refuses a round in which no findings file has a finding", () => {
    prepareRespec(project)
    changeEntry(project, {
      rounds: [{ round: 5, draft: "draft-5.md", at: "2026-11-20T16:05:00.000Z", verdicts: ["legal", "readability", "simulation"].map((reviewer) => ({ reviewer, verdict: "PASS" })) }],
    })
    writeFindings(project, 5, "legal.md", "# legal review of draft-5.md\n\nVerdict: PASS\n\nNo findings.\n")
    writeFindings(project, 5, "readability.md", "# readability review of draft-5.md\n\nVerdict: PASS\n\nNo findings.\n")

    expectRefused([processId], `${cannot}: round 5 has no finding`)
  })
})

describe("process-factory respec for an id that is not a process", () => {
  it.each([
    ["an id the board does not list", "009-no-such-process"],
    ["an id with another character than lowercase letters, digits and hyphens", "../001-handle-a-lost-laptop"],
  ])("says that there is no such process for %s", (_name, id) => {
    prepareRespec(project)

    expectRefused([id], `process-factory: there is no process ${id}`)
  })
})

describe("process-factory respec when the findings file is already there", () => {
  it("says that it cannot write the file, and leaves the file and the board as they were", () => {
    prepareRespec(project)
    writeFile(project, findingsFile, "# Kept\n")
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["respec", processId])

    expect(result.stderr.startsWith(`process-factory: cannot write ${findingsFile}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, findingsFile)).toBe("# Kept\n")
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["respec alone", ["respec"]],
    ["the arguments respec a b", ["respec", "a", "b"]],
    ["no argument", []],
  ])("has fifteen lines, with respec directly after approve, and is printed with %s", (_name, args) => {
    prepareRespec(project)
    const before = readFile(project, boardFile)

    const result = runCommand(project, args)

    expect(result.stderr).toBe(`${usageLines.join("\n")}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})
