import { rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, history, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { processFolder, processId, timeForm } from "../024-named-owner-and-approval/approval.ts"
import { changeEntry, changedDependency, entry, feedbackText, fourReasons, move, preparePublished, reasonsFile } from "./regeneration.ts"

const cannotStart = `process-factory: cannot move ${processId} from published to regenerate`
const nothing = `${cannotStart}: there is nothing to regenerate it for: no open feedback, no case newer than version 1 and no changed dependency\n`

let project = ""

/** The names of the reasons in the reasons file: the lines under `## Reasons` that start with `- `. */
function reasons(): string[] {
  const lines = readFile(project, reasonsFile).split("\n")
  return lines
    .slice(lines.indexOf("## Reasons") + 1)
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
}

/** Leaves the process of the criteria without a reason: no open feedback, no case outside the version, no changed dependency. */
function removeReasons(): void {
  preparePublished(project, { dependencies: [] })
  writeFile(project, `${processFolder}/feedback/feedback-1.md`, feedbackText(1, "closed"))
  rmSync(path.join(project, processFolder, "feedback/feedback-2.md"))
  rmSync(path.join(project, processFolder, "cases/case-2.md"))
}

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory move <process-id> regenerate for a published process with reasons", () => {
  it("prints regenerate and writes regeneration-1.md with the version, the time and the four reasons in their order", () => {
    preparePublished(project)

    const result = move(project, "regenerate")

    expect(result.stdout).toBe("regenerate\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const lines = readFile(project, reasonsFile).split("\n")
    expect(lines.slice(0, 4)).toEqual(["# Regeneration of version 1", "", `Process: ${processId}`, "Version: 1"])
    expect(lines[4]?.startsWith("Started at: ")).toBe(true)
    expect(lines[4]?.slice("Started at: ".length)).toMatch(timeForm)
    expect(lines.slice(5)).toEqual(["", "## Reasons", "", ...fourReasons.map((reason) => `- ${reason}`), ""])
  })

  it("moves the process to regenerate and records the version, the newest round and the time under regeneration", () => {
    preparePublished(project)

    move(project, "regenerate")

    const stored = entry(project)
    const last = history(stored).at(-1)
    expect(stored.stage).toBe("regenerate")
    expect(history(stored)).toHaveLength(2)
    expect(last?.stage).toBe("regenerate")
    expect(stored.regeneration).toEqual({ version: 1, round: 1, at: last?.at })
    expect(readFile(project, reasonsFile)).toContain(`Started at: ${String(last?.at)}\n`)
  })

  it("records round 0 for a process without a recorded round", () => {
    preparePublished(project, { rounds: undefined })

    expect(move(project, "regenerate").status).toBe(0)

    expect(entry(project).regeneration).toMatchObject({ version: 1, round: 0 })
  })

  it("counts no closed feedback, no case that is in the version and no unchanged dependency as a reason", () => {
    preparePublished(project)
    writeFile(project, `${processFolder}/feedback/feedback-2.md`, feedbackText(2, "closed"))
    writeFile(project, `${processFolder}/feedback/feedback-3.md`, feedbackText(3).replace("Status: open\n", ""))
    writeFile(project, `${processFolder}/versions/1/cases/case-2.md`, "# Case 2: The data protection officer is away\n")
    writeFile(project, `${processFolder}/cases/case-3.md`, "# Case 3: The laptop is found again\n")

    expect(move(project, "regenerate").status).toBe(0)

    expect(reasons()).toEqual(["feedback-1.md", "case-3.md", "Role: Data protection officer"])
  })

  it.each([
    ["an open feedback", "feedback-1.md"],
    ["a case that is not in the version", "case-2.md"],
    ["a changed dependency", "Role: Data protection officer"],
  ])("starts with only %s as the reason", (_name, reason) => {
    removeReasons()
    if (reason === "feedback-1.md") writeFile(project, `${processFolder}/feedback/feedback-1.md`, feedbackText(1))
    if (reason === "case-2.md") writeFile(project, `${processFolder}/cases/case-2.md`, "# Case 2: The data protection officer is away\n")
    if (reason.startsWith("Role: ")) changeEntry(project, { dependencies: [changedDependency] })

    const result = move(project, "regenerate")

    expect(result.stdout).toBe("regenerate\n")
    expect(result.status).toBe(0)
    expect(reasons()).toEqual([reason])
  })
})

describe("process-factory move <process-id> regenerate without something to regenerate for", () => {
  it("refuses a process without open feedback, without a newer case and without a changed dependency, and writes nothing", () => {
    removeReasons()
    const before = readFile(project, boardFile)
    const files = entries(project, processFolder)

    const result = move(project, "regenerate")

    expect(result.stderr).toBe(nothing)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, processFolder)).toEqual(files)
  })

  it.each([
    ["no list versions", undefined],
    ["an empty list versions", []],
  ])("refuses a published process with %s, because it has no published version", (_name, versions) => {
    preparePublished(project, { versions })
    const before = readFile(project, boardFile)
    const files = entries(project, processFolder)

    const result = move(project, "regenerate")

    expect(result.stderr).toBe(`${cannotStart}: it has no published version\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, processFolder)).toEqual(files)
  })
})

describe("process-factory show <process-id> for a process that is being regenerated", () => {
  it("prints Regenerating: version 1 after the owner and before the rounds, and no such line for a process without a regeneration", () => {
    preparePublished(project)
    const before = runCommand(project, ["show", processId]).stdout
    move(project, "regenerate")

    const lines = runCommand(project, ["show", processId]).stdout.split("\n")

    expect(before).not.toContain("Regenerating: ")
    expect(lines.slice(2, 6)).toEqual(["Stage: regenerate", "Owner: Kari Nordmann", "Regenerating: version 1", "Rounds:"])
  })
})
