import { describe, expect, it } from "vitest"
import { headings, installedFolder, readFile, root, section, sectionLines, skillTemplate, tableRows } from "../010-clarifying-questions/clarify.ts"
import { firstTenSections } from "./dependencies.ts"

const specWriter = "templates/skills/process/spec-writer.md"
const caseWriter = "templates/skills/process/case-writer.md"

describe("the form of templates/skills/process/spec-writer.md", () => {
  it("has eight level 2 headings, with The eleven sections third and The dependencies after The specification", () => {
    expect(headings(specWriter, 2)).toEqual([
      "Rules",
      "What you read",
      "The eleven sections",
      "Decided or open",
      "The specification",
      "The dependencies",
      "The questions file",
      "Your reply",
    ])
  })

  it("says in its first paragraph that the specification has eleven sections", () => {
    const text = readFile(root, specWriter)
    const intro = text.slice(0, Math.max(0, text.indexOf("\n## Rules")))
    expect(intro).toContain("eleven sections, each decided or open")
    expect(intro).not.toContain("ten sections, each decided or open")
  })
})

describe("the section The eleven sections of the spec writer file", () => {
  it("has a table with the ten sections of before followed by Dependencies", () => {
    const firstCells = tableRows(specWriter, "The eleven sections").map((row) => row.split("|")[1]?.trim())
    expect(firstCells).toEqual([...firstTenSections, "Dependencies"])
  })

  it("says in the row of Dependencies what the process rests on", () => {
    const row = tableRows(specWriter, "The eleven sections").find((line) => line.split("|")[1]?.trim() === "Dependencies")
    expect(row ?? "").toContain("laws and rules, roles, systems, agreements, policies and other processes")
  })
})

describe("the sections Decided or open and The specification of the spec writer file", () => {
  it("decides Dependencies only when every role, system, agreement and policy has a section in organisation/", () => {
    const text = section(specWriter, "Decided or open")
    expect(text).toContain("- `Dependencies` is decided only when every role, system, agreement and policy it names has a section in `organisation/`.")
    expect(text).toContain("One that has no section is a `Missing:` line, never a dependency line.")
  })

  it("fixes the eleven headings of spec.md", () => {
    const text = section(specWriter, "The specification")
    expect(text).toContain("The level 2 headings are always the eleven of the table")
    expect(text).toContain("there is no other level 2 heading")
  })
})

describe("the section The dependencies of the spec writer file", () => {
  it("gives the form of the section with one line for each of the six kinds", () => {
    const lines = sectionLines(specWriter, "The dependencies")
    for (const line of [
      "## Dependencies",
      "Status: decided",
      "- Law: <a law or a rule from outside the organisation>",
      "- Role: <the heading of the role in `organisation/roles.md`>",
      "- System: <the heading of the system in `organisation/systems.md`>",
      "- Agreement: <the heading of the agreement in `organisation/processors.md`>",
      "- Policy: <the heading of the policy in `organisation/policies.md`>",
      "- Process: <another process this one hands over to or relies on, as the files name it>",
    ]) {
      expect(lines).toContain(line)
    }
  })

  it("says the name is the heading letter for letter, that check finds the section by it, and what is never on a line", () => {
    const text = section(specWriter, "The dependencies")
    expect(text).toContain("letter for letter")
    expect(text).toContain("`process-factory check` finds the section by it")
    expect(text).toContain("The person who holds a role is not on the line.")
    expect(text).toContain("A heading that starts with `Example:` is never a dependency.")
  })
})

describe("the skill and the case writer", () => {
  it("says in Write the spec of the skill that the specification has eleven sections", () => {
    expect(section(skillTemplate, "Write the spec")).toContain("in eleven sections that are each decided or open")
  })

  it("names the eleven sections in Before you write of the case writer", () => {
    const text = section(caseWriter, "Before you write")
    expect(text).toContain("The eleven sections of a specification are")
    expect(text).toContain("`Records` and `Dependencies`")
    expect(text).toContain("one of the eleven")
  })
})

describe("the copies in .claude/skills/process", () => {
  it.each([
    ["SKILL.md", "in eleven sections that are each decided or open"],
    ["spec-writer.md", "## The dependencies"],
    ["case-writer.md", "The eleven sections of a specification are"],
  ])("has %s with the new text, byte-identical to its template", (file, text) => {
    const copy = readFile(root, `${installedFolder}/${file}`)
    expect(copy).toContain(text)
    expect(copy).toBe(readFile(root, `templates/skills/process/${file}`))
  })
})
