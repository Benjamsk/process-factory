import { describe, expect, it } from "vitest"
import { headings, section, sectionLines } from "../010-clarifying-questions/clarify.ts"
import { draftWriterTemplate } from "../017-review-rounds/rounds.ts"

const conflictsFile = "`processes/<process-id>/rounds/round-<r>/conflicts.md`"

describe("the order of the reviewers in the section A rework of the draft writer", () => {
  it("gives the fixed order legal, gdpr, simulation, readability, with every other reviewer last and of the same rank", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("The reviewers have a fixed order: `legal`, `gdpr`, `simulation`, `readability`.")
    expect(text).toContain("The name of a reviewer is the name of its findings file without `.md`.")
    expect(text).toContain("A reviewer that is not on the list ranks last, after `readability`")
    expect(text).toContain("two reviewers that are both not on the list rank the same")
  })

  it("follows the finding of the higher reviewer whatever the tags, and lets the tag decide only within one reviewer or one rank", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("follow the finding of the reviewer that is higher in the order, whatever the tags of the two findings are")
    expect(text).toContain(
      "Between two findings of one reviewer, or of two reviewers that rank the same, follow the one with the higher tag, `high` before `medium` before `low`, and neither when their tags are the same.",
    )
    expect(text).not.toContain("- When two findings cannot both be met, follow the one with the higher tag")
  })
})

describe("conflicts.md in the section A rework of the draft writer", () => {
  it("writes one entry per finding dropped for a higher reviewer, only when there is one, and none for another reason", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain(`For every finding you did not follow because the finding of a higher reviewer won, write one entry in the file ${conflictsFile}`)
    expect(text).toContain("Write the file only when it has at least one entry, and replace one that is already there.")
    expect(text).toContain("A finding you did not follow for another reason gets no entry.")
  })

  it("gives the form of conflicts.md: the title, the heading of an entry and the lines Dropped, Followed and Reason, in order", () => {
    const lines = sectionLines(draftWriterTemplate, "A rework")
    const starts = ["# Conflicts of round <r>", "## Conflict <i>", "- Dropped: <name>.md: ", "- Followed: <name>.md: ", "- Reason: "]
    const positions = starts.map((start) => lines.findIndex((line) => line.startsWith(start)))
    expect(positions.every((position) => position !== -1)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(lines).toContain("# Conflicts of round <r>")
    expect(lines).toContain("## Conflict <i>")
    expect(section(draftWriterTemplate, "A rework")).toContain("`<i>` counts the entries from 1.")
  })

  it("reads the conflicts.md of every earlier round, not the one of its own round, and never undoes the change of a higher reviewer", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("except a file `conflicts.md`, which you do not read")
    expect(text).toContain("Read no other draft and no other round.")
    expect(text).toContain("The one exception is the file `conflicts.md` of every earlier round, a folder `round-<k>` with `<k>` lower than `<r>`: read it when it is there.")
    expect(text).toContain("the finding on the `Followed` line of that entry counts as a finding of this round")
    expect(text).toContain("Never undo a change a higher reviewer required because a lower reviewer asks for it again.")
    expect(text).toContain("When the finding that won comes from an earlier `conflicts.md`, copy its `Followed` line from there.")
  })
})

describe("the sections Rules and Your reply of the draft writer", () => {
  it("allows conflicts.md in a rework next to the one new draft, names the reply line CONFLICTS and keeps the nine headings", () => {
    const rules = section(draftWriterTemplate, "Rules")
    expect(rules).toContain("Write only one new file `processes/<process-id>/drafts/draft-<n>.md`.")
    expect(rules).toContain("In a rework you also write the file `conflicts.md` that `A rework` names, when it asks for it.")
    expect(rules).toContain("change or delete no file, also no draft that is already there")
    expect(section(draftWriterTemplate, "Your reply")).toContain(
      "When you wrote `conflicts.md`, the line `CONFLICTS processes/<process-id>/rounds/round-<r>/conflicts.md` comes last.",
    )
    expect(headings(draftWriterTemplate, 2)).toEqual(["Rules", "What you read", "Before you write", "The reader", "People", "The cases", "A draft", "A rework", "Your reply"])
  })
})
