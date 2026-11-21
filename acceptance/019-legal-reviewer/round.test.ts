import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, processes, runCommand } from "../006-process-state-machine/store.ts"
import { findings, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { exampleFinding, installedFolder } from "./legal.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/**
 * A project where `init` installed the skill, with a process in `review`, `draft-1.md` and a round 1 in which every
 * installed reviewer but `legal` passed the draft. `legal` is the findings file of the legal reviewer, left out when undefined.
 */
function prepareRound(legal?: string): void {
  expect(runCommand(project, ["init"]).status).toBe(0)
  writeProcess(project)
  writeDrafts(project, [1])
  const reviewers = entries(project, installedFolder)
    .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
    .map((name) => name.replace("-reviewer.md", ""))
  for (const reviewer of reviewers.filter((name) => name !== "legal")) {
    writeFindings(project, 1, `${reviewer}.md`, findings(reviewer, "PASS", []))
  }
  if (legal !== undefined) writeFindings(project, 1, "legal.md", legal)
}

describe("process-factory round with the legal reviewer that init installed", () => {
  it("refuses a round without legal.md, names the file as missing and leaves the process in review", () => {
    prepareRound()

    const result = runCommand(project, ["round", processId])

    expect(result.stderr.split("\n")).toContain("  legal.md: is missing")
    expect(result.status).toBe(1)
    expect(processes(project)[1]?.stage).toBe("review")
  })

  it("records a legal finding that ends with its rule as one high finding and moves the process to rework", () => {
    prepareRound(`# legal review of draft-1.md\n\nVerdict: CHANGES\n\n${exampleFinding}\n`)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout.split("\n")).toContain("  legal  CHANGES  1 high, 0 medium, 0 low")
    expect(result.status).toBe(0)
    expect(processes(project)[1]?.stage).toBe("rework")
  })
})
