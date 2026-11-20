import { existsSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { headings, readFile, root, section, tableRows } from "../010-clarifying-questions/clarify.ts"
import { fencedBlocks, simulationTemplate } from "./simulation.ts"

const readSection = "What you read besides the files of `reviewer.md`"

describe("the file templates/skills/process/simulation-reviewer.md", () => {
  it("exists, starts with # Simulation reviewer, has no frontmatter and no other level 1 heading, and ends with one newline", () => {
    expect(existsSync(path.join(root, simulationTemplate))).toBe(true)
    const text = readFile(root, simulationTemplate)
    expect(text.split(/\r?\n/)[0]).toBe("# Simulation reviewer")
    expect(headings(simulationTemplate, 1)).toEqual(["Simulation reviewer"])
    expect(text.endsWith("\n")).toBe(true)
    expect(/\r?\n\r?\n$/.test(text)).toBe(false)
  })

  it("has the five level 2 headings of the spec, in order, and no others outside fenced code blocks", () => {
    expect(headings(simulationTemplate, 2)).toEqual([
      readSection,
      "Play every case",
      "What a failed case becomes",
      "The account of every case",
      "The findings file",
    ])
  })

  it("points to reviewer.md for the shared rules and restates none of them", () => {
    const text = readFile(root, simulationTemplate)
    expect(text).toContain("The rules every reviewer shares are in `reviewer.md`.")
    expect(text).not.toContain("Run no command")
    expect(text).not.toContain("REVIEWED processes/")
    for (const tag of ["high", "medium", "low"]) {
      expect(text.split(/\r?\n/).filter((line) => line.startsWith(`- \`${tag}\`: `))).toEqual([])
    }
  })
})

describe("the section What you read besides the files of reviewer.md", () => {
  it("names the cases of the process", () => {
    expect(section(simulationTemplate, readSection)).toContain("Every `case-<n>.md` in `processes/<process-id>/cases/`.")
  })

  it("says that with no case the reviewer writes no file and replies NOT REVIEWED with the reason", () => {
    expect(section(simulationTemplate, readSection)).toContain(
      "When that folder holds no `case-<n>.md`, write no file and reply with the line `NOT REVIEWED` and under it the line `There is no case in processes/<process-id>/cases/.`",
    )
  })
})

describe("the section Play every case", () => {
  it("tells the reviewer to play the person under Who acts with only what What the person knows says", () => {
    const text = section(simulationTemplate, "Play every case")
    expect(text).toContain("You are the person under `Who acts`, in the situation under `Situation`, and you have the draft.")
    expect(text).toContain("You know what `What the person knows` says you know, and nothing it says you do not know.")
  })

  it("says the person does not know spec.md nor What should happen and Pass of the case", () => {
    expect(section(simulationTemplate, "Play every case")).toContain(
      "You do not know what `spec.md` says, and not what the case says under `What should happen` and `Pass`.",
    )
  })

  it("says a case passes when the person brings about the outcome under Pass, and otherwise fails at the step where they stopped or first did something else", () => {
    const text = section(simulationTemplate, "Play every case")
    expect(text).toContain("The case passes when what the person did brings about the outcome under `Pass`.")
    expect(text).toContain(
      "In every other case it fails, at the step of the draft where the person stopped or first did something else than `What should happen` says.",
    )
  })
})

describe("the section What a failed case becomes", () => {
  it("has a table with exactly the four kinds of the spec and their tags, in order", () => {
    expect(tableRows(simulationTemplate, "What a failed case becomes")).toEqual([
      "| The draft says something else than `spec.md`, and the person who follows it does something wrong | `high` |",
      "| The draft is silent on something `spec.md` says, and the person goes on and leaves it undone without noticing | `high` |",
      "| The draft is silent on something `spec.md` says, and the person stops | `medium` |",
      "| The draft is silent on something `spec.md` does not say either, and the person does not find whom to turn to | `low` |",
    ])
  })

  it("says a finding ends with the cases that showed it, in brackets", () => {
    expect(section(simulationTemplate, "What a failed case becomes")).toContain(
      "End every finding with the cases that showed it, in brackets, such as `(case 3)` or `(case 3, case 7)`.",
    )
  })

  it("says a low finding does not fail its case and that a case fails exactly when a high or medium finding names it", () => {
    const text = section(simulationTemplate, "What a failed case becomes")
    expect(text).toContain("A finding tagged `low` does not make its case fail.")
    expect(text).toContain("A case has the result `FAIL` exactly when a finding tagged `high` or `medium` names it.")
  })
})

describe("the section The account of every case", () => {
  it("gives the form of a case section as a fenced block with the heading and the four lines, in order", () => {
    const block = fencedBlocks()[0] ?? ""
    const starts = block
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => (line.startsWith("## ") ? line : line.slice(0, line.indexOf(":") + 1)))
    expect(starts).toEqual(["## Case <n>: <title>", "Would do:", "Stops at:", "Gets wrong:", "Result:"])
    expect(section(simulationTemplate, "The account of every case")).toContain(block.trimEnd())
  })

  it("says the result line is Result: PASS or starts with Result: FAIL at", () => {
    expect(section(simulationTemplate, "The account of every case")).toContain(
      "The line of the result is `Result: PASS`, or it starts with `Result: FAIL at `",
    )
  })

  it("says to start no line of a case section with a bullet or with Verdict:", () => {
    expect(section(simulationTemplate, "The account of every case")).toContain("Start no line of a section with `- ` or with `Verdict:`.")
  })
})

describe("the section The findings file", () => {
  it("says what the file looks like when every case passes", () => {
    expect(section(simulationTemplate, "The findings file")).toContain(
      "When every case passes and there is no finding, the verdict is `PASS`, the line `No findings.` stands under it, and the section of every case ends with `Result: PASS`.",
    )
  })
})
