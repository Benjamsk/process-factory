import { rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, moves, processes, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { kari, olderEntry, ownEntry, processId, rolesFile, rolesText, writeProcess } from "./approval.ts"

const nameError = "process-factory: the owner must be one line with at least one letter\n"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

function notNamed(person: string): string {
  return `process-factory: cannot set the owner of ${processId}: ${person} is not named in organisation/roles.md\n`
}

/** Runs `owner` for a refusal: standard error must be `stderr`, and the board must stay as it was. */
function expectRefused(person: string, stderr: string): void {
  const before = readFile(project, boardFile)

  const result = runCommand(project, ["owner", processId, person])

  expect(result.stderr).toBe(stderr)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(readFile(project, boardFile)).toBe(before)
}

describe("process-factory owner with a name that stands in organisation/roles.md", () => {
  it("prints Owner: with the name and stores it on the entry of a process in intake, and changes nothing else", () => {
    const more = { specAcceptedAt: "2026-11-19T16:20:45.789Z", rounds: [] }
    writeProcess(project, "intake", more)

    const result = runCommand(project, ["owner", processId, kari])

    expect(result.stdout).toBe("Owner: Kari Nordmann\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const stored = processes(project)
    expect(stored).toHaveLength(2)
    expect(stored[0]).toEqual(olderEntry)
    expect(stored[1]).toEqual({ ...ownEntry("intake", more), owner: kari })
    expect(readFile(project, rolesFile)).toBe(rolesText)
  })

  it.each(moves.map(([stage]) => [stage]))("sets the owner of a process in %s and replaces it with a second owner", (stage) => {
    writeProcess(project, stage)

    expect(runCommand(project, ["owner", processId, kari]).status).toBe(0)
    expect(processes(project)[1]).toEqual({ ...ownEntry(stage), owner: kari })

    const second = runCommand(project, ["owner", processId, "Ola Hansen"])

    expect(second.stdout).toBe("Owner: Ola Hansen\n")
    expect(second.status).toBe(0)
    expect(processes(project)[1]).toEqual({ ...ownEntry(stage), owner: "Ola Hansen" })
  })

  it("stores the name without the whitespace at its start and its end", () => {
    writeProcess(project, "draft")

    const result = runCommand(project, ["owner", processId, "  Kari Nordmann  "])

    expect(result.stdout).toBe("Owner: Kari Nordmann\n")
    expect(result.status).toBe(0)
    expect(processes(project)[1]?.owner).toBe(kari)
  })

  it.each([
    ["in a section after an example section", "Liv Dahl"],
    ["directly before a full stop", "Nina Berg"],
    ["as one whole word of a longer name", "Kari"],
    ["in a heading", "Head of finance"],
  ])("accepts a name that stands %s", (_name, person) => {
    writeProcess(project, "spec")
    writeFile(project, rolesFile, `${rolesText}\n## Head of finance\n\nLiv Dahl is the head of finance. Her deputy is Nina Berg.\n`)

    const result = runCommand(project, ["owner", processId, person])

    expect(result.stdout).toBe(`Owner: ${person}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(processes(project)[1]?.owner).toBe(person)
  })
})

describe("process-factory owner with a name that does not stand in organisation/roles.md", () => {
  it.each([
    ["only stands in an example section", "Per Olsen"],
    ["has other capitals", "kari nordmann"],
    ["ends in the middle of a word", "Kari Nord"],
    ["starts in the middle of a word", "ari Nordmann"],
    ["has two spaces where the file has one", "Kari  Nordmann"],
    ["is not in the file", "Nora Berg"],
  ])("refuses a name that %s and leaves the board as it was", (_name, person) => {
    writeProcess(project, "approval")

    expectRefused(person, notNamed(person))
  })

  it("refuses a name when organisation/roles.md is missing", () => {
    writeProcess(project, "approval")
    rmSync(path.join(project, rolesFile))

    expectRefused(kari, notNamed(kari))
  })
})

describe("process-factory owner with a name or an id it cannot use", () => {
  it.each([
    ["is empty", ""],
    ["is only spaces", "   "],
    ["has no letter", "123"],
    ["has a line break", "Kari\nNordmann"],
  ])("says the owner must be one line with at least one letter for a name that %s", (_name, person) => {
    writeProcess(project, "approval")

    expectRefused(person, nameError)
  })

  it("says there is no process for an id that is not on the board", () => {
    writeProcess(project, "approval")
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["owner", "002-unknown-process", kari])

    expect(result.stderr).toBe("process-factory: there is no process 002-unknown-process\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})
