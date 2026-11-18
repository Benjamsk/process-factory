import { describe, expect, it } from "vitest"
import { entries, organisationFiles, readFile, root, templateFolder } from "./organisation.ts"

const marker = "This section is an example, not a fact about the organisation. Replace it with a real section or delete it."
const titles = [
  ["roles.md", "# Roles"],
  ["systems.md", "# Systems"],
  ["processors.md", "# Data processor agreements"],
  ["policies.md", "# Policies"],
  ["authority.md", "# Authority"],
]

function templateLines(file: string): string[] {
  return readFile(root, `${templateFolder}/${file}`).split(/\r?\n/)
}

describe("the folder templates/organisation", () => {
  it("holds exactly the five files of the organisation context", () => {
    expect(entries(root, templateFolder)).toEqual([...organisationFiles].sort())
  })
})

describe.each(titles)("templates/organisation/%s", (file, title) => {
  it(`starts with the line ${title} and has no other level 1 heading`, () => {
    const lines = templateLines(file)
    expect(lines[0]).toBe(title)
    expect(lines.filter((line) => line.startsWith("# "))).toEqual([title])
  })

  it("has exactly one level 2 heading, which starts with ## Example: ", () => {
    const headings = templateLines(file).filter((line) => /^#{2,6} /.test(line))
    expect(headings).toHaveLength(1)
    expect(headings[0]).toMatch(/^## Example: \S/)
  })

  it("has the marker line as the first line of text under the example heading, and an example after it", () => {
    const lines = templateLines(file)
    const text = lines.slice(lines.findIndex((line) => line.startsWith("## Example: ")) + 1).filter((line) => line.trim() !== "")
    expect(text[0]).toBe(marker)
    expect(text.length).toBeGreaterThan(1)
  })

  it("says what belongs in the file, in prose between the two headings", () => {
    const lines = templateLines(file)
    const example = lines.findIndex((line) => line.startsWith("## Example: "))
    expect(example).toBeGreaterThan(0)
    const text = lines.slice(1, example).filter((line) => line.trim() !== "")
    expect(text).toHaveLength(1)
    expect(text[0]).toContain("Write one section per")
    expect(text[0]).toContain("Say in prose")
  })

  it("holds no table row, no link and no fenced code block, and ends with one newline", () => {
    const content = readFile(root, `${templateFolder}/${file}`)
    expect(content).not.toBe("")
    expect(templateLines(file).filter((line) => line.startsWith("|"))).toEqual([])
    expect(content).not.toContain("](")
    expect(content).not.toContain("http://")
    expect(content).not.toContain("https://")
    expect(content).not.toContain("```")
    expect(content).toMatch(/[^\n]\n$/)
  })
})
