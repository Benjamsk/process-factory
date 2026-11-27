import { describe, expect, it } from "vitest"
import { repositoryText } from "./read.ts"

const sentence =
  "`/process org read <path>`, or `/process org read` followed by pasted text, reads a document the user already has instead: it shows per area the sections it would add or change, with the sentence of the document each fact comes from, and writes the files only after the user confirms."

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const status = repositoryText("README.md").split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("ends its paragraph about the folder organisation/, still the third from the end, with the sentence about /process org read", () => {
    const paragraph = statusParagraphs().at(-3) ?? ""

    expect(paragraph.startsWith("The factory reads what it knows about the organisation from the folder `organisation/`.")).toBe(true)
    expect(paragraph.endsWith(`which processes on the board it blocks. ${sentence}`)).toBe(true)
  })
})
