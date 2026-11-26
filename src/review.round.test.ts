import { rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  boardPath,
  isRecord,
  readWorkingFile,
  runCommand,
  skillFolder,
  storedHistory,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeProjectFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("process-factory round", () => {
  const processFolder = "processes/001-handle-a-breach"
  const cannotLine = "process-factory: cannot record a round of 001-handle-a-breach"
  const staysLine = "process-factory: 001-handle-a-breach stays in review: /process next 001-handle-a-breach runs a new round"

  function findingsText(name: string, verdict: string, tags: string[]): string {
    const findings = tags.length === 0 ? "No findings.\n" : tags.map((tag) => `- [${tag}] Step 3: the deadline is missing.\n`).join("")
    return `# ${name} review of draft-1.md\n\nVerdict: ${verdict}\n\n${findings}`
  }

  /** A process in `review` with these reviewers installed, `draft-1.md` and, for each round, the findings files it names. */
  function prepareReview(reviewers: string[], rounds: Record<number, Record<string, string>>, more: Record<string, unknown> = {}): void {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "review", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "review" }], ...more },
    ])
    writeProjectFile(`${skillFolder}/reviewer.md`, "# Reviewer\n")
    for (const reviewer of reviewers) writeProjectFile(`${skillFolder}/${reviewer}-reviewer.md`, `# ${reviewer} reviewer\n`)
    writeWorkingFile(`${processFolder}/drafts/draft-1.md`, "# Handle a breach\n")
    for (const [round, files] of Object.entries(rounds)) {
      for (const [file, content] of Object.entries(files)) writeWorkingFile(`${processFolder}/rounds/round-${round}/${file}`, content)
    }
  }

  it("records the round with the draft and the verdicts, moves the process to rework and prints the findings per tag", () => {
    prepareReview(["legal", "readability"], {
      1: { "legal.md": findingsText("legal", "CHANGES", ["high", "medium"]), "readability.md": findingsText("readability", "PASS", ["low"]) },
    })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  CHANGES  1 high, 1 medium, 0 low\n  readability  PASS  0 high, 0 medium, 1 low\nrework\n`,
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    const changes = storedHistory(entry)
    expect(changes[1]?.stage).toBe("rework")
    expect(changes[1]?.at).toMatch(timeForm)
    expect(entry?.stage).toBe("rework")
    expect(entry?.rounds).toEqual([
      {
        round: 1,
        draft: "draft-1.md",
        at: changes[1]?.at,
        verdicts: [
          { reviewer: "legal", verdict: "CHANGES" },
          { reviewer: "readability", verdict: "PASS" },
        ],
      },
    ])
  })

  it("moves the process to approval when every verdict is PASS", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("approval")
  })

  it("records the highest round folder after the rounds that are already there and keeps them", () => {
    const first = { round: 1, draft: "draft-1.md", at: "2026-11-18T17:05:40.456Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
    prepareReview(
      ["legal"],
      { 1: { "legal.md": findingsText("legal", "CHANGES", ["high"]) }, 2: { "legal.md": findingsText("legal", "PASS", []) } },
      { rounds: [first] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout.split("\n")[0]).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md`)
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.rounds).toEqual([
      first,
      { round: 2, draft: "draft-1.md", at: expect.stringMatching(timeForm), verdicts: [{ reviewer: "legal", verdict: "PASS" }] },
    ])
  })

  it.each([
    ["a file that is not there", "legal.md", "", "is missing"],
    ["a file without a verdict line", "legal.md", "# legal review of draft-1.md\n\nNo findings.\n", "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    ["a file with two verdict lines", "legal.md", "# legal review of draft-1.md\n\nVerdict: PASS\nVerdict: PASS\n", "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    ["a file with the verdict OK", "legal.md", findingsText("legal", "OK", []), "must have exactly one line Verdict: PASS or Verdict: CHANGES"],
    [
      "a line that starts with - but is no finding",
      "legal.md",
      "# legal review of draft-1.md\n\nVerdict: CHANGES\n\n- [urgent] Step 3: the deadline is missing.\n- [high] Step 3: the deadline is missing.\n",
      'line 5 starts with "- " but is not a finding tagged [high], [medium] or [low]',
    ],
    ["a PASS file with a medium finding", "legal.md", findingsText("legal", "PASS", ["medium"]), "the verdict is PASS but it has findings tagged high or medium"],
    ["a CHANGES file with only low findings", "legal.md", findingsText("legal", "CHANGES", ["low"]), "the verdict is CHANGES but it has no finding tagged high or medium"],
  ])("refuses %s, names it and leaves the board as it was", (_name, file, content, reason) => {
    prepareReview(["legal"], { 1: content === "" ? { "notes.md": "nothing\n" } : { [file]: content } })
    const before = readWorkingFile(boardPath)

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  ${file}: ${reason}\n${staysLine}\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("names every failing file in the order of the reviewers", () => {
    prepareReview(["legal", "readability"], { 1: { "readability.md": findingsText("readability", "PASS", ["high"]) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  legal.md: is missing\n  readability.md: the verdict is PASS but it has findings tagged high or medium\n${staysLine}\n`,
    )
    expect(result.status).toBe(1)
  })

  it("says there is no process for an id that is not on the board", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "../../outside"])

    expect(result.stderr).toBe("process-factory: there is no process ../../outside\n")
    expect(result.status).toBe(1)
  })

  it("names the stage of a process that is not in review", () => {
    prepareReview(["legal"], { 1: { "legal.md": findingsText("legal", "PASS", []) } })
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "draft" }])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: it is in the stage draft, not in review\n`)
    expect(result.status).toBe(1)
  })

  it("says no reviewer is installed when only reviewer.md lies next to the skill", () => {
    prepareReview([], { 1: { "legal.md": findingsText("legal", "PASS", []) } })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: no reviewer is installed in ${skillFolder}\n`)
    expect(result.status).toBe(1)
  })

  it("says there is no round folder and, for a round without a draft, that there is no draft", () => {
    prepareReview(["legal"], {})

    expect(runCommand(["round", "001-handle-a-breach"]).stderr).toBe(`${cannotLine}: there is no round folder in ${processFolder}/rounds\n`)

    writeWorkingFile(`${processFolder}/rounds/round-1/legal.md`, findingsText("legal", "PASS", []))
    rmSync(path.join(workingDirectory, processFolder, "drafts"), { recursive: true })

    expect(runCommand(["round", "001-handle-a-breach"]).stderr).toBe(`${cannotLine}: there is no draft in ${processFolder}/drafts\n`)
  })

  it("says the newest round is already recorded", () => {
    prepareReview(
      ["legal"],
      { 1: { "legal.md": findingsText("legal", "PASS", []) } },
      { rounds: [{ round: 1, draft: "draft-1.md", at: "2026-11-18T17:05:40.456Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(`${cannotLine}: round 1 is already recorded\n`)
    expect(result.status).toBe(1)
  })

  /** The entries of `count` rounds that are already on the board, numbered from 1, each with legal asking for changes. */
  function recordedRounds(count: number): Record<string, unknown>[] {
    return Array.from({ length: count }, (_unused, index) => ({
      round: index + 1,
      draft: "draft-1.md",
      at: "2026-11-18T17:05:40.456Z",
      verdicts: [{ reviewer: "legal", verdict: "CHANGES" }],
    }))
  }

  /** The round entries of the one process on the board. */
  function storedRounds(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.rounds
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("stops the fifth round that asks for changes, moves it to approval and records the reason after the verdicts", () => {
    prepareReview(
      ["legal", "readability"],
      { 5: { "legal.md": findingsText("legal", "PASS", []), "readability.md": findingsText("readability", "CHANGES", ["medium"]) } },
      { rounds: recordedRounds(4) },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: readability"
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\n  readability  CHANGES  0 high, 1 medium, 0 low\nStopped: ${reason}\napproval\n`,
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("approval")
    expect(storedHistory(entry).at(-1)?.stage).toBe("approval")
    expect(Object.keys(storedRounds()[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "stopped"])
    expect(storedRounds()[4]?.stopped).toBe(reason)
  })

  it("leaves a fourth round that asks for changes in rework without a reason", () => {
    prepareReview(["legal"], { 4: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedRounds(3) })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-4 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[3]).not.toHaveProperty("stopped")
  })

  it("does not stop a fifth round in which every verdict is PASS", () => {
    prepareReview(["legal"], { 5: { "legal.md": findingsText("legal", "PASS", []) } }, { rounds: recordedRounds(4) })

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(storedProcesses()[0]?.stage).toBe("approval")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("prints Stopped: with the reason of the newest round between the Stage line and the line Rounds:", () => {
    prepareReview(["legal"], { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedRounds(4) })
    runCommand(["round", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines.slice(2, 4)).toEqual(["Stage: approval", "Stopped: the limit of 5 rounds is reached and these reviewers still ask for changes: legal"])
    expect(lines[4]).toBe("Rounds:")
  })

  it("prints Rounds: with one line per round between the Stage line and the History line, and only for a process with rounds", () => {
    prepareReview(["legal", "readability"], {
      1: { "legal.md": findingsText("legal", "CHANGES", ["high"]), "readability.md": findingsText("readability", "PASS", []) },
    })
    runCommand(["round", "001-handle-a-breach"])

    const lines = runCommand(["show", "001-handle-a-breach"]).stdout.split("\n")

    expect(lines.slice(2, 6)).toEqual(["Stage: rework", "Rounds:", "  1  draft-1.md  legal CHANGES, readability PASS", "History:"])
    writeBoardFile([{ id: "002-handle-a-breach", title: "Handle a breach", stage: "review", rounds: [] }])
    expect(runCommand(["show", "002-handle-a-breach"]).stdout).not.toContain("Rounds:")
  })

  /** A `simulation.md` with this verdict and one section per case number, with the line of its result or none for `""`. */
  function simulationText(verdict: string, sections: [number, string][]): string {
    const finding = verdict === "CHANGES" ? "- [high] Step 2: it does not say who locks the laptop. (case 3)\n" : "No findings.\n"
    const written = sections
      .map(([number, line]) => `## Case ${String(number)}: The IT manager is away\n\nGets wrong: nothing\n${line === "" ? "" : `${line}\n`}`)
      .join("\n")
    return `# simulation review of draft-1.md\n\nVerdict: ${verdict}\n\n${finding}\n${written}`
  }

  /** Writes the files `case-<n>.md` with these numbers in the folder `cases` of the process. */
  function writeCases(numbers: number[]): void {
    for (const number of numbers) writeWorkingFile(`${processFolder}/cases/case-${String(number)}.md`, `# Case ${String(number)}: The IT manager is away\n`)
  }

  /** The entries of one round per result of case 3, numbered from 1, each with the draft of its number and its result under `cases`. */
  function recordedCaseRounds(results: string[]): Record<string, unknown>[] {
    return results.map((result, index) => ({
      round: index + 1,
      draft: `draft-${String(index + 1)}.md`,
      at: "2026-11-18T17:05:40.456Z",
      verdicts: [{ reviewer: "simulation", verdict: result === "FAIL" ? "CHANGES" : "PASS" }],
      cases: [{ case: 3, result }],
    }))
  }

  it("stores the result of every stored case under cases, after the verdicts and in ascending order of the numbers", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("CHANGES", [[10, "Result: FAIL at step 2"], [2, "Result: PASS"]]) } })
    writeCases([2, 10])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(Object.keys(storedRounds()[0] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases"])
    expect(storedRounds()[0]?.cases).toEqual([
      { case: 2, result: "PASS" },
      { case: 10, result: "FAIL" },
    ])
  })

  it("refuses a simulation.md that has no result for a stored case and names the cases", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("PASS", [[1, "Result: PASS"], [2, "Result: FAIL"], [5, ""]]) } })
    writeCases([1, 2, 5])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  simulation.md: has no Result: line for case 2, case 5\n${staysLine}\n`,
    )
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.stage).toBe("review")
  })

  it("refuses a simulation.md with the verdict PASS in which a stored case has the result FAIL", () => {
    prepareReview(["simulation"], { 1: { "simulation.md": simulationText("PASS", [[1, "Result: PASS"], [3, "Result: FAIL at step 2"]]) } })
    writeCases([1, 3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stderr).toBe(
      `process-factory: cannot record round 1 of 001-handle-a-breach: these findings files in ${processFolder}/rounds/round-1 are missing or malformed\n  simulation.md: the verdict is PASS but these cases have the result FAIL: case 3\n${staysLine}\n`,
    )
    expect(result.status).toBe(1)
    expect(storedProcesses()[0]?.rounds).toBeUndefined()
  })

  it("prints Regressed: with the draft the case last passed in and moves a second round to rework", () => {
    prepareReview(["simulation"], { 2: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } }, { rounds: recordedCaseRounds(["PASS"]) })
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nRegressed: case 3 last passed in draft-1.md\nrework\n`,
    )
    expect(result.status).toBe(0)
    expect(storedProcesses()[0]?.stage).toBe("rework")
  })

  it("moves a fifth round with a regressed case to rework without a stop", () => {
    prepareReview(
      ["simulation"],
      { 5: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["FAIL", "PASS", "FAIL", "FAIL"]) },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nRegressed: case 3 last passed in draft-2.md\nrework\n`,
    )
    const entry = storedProcesses()[0]
    expect(entry?.stage).toBe("rework")
    expect(storedHistory(entry).at(-1)?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("stops a fifth round in which a case fails that passed in no earlier round", () => {
    prepareReview(
      ["simulation"],
      { 5: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["FAIL", "FAIL", "FAIL", "FAIL"]) },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    const reason = "the limit of 5 rounds is reached and these reviewers still ask for changes: simulation"
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nStopped: ${reason}\napproval\n`,
    )
    expect(storedProcesses()[0]?.stage).toBe("approval")
    expect(Object.keys(storedRounds()[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "cases", "stopped"])
  })

  it("stores no cases and prints no Regressed: line without the simulation reviewer", () => {
    prepareReview(["legal"], { 2: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } }, { rounds: recordedCaseRounds(["PASS"]) })
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(Object.keys(storedRounds()[1] ?? {})).toEqual(["round", "draft", "at", "verdicts"])
  })

  it("counts the limit only from the rounds recorded after a respec", () => {
    prepareReview(
      ["legal"],
      { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } },
      { rounds: recordedRounds(4), respecs: [{ round: 3, at: "2026-11-19T09:00:00.000Z" }] },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("counts the limit only from the rounds recorded after a regeneration started", () => {
    prepareReview(
      ["legal"],
      { 5: { "legal.md": findingsText("legal", "CHANGES", ["high"]) } },
      { rounds: recordedRounds(4), regeneration: { version: 1, round: 4, at: "2026-11-23T10:00:00.000Z" } },
    )

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-5 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(storedProcesses()[0]?.stage).toBe("rework")
    expect(storedRounds()[4]).not.toHaveProperty("stopped")
  })

  it("prints no Regressed: line for a case that passed only in a round before a respec", () => {
    prepareReview(
      ["simulation"],
      { 2: { "simulation.md": simulationText("CHANGES", [[3, "Result: FAIL at step 2"]]) } },
      { rounds: recordedCaseRounds(["PASS"]), respecs: [{ round: 1, at: "2026-11-19T09:00:00.000Z" }] },
    )
    writeCases([3])

    const result = runCommand(["round", "001-handle-a-breach"])

    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-1.md\n  simulation  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(result.status).toBe(0)
  })
})
