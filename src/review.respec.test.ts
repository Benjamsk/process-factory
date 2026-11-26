import { existsSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  boardPath,
  readWorkingFile,
  runCommand,
  storedHistory,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeProjectFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory respec", () => {
  const processFolder = "processes/001-handle-a-breach"
  const cannotLine = "process-factory: cannot send 001-handle-a-breach back to spec"
  const findingsFile = `${processFolder}/feedback/findings-round-2.md`
  const highFinding = "- [high] Step 3: the deadline for telling the authority is missing."
  const lowFinding = "- [low] Step 2: two actions in one step."
  const firstRound = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:01:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
  const secondRound = {
    round: 2,
    draft: "draft-2.md",
    at: "2026-11-20T16:02:00.000Z",
    verdicts: [
      { reviewer: "legal", verdict: "CHANGES" },
      { reviewer: "readability", verdict: "PASS" },
    ],
  }

  /** A process in `stage` with two recorded rounds, `specAcceptedAt` and the findings files of both rounds. */
  function prepareRespec(stage = "approval", more: Record<string, unknown> = {}): void {
    writeBoardFile([
      {
        id: "001-handle-a-breach",
        title: "Handle a breach",
        stage,
        history: [{ at: "2026-11-18T17:02:11.123Z", stage: "review" }],
        specAcceptedAt: "2026-11-19T15:45:00.000Z",
        rounds: [firstRound, secondRound],
        ...more,
      },
    ])
    writeWorkingFile(`${processFolder}/rounds/round-1/legal.md`, "# legal review of draft-1.md\n\nVerdict: CHANGES\n\n- [high] A finding of round 1.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/legal.md`, `# legal review of draft-2.md\n\nVerdict: CHANGES\n\n${highFinding}\n`)
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, `# readability review of draft-2.md\n\nVerdict: PASS\n\n${lowFinding}  \n`)
  }

  /** The date and time of the last history entry of the one process on the board. */
  function lastChange(): string {
    const at: unknown = storedHistory(storedProcesses()[0]).at(-1)?.at
    return typeof at === "string" ? at : ""
  }

  /** The findings file the command writes for the round 2 of this process, sent back at `at`. */
  function expectedFindings(at: string): string {
    const head = `# Findings of round 2\n\nProcess: 001-handle-a-breach\nRound: 2\nDraft: draft-2.md\nSent back at: ${at}`
    return `${head}\n\n## legal\n\nVerdict: CHANGES\n\n${highFinding}\n\n## readability\n\nVerdict: PASS\n\n${lowFinding}\n`
  }

  it.each(["approval", "rework"])("writes the findings of the newest round and prints the file and the stage for a process in %s", (stage) => {
    prepareRespec(stage)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Stored ${findingsFile}\nspec\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(lastChange()).toMatch(timeForm)
    expect(readWorkingFile(findingsFile)).toBe(expectedFindings(lastChange()))
  })

  it("copies no other line of a findings file and no finding of an earlier round", () => {
    prepareRespec()

    runCommand(["respec", "001-handle-a-breach"])

    expect(readWorkingFile(findingsFile)).not.toContain("review of draft-2.md")
    expect(readWorkingFile(findingsFile)).not.toContain("A finding of round 1.")
  })

  it("writes No findings. for a reviewer without a finding and leaves out a file of no reviewer of the round", () => {
    prepareRespec()
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, "# readability review of draft-2.md\n\nVerdict: PASS\n\nNo findings.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/conflicts.md`, "# Conflicts of round 2\n\n- Dropped: readability.md: [low] Step 4: shorten the step.\n")

    runCommand(["respec", "001-handle-a-breach"])

    expect(readWorkingFile(findingsFile).endsWith("## readability\n\nVerdict: PASS\n\nNo findings.\n")).toBe(true)
    expect(readWorkingFile(findingsFile)).not.toContain("Dropped:")
  })

  it("moves the process to spec, records the respec, removes specAcceptedAt and keeps the rounds", () => {
    prepareRespec()

    runCommand(["respec", "001-handle-a-breach"])

    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("spec")
    expect(storedHistory(entry).at(-1)).toEqual({ at: lastChange(), stage: "spec" })
    expect(entry?.respecs).toEqual([{ round: 2, at: lastChange() }])
    expect(entry).not.toHaveProperty("specAcceptedAt")
    expect(entry?.rounds).toEqual([firstRound, secondRound])
  })

  it("adds a second element to respecs of a process that was sent back before", () => {
    prepareRespec("rework", { respecs: [{ round: 1, at: "2026-11-19T09:00:00.000Z" }] })

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.respecs).toEqual([{ round: 1, at: "2026-11-19T09:00:00.000Z" }, { round: 2, at: lastChange() }])
  })

  /** Expects this one line on standard error, exit code 1, no folder `feedback` and a board that is as it was. */
  function expectRefused(line: string): void {
    const before = readWorkingFile(boardPath)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${line}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readdirSync(path.join(workingDirectory, processFolder))).toEqual(["rounds"])
    expect(readWorkingFile(boardPath)).toBe(before)
  }

  it.each(["intake", "spec", "review", "published"])("refuses a process in %s and writes nothing", (stage) => {
    prepareRespec(stage)

    expectRefused(`${cannotLine}: it is in the stage ${stage}, not in rework or approval`)
  })

  it.each([
    ["no key rounds", undefined],
    ["an empty list of rounds", []],
  ])("refuses a process with %s, because no round is recorded for it", (_name, rounds) => {
    prepareRespec("approval", { rounds })

    expectRefused(`${cannotLine}: no round is recorded for it`)
  })

  it("refuses a process that is being regenerated, because a regeneration keeps the specification", () => {
    prepareRespec("rework", { regeneration: { version: 2, round: 2, at: "2026-11-23T10:00:00.000Z" } })

    expectRefused(`${cannotLine}: it is being regenerated from version 2, and a regeneration keeps the specification of that version`)
  })

  it("refuses when the findings file of a reviewer of the round is not there and names the file", () => {
    prepareRespec()
    rmSync(path.join(workingDirectory, processFolder, "rounds/round-2/readability.md"))

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: ${processFolder}/rounds/round-2/readability.md is missing\n`)
    expect(result.status).toBe(1)
  })

  it("refuses a round in which no findings file has a finding", () => {
    prepareRespec()
    writeWorkingFile(`${processFolder}/rounds/round-2/legal.md`, "# legal review of draft-2.md\n\nVerdict: CHANGES\n\nNo findings.\n")
    writeWorkingFile(`${processFolder}/rounds/round-2/readability.md`, "# readability review of draft-2.md\n\nVerdict: PASS\n\nNo findings.\n")

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: round 2 has no finding\n`)
    expect(result.status).toBe(1)
  })

  it.each(["009-no-such-process", "../001-handle-a-breach"])("says there is no process %s", (id) => {
    prepareRespec()

    const result = runCommand(["respec", id])

    expect(result.stderr).toBe(`process-factory: there is no process ${id}\n`)
    expect(result.status).toBe(1)
  })

  it("refuses a findings file that is already there and leaves it and the board as they were", () => {
    prepareRespec()
    writeWorkingFile(findingsFile, "# Kept\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["respec", "001-handle-a-breach"])

    expect(result.stderr.startsWith(`process-factory: cannot write ${findingsFile}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(findingsFile)).toBe("# Kept\n")
    expect(readWorkingFile(boardPath)).toBe(before)
  })
})

describe("process-factory send-back", () => {
  const processId = "001-handle-a-lost-laptop"
  const processFolder = `processes/${processId}`
  const ownerFile = `${processFolder}/rounds/round-2/owner.md`
  const cannotLine = `process-factory: cannot send ${processId} back to rework`
  const note = "Step 3 must name the IT manager.\n\n  Shorten the first   section. \n"
  const findings = "- [high] Step 3 must name the IT manager.\n- [high] Shorten the first section."
  const rounds = [
    { round: 1, draft: "draft-1.md", at: "2026-11-21T10:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] },
    { round: 2, draft: "draft-2.md", at: "2026-11-22T10:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] },
  ]

  /** A process in `stage` with the recorded rounds 1 and 2, and a `note.md` in the project the command runs in. */
  function prepareSendBack(stage = "approval", more: Record<string, unknown> = {}): void {
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage, history: [{ at: "2026-11-22T10:00:00.000Z", stage }], rounds, ...more }])
    writeProjectFile("note.md", note)
  }

  it("writes every line of the note as a finding of the owner in the folder of the newest round and prints the file and the stage", () => {
    prepareSendBack()

    const result = runCommand(["send-back", processId, "note.md"])

    expect(result.stdout).toBe(`Stored ${ownerFile}\nrework\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const lines = readWorkingFile(ownerFile).split("\n")
    expect(lines.slice(0, 5)).toEqual(["# Findings of the owner", "", `Process: ${processId}`, "Round: 2", "Draft: draft-2.md"])
    expect(lines[5]).toMatch(/^Sent back at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(lines.slice(6).join("\n")).toBe(`\nVerdict: CHANGES\n\n${findings}\n`)
  })

  it("moves the process to rework and records the stage in its history", () => {
    prepareSendBack()

    expect(runCommand(["send-back", processId, "note.md"]).status).toBe(0)

    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("rework")
    expect(storedHistory(entry).map((change) => change.stage)).toEqual(["approval", "rework"])
  })

  /** Each send-back that is refused: what is wrong with it, the id and the file it is run with, the stage and further keys of the entry, and the line it prints. */
  const refusals: [string, string, string, string, Record<string, unknown>, string][] = [
    ["an id that is not on the board", "009-not-on-the-board", "note.md", "approval", {}, "process-factory: there is no process 009-not-on-the-board"],
    ["a process in rework", processId, "note.md", "rework", {}, `${cannotLine}: it is in the stage rework, not in approval`],
    ["a process without a recorded round", processId, "note.md", "approval", { rounds: [] }, `${cannotLine}: no round is recorded for it`],
    ["a note of only empty lines", processId, "empty.md", "approval", {}, `${cannotLine}: the note is empty`],
  ]

  it.each(refusals)("refuses %s with one line, exits with 1 and writes nothing", (_name, id, file, stage, more, line) => {
    prepareSendBack(stage, more)
    writeProjectFile("empty.md", "\n   \n\t\n")
    const before = readWorkingFile(boardPath)

    const result = runCommand(["send-back", id, file])

    expect(result.stderr).toBe(`${line}\n`)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, `${processFolder}/rounds`))).toBe(false)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names the file it cannot read and an owner.md that is already there, and changes neither the file nor the stage", () => {
    prepareSendBack()

    const missing = runCommand(["send-back", processId, "missing.md"])

    expect(missing.stderr.startsWith("process-factory: cannot read missing.md: ")).toBe(true)
    expect(missing.status).toBe(1)
    writeWorkingFile(ownerFile, "# Kept\n")

    const second = runCommand(["send-back", processId, "note.md"])

    expect(second.stderr.startsWith(`process-factory: cannot write ${ownerFile}: `)).toBe(true)
    expect(second.stdout).toBe("")
    expect(second.status).toBe(1)
    expect(readWorkingFile(ownerFile)).toBe("# Kept\n")
    expect(storedProcesses()[0]?.stage).toBe("approval")
  })

  it("reads the note from standard input when the file is -", () => {
    prepareSendBack()

    const result = runCommand(["send-back", processId, "-"], note)

    expect(result.stdout).toBe(`Stored ${ownerFile}\nrework\n`)
    expect(result.status).toBe(0)
    expect(readWorkingFile(ownerFile)).toContain(`Verdict: CHANGES\n\n${findings}\n`)
  })

  it("reads the answers of answer from standard input when the file is -", () => {
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage: "clarify", history: [{ at: "2026-11-22T10:00:00.000Z", stage: "clarify" }] }])
    writeWorkingFile(`${processFolder}/questions-1.md`, "# Questions 1\n\n## Questions\n\n1. Who calls the police?\n")
    const answers = "# Answers 1\n\n## 1. Who calls the police?\n\nThe IT manager.\n"

    const result = runCommand(["answer", processId, "-"], answers)

    expect(result.stdout).toBe(`Stored ${processFolder}/answers-1.md\nspec\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readWorkingFile(`${processFolder}/answers-1.md`)).toBe(answers)
    expect(storedProcesses()[0]?.stage).toBe("spec")
  })
})
