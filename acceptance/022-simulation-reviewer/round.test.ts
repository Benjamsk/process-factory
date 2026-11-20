import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, processes, root, runCommand } from "../006-process-state-machine/store.ts"
import { installedFolder, processFolder, processId, reviewerTemplate, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { fencedBlocks, simulationTemplate } from "./simulation.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory round with the form of a findings file in simulation-reviewer.md", () => {
  it("accepts the last fenced block of the template, unchanged, as simulation.md, counts one high finding and moves the process to rework", () => {
    expect(existsSync(path.join(root, simulationTemplate))).toBe(true)
    const block = fencedBlocks().at(-1) ?? ""
    expect(block.split("\n")[0]).toBe("# simulation review of draft-<m>.md")
    expect(block).toContain("\n## Case <n>: <title>\n")
    expect(block).toContain("\nResult: FAIL at ")
    writeProcess(project)
    writeDrafts(project, [1])
    mkdirSync(path.join(project, installedFolder), { recursive: true })
    cpSync(path.join(root, reviewerTemplate), path.join(project, installedFolder, "reviewer.md"))
    cpSync(path.join(root, simulationTemplate), path.join(project, installedFolder, "simulation-reviewer.md"))
    writeFindings(project, 1, "simulation.md", block)

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(result.status).toBe(0)
    expect(processes(project)[1]?.stage).toBe("rework")
  })
})

describe("process-factory round after process-factory init", () => {
  it("finds the simulation reviewer installed and refuses the empty round because simulation.md is missing", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    writeProcess(project)
    writeDrafts(project, [1])
    mkdirSync(path.join(project, processFolder, "rounds", "round-1"), { recursive: true })

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).not.toContain("no reviewer is installed")
    expect(result.stderr.split("\n")).toContain("  simulation.md: is missing")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(processes(project)[1]?.stage).toBe("review")
  })
})
