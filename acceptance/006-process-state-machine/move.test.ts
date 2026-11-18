import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, entries, emptyFolder, history, historyStages, moves, processes, readFile, runCommand, writeBoard, writeFile } from "./store.ts"

const breachId = "001-handle-a-personal-data-breach"
const breachTitle = "Handle a personal data breach"
const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const stages = moves.map(([stage]) => stage)

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

function moment(at: unknown): number {
  return typeof at === "string" ? Date.parse(at) : Number.NaN
}

function refusal(id: string, from: string, to: string, allowed: string[]): string {
  return `process-factory: cannot move ${id} from ${from} to ${to} (allowed from ${from}: ${allowed.join(", ") || "none"})\n`
}

describe("process-factory new and the history", () => {
  it("stores the keys id, title, stage and history, with one dated history entry for intake", () => {
    const before = Date.now()
    const result = runCommand(project, ["new", breachTitle])
    const after = Date.now()
    expect(result.stdout).toBe(`${breachId}\n`)
    expect(result.status).toBe(0)

    const entry = processes(project)[0]
    expect(Object.keys(entry ?? {})).toEqual(["id", "title", "stage", "history"])
    expect(entry?.stage).toBe("intake")
    const changes = history(entry)
    expect(changes).toHaveLength(1)
    expect(Object.keys(changes[0] ?? {})).toEqual(["at", "stage"])
    expect(changes[0]?.stage).toBe("intake")
    const at = changes[0]?.at
    expect(at).toMatch(timeForm)
    expect(moment(at)).toBeGreaterThanOrEqual(before)
    expect(moment(at)).toBeLessThanOrEqual(after)
  })

  it("still writes the board with two spaces of indentation and one newline at the end", () => {
    runCommand(project, ["new", breachTitle])
    const text = readFile(project, boardFile)
    const parsed: unknown = JSON.parse(text)
    expect(text).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
    expect(text).toContain('"history": [')
  })
})

describe("process-factory move with a move the machine allows", () => {
  it("prints the new stage, stores it and appends a dated history entry", () => {
    runCommand(project, ["new", breachTitle])
    const created = history(processes(project)[0])[0]

    const result = runCommand(project, ["move", breachId, "clarify"])

    expect(result.stdout).toBe("clarify\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = processes(project)[0]
    expect(entry?.stage).toBe("clarify")
    const changes = history(entry)
    expect(changes).toHaveLength(2)
    expect(changes[0]).toEqual(created)
    expect(Object.keys(changes[1] ?? {})).toEqual(["at", "stage"])
    expect(changes[1]?.stage).toBe("clarify")
    const at = changes[1]?.at
    expect(at).toMatch(timeForm)
    expect(moment(at)).toBeGreaterThanOrEqual(moment(created?.at))
  })

  it.each(moves)(
    "moves a process from %s to each of its allowed stages",
    (from, allowed) => {
      for (const to of allowed) {
        writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: from, history: [{ at: "2026-11-18T17:02:11.123Z", stage: from }] }])
        const result = runCommand(project, ["move", "001-handle-a-breach", to])
        expect(result.stdout).toBe(`${to}\n`)
        expect(result.stderr).toBe("")
        expect(result.status).toBe(0)
        const entry = processes(project)[0]
        expect(entry?.stage).toBe(to)
        expect(historyStages(entry)).toEqual([from, to])
      }
    },
    30_000,
  )

  it("walks a new process through the whole loop and lists every stage in the history", () => {
    const loop = ["clarify", "spec", "cases", "draft", "review", "rework", "review", "approval", "published", "regenerate", "review"]
    runCommand(project, ["new", breachTitle])
    for (const stage of loop) {
      const result = runCommand(project, ["move", breachId, stage])
      expect(result.stdout).toBe(`${stage}\n`)
      expect(result.status).toBe(0)
    }
    const entry = processes(project)[0]
    expect(entry?.stage).toBe("review")
    expect(historyStages(entry)).toEqual(["intake", ...loop])
  }, 30_000)

  it("keeps the other process and the keys it does not know, and changes only stage and history", () => {
    const first = { id: "001-older-process", title: "Older process", stage: "intake", owner: "Kari" }
    const second = { id: "002-handle-a-breach", title: "Handle a breach", stage: "intake", owner: "Ola" }
    writeBoard(project, [first, second])

    const result = runCommand(project, ["move", "002-handle-a-breach", "spec"])

    expect(result.status).toBe(0)
    const stored = processes(project)
    expect(stored).toHaveLength(2)
    expect(stored[0]).toEqual(first)
    expect(stored[1]).toMatchObject({ ...second, stage: "spec" })
    expect(Object.keys(stored[1] ?? {}).sort()).toEqual(["history", "id", "owner", "stage", "title"])
  })

  it("gives a process stored without a history one history entry for the stage it moves to", () => {
    writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])

    const result = runCommand(project, ["move", "001-handle-a-breach", "spec"])

    expect(result.stdout).toBe("spec\n")
    expect(result.status).toBe(0)
    const entry = processes(project)[0]
    expect(entry?.stage).toBe("spec")
    expect(historyStages(entry)).toEqual(["spec"])
    expect(history(entry)[0]?.at).toMatch(timeForm)
  })

  it("changes nothing in the process folder and adds nothing to processes", () => {
    runCommand(project, ["new", breachTitle])
    writeFile(project, `processes/${breachId}/cases/case-1.md`, "kept\n")

    const result = runCommand(project, ["move", breachId, "clarify"])

    expect(result.status).toBe(0)
    expect(entries(project, "processes")).toEqual([breachId, "board.json"])
    expect(entries(project, `processes/${breachId}`)).toEqual(["cases", "drafts", "feedback", "request.md", "rounds", "versions"])
    expect(entries(project, `processes/${breachId}/cases`)).toEqual(["case-1.md"])
    expect(readFile(project, `processes/${breachId}/request.md`)).toBe(`# ${breachTitle}\n`)
  })
})

