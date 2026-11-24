import { describe, expect, it } from "vitest"
import { readFile, root } from "../006-process-state-machine/store.ts"

const paragraph =
  "`process-factory export <process-id> --format html|markdown --link <address>` writes the newest published version of a process as one file for the places employees already read: with `html` the file `exports/<process-id>-v<n>.html` in the project's folder, which shows the document as the reading view shows it, and with `markdown` the file `exports/<process-id>-v<n>.md`, which holds the published `process.md`. `<address>` is the address at which employees reach the reading view. The file starts and ends with a stamp: the title, `Version <n>`, the owner, who approved the version and on which date, and the sentence that the file is a copy and that the current version is at `<address>/<process-id>/<n>`. The reading view stays the source of truth: the export leaves out the feedback form and the version history, changes nothing in the store, and a later export of the same version replaces the file."

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const status = readFile(root, "README.md").replace(/\r\n/g, "\n").split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("has the paragraph about process-factory export between the paragraph about the stages and the paragraph about respec, and still ends with the dashboard", () => {
    const paragraphs = statusParagraphs()
    const at = paragraphs.indexOf(paragraph)

    expect(at).toBeGreaterThan(-1)
    expect(paragraphs[at - 1]?.startsWith("Every process is in one of the stages")).toBe(true)
    expect(paragraphs[at + 1]?.startsWith("A process whose reviews show gaps in its specification")).toBe(true)
    expect(paragraphs.at(-1)?.startsWith("`process-factory dashboard` starts a dashboard of the process store")).toBe(true)
  })
})
