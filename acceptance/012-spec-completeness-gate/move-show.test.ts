import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, processes, readFile, runCommand, writeBoard } from "../006-process-state-machine/store.ts"
import { processId, specText, writeProcess } from "./gate.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory move for a process in spec", () => {
  it.each([
    ["with a decided spec.md", specText()],
    ["without a spec.md", undefined],
  ])("refuses the move to cases %s and names accept-spec", (_name, spec) => {
    writeProcess(project, "spec", spec)
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["move", processId, "cases"])

    expect(result.stderr).toBe(
      `process-factory: cannot move ${processId} from spec to cases: only accept-spec ${processId} moves a process from spec to cases\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it("names clarify as the only stage allowed from spec, and still moves there", () => {
    writeProcess(project, "spec")

    const refused = runCommand(project, ["move", processId, "draft"])
    expect(refused.stderr).toBe(`process-factory: cannot move ${processId} from spec to draft (allowed from spec: clarify)\n`)
    expect(refused.status).toBe(1)

    const moved = runCommand(project, ["move", processId, "clarify"])
    expect(moved.stdout).toBe("clarify\n")
    expect(moved.status).toBe(0)
    expect(processes(project)[0]?.stage).toBe("clarify")
  })
})

describe("process-factory show <process-id> and the acceptance", () => {
  it("prints Spec accepted between the Stage line and the History line, and only for an entry with specAcceptedAt", () => {
    writeBoard(project, [
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "cases",
        history: [
          { at: "2026-11-19T15:40:02.456Z", stage: "spec" },
          { at: "2026-11-19T16:20:45.789Z", stage: "cases" },
        ],
        specAcceptedAt: "2026-11-19T16:20:45.789Z",
      },
      { id: "002-handle-a-breach", title: "Handle a breach", stage: "spec" },
    ])

    const result = runCommand(project, ["show", processId])

    expect(result.stdout).toBe(
      [
        processId,
        "Title: Handle a lost laptop",
        "Stage: cases",
        "Spec accepted: 2026-11-19T16:20:45.789Z",
        "History:",
        "  2026-11-19T15:40:02.456Z  spec",
        "  2026-11-19T16:20:45.789Z  cases",
        "",
      ].join("\n"),
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(runCommand(project, ["show", "002-handle-a-breach"]).stdout).toBe("002-handle-a-breach\nTitle: Handle a breach\nStage: spec\nHistory:\n")
  })

  it("prints the date and time that accept-spec stored on the board", () => {
    writeProcess(project, "spec", specText())
    runCommand(project, ["accept-spec", processId])

    const result = runCommand(project, ["show", processId])

    const lines = result.stdout.split("\n")
    expect(lines[2]).toBe("Stage: cases")
    expect(lines[3]).toMatch(/^Spec accepted: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(lines[3]?.slice("Spec accepted: ".length)).toBe(processes(project)[0]?.specAcceptedAt)
    expect(lines[4]).toBe("History:")
  })
})
