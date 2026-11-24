import { describe, expect, it } from "vitest"
import { readFile, root } from "../006-process-state-machine/store.ts"

const paragraph =
  "`process-factory dashboard` starts a dashboard of the process store on the machine it runs on, at the address `127.0.0.1:4174`, or at another port with `--port <number>`, and runs until it is stopped. Its one page has a column for each of the ten stages and shows every process on the board as a card in the stage it is in, with its title, its id, its owner, the number of its newest recorded round, the questions of its newest `questions-<n>.md` that have no answers yet and the cases that failed in that round. The page reloads itself every five seconds, so a process is seen moving from stage to stage. The title on a card opens that process in a panel at the right side of the page, over the board, which shows its stage history as a timeline, its specification, its cases, its newest draft, every recorded review round with the verdict and the findings of each reviewer, its versions and its open feedback, each in full. While a panel is open the page does not reload, until the panel is closed. The panel of a process that waits for a person starts with a part `Decision`: for a process in `clarify` one field per open question, of which a field left empty is stored as `Not known.`, for a process in `spec` whose sections are all decided a button that accepts the specification, for a process in `approval` a field for the full name of the owner with a button that approves the newest draft and publishes it as a version, and a field for a note with a button that sends the draft back for one more round, and for a process in `published` a button that starts a regeneration. The dashboard writes no file itself: for each decision it runs the command line, `answer`, `accept-spec`, `approve` and then `move <process-id> published`, `send-back` or `move <process-id> regenerate`, and when the command line refuses it shows what the command line printed. `process-factory send-back <process-id> <file>` takes a process in `approval` and a file with a note, stores every line of the note as a finding of the owner in `owner.md` in the folder of the newest recorded round and moves the process to `rework`, where the draft writer follows the findings of the owner before those of any reviewer. `answer` and `send-back` read standard input when the file is `-`. The dashboard starts no agent: after a decision the process waits in its new stage until `/process next <process-id>` runs it in Claude Code."

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
