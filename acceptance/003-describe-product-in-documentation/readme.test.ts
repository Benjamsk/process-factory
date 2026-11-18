import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = path.resolve(__dirname, "../..")
const readmePath = path.join(root, "README.md")

function readReadme(): string {
  return existsSync(readmePath) ? readFileSync(readmePath, "utf8") : ""
}

function lines(): string[] {
  return readReadme().split(/\r?\n/)
}

function headings(level: number): string[] {
  const prefix = "#".repeat(level) + " "
  return lines()
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim())
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function section(title: string): string {
  const all = lines()
  const start = all.indexOf("## " + title)
  if (start === -1) return ""
  const rest = all.slice(start + 1)
  const end = rest.findIndex((line) => /^#{1,6} /.test(line))
  return collapse((end === -1 ? rest : rest.slice(0, end)).join("\n"))
}

describe("README.md in the repository root", () => {
  it("exists and is not empty", () => {
    expect(existsSync(readmePath)).toBe(true)
    expect(readReadme().trim()).not.toBe("")
  })

  it("starts with the line # Process Factory", () => {
    expect(lines()[0]).toBe("# Process Factory")
  })

  it("has exactly one level 1 heading", () => {
    expect(headings(1)).toEqual(["Process Factory"])
  })

  it("has the level 2 headings Product, How it relates to the software factory and Status, in that order", () => {
    expect(headings(2)).toEqual(["Product", "How it relates to the software factory", "Status"])
  })
})

describe("the Product section", () => {
  it("says the product is a modern process factory", () => {
    expect(section("Product")).toContain("modern process factory")
  })

  it("says it produces a process instead of an application", () => {
    expect(section("Product")).toContain("instead of producing an application")
  })

  it("says the process is one in which humans and AIs work together", () => {
    expect(section("Product")).toContain("a complete process in which humans and AIs work together")
  })
})

describe("the relation to the software factory", () => {
  it("names the Kaizen factory", () => {
    expect(collapse(readReadme())).toContain("Kaizen factory")
  })

  it("mentions the software factory in the section How it relates to the software factory", () => {
    expect(section("How it relates to the software factory")).toContain("software factory")
  })
})

describe("plain text only", () => {
  it("contains no link, no HTML tag and no fenced code block", () => {
    const readme = readReadme()
    expect(readme.trim()).not.toBe("")
    expect(readme).not.toContain("](")
    expect(readme).not.toContain("http://")
    expect(readme).not.toContain("https://")
    // Text in an inline code span, such as `/process <prompt>`, is shown literally and is not an HTML tag.
    const withoutInlineCode = readme.replace(/`[^`\r\n]*`/g, "")
    expect(withoutInlineCode).not.toMatch(/<\/?[a-zA-Z][^>]*>/)
    expect(readme).not.toContain("```")
    expect(readme).not.toContain("~~~")
  })
})
