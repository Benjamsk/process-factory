import { describe, expect, it } from "vitest"
import { readFile, root } from "../006-process-state-machine/store.ts"

const template = "templates/skills/process/draft-writer.md"
const ownerBullet =
  "- A file `owner.md` in the folder of the round holds the findings of the owner of the process, who sent the draft back from `approval` with a note. They are findings like those of a reviewer, and `owner` is the one name that is not on the list and does not rank last: the owner ranks first, before `legal`. When a finding of the owner and a finding of a reviewer cannot both be met, follow the finding of the owner. A finding of the owner that asks for a person, a role, a step, a deadline, a duty or a rule that is not in `spec.md` is not followed, like every other such finding."
const kept =
  "`process-factory dashboard` starts a dashboard of the process store on the machine it runs on, at the address `127.0.0.1:4174`, or at another port with `--port <number>`, and runs until it is stopped. Its one page has a column for each of the ten stages and shows every process on the board as a card in the stage it is in, with its title, its id, its owner, the number of its newest recorded round, the questions of its newest `questions-<n>.md` that have no answers yet and the cases that failed in that round. The page reloads itself every five seconds, so a process is seen moving from stage to stage. The title on a card opens that process in a panel at the right side of the page, over the board, which shows its stage history as a timeline, its specification, its cases, its newest draft, every recorded review round with the verdict and the findings of each reviewer, its versions and its open feedback, each in full. While a panel is open the page does not reload, until the panel is closed."
const added =
  "The panel of a process that waits for a person starts with a part `Decision`: for a process in `clarify` one field per open question, of which a field left empty is stored as `Not known.`, for a process in `spec` whose sections are all decided a button that accepts the specification, for a process in `approval` a field for the full name of the owner with a button that approves the newest draft and publishes it as a version, and a field for a note with a button that sends the draft back for one more round, and for a process in `published` a button that starts a regeneration. The dashboard writes no file itself: for each decision it runs the command line, `answer`, `accept-spec`, `approve` and then `move <process-id> published`, `send-back` or `move <process-id> regenerate`, and when the command line refuses it shows what the command line printed. `process-factory send-back <process-id> <file>` takes a process in `approval` and a file with a note, stores every line of the note as a finding of the owner in `owner.md` in the folder of the newest recorded round and moves the process to `rework`, where the draft writer follows the findings of the owner before those of any reviewer. `answer` and `send-back` read standard input when the file is `-`. The dashboard starts no agent: after a decision the process waits in its new stage until `/process next <process-id>` runs it in Claude Code. The panel of a process in `spec`, `cases`, `draft`, `review`, `rework` or `approval` that is not being regenerated has a link `Edit spec.md` above its specification and a link `Edit case-<n>.md` above each of its cases. The link opens a page with the whole text of the file in one field, and the next page shows every line of the edited text, a removed line marked with `-` and an added line with `+`, and asks for the full name of the person who saves. The dashboard saves through `process-factory edit <process-id> <name> <file> --by \"<person>\"`, where `<name>` is `spec.md` or the `case-<n>.md` of a case that is there and `<file>` holds the new text, or is `-` for standard input. `edit` refuses a name that is not in `organisation/roles.md`, for a process that has an owner every name but the owner's, a text that changes nothing, and for a specification that is accepted a text that leaves a section that is not decided. It replaces the file, records the file, the name and the time in the history of the process on the board, which the timeline of the panel and `show` display, and marks a process that has a draft as needing a new draft, which the card, the panel and `show` say until a draft moves to `review`. A process in `review`, `rework` or `approval` moves back to `draft` with the save, so that `/process next <process-id>` writes a new draft from the edited files."

/** The lines of a file of the repository, with one kind of line break. */
function lines(file: string): string[] {
  return readFile(root, file).replace(/\r\n/g, "\n").split("\n")
}

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const status = lines("README.md").join("\n").split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("draft-writer.md", () => {
  it("ranks the findings of the owner before those of every reviewer, in a bullet of A rework directly after the bullet with the fixed order, and its installed copy says the same", () => {
    const text = lines(template)
    const rework = text.indexOf("## A rework")
    const order = text.findIndex((line) => line.startsWith("- The reviewers have a fixed order:"))

    expect(rework).toBeGreaterThan(-1)
    expect(order).toBeGreaterThan(rework)
    expect(order).toBeLessThan(text.indexOf("## A regeneration"))
    expect(text[order + 1]).toBe(ownerBullet)
    expect(lines(".claude/skills/process/draft-writer.md")).toEqual(text)
  })
})

describe("the Status section of README.md", () => {
  it("ends with the paragraph about the dashboard and its decisions, directly after the paragraph about the organisation, and no longer says that the dashboard never writes a file", () => {
    const paragraphs = statusParagraphs()

    expect(paragraphs.at(-1)).toBe(`${kept} ${added}`)
    expect(paragraphs.at(-2)?.startsWith("The factory reads what it knows about the organisation")).toBe(true)
    expect(lines("README.md").join("\n")).not.toContain("The dashboard never writes a file.")
  })
})
