import { describe, expect, it } from "vitest"
import { readFile, root } from "../010-clarifying-questions/clarify.ts"

const incident = "as a case every later version of the process must pass."
const form =
  "`/process respec <process-id>` sends a process in `rework` or `approval` back to `spec` with the findings of its newest recorded round, so that a new specification can state what the reviewers found missing, and the process then goes through `cases`, `draft` and `review` again."
const paragraph =
  "A process whose reviews show gaps in its specification can go back to `spec`. `process-factory respec <process-id>` takes a process in `rework` or `approval`, copies every finding of its newest recorded round, with the verdict of every reviewer, into the file `findings-round-<r>.md` in the folder `feedback` of the process, records the respec on the board and moves the process to `spec`. It refuses a process in another stage, a process without a recorded round and a round without a finding. The spec writer reads that file when it writes `spec.md` anew: a finding that asks for a rule, a deadline, an owner or a legal ground that the request, the answers and the organisation context do not state becomes a question to the user, and a finding about wording alone is left for the next draft. After the user accepted the new specification, the case writer keeps every case that is there and adds cases for what is new, and the next draft is written from the new specification. The limit of five rounds then counts only the rounds recorded after the respec, and a case has regressed only when it passed in a round recorded after the respec. Every draft, every round and every folder under `versions` stays as it was."

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const text = readFile(root, "README.md").replace(/\r\n/g, "\n")
  const status = text.slice(text.indexOf("\n## Status\n") + "\n## Status\n".length)
  return status
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the Status section of README.md", () => {
  it("says at the end of its first paragraph what /process respec <process-id> does, after the sentence about /process incident", () => {
    expect(statusParagraphs()[0]?.endsWith(`${incident} ${form}`)).toBe(true)
  })

  it("has the paragraph about process-factory respec directly before the paragraph about the organisation", () => {
    const paragraphs = statusParagraphs()
    const at = paragraphs.indexOf(paragraph)
    expect(at).toBeGreaterThan(-1)
    expect(paragraphs[at + 1]?.startsWith("The factory reads what it knows about the organisation")).toBe(true)
    expect(paragraphs[at - 1]?.startsWith("Every process is in one of the stages")).toBe(true)
  })
})
