import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, history, processes, readFile, runCommand, usage, writeFile } from "../006-process-state-machine/store.ts"
import {
  enteredReview,
  findings,
  installReviewers,
  installedFolder,
  prepareReview,
  processFolder,
  processId,
  refusal,
  writeDrafts,
  writeFindings,
  writeProcess,
} from "./rounds.ts"

const timeForm = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const twelveLines =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory org init\n       process-factory check\n       process-factory serve [--port <number>]\n'

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

/** Runs `round` for a refusal: standard error must be `stderr`, and the board must stay as it was. */
function expectRefused(id: string, stderr: string): void {
  const before = readFile(project, boardFile)

  const result = runCommand(project, ["round", id])

  expect(result.stderr).toBe(stderr)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(readFile(project, boardFile)).toBe(before)
}

describe("the usage of process-factory", () => {
  it.each([
    ["no argument", []],
    ["round alone", ["round"]],
    ["the arguments round a b", ["round", "a", "b"]],
  ])("has twelve lines, with round after accept-spec, and is printed with %s", (_name, args) => {
    const result = runCommand(project, args)

    expect(result.stderr).toBe(twelveLines)
    expect(result.stderr).toBe(usage)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})

describe("process-factory round for a complete round", () => {
  it("prints the round, the newest draft, each verdict with its findings per tag and the stage rework", () => {
    prepareReview(project)
    writeDrafts(project, [2])
    writeFindings(project, 1, "legal.md", findings("legal", "CHANGES", ["high", "medium", "medium"]))
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", ["low"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-1 for draft-2.md\n  legal  CHANGES  1 high, 2 medium, 0 low\n  readability  PASS  0 high, 0 medium, 1 low\nrework\n`,
    )
    expect(result.status).toBe(0)
  })

  it("records the round, the draft and the verdicts on the board, moves the process to rework and keeps everything else", () => {
    prepareReview(project)
    writeDrafts(project, [2])
    const legal = findings("legal", "CHANGES", ["high", "medium", "medium"])
    const readability = findings("readability", "PASS", ["low"])
    writeFindings(project, 1, "legal.md", legal)
    writeFindings(project, 1, "readability.md", readability)
    const draft = readFile(project, `${processFolder}/drafts/draft-2.md`)

    expect(runCommand(project, ["round", processId]).status).toBe(0)

    const changes = history(entry())
    expect(changes).toHaveLength(2)
    expect(changes[0]).toEqual(enteredReview)
    expect(changes[1]?.stage).toBe("rework")
    expect(changes[1]?.at).toMatch(timeForm)
    expect(processes(project)).toEqual([
      { id: "000-older-process", title: "Older process", stage: "published", owner: "Kari" },
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "rework",
        history: changes,
        owner: "Ola",
        rounds: [
          {
            round: 1,
            draft: "draft-2.md",
            at: changes[1]?.at,
            verdicts: [
              { reviewer: "legal", verdict: "CHANGES" },
              { reviewer: "readability", verdict: "PASS" },
            ],
          },
        ],
      },
    ])
    expect(readFile(project, `${processFolder}/rounds/round-1/legal.md`)).toBe(legal)
    expect(readFile(project, `${processFolder}/rounds/round-1/readability.md`)).toBe(readability)
    expect(readFile(project, `${processFolder}/drafts/draft-2.md`)).toBe(draft)
    expect(entries(project, `${processFolder}/rounds/round-1`)).toEqual(["legal.md", "readability.md"])
  })

  it("moves the process to approval when every verdict is PASS, with no finding or only low ones", () => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", ["low", "low"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  PASS  0 high, 0 medium, 0 low\n  readability  PASS  0 high, 0 medium, 2 low\napproval\n`,
    )
    expect(result.status).toBe(0)
    expect(entry().stage).toBe("approval")
    expect(history(entry())[1]?.stage).toBe("approval")
  })

  it("reads a findings file with \\r\\n line ends, spaces at the end of its lines and free text, and ignores files of no installed reviewer", () => {
    prepareReview(project)
    const legal = "# legal review of draft-1.md\n\nVerdict: CHANGES  \n\nWhat I looked at: every step.\n\n- [high] Step 3: the deadline is missing.  \n  It is in the specification.\n- [low] Steps: one long sentence.\n"
    writeFindings(project, 1, "legal.md", legal.replaceAll("\n", "\r\n"))
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", []))
    writeFindings(project, 1, "gdpr.md", "not a findings file\n- no tag\n")
    writeFindings(project, 1, "conflicts.md", "- nothing\n")

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-1 for draft-1.md\n  legal  CHANGES  1 high, 0 medium, 1 low\n  readability  PASS  0 high, 0 medium, 0 low\nrework\n`,
    )
    expect(result.status).toBe(0)
  })
})

describe("process-factory round and the newest round folder", () => {
  it("records round 2 as a second entry and keeps the first when round 1 is already on the board", () => {
    const first = { round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "CHANGES" }] }
    writeProcess(project, "review", { rounds: [first] })
    installReviewers(project, ["legal"])
    writeDrafts(project, [1, 2])
    writeFindings(project, 1, "legal.md", findings("legal", "CHANGES", ["high"]))
    writeFindings(project, 2, "legal.md", findings("legal", "PASS", []))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(`Recorded ${processFolder}/rounds/round-2 for draft-2.md\n  legal  PASS  0 high, 0 medium, 0 low\napproval\n`)
    expect(entry().rounds).toEqual([
      first,
      { round: 2, draft: "draft-2.md", at: expect.stringMatching(timeForm), verdicts: [{ reviewer: "legal", verdict: "PASS" }] },
    ])
  })

  it("takes round-10 before round-2, and leaves the unfinished round-2 unrecorded", () => {
    prepareReview(project)
    writeFindings(project, 2, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 10, "legal.md", findings("legal", "CHANGES", ["medium"]))
    writeFindings(project, 10, "readability.md", findings("readability", "PASS", []))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout.split("\n")[0]).toBe(`Recorded ${processFolder}/rounds/round-10 for draft-1.md`)
    expect(result.status).toBe(0)
    expect(entry().rounds).toEqual([
      {
        round: 10,
        draft: "draft-1.md",
        at: expect.stringMatching(timeForm),
        verdicts: [
          { reviewer: "legal", verdict: "CHANGES" },
          { reviewer: "readability", verdict: "PASS" },
        ],
      },
    ])
    expect(entries(project, `${processFolder}/rounds`)).toEqual(["round-10", "round-2"])
  })
})

describe("process-factory round when there is nothing to record", () => {
  function prepareComplete(): void {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", []))
  }

  it.each([["002-handle-a-breach"], ["../../outside"]])("says there is no process %s", (unknown) => {
    prepareComplete()
    expectRefused(unknown, `process-factory: there is no process ${unknown}\n`)
  })

  it("names the board it cannot read", () => {
    writeFile(project, boardFile, "{ not json\n")

    const result = runCommand(project, ["round", processId])

    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr.startsWith("process-factory: cannot read processes/board.json: ")).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(readFile(project, boardFile)).toBe("{ not json\n")
  })

  it("names the stage of a process that is not in review", () => {
    prepareComplete()
    writeProcess(project, "draft")
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: it is in the stage draft, not in review\n`)
  })

  it("says no reviewer is installed when the folder of the skill holds reviewer.md but no <name>-reviewer.md", () => {
    writeProcess(project)
    installReviewers(project, [])
    writeFile(project, `${installedFolder}/draft-writer.md`, "# Draft writer\n")
    writeDrafts(project, [1])
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: no reviewer is installed in .claude/skills/process\n`)
  })

  it("says no reviewer is installed when the folder of the skill is missing", () => {
    writeProcess(project)
    writeDrafts(project, [1])
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: no reviewer is installed in .claude/skills/process\n`)
  })

  it("says there is no round folder", () => {
    prepareReview(project)
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: there is no round folder in ${processFolder}/rounds\n`)
  })

  it("says the newest round is already recorded", () => {
    prepareComplete()
    writeProcess(project, "review", {
      rounds: [{ round: 1, draft: "draft-1.md", at: "2026-11-20T16:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }],
    })
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: round 1 is already recorded\n`)
  })

  it("says there is no draft", () => {
    writeProcess(project)
    installReviewers(project, ["legal"])
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    writeFile(project, `${processFolder}/drafts/notes.md`, "not a draft\n")
    expectRefused(processId, `process-factory: cannot record a round of ${processId}: there is no draft in ${processFolder}/drafts\n`)
  })
})

