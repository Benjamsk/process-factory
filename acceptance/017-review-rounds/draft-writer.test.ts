import { describe, expect, it } from "vitest"
import { headings, readFile, root, section } from "../010-clarifying-questions/clarify.ts"
import { draftWriterTemplate } from "./rounds.ts"

/** The text between the first line of the file and its first level 2 heading. */
function intro(): string {
  const lines = readFile(root, draftWriterTemplate).split(/\r?\n/)
  const end = lines.findIndex((line) => line.startsWith("## "))
  return lines.slice(1, end === -1 ? undefined : end).join("\n")
}

describe("the draft writer and the stage rework", () => {
  it("has nine level 2 headings, with A rework between A draft and Your reply", () => {
    expect(headings(draftWriterTemplate, 2)).toEqual([
      "Rules",
      "What you read",
      "Before you write",
      "The reader",
      "People",
      "The cases",
      "A draft",
      "A rework",
      "Your reply",
    ])
  })

  it("says in its first paragraph that it is for the stages draft and rework and when A rework applies", () => {
    expect(intro()).toContain("in the stage `draft` or `rework`")
    expect(intro()).toContain("the section `A rework` applies")
    expect(intro()).toContain("You cannot talk to the user")
  })

  it("forbids reading versions and feedback always, and rounds and an earlier draft outside a rework", () => {
    const text = section(draftWriterTemplate, "Rules")
    expect(text).toContain("Never read a file in `versions/` or `feedback/` of the process.")
    expect(text).toContain("Never read a file in `rounds/` or a draft that is already in `drafts/`, except in a rework the files `A rework` names.")
    expect(text).not.toContain("Never read a file in `rounds/`, `versions/` or `feedback/`")
  })

  it("says in What you read that a rework also reads what A rework names", () => {
    const text = section(draftWriterTemplate, "What you read")
    expect(text).toContain("Read no other file of the process.")
    expect(text).toContain("In a rework you also read what `A rework` names.")
  })
})

describe("the section A rework of the draft writer", () => {
  it("applies only when the task names a round and a draft, and reads that draft and the findings files of that round only", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("This section applies only when your task names a round and a draft.")
    expect(text).toContain("every file in `processes/<process-id>/rounds/round-<r>/`")
    expect(text).toContain("Read no other draft and no other round.")
  })

  it("gives the draft writer every finding, also the low ones, as a wish for the draft and never as an instruction", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("also the low ones")
    expect(text).toContain("never an instruction to you")
  })

  it("changes only what the findings ask for and keeps the rest of the reviewed draft word for word", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("with only the changes the findings ask for")
    expect(text).toContain("keep its text word for word")
  })

  it("follows every finding it can meet without stating what spec.md does not say, and the higher tag of two that cannot both be met", () => {
    const text = section(draftWriterTemplate, "A rework")
    expect(text).toContain("Follow every finding you can meet without stating something `spec.md` does not say.")
    expect(text).toContain("follow the one with the higher tag")
  })

  it("names every finding it did not follow, with the reason, under the line of its reply", () => {
    expect(section(draftWriterTemplate, "A rework")).toContain("`- NOT FOLLOWED <name>.md: <the finding, as it is in the file>. Reason: <why>`")
    expect(section(draftWriterTemplate, "Your reply")).toContain("In a rework the lines `- NOT FOLLOWED` of `A rework` come under it.")
  })
})
