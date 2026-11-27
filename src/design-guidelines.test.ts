import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { repositoryRoot } from "./command-line.ts"

const writingPointer =
  "- Follow `DESIGN.md` for everything a page shows: use its design tokens and its parts, and add a token or a part there before a page uses one it does not name."
const reviewingPointer =
  "- Flag a page that does not follow `DESIGN.md`: a colour, a size or a spacing that is no design token, a part it does not name, or a rule it breaks. These are [medium] findings."

/** The text of a file of the repository with one kind of line break. */
function repositoryFile(file: string): string {
  return readFileSync(path.join(repositoryRoot, file), "utf8").replace(/\r\n/g, "\n")
}

/** Every design token `pageStyle` declares, with the value of its declaration. */
function declaredTokens(): [string, string][] {
  return [...repositoryFile("bin/page-style.mjs").matchAll(/^(--[a-z0-9-]+): ([^;]+);$/gm)].map((match): [string, string] => [match[1] ?? "", match[2] ?? ""])
}

describe("the design guidelines of the repository", () => {
  it("are what the design reviewer reviews a page against, which no longer names Tailwind", () => {
    const reviewer = repositoryFile(".claude/agents/ui-design-reviewer.md")

    expect(reviewer).toContain("`DESIGN.md`")
    expect(reviewer).toContain("`bin/page-style.mjs`")
    expect(reviewer).not.toContain("Tailwind")
  })

  it("are pointed to by both sections of CLAUDE.md", () => {
    const lines = repositoryFile("CLAUDE.md").split("\n")

    expect(lines.filter((line) => line === writingPointer)).toHaveLength(1)
    expect(lines.filter((line) => line === reviewingPointer)).toHaveLength(1)
  })

  it("name every token of bin/page-style.mjs with the value it declares", () => {
    const design = repositoryFile("DESIGN.md").split("\n")
    const tokens = declaredTokens()

    expect(tokens).toHaveLength(25)
    for (const [name, value] of tokens) {
      expect(design.filter((line) => line.includes(`\`${name}\``) && line.includes(`\`${value}\``))).toHaveLength(1)
    }
  })
})
