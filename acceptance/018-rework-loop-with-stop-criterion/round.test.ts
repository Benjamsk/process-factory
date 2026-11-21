import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, history, processes, runCommand } from "../006-process-state-machine/store.ts"
import { findings, installReviewers, processFolder, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"

const limitReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: "

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** The entries of `count` rounds that are already on the board, numbered from 1, each with legal asking for changes. */
function recorded(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_unused, index) => ({
    round: index + 1,
    draft: `draft-${String(index + 1)}.md`,
    at: "2026-11-20T16:00:00.000Z",
    verdicts: [{ reviewer: "legal", verdict: "CHANGES" }],
  }))
}

/** A process in `review` with `count` recorded rounds, these reviewers installed and the draft of the next round. */
function prepare(count: number, reviewers: string[]): void {
  writeProcess(project, "review", count === 0 ? {} : { rounds: recorded(count) })
  installReviewers(project, reviewers)
  writeDrafts(project, [count + 1])
}

/** The second entry on the board, which is the process the tests record rounds for. */
function entry(): Record<string, unknown> {
  return processes(project)[1] ?? {}
}

/** The round entries of the process on the board. */
function rounds(): Record<string, unknown>[] {
  const list: unknown = entry().rounds
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : []
}

/** Moves the process from `approval` or `rework` back to `review`, as a person and the step `Rework the draft` do. */
function backToReview(): void {
  if (entry().stage === "approval") expect(runCommand(project, ["move", processId, "rework"]).status).toBe(0)
  expect(runCommand(project, ["move", processId, "review"]).status).toBe(0)
}

