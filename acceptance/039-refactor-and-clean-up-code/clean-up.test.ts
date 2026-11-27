import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const bin = path.resolve(import.meta.dirname, "../../bin")
/** The text of every file of `bin/` together, in the order of the file names: the command line is one file or several modules. */
const source = readdirSync(bin)
  .filter((name) => name.endsWith(".mjs"))
  .sort()
  .map((name) => readFileSync(path.join(bin, name), "utf8").replaceAll("\r\n", "\n"))
  .join("\n")

/** How many times a text stands in the files of the command line together. */
function count(text: string): number {
  return source.split(text).length - 1
}

/** How many times a function is called with this argument, without its declaration. */
function calls(name: string, argument: string): number {
  return count(`${name}(${argument})`) - count(`function ${name}(${argument})`)
}

describe("the helpers of the files of bin", () => {
  it.each(["readEntryOrPrintReason", "readInputOrPrintReason", "folderNames", "caseNumbers", "newestQuestionsNumber", "cleanedText"])(
    "declares the function %s",
    (name) => {
      expect(count(`function ${name}(`)).toBe(1)
    },
  )

  it("declares the constant formBodyLimit as 32768", () => {
    expect(source).toContain("const formBodyLimit = 32768\n")
  })
})

describe("the lookup of a board entry", () => {
  it("has the text there is no process ${id} exactly once", () => {
    expect(count("there is no process ${id}")).toBe(1)
  })

  it("is called as readEntryOrPrintReason(id) by exactly seven commands", () => {
    expect(calls("readEntryOrPrintReason", "id")).toBe(7)
  })

  it("has the id check /^[a-z0-9-]+$/.test(id) exactly twice", () => {
    expect(count("/^[a-z0-9-]+$/.test(id)")).toBe(2)
  })
})

describe("the read of a file or of standard input", () => {
  it("has the text cannot read ${file}: exactly once", () => {
    expect(count("cannot read ${file}:")).toBe(1)
  })

  it("is called as readInputOrPrintReason(file) by exactly three commands", () => {
    expect(calls("readInputOrPrintReason", "file")).toBe(3)
  })

  it("no longer has the name readFileOrStandardInput", () => {
    expect(source).not.toContain("readFileOrStandardInput")
  })
})

describe("the read of the names of a folder", () => {
  it("calls readdirSync exactly once", () => {
    expect(count("readdirSync(")).toBe(1)
  })
})

describe("the names of cases and questions files", () => {
  it("has the pattern of a case file exactly once", () => {
    expect(count(String.raw`case-(\d+)\.md`)).toBe(1)
  })

  it("has the pattern of a questions file exactly once", () => {
    expect(count(String.raw`questions-(\d+)\.md`)).toBe(1)
  })
})

describe("the names that said feedback", () => {
  it("has no whole word feedbackText", () => {
    expect(source).not.toMatch(/\bfeedbackText\b/)
  })

  it("has no feedbackBodyLimit", () => {
    expect(source).not.toContain("feedbackBodyLimit")
  })
})

describe("the comments", () => {
  it.each([
    "/** The headers of every page of the reading view and of the dashboard. */",
    "/** The readable defaults of every page of the reading view, of the dashboard and of an HTML export. */",
    "/** What the command line, the reading view, the dashboard and an export show for a value the store does not record. */",
    "/** The first problem of the lines of a change list of a regeneration, in the order of the checks below, or undefined when it has none. */",
    "/** One part of the page of a process as the store has it at this moment, and whether it holds a form: the decision, the timeline, the specification, the cases, a draft, the rounds, the versions or the open feedback. */",
    "/** The page `Not done`: why a decision was not taken or an edit was not saved, with the way back to the process. */",
    "/** The process and the name of the address `/<process-id>/<part>/<name>` of a file of a process on the board, or null for every other path. */",
  ])("has the comment %s", (comment) => {
    expect(source).toContain(comment)
  })

  it.each([
    "The headers of every page of the reading view.",
    "The readable defaults of every page of the reading view.",
    "What the reading view shows for an owner",
    "in the order of 3.2 of the spec",
    "links to its seven parts",
    "why a decision was not taken, with",
    "The process, the name and the stored text of the address",
  ])("no longer has the stale text %s", (stale) => {
    expect(source).not.toContain(stale)
  })
})
