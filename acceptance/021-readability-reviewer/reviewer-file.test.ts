import { describe, expect, it } from "vitest"
import { headings, readFile, root, section, sectionLines } from "../010-clarifying-questions/clarify.ts"
import { template } from "./readability.ts"

/** The text between the first line of the file and its first level 2 heading. */
function intro(): string {
  const lines = readFile(root, template).split(/\r?\n/)
  const end = lines.findIndex((line) => line.startsWith("## "))
  return lines.slice(1, end === -1 ? undefined : end).join("\n")
}

/** The indented bullets of the section What you check that start with a backtick, without their indent and dash. */
function taggedBullets(): string[] {
  return sectionLines(template, "What you check")
    .filter((line) => /^\s+- `/.test(line))
    .map((line) => line.replace(/^\s+- /, ""))
}

describe("the file templates/skills/process/readability-reviewer.md", () => {
  it("starts with # Readability reviewer, has no frontmatter and no other level 1 heading, and ends with one newline", () => {
    const text = readFile(root, template)
    expect(text.split(/\r?\n/)[0]).toBe("# Readability reviewer")
    expect(headings(template, 1)).toEqual(["Readability reviewer"])
    expect(text.endsWith("\n")).toBe(true)
    expect(/\r?\n\r?\n$/.test(text)).toBe(false)
  })

  it("has the three level 2 headings of the spec, in order, and no others", () => {
    expect(headings(template, 2)).toEqual(["The reader", "What you check", "What you do not check"])
  })

  it("names the reviewer readability and reviewer.md in its first paragraph and says what it checks", () => {
    expect(intro()).toContain("`readability`")
    expect(intro()).toContain("`reviewer.md`")
    expect(intro()).toContain("whether the employee who meets the draft for the first time, in a real incident, can follow it")
  })

  it("restates nothing of the shared rules: it has none of the strings Verdict, REVIEWED and rounds/", () => {
    const text = readFile(root, template)
    expect(text).not.toBe("")
    expect(text).not.toContain("Verdict")
    expect(text).not.toContain("REVIEWED")
    expect(text).not.toContain("rounds/")
  })
})

describe("the section The reader of the readability reviewer file", () => {
  it("gives the reader only the draft, has the reviewer read the draft first and once, and keeps the headings fixed", () => {
    const text = section(template, "The reader")
    expect(text).toContain("They have only the draft")
    expect(text).toContain("Read the draft before any other file, once, from the top to the bottom")
    expect(text).toContain("Judge a sentence by what the reader can do with it")
    expect(text).toContain("Never ask for a heading to be added, removed, renamed or moved.")
  })
})

describe("the section What you check of the readability reviewer file", () => {
  it("has exactly the five numbered checks of the request, in order", () => {
    expect(section(template, "What you check")).toContain("Check these five things, and nothing else.")
    const numbered = sectionLines(template, "What you check").filter((line) => /^\d+\. /.test(line))
    expect(numbered).toEqual([
      "1. The first thing to do comes first.",
      "2. One step is one action.",
      "3. No term is left undefined.",
      "4. No sentence needs rereading.",
      "5. Every decision point has a clear answer.",
    ])
  })

  it("gives every kind of finding one of the tags high, medium and low, and uses each tag", () => {
    const bullets = taggedBullets()
    expect(bullets.length).toBeGreaterThan(0)
    for (const bullet of bullets) {
      expect(bullet).toMatch(/^`(high|medium|low)`: /)
    }
    for (const tag of ["high", "medium", "low"]) {
      expect(bullets.some((bullet) => bullet.startsWith(`\`${tag}\`: `))).toBe(true)
    }
  })

  it.each([
    "`medium`: a step of `Steps` asks for two or more actions.",
    "`high`: a sentence can be read in two ways that make the reader do different things.",
    "`high`: the draft makes the reader decide",
    "`medium`: a deadline does not say how long and counted from what",
    "`medium`: a role is written without the name of its holder",
  ])("has the kind of finding that starts with %s", (start) => {
    expect(taggedBullets().some((bullet) => bullet.startsWith(start))).toBe(true)
  })

  it("forbids the reviewer to give a meaning or a name itself", () => {
    expect(section(template, "What you check")).toContain("Never give a meaning or a name yourself.")
  })
})

describe("the section What you do not check of the readability reviewer file", () => {
  it("says a draft that is easy to follow and wrong has no finding", () => {
    expect(section(template, "What you do not check")).toContain("A draft that is easy to follow and wrong has no finding from you.")
  })
})