describe("process-factory round at the limit of five rounds", () => {
  it("prints the line Stopped: with the limit and the reviewers that still ask for changes, between the reviewer lines and the stage approval", () => {
    prepare(4, ["gdpr", "legal", "readability"])
    writeFindings(project, 5, "gdpr.md", findings("gdpr", "CHANGES", ["medium"]))
    writeFindings(project, 5, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 5, "readability.md", findings("readability", "CHANGES", ["medium", "medium", "low"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(
      [
        `Recorded ${processFolder}/rounds/round-5 for draft-5.md`,
        "  gdpr  CHANGES  0 high, 1 medium, 0 low",
        "  legal  PASS  0 high, 0 medium, 0 low",
        "  readability  CHANGES  0 high, 2 medium, 1 low",
        `Stopped: ${limitReason}gdpr, readability`,
        "approval",
        "",
      ].join("\n"),
    )
    expect(result.status).toBe(0)
  })

  it("moves the process to approval and stores the reason under stopped on the fifth round entry, after the verdicts", () => {
    prepare(4, ["gdpr", "legal", "readability"])
    writeFindings(project, 5, "gdpr.md", findings("gdpr", "CHANGES", ["medium"]))
    writeFindings(project, 5, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 5, "readability.md", findings("readability", "CHANGES", ["high"]))

    expect(runCommand(project, ["round", processId]).status).toBe(0)

    const changes = history(entry())
    expect(entry().stage).toBe("approval")
    expect(changes.at(-1)?.stage).toBe("approval")
    expect(rounds()).toEqual([
      ...recorded(4),
      {
        round: 5,
        draft: "draft-5.md",
        at: changes.at(-1)?.at,
        verdicts: [
          { reviewer: "gdpr", verdict: "CHANGES" },
          { reviewer: "legal", verdict: "PASS" },
          { reviewer: "readability", verdict: "CHANGES" },
        ],
        stopped: `${limitReason}gdpr, readability`,
      },
    ])
    expect(Object.keys(rounds()[4] ?? {})).toEqual(["round", "draft", "at", "verdicts", "stopped"])
  })

  it("names the one reviewer that still asks for changes", () => {
    prepare(4, ["legal", "readability"])
    writeFindings(project, 5, "legal.md", findings("legal", "CHANGES", ["high"]))
    writeFindings(project, 5, "readability.md", findings("readability", "PASS", ["low"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stdout.split("\n").slice(-3)).toEqual([`Stopped: ${limitReason}legal`, "approval", ""])
    expect(rounds()[4]?.stopped).toBe(`${limitReason}legal`)
  })
})

describe("process-factory round below the limit and without open changes", () => {
  it("moves a fourth round with CHANGES to rework without a stop, and stops the fifth round that follows it", () => {
    prepare(3, ["legal"])
    writeFindings(project, 4, "legal.md", findings("legal", "CHANGES", ["high"]))

    const fourth = runCommand(project, ["round", processId])

    expect(fourth.stdout).toBe(`Recorded ${processFolder}/rounds/round-4 for draft-4.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(entry().stage).toBe("rework")
    expect(rounds()).toHaveLength(4)
    expect(rounds()[3]).not.toHaveProperty("stopped")

    backToReview()
    writeDrafts(project, [5])
    writeFindings(project, 5, "legal.md", findings("legal", "CHANGES", ["medium"]))

    const fifth = runCommand(project, ["round", processId])

    expect(fifth.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-5.md\n  legal  CHANGES  0 high, 1 medium, 0 low\nStopped: ${limitReason}legal\napproval\n`,
    )
    expect(entry().stage).toBe("approval")
    expect(rounds()[3]).not.toHaveProperty("stopped")
  })

  it("moves a fifth round with only PASS to approval without a stop, and stops the sixth round when a person sent the draft back and it has CHANGES", () => {
    prepare(4, ["legal", "readability"])
    writeFindings(project, 5, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 5, "readability.md", findings("readability", "PASS", ["low"]))

    const fifth = runCommand(project, ["round", processId])

    expect(fifth.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-5 for draft-5.md\n  legal  PASS  0 high, 0 medium, 0 low\n  readability  PASS  0 high, 0 medium, 1 low\napproval\n`,
    )
    expect(entry().stage).toBe("approval")
    expect(rounds()[4]).not.toHaveProperty("stopped")

    backToReview()
    writeDrafts(project, [6])
    writeFindings(project, 6, "legal.md", findings("legal", "PASS", []))
    writeFindings(project, 6, "readability.md", findings("readability", "CHANGES", ["medium"]))

    const sixth = runCommand(project, ["round", processId])

    expect(sixth.stderr).toBe("")
    expect(sixth.stdout.split("\n").slice(-3)).toEqual([`Stopped: ${limitReason}readability`, "approval", ""])
    expect(entry().stage).toBe("approval")
    expect(rounds()[4]).not.toHaveProperty("stopped")
    expect(rounds()[5]?.stopped).toBe(`${limitReason}readability`)
  })
})

describe("process-factory round and what the limit counts", () => {
  it("counts the rounds recorded on the board, not the number of the round folder", () => {
    prepare(4, ["legal"])
    writeFindings(project, 9, "legal.md", findings("legal", "CHANGES", ["high"]))

    const withFour = runCommand(project, ["round", processId])

    expect(withFour.stdout).toBe(
      `Recorded ${processFolder}/rounds/round-9 for draft-5.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nStopped: ${limitReason}legal\napproval\n`,
    )
    expect(rounds()[4]?.round).toBe(9)
    expect(rounds()[4]?.stopped).toBe(`${limitReason}legal`)

    writeProcess(project, "review")

    const withNone = runCommand(project, ["round", processId])

    expect(withNone.stdout).toBe(`Recorded ${processFolder}/rounds/round-9 for draft-5.md\n  legal  CHANGES  1 high, 0 medium, 0 low\nrework\n`)
    expect(entry().stage).toBe("rework")
    expect(rounds()[0]).not.toHaveProperty("stopped")
  })

  it("stops a sixth round with CHANGES again after a stopped fifth round, and keeps the reason of the fifth", () => {
    const fifth = { ...recorded(5)[4], stopped: `${limitReason}legal` }
    writeProcess(project, "review", { rounds: [...recorded(4), fifth] })
    installReviewers(project, ["gdpr", "legal"])
    writeDrafts(project, [6])
    writeFindings(project, 6, "gdpr.md", findings("gdpr", "CHANGES", ["high"]))
    writeFindings(project, 6, "legal.md", findings("legal", "CHANGES", ["medium"]))

    const result = runCommand(project, ["round", processId])

    expect(result.stderr).toBe("")
    expect(result.stdout.split("\n").slice(-3)).toEqual([`Stopped: ${limitReason}gdpr, legal`, "approval", ""])
    expect(result.status).toBe(0)
    expect(entry().stage).toBe("approval")
    expect(rounds()[4]).toEqual(fifth)
    expect(rounds()[5]?.stopped).toBe(`${limitReason}gdpr, legal`)
  })
})
