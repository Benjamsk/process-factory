import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { headings, readFile, root, section, sectionLines } from "../010-clarifying-questions/clarify.ts"
import { draftWriterTemplate } from "../017-review-rounds/rounds.ts"

/** The text of the section `A regeneration`, as the spec gives it. */
const aRegeneration = readFileSync(path.join(import.meta.dirname, "a-regeneration.md"), "utf8").replace(/\r\n/g, "\n").trim()
const inIntro =
  "For a process in the stage `regenerate`, and in a rework of a process that is being regenerated, your task also names the regeneration of a version, and the section `A regeneration` applies. You cannot talk to the user."
const writes =
  "In a rework you also write the file `conflicts.md` that `A rework` names, when it asks for it. In a regeneration you also write the file `changes-<n>.md` that `A regeneration` names. Create no other file"
const reads = "Never read a file in `versions/` or `feedback/` of the process. The one exception is a regeneration, with the files `A regeneration` names. Never read a file in `rounds/`"
const changeListLine = "- In a regeneration the line `CHANGE LIST processes/<process-id>/drafts/changes-<n>.md` comes directly under the line `DRAFT WRITTEN`."
const noChanges = "- When no reason of a regeneration led to a change, reply with the line `NO CHANGES`, and under it one line that starts with `- ` for every reason, with its name and why it changed nothing."

describe("the draft writer and the stage regenerate", () => {
  it("has ten level 2 headings, with A regeneration between A rework and Your reply", () => {
    expect(headings(draftWriterTemplate, 2)).toEqual(["Rules", "What you read", "Before you write", "The reader", "People", "The cases", "A draft", "A rework", "A regeneration", "Your reply"])
  })

  it("says at the end of its first paragraph when the section A regeneration applies", () => {
    const first = readFile(root, draftWriterTemplate).split(/\r?\n/)[2] ?? ""
    expect(first.endsWith(inIntro)).toBe(true)
  })

  it("lets a regeneration write the change list and read the files A regeneration names, in the first and the third bullet of Rules", () => {
    const bullets = sectionLines(draftWriterTemplate, "Rules").filter((line) => line.startsWith("- "))
    expect(bullets[0]).toContain(writes)
    expect(bullets[2]).toContain(reads)
  })

  it("says at the end of What you read that a regeneration also reads what A regeneration names", () => {
    const last = sectionLines(draftWriterTemplate, "What you read")
      .filter((line) => line !== "")
      .at(-1)
    expect(last?.endsWith("In a rework you also read what `A rework` names. In a regeneration you also read what `A regeneration` names.")).toBe(true)
  })
})

describe("the section A regeneration of the draft writer", () => {
  it("is the text of the spec, with the form of a change list", () => {
    expect(section(draftWriterTemplate, "A regeneration").trim()).toBe(aRegeneration)
  })
})

describe("the section Your reply of the draft writer", () => {
  it("ends with the reply line CHANGE LIST of a regeneration and the reply NO CHANGES", () => {
    const bullets = sectionLines(draftWriterTemplate, "Your reply").filter((line) => line.startsWith("- "))
    expect(bullets.slice(-2)).toEqual([changeListLine, noChanges])
    expect(bullets).toHaveLength(4)
  })
})