describe("process-factory round for findings files that are missing or malformed", () => {
  const verdictReason = "must have exactly one line Verdict: PASS or Verdict: CHANGES"
  const lineReason = 'line 5 starts with "- " but is not a finding tagged [high], [medium] or [low]'

  it("names the reviewer without a file, and only that one", () => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", findings("legal", "CHANGES", ["high"]))
    expectRefused(processId, refusal(1, [["readability.md", "is missing"]]))
    expect(entry().rounds).toBeUndefined()
  })

  it("names every failing file in the order of the reviewers", () => {
    prepareReview(project)
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", ["medium"]))
    expectRefused(
      processId,
      refusal(1, [
        ["legal.md", "is missing"],
        ["readability.md", "the verdict is PASS but it has findings tagged high or medium"],
      ]),
    )
  })

  it.each([
    ["no verdict line", "# legal review of draft-1.md\n\nNo findings.\n"],
    ["two verdict lines", "# legal review of draft-1.md\n\nVerdict: PASS\nVerdict: PASS\n\nNo findings.\n"],
    ["the verdict OK", findings("legal", "OK", [])],
  ])("refuses a file with %s", (_name, content) => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", content)
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", []))
    expectRefused(processId, refusal(1, [["legal.md", verdictReason]]))
  })

  it.each([["- [urgent] x"], ["- no tag"], ["- [high]"]])("refuses a file whose fifth line is %j", (line) => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", `# legal review of draft-1.md\n\nVerdict: CHANGES\n\n${line}\n- [high] Step 3: the deadline is missing.\n`)
    writeFindings(project, 1, "readability.md", findings("readability", "PASS", []))
    expectRefused(processId, refusal(1, [["legal.md", lineReason]]))
  })

  it.each([
    ["a PASS file with a medium finding", "PASS", ["low", "medium"], "the verdict is PASS but it has findings tagged high or medium"],
    ["a PASS file with a high finding", "PASS", ["high"], "the verdict is PASS but it has findings tagged high or medium"],
    ["a CHANGES file with only low findings", "CHANGES", ["low"], "the verdict is CHANGES but it has no finding tagged high or medium"],
    ["a CHANGES file with no finding", "CHANGES", [], "the verdict is CHANGES but it has no finding tagged high or medium"],
  ])("refuses %s, whose verdict does not fit its findings", (_name, verdict, tags, reason) => {
    prepareReview(project)
    writeFindings(project, 1, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 1, "readability.md", findings("readability", verdict, tags))
    expectRefused(processId, refusal(1, [["readability.md", reason]]))
  })
})
