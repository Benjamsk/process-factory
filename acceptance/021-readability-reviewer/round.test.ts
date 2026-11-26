import { mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, processes, projectOf, runCommand } from "../006-process-state-machine/store.ts"
import { findings, processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { installedFolder } from "./readability.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** The second entry on the board, which is the process the tests record rounds for. */
function entry(): Record<string, unknown> {
  return processes(project)[1] ?? {}
}

/**
 * A project where `init` installed the skill, with a process in `review`, `draft-1.md` and a round 1 in which every
 * installed reviewer passed the draft without a finding. `readability` replaces the findings file of the readability
 * reviewer, and `null` leaves it out.
 */
function prepareRound(readability?: string | null): void {
  expect(runCommand(project, ["init"]).status).toBe(0)
  writeProcess(project)
  writeDrafts(project, [1])
  mkdirSync(path.join(project, processFolder, "rounds/round-1"), { recursive: true })
  const reviewers = entries(projectOf(project), installedFolder)
    .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
    .map((name) => name.replace("-reviewer.md", ""))
  for (const reviewer of new Set([...reviewers, "readability"])) {
    const content = reviewer === "readability" && readability !== undefined ? readability : findings(reviewer, "PASS", [])
    if (content !== null) writeFindings(project, 1, `${reviewer}.md`, content)
  }
}

describe("process-factory round with the readability reviewer that init installed", () => {
  it("records the verdict PASS of readability and prints its line with no findings", () => {
    prepareRound()

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(result.stdout.split("\n")).toContain("  readability  PASS  0 high, 0 medium, 0 low")
    expect(entry().rounds).toEqual([expect.objectContaining({ round: 1, draft: "draft-1.md" })])
    expect(JSON.stringify(entry().rounds)).toContain('{"reviewer":"readability","verdict":"PASS"}')
  })

  it("prints the findings per tag of a readability verdict CHANGES and moves the process to rework", () => {
    prepareRound(findings("readability", "CHANGES", ["medium", "low"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(result.stdout.split("\n")).toContain("  readability  CHANGES  0 high, 1 medium, 1 low")
    expect(entry().stage).toBe("rework")
  })

  it("refuses the round and names readability.md when the findings file of the readability reviewer is missing", () => {
    prepareRound(null)

    const result = runCommand(project, ["round", processId])

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.split("\n")).toContain("  readability.md: is missing")
    expect(result.stderr).toContain(`these findings files in ${processFolder}/rounds/round-1 are missing or malformed`)
    expect(entry().stage).toBe("review")
  })

  it("refuses a readability.md whose verdict PASS does not fit a finding tagged medium", () => {
    prepareRound(findings("readability", "PASS", ["medium"]))

    const result = runCommand(project, ["round", processId])

    expect(result.status).toBe(1)
    expect(result.stderr.split("\n")).toContain("  readability.md: the verdict is PASS but it has findings tagged high or medium")
    expect(entry().stage).toBe("review")
  })
})
