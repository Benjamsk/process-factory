import { describe, expect, it } from "vitest"
import { readFile, root } from "../006-process-state-machine/store.ts"

const paragraph =
  "`process-factory dashboard` starts a dashboard of the process store on the machine it runs on, at the address `127.0.0.1:4174`, or at another port with `--port <number>`, and runs until it is stopped. Its one page has a column for each of the ten stages and shows every process on the board as a card in the stage it is in, with its title, its id, its owner, the number of its newest recorded round, the questions of its newest `questions-<n>.md` that have no answers yet and the cases that failed in that round. The page reloads itself every five seconds, so a process is seen moving from stage to stage. The title on a card opens that process in a panel at the right side of the page, over the board, which shows its stage history as a timeline, its specification, its cases, its newest draft, every recorded review round with the verdict and the findings of each reviewer, its versions and its open feedback, each in full. While a panel is open the page does not reload, until the panel is closed. The dashboard never writes a file."

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const text = readFile(root, "README.md").replace(/\r\n/g, "\n")
  const status = text.split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("ends with the paragraph about process-factory dashboard, directly after the paragraph about the organisation", () => {
    const paragraphs = statusParagraphs()

    expect(paragraphs.at(-1)).toBe(paragraph)
    expect(paragraphs.at(-2)?.startsWith("The factory reads what it knows about the organisation")).toBe(true)
  })
})
