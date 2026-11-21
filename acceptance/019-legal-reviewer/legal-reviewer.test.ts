import { describe, expect, it } from "vitest"
import { headings, readFile, root, section, sectionLines, tableRows } from "../010-clarifying-questions/clarify.ts"
import { template } from "./legal.ts"

/** The text between the first line of the file and its first level 2 heading. */
function intro(): string {
  const lines = readFile(root, template).split(/\r?\n/)
  const end = lines.findIndex((line) => line.startsWith("## "))
  return lines.slice(1, end === -1 ? undefined : end).join("\n")
}

/** The trimmed cells of a table row. */
function cells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim())
}

describe("the file templates/skills/process/legal-reviewer.md", () => {
  it("starts with # Legal reviewer, has no frontmatter and no other level 1 heading, and ends with one newline", () => {
    const text = readFile(root, template)
    expect(text.split(/\r?\n/)[0]).toBe("# Legal reviewer")
    expect(headings(template, 1)).toEqual(["Legal reviewer"])
    expect(text.endsWith("\n")).toBe(true)
    expect(/\r?\n\r?\n$/.test(text)).toBe(false)
  })

  it("has the three level 2 headings of the spec, in order, and no others outside fenced code blocks", () => {
    expect(headings(template, 2)).toEqual(["The rules you check against", "What you check", "The rule of a finding"])
  })

  it("says in its first paragraph that reviewer.md holds the shared rules, that both files apply and that it reads no further file", () => {
    expect(intro()).toContain("`reviewer.md` holds the rules you share with every reviewer, and both files apply.")
    expect(intro()).toContain("You read no file besides those `reviewer.md` names.")
  })

  it("repeats no rule of reviewer.md: no verdict line, no reply and no findings file path", () => {
    const text = readFile(root, template)
    expect(text).not.toBe("")
    expect(text.split(/\r?\n/).filter((line) => line.startsWith("Verdict:"))).toEqual([])
    expect(text).not.toContain("REVIEWED")
    expect(text).not.toContain("rounds/round-")
  })
})

describe("the section The rules you check against", () => {
  const title = "The rules you check against"

  it("names the sections of spec.md and the file of the organisation that hold the rules", () => {
    const text = section(template, title)
    for (const name of ["Legal basis", "Dependencies", "Deadlines", "Duties to notify", "Roles", "Escalation"]) {
      expect(text).toContain(`\`${name}\``)
    }
    expect(text).toContain("`spec.md`")
    expect(text).toContain("`organisation/authority.md`")
  })

  it("checks against no rule that spec.md does not name, and uses what it knows of a named law only when sure", () => {
    const text = section(template, title)
    expect(text).toContain("Check the draft against no law, agreement or policy that `spec.md` does not name.")
    expect(text).toContain("What you know about a law that `spec.md` names counts only when you are sure of it.")
  })
})

describe("the section What you check", () => {
  const title = "What you check"

  it("has a table with the six kinds of finding in order, each with its tag", () => {
    const rows = tableRows(template, title).map(cells)
    expect(rows.map((row) => row[0])).toEqual(["No legal basis", "Unnamed rule", "Missing deadline", "Wrong authority", "Missing duty", "Exposing advice"])
    expect(rows.map((row) => row.at(-1))).toEqual(["`high`", "`medium`", "`high`", "`high`", "`high`", "`high`"])
  })

  it("gives no finding for a step no rule is about, and takes no rule from an example section", () => {
    const text = section(template, title)
    expect(text).toContain("A step that no rule is about gives no finding.")
    expect(text).toContain("A section of `organisation/authority.md` whose heading starts with `Example:` is no rule.")
  })
})

describe("the section The rule of a finding", () => {
  const title = "The rule of a finding"

  it("makes every finding end with its rule in the same line, and forbids a finding without a rule", () => {
    const text = section(template, title)
    expect(text).toContain("Every finding ends with the rule it comes from, in the same line: `Rule: <the rule>.`")
    expect(text).toContain("What you cannot give a rule for is not a finding.")
  })

  it("shows one example finding, a line tagged high that holds its rule", () => {
    const examples = sectionLines(template, title).filter((line) => line.startsWith("- ["))
    expect(examples).toHaveLength(1)
    expect(examples[0]?.startsWith("- [high] ")).toBe(true)
    expect(examples[0]).toContain("Rule: ")
  })
})