describe("process-factory move with a move the machine refuses", () => {
  it("names the stages allowed from intake, exits with 1 and leaves the board byte for byte as it was", () => {
    runCommand(project, ["new", "Handle a breach"])
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["move", "001-handle-a-breach", "draft"])

    expect(result.stderr).toBe(
      "process-factory: cannot move 001-handle-a-breach from intake to draft (allowed from intake: clarify, spec)\n",
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it.each(moves)(
    "refuses every move from %s that is not in the table, also to the same stage and to a name that is no stage",
    (from, allowed) => {
      writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: from, history: [{ at: "2026-11-18T17:02:11.123Z", stage: from }] }])
      const before = readFile(project, boardFile)
      const refused = [...stages.filter((stage) => !allowed.includes(stage)), "done"]
      expect(refused).toContain(from)
      for (const to of refused) {
        const result = runCommand(project, ["move", "001-handle-a-breach", to])
        expect(result.stderr).toBe(refusal("001-handle-a-breach", from, to, allowed))
        expect(result.stdout).toBe("")
        expect(result.status).toBe(1)
        expect(readFile(project, boardFile)).toBe(before)
      }
    },
    60_000,
  )

  it("lists rework, approval for a process in review and draft for a process in cases", () => {
    writeBoard(project, [
      { id: "001-in-review", title: "In review", stage: "review" },
      { id: "002-in-cases", title: "In cases", stage: "cases" },
    ])
    expect(runCommand(project, ["move", "001-in-review", "published"]).stderr).toBe(
      "process-factory: cannot move 001-in-review from review to published (allowed from review: rework, approval)\n",
    )
    expect(runCommand(project, ["move", "002-in-cases", "review"]).stderr).toBe(
      "process-factory: cannot move 002-in-cases from cases to review (allowed from cases: draft)\n",
    )
  })

  it("allows no move from a stored stage that is not one of the ten", () => {
    writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "archived" }])
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["move", "001-handle-a-breach", "intake"])

    expect(result.stderr).toBe(
      "process-factory: cannot move 001-handle-a-breach from archived to intake (allowed from archived: none)\n",
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("process-factory move for a process that is not on the board", () => {
  it.each([["001-handle-a-breach"], ["../../outside"]])("says there is no process %s and creates nothing when there is no board", (id) => {
    const result = runCommand(project, ["move", id, "clarify"])
    expect(result.stderr).toBe(`process-factory: there is no process ${id}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })

  it("says there is no process and leaves the board as it was when the board lists another process", () => {
    writeBoard(project, [{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["move", "002-handle-a-breach", "clarify"])

    expect(result.stderr).toBe("process-factory: there is no process 002-handle-a-breach\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
    expect(entries(project, "processes")).toEqual(["board.json"])
  })
})

describe("process-factory move when the board cannot be read", () => {
  it.each([
    ["is not valid JSON", "{ not json\n"],
    ["has no list under processes", '{ "processes": "none" }\n'],
  ])("exits with 1, names processes/board.json and leaves it as it was when the board %s", (_name, content) => {
    writeFile(project, boardFile, content)
    const result = runCommand(project, ["move", "001-handle-a-breach", "clarify"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, boardFile)).toBe(content)
  })
})
