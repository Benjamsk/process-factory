import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, history, processes, readFile, runCommand, usage, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { enteredSpec, openLine, processId, sections, sectionText, specFile, specText, staysRefusal, writeProcess } from "./gate.ts"

const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const accepted = `Accepted ${specFile}\ncases\n`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory accept-spec with every section decided", () => {
  it("prints Accepted and cases on standard output, nothing on standard error, and exits with 0", () => {
    writeProcess(project, "spec", specText())

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stdout).toBe(accepted)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("moves the process to cases and records specAcceptedAt with the date and time of the new history entry", () => {
    writeProcess(project, "spec", specText())
    const before = Date.now()

    runCommand(project, ["accept-spec", processId])

    const entry = processes(project)[0]
    expect(entry?.stage).toBe("cases")
    const changes = history(entry)
    expect(changes).toHaveLength(3)
    expect(changes[1]).toEqual(enteredSpec)
    expect(changes[2]?.stage).toBe("cases")
    const at = changes[2]?.at
    expect(at).toMatch(timeForm)
    expect(Date.parse(typeof at === "string" ? at : "")).toBeGreaterThanOrEqual(before)
    expect(entry?.specAcceptedAt).toBe(at)
  })

  it("keeps the other entries and the keys it does not know, the layout of the board and spec.md", () => {
    const other = { id: "001-older-process", title: "Older process", stage: "spec", owner: "Kari" }
    const own = { id: "002-handle-a-breach", title: "Handle a breach", stage: "spec", owner: "Ola" }
    writeBoard(project, [other, own])
    writeFile(project, "processes/002-handle-a-breach/spec.md", specText())

    const result = runCommand(project, ["accept-spec", "002-handle-a-breach"])

    expect(result.status).toBe(0)
    const stored = processes(project)
    expect(stored).toHaveLength(2)
    expect(stored[0]).toEqual(other)
    expect(stored[1]).toMatchObject({ ...own, stage: "cases" })
    expect(Object.keys(stored[1] ?? {}).sort()).toEqual(["history", "id", "owner", "specAcceptedAt", "stage", "title"])
    const text = readFile(project, boardFile)
    const parsed: unknown = JSON.parse(text)
    expect(text).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
    expect(readFile(project, "processes/002-handle-a-breach/spec.md")).toBe(specText())
    expect(entries(project, "processes/002-handle-a-breach")).toEqual(["spec.md"])
  })

  it.each([
    ["line ends of \\r\\n", specText().replaceAll("\n", "\r\n")],
    ["spaces at the end of a heading and of a Status line", specText().replaceAll("## Roles\n", "## Roles  \n").replaceAll("Status: decided\n", "Status: decided \n")],
    ["three blank lines between a heading and its Status line", specText().replaceAll("\n\nStatus: decided", "\n\n\n\nStatus: decided")],
    ["a further level 2 heading", `${specText()}\n## Notes\n\nNothing more.\n`],
  ])("accepts a decided spec.md with %s", (_name, spec) => {
    writeProcess(project, "spec", spec)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stdout).toBe(accepted)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(processes(project)[0]?.stage).toBe("cases")
  })
})

describe("process-factory accept-spec with an open section and no questions file", () => {
  it("names Roles and Deadlines, says the process stays in spec, exits with 1 and leaves the board byte for byte as it was", () => {
    writeProcess(project, "spec", specText(["Roles", "Deadlines"]))
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(staysRefusal(["Roles", "Deadlines"]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it.each([
    ["whose heading is missing", specText().replace(sectionText("Steps", true), "")],
    ["whose first line is not Status: decided", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nStatus: settled")],
    ["whose Status: decided only comes after another line", specText().replace("## Steps\n\nStatus: decided", "## Steps\n\nThe steps follow.\n\nStatus: decided")],
    ["whose heading is of level 3", specText().replace("## Steps\n", "### Steps\n")],
  ])("names a section %s as open", (_name, spec) => {
    writeProcess(project, "spec", spec)
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(staysRefusal(["Steps"]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it("names the open sections in the order of the eleven, whatever their order in the file", () => {
    const reversed = [...sections].reverse()
    writeProcess(project, "spec", `# Specification: Handle a lost laptop\n\n${reversed.map((name) => sectionText(name, !["Records", "Scope"].includes(name))).join("\n")}`)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(staysRefusal(["Scope", "Records"]))
    expect(result.status).toBe(1)
  })

  it("names all eleven sections, in order, for a process without a spec.md", () => {
    writeProcess(project, "spec")
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(staysRefusal(sections))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("process-factory accept-spec with an open section and a questions file", () => {
  it("moves the process to clarify when the newest questions file has no answers, records no acceptance and exits with 1", () => {
    writeProcess(project, "spec", specText(["Roles", "Deadlines"]))
    for (const file of ["questions-1.md", "answers-1.md", "questions-2.md"]) {
      writeFile(project, `processes/${processId}/${file}`, "# Round\n")
    }

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(
      `${openLine}\n  Roles\n  Deadlines\nprocess-factory: processes/${processId}/questions-2.md has no answers yet: ${processId} moves to clarify\n`,
    )
    expect(result.stdout).toBe("clarify\n")
    expect(result.status).toBe(1)
    const entry = processes(project)[0]
    expect(entry?.stage).toBe("clarify")
    const changes = history(entry)
    expect(changes).toHaveLength(3)
    expect(changes[2]?.stage).toBe("clarify")
    expect(changes[2]?.at).toMatch(timeForm)
    expect(Object.keys(entry ?? {})).not.toContain("specAcceptedAt")
  })

  it("leaves the process in spec when the newest questions file has its answers file", () => {
    writeProcess(project, "spec", specText(["Roles", "Deadlines"]))
    for (const file of ["questions-1.md", "questions-2.md", "answers-2.md"]) {
      writeFile(project, `processes/${processId}/${file}`, "# Round\n")
    }
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(staysRefusal(["Roles", "Deadlines"]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("process-factory accept-spec for a process it cannot accept", () => {
  it.each([["intake"], ["clarify"], ["cases"], ["review"]])("names the stage %s, exits with 1 and leaves the board as it was, also with a decided spec.md", (stage) => {
    writeProcess(project, stage, specText())
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.stderr).toBe(`process-factory: cannot accept the spec of ${processId}: it is in the stage ${stage}, not in spec\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s and writes nothing", (id) => {
    writeProcess(project, "spec", specText())
    const before = readFile(project, boardFile)

    const result = runCommand(project, ["accept-spec", id])

    expect(result.stderr).toBe(`process-factory: there is no process ${id}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })

  it.each([
    ["is not valid JSON", "{ not json\n"],
    ["has no list under processes", '{ "processes": "none" }\n'],
  ])("exits with 1, names processes/board.json and leaves it as it was when the board %s", (_name, content) => {
    writeFile(project, boardFile, content)

    const result = runCommand(project, ["accept-spec", processId])

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, boardFile)).toBe(content)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["no argument", []],
    ["accept-spec alone", ["accept-spec"]],
    ["the arguments accept-spec a b", ["accept-spec", "a", "b"]],
  ])("has fourteen lines, with accept-spec after answer, and is printed with %s", (_name, args) => {
    const result = runCommand(project, args)

    expect(result.stderr).toBe(
      'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n',
    )
    expect(result.stderr).toBe(usage)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})
