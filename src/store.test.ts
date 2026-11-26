import { readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { boardPath, readWorkingFile, runCommand, timeForm, workingDirectory, writeBoardFile, writeWorkingFile } from "./command-line.ts"

describe("process-factory new", () => {
  it("prints the id and creates the process folder, request.md and the five empty folders", () => {
    const result = runCommand(["new", "Handle a personal data breach"])
    expect(result.stdout).toBe("001-handle-a-personal-data-breach\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const folder = "processes/001-handle-a-personal-data-breach"
    expect(readdirSync(path.join(workingDirectory, folder)).sort()).toEqual([
      "cases",
      "drafts",
      "feedback",
      "request.md",
      "rounds",
      "versions",
    ])
    expect(readdirSync(path.join(workingDirectory, folder, "cases"))).toEqual([])
    expect(readWorkingFile(`${folder}/request.md`)).toBe("# Handle a personal data breach\n")
  })

  it("lists the process on the board in the stage intake with one dated history entry and writes nothing else", () => {
    runCommand(["new", "Handle a personal data breach"])
    const text = readWorkingFile(boardPath)
    const parsed: unknown = JSON.parse(text)
    expect(parsed).toEqual({
      processes: [
        {
          id: "001-handle-a-personal-data-breach",
          title: "Handle a personal data breach",
          stage: "intake",
          history: [{ at: expect.stringMatching(timeForm), stage: "intake" }],
        },
      ],
    })
    expect(text).toBe(`${JSON.stringify(parsed, null, 2)}\n`)
    expect(readdirSync(workingDirectory)).toEqual(["processes"])
  })

  it("takes the next number after the highest on the board, trims the title and keeps six words", () => {
    writeWorkingFile(boardPath, `${JSON.stringify({ processes: [{ id: "007-older-process", owner: "Kari" }] }, null, 2)}\n`)
    const result = runCommand(["new", "  Onboard a new colleague, step by step, in two weeks  "])
    expect(result.stdout).toBe("008-onboard-a-new-colleague-step-by\n")
    expect(JSON.parse(readWorkingFile(boardPath))).toEqual({
      processes: [
        { id: "007-older-process", owner: "Kari" },
        {
          id: "008-onboard-a-new-colleague-step-by",
          title: "Onboard a new colleague, step by step, in two weeks",
          stage: "intake",
          history: [{ at: expect.stringMatching(timeForm), stage: "intake" }],
        },
      ],
    })
  })

  it("writes the trimmed prompt under the title in request.md and keeps it off the board", () => {
    const result = runCommand(["new", "Handle a breach", "  A laptop was lost.\nWho do we tell?  "])
    expect(result.stdout).toBe("001-handle-a-breach\n")
    expect(result.status).toBe(0)
    expect(readWorkingFile("processes/001-handle-a-breach/request.md")).toBe("# Handle a breach\n\nA laptop was lost.\nWho do we tell?\n")
    expect(readWorkingFile(boardPath)).not.toContain("A laptop was lost.")
  })

  it("writes request.md as the title alone for a prompt of only whitespace", () => {
    expect(runCommand(["new", "Handle a breach", " \n "]).status).toBe(0)
    expect(readWorkingFile("processes/001-handle-a-breach/request.md")).toBe("# Handle a breach\n")
  })

  it("keeps a title with dots and slashes inside the store", () => {
    expect(runCommand(["new", "../../outside"]).stdout).toBe("001-outside\n")
    expect(readdirSync(path.join(workingDirectory, "processes")).sort()).toEqual(["001-outside", "board.json"])
  })

  it.each([[""], ["   "], ["???"], ["Handle a breach\nand more"]])(
    "refuses the title %j and writes nothing",
    (title) => {
      const result = runCommand(["new", title])
      expect(result.stderr).toBe("process-factory: the title must be one line with at least one letter or digit\n")
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(readdirSync(workingDirectory)).toEqual([])
    },
  )

  it.each([["{ not json\n"], ['{ "processes": "none" }\n']])(
    "names the board it cannot read and writes nothing for %j",
    (content) => {
      writeWorkingFile(boardPath, content)
      const result = runCommand(["new", "Handle a breach"])
      expect(result.status).toBe(1)
      expect(result.stdout).toBe("")
      expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
      expect(readWorkingFile(boardPath)).toBe(content)
      expect(readdirSync(path.join(workingDirectory, "processes"))).toEqual(["board.json"])
    },
  )

  it("names the process it cannot create when processes is a file", () => {
    writeWorkingFile("processes", "not a folder\n")
    const result = runCommand(["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^process-factory: cannot create process 001-handle-a-breach: .+\n$/)
    expect(readWorkingFile("processes")).toBe("not a folder\n")
  })

  it("keeps an existing process folder and writes no board", () => {
    writeWorkingFile("processes/001-handle-a-breach/notes.txt", "kept\n")
    const result = runCommand(["new", "Handle a breach"])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/^process-factory: cannot create process 001-handle-a-breach: .+\n$/)
    expect(readWorkingFile("processes/001-handle-a-breach/notes.txt")).toBe("kept\n")
    expect(readdirSync(path.join(workingDirectory, "processes"))).toEqual(["001-handle-a-breach"])
  })
})

describe("process-factory show", () => {
  it("prints one line per process with id, stage and title, in the board's order", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify" },
      { id: "002-onboard-a-new-colleague", title: "Onboard a new colleague", stage: "intake" },
    ])
    const result = runCommand(["show"])
    expect(result.stdout).toBe("001-handle-a-breach  clarify  Handle a breach\n002-onboard-a-new-colleague  intake  Onboard a new colleague\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("prints No processes. and creates nothing when there is no board", () => {
    const result = runCommand(["show"])
    expect(result.stdout).toBe("No processes.\n")
    expect(result.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it("prints one process with its history, oldest first, and leaves the board as it was", () => {
    writeBoardFile([
      { id: "001-handle-a-breach", title: "Handle a breach", stage: "clarify", history: [{ at: "2026-11-18T17:02:11.123Z", stage: "intake" }, { at: "2026-11-18T17:05:40.456Z", stage: "clarify" }] },
    ])
    const before = readWorkingFile(boardPath)

    const result = runCommand(["show", "001-handle-a-breach"])

    expect(result.stdout).toBe(
      "001-handle-a-breach\nTitle: Handle a breach\nStage: clarify\nHistory:\n  2026-11-18T17:02:11.123Z  intake\n  2026-11-18T17:05:40.456Z  clarify\n",
    )
    expect(result.status).toBe(0)
    expect(readWorkingFile(boardPath)).toBe(before)
  })

  it("ends with the line History: for a process stored without a history", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const result = runCommand(["show", "001-handle-a-breach"])
    expect(result.stdout).toBe("001-handle-a-breach\nTitle: Handle a breach\nStage: intake\nHistory:\n")
    expect(result.status).toBe(0)
  })

  it("says there is no process for an id that is not on the board", () => {
    writeBoardFile([{ id: "001-handle-a-breach", title: "Handle a breach", stage: "intake" }])
    const result = runCommand(["show", "002-handle-a-breach"])
    expect(result.stderr).toBe("process-factory: there is no process 002-handle-a-breach\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("process-factory show and the open feedback of a process", () => {
  const laptopId = "001-handle-a-lost-laptop"
  const laptop = { id: laptopId, title: "Handle a lost laptop", stage: "published" }
  const laptopTop = `${laptopId}\nTitle: Handle a lost laptop\nStage: published\n`

  /** The lines above the text of an open feedback, as the reading view writes them. */
  function openLines(version: string, step: string, kind: string): string[] {
    return [`Version: ${version}`, `Step: ${step}`, `Kind: ${kind}`, "From: Ola Hansen", "Received at: 2026-11-22T10:15:00.000Z", "Status: open"]
  }

  /** Writes a feedback file of the laptop process with the lines above its text. */
  function writeFeedback(number: number, lines: string[], text: string): void {
    writeWorkingFile(`processes/${laptopId}/feedback/feedback-${String(number)}.md`, `# Feedback ${String(number)}\n\n${lines.join("\n")}\n\n## Text\n\n${text}\n`)
  }

  it("prints the number of open feedback behind a process that has any, and nothing behind a process without any", () => {
    writeBoardFile([laptop, { id: "002-order-a-badge", title: "Order a badge", stage: "draft" }])
    writeFeedback(1, openLines("2", "1", "document"), "I did not understand step one.")
    writeFeedback(2, openLines("1", "whole document", "process"), "The police did not answer.")

    const result = runCommand(["show"])

    expect(result.stdout).toBe(`${laptopId}  published  Handle a lost laptop  2 open feedback\n002-order-a-badge  draft  Order a badge\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
  })

  it("counts and lists only a file feedback-<k>.md whose first line Status: says open", () => {
    writeBoardFile([laptop])
    writeFeedback(1, openLines("2", "1", "document"), "I did not understand step one.")
    writeFeedback(3, [...openLines("2", "1", "document").slice(0, -1), "Status: closed"], "Closed.\nStatus: open")
    writeFeedback(5, openLines("2", "1", "document").slice(0, -1), "Without a status.")
    writeWorkingFile(`processes/${laptopId}/feedback/notes.md`, "# Notes\n\nStatus: open\n\n## Text\n\nNot a feedback file.\n")

    expect(runCommand(["show"]).stdout).toBe(`${laptopId}  published  Handle a lost laptop  1 open feedback\n`)
    expect(runCommand(["show", laptopId]).stdout).toBe(`${laptopTop}Feedback:\n  1  version 2  step 1  document  I did not understand step one.\nHistory:\n`)
  })

  it("prints no line of feedback for a process whose folder feedback is missing", () => {
    writeBoardFile([laptop])

    expect(runCommand(["show"]).stdout).toBe(`${laptopId}  published  Handle a lost laptop\n`)
    expect(runCommand(["show", laptopId]).stdout).toBe(`${laptopTop}History:\n`)
  })

  it("lists each open feedback on one line, in the order of their numbers, without the name and the time", () => {
    writeBoardFile([laptop])
    writeFeedback(10, openLines("2", "1", "process"), "The tenth remark.")
    writeFeedback(2, openLines("1", "whole document", "process"), "The police\u001b[31m did not answer.\r\n\r\n  I waited\tan hour.")
    writeFeedback(4, ["Status: open"], "Something went wrong.")

    const result = runCommand(["show", laptopId])

    expect(result.stdout).toBe(
      `${laptopTop}Feedback:\n  2  version 1  whole document  process  The police [31m did not answer. I waited an hour.\n  4  version not recorded  step not recorded  not recorded  Something went wrong.\n  10  version 2  step 1  process  The tenth remark.\nHistory:\n`,
    )
    expect(result.stdout).not.toContain("Ola Hansen")
    expect(result.stdout).not.toContain("2026-11-22T10:15")
    expect(result.status).toBe(0)
  })
})
