import { describe, expect, it } from "vitest"
import { headings, installedFolder, readFile, root, section, sectionLines, skillTemplate } from "../010-clarifying-questions/clarify.ts"
import { draftWriterTemplate } from "../017-review-rounds/rounds.ts"

const reworkException =
  "In the step `Rework the draft` the draft writer you start writes one new file `draft-<n>.md` in the folder `drafts` of the process, as `draft-writer.md` says."
const conflictsException = "There it also writes at most one file `conflicts.md` in the folder `rounds/round-<r>` of the process, as `draft-writer.md` says."

describe("the section The command line of the skill", () => {
  it("keeps nine exceptions and names conflicts.md directly after the sentence about the rework", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("There are nine exceptions, and you write no other file.")
    expect(text).toContain(`${reworkException} ${conflictsException} In the interview of \`/process incident <process-id>\``)
    expect(headings(skillTemplate, 2)).toHaveLength(22)
  })
})

describe("the section Review the draft of the skill", () => {
  it("tells a stopped round from a round every reviewer passed, and says what a stop means for the user", () => {
    const step = sectionLines(skillTemplate, "Review the draft").find((line) => line.startsWith("7. ")) ?? ""
    expect(step).toContain("When it printed the stage `approval` and no line that starts with `Stopped: `, tell the user that every reviewer passed the draft")
    expect(step).toContain("When it printed a line that starts with `Stopped: `")
    expect(step).toContain("the limit of five rounds")
    expect(step).toContain("the person who approves decides about the open findings")
    expect(step).toContain("the files `conflicts.md` of the rounds")
    expect(step).toContain("sends the draft back to the draft writer with every finding")
    expect(step.endsWith("and that `/process next <process-id>` asks the owner of the process to approve the draft.")).toBe(true)
  })

  it("names the stop without asking the user to accept anything and without a move", () => {
    const text = section(skillTemplate, "Review the draft")
    expect(text).toContain("`Stopped: `")
    expect(text).not.toContain("Ask the user")
    expect(text).not.toContain("accept")
    expect(text).not.toContain("move <process-id>")
  })
})

describe("the section Rework the draft of the skill", () => {
  it("tells the user what the file on a line that starts with CONFLICTS records", () => {
    const lines = sectionLines(skillTemplate, "Rework the draft")
    const step = lines.find((line) => line.startsWith("4. ")) ?? ""
    expect(step).toContain("lines that start with `- NOT FOLLOWED`")
    expect(step).toContain(
      "When the reply has a line that starts with `CONFLICTS `, tell the user that the file it names records the findings that were dropped because a higher reviewer required the opposite.",
    )
    expect(lines.filter((line) => line.includes("move <process-id> review"))).toHaveLength(1)
  })
})

describe("the copies under .claude/skills/process", () => {
  it("has SKILL.md with the sentence about conflicts.md, byte-identical to its template", () => {
    const copy = readFile(root, `${installedFolder}/SKILL.md`)
    expect(copy).toContain(conflictsException)
    expect(copy).toBe(readFile(root, skillTemplate))
  })

  it("has draft-writer.md with the order of the reviewers, byte-identical to its template", () => {
    const copy = readFile(root, `${installedFolder}/draft-writer.md`)
    expect(copy).toContain("The reviewers have a fixed order: `legal`, `gdpr`, `simulation`, `readability`.")
    expect(copy).toBe(readFile(root, draftWriterTemplate))
  })
})
