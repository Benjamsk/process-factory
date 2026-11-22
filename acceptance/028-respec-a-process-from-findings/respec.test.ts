import { readdirSync, rmSync, statSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, historyStages, processes, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { processFolder, processId, writeDrafts, writeFindings } from "../017-review-rounds/rounds.ts"
import {
  changeEntry,
  earlierFinding,
  entry,
  expectedFindings,
  findingsFile,
  fiveRounds,
  highFinding,
  lastChange,
  prepareRespec,
  recorded,
  specAcceptedAt,
} from "./respec.ts"

const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const stored = `Stored ${findingsFile}\nspec\n`

let project = ""

/** Every file under a folder of the project with its content, by its path. */
function contents(folder: string): Record<string, string> {
  const found: Record<string, string> = {}
  for (const name of readdirSync(path.join(project, folder)).sort()) {
    const file = `${folder}/${name}`
    if (statSync(path.join(project, file)).isDirectory()) Object.assign(found, contents(file))
    else found[file] = readFile(project, file)
  }
  return found
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory respec for a process in approval", () => {
  it("prints the file it stored and the stage spec, and exits with 0", () => {
    prepareRespec(project)

    const result = runCommand(project, ["respec", processId])

    expect(result.stdout).toBe(stored)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("writes findings-round-5.md with the round, the draft, the time and one section per reviewer with its verdict and its findings", () => {
    prepareRespec(project)

    runCommand(project, ["respec", processId])

    expect(lastChange(project)).toMatch(timeForm)
    expect(readFile(project, findingsFile)).toBe(expectedFindings(lastChange(project)))
    expect(entries(project, `${processFolder}/feedback`)).toEqual(["findings-round-5.md"])
  })

  it("copies only the findings of the reviewers of round 5: no other line of a findings file, nothing of conflicts.md and nothing of round 4", () => {
    prepareRespec(project)

    runCommand(project, ["respec", processId])

    const text = readFile(project, findingsFile)
    expect(text).toContain(highFinding)
    expect(text).not.toContain("review of draft-5.md")
    expect(text).not.toContain("## Case")
    expect(text).not.toContain("Result:")
    expect(text).not.toContain("Would do:")
    expect(text).not.toContain("Dropped:")
    expect(text).not.toContain("Conflict")
    expect(text).not.toContain(earlierFinding)
  })

  it("moves the process to spec, records the respec on the board and removes specAcceptedAt, and leaves the rest of the board as it was", () => {
    prepareRespec(project)
    const [olderBefore, before = {}] = processes(project)

    runCommand(project, ["respec", processId])

    const [older, after = {}] = processes(project)
    const at = lastChange(project)
    expect(after.stage).toBe("spec")
    expect(historyStages(after)).toEqual(["review", "spec"])
    expect(after.respecs).toEqual([{ round: 5, at }])
    expect(Object.hasOwn(after, "specAcceptedAt")).toBe(false)
    expect(before.specAcceptedAt).toBe(specAcceptedAt)
    expect(after.rounds).toEqual(fiveRounds())
    expect(after.owner).toBe("Ola")
    expect(after.title).toBe(before.title)
    expect(older).toEqual(olderBefore)
    expect(processes(project)).toHaveLength(2)
  })

  it("changes no file of the process but the findings file: spec.md, the cases, the drafts, the rounds and the versions stay byte for byte", () => {
    prepareRespec(project)
    const before = contents(processFolder)

    const result = runCommand(project, ["respec", processId])

    const after = contents(processFolder)
    expect(result.status).toBe(0)
    expect(Object.keys(after).filter((file) => !Object.hasOwn(before, file))).toEqual([findingsFile])
    expect(Object.fromEntries(Object.entries(after).filter(([file]) => file !== findingsFile))).toEqual(before)
  })

  it("creates the folder feedback when it is missing", () => {
    prepareRespec(project)
    expect(entries(project, processFolder)).not.toContain("feedback")

    const result = runCommand(project, ["respec", processId])

    expect(result.stdout).toBe(stored)
    expect(entries(project, `${processFolder}/feedback`)).toEqual(["findings-round-5.md"])
  })

  it("writes into a folder feedback that is already there and keeps the reader feedback in it", () => {
    prepareRespec(project)
    writeFile(project, `${processFolder}/feedback/feedback-1.md`, "# Feedback 1\n\nStatus: open\n")

    const result = runCommand(project, ["respec", processId])

    expect(result.stdout).toBe(stored)
    expect(entries(project, `${processFolder}/feedback`)).toEqual(["feedback-1.md", "findings-round-5.md"])
    expect(readFile(project, `${processFolder}/feedback/feedback-1.md`)).toBe("# Feedback 1\n\nStatus: open\n")
  })
})

describe("process-factory respec for a process in rework", () => {
  it("gives the same output, the same file and the same board entry as for a process in approval", () => {
    prepareRespec(project, "rework")

    const result = runCommand(project, ["respec", processId])

    expect(result.stdout).toBe(stored)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readFile(project, findingsFile)).toBe(expectedFindings(lastChange(project)))
    expect(entry(project).stage).toBe("spec")
    expect(entry(project).respecs).toEqual([{ round: 5, at: lastChange(project) }])
    expect(Object.hasOwn(entry(project), "specAcceptedAt")).toBe(false)
  })
})

describe("a second respec of a process", () => {
  it("adds a second element to respecs and writes a second file, and leaves the first file as it was", () => {
    prepareRespec(project)
    runCommand(project, ["respec", processId])
    const first = readFile(project, findingsFile)
    const firstRespec = { round: 5, at: lastChange(project) }
    changeEntry(project, { stage: "rework", rounds: [...fiveRounds(), recorded(6, [["legal", "CHANGES"]])] })
    writeDrafts(project, [6])
    writeFindings(project, 6, "legal.md", `# legal review of draft-6.md\n\nVerdict: CHANGES\n\n${highFinding}\n`)

    const result = runCommand(project, ["respec", processId])

    const second = `${processFolder}/feedback/findings-round-6.md`
    expect(first).not.toBe("")
    expect(result.stdout).toBe(`Stored ${second}\nspec\n`)
    expect(result.status).toBe(0)
    expect(entry(project).respecs).toEqual([firstRespec, { round: 6, at: lastChange(project) }])
    expect(readFile(project, findingsFile)).toBe(first)
    expect(readFile(project, second)).toBe(
      `# Findings of round 6\n\nProcess: ${processId}\nRound: 6\nDraft: draft-6.md\nSent back at: ${lastChange(project)}\n\n## legal\n\nVerdict: CHANGES\n\n${highFinding}\n`,
    )
    expect(readFile(project, boardFile)).toContain('"respecs"')
  })
})
