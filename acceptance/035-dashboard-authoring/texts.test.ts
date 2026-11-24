import { describe, expect, it } from "vitest"
import { readFile, root } from "../006-process-state-machine/store.ts"
import { editSentences } from "./authoring.ts"

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const status = readFile(root, "README.md").replace(/\r\n/g, "\n").split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("ends its last paragraph, the one about the dashboard, with the sentences about editing a specification and a case", () => {
    const last = statusParagraphs().at(-1) ?? ""

    expect(last.startsWith("`process-factory dashboard` starts a dashboard of the process store")).toBe(true)
    expect(last.endsWith(`until \`/process next <process-id>\` runs it in Claude Code. ${editSentences}`)).toBe(true)
  })
})
