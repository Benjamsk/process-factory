import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { headings, installedFolder, readFile, root, section, sectionLines, skillTemplate, tableRows } from "../010-clarifying-questions/clarify.ts"

/** The text of the section `Approve the draft`, as the spec gives it. */
const approveTheDraft = readFileSync(path.join(import.meta.dirname, "approve-the-draft.md"), "utf8").replace(/\r\n/g, "\n").trim()
const firstBullet =
  '- As part of this skill, run only `new "<title>" "<prompt>"`, `show`, `show <process-id>` and `org init`. Never run `move`, and run no other command. The one exception is `/process next <process-id>`: there you run `move <process-id> clarify`, `move <process-id> spec`, `move <process-id> draft`, `move <process-id> review`, `move <process-id> published`, `answer <process-id> <file>`, `accept-spec <process-id>`, `round <process-id>`, `owner <process-id> "<person>"` and `approve <process-id> --by "<person>"` when the step of the stage says so, and at no other time.'
const versionsBullet =
  "- A folder `processes/<process-id>/versions/<n>/` is a published version of the process. Never create, change or delete a file in a folder `versions/`, and give no agent you start a task that does. Only the command line writes there, and it never changes a version that is there: a change to a published process becomes a new version."

/** The numbered step of the section `Approve the draft` that starts with `<number>. `. */
function step(number: number): string {
  return sectionLines(skillTemplate, "Approve the draft").find((line) => line.startsWith(`${String(number)}. `)) ?? ""
}

describe("the section The command line of the skill", () => {
  it("lets Claude run move <process-id> published inside /process next, directly after move <process-id> review", () => {
    const bullet = sectionLines(skillTemplate, "The command line").find((line) => line.startsWith("- As part of this skill")) ?? ""
    expect(bullet).toBe(firstBullet)
  })

  it("forbids changing a file under versions/, in a bullet directly after the bullet about the store and before the bullet about agents", () => {
    const bullets = sectionLines(skillTemplate, "The command line").filter((line) => line.startsWith("- "))
    const store = bullets.findIndex((line) => line.startsWith("- Only the command line writes the store."))
    expect(store).toBeGreaterThan(-1)
    expect(bullets[store + 1]).toBe(versionsBullet)
    expect(bullets[store + 2]?.startsWith("- Start no agent")).toBe(true)
    expect(versionsBullet).toContain("Never create, change or delete a file in a folder `versions/`, and give no agent you start a task that does.")
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("There are nine exceptions, and you write no other file.")
    expect(text).not.toContain("the step `Approve the draft`")
  })
})

describe("the section Approve the draft of the skill", () => {
  it("is the text of the spec, in a skill that keeps its twenty headings and no step for published and regenerate", () => {
    expect(section(skillTemplate, "Approve the draft").trim()).toBe(approveTheDraft)
    expect(headings(skillTemplate, 2)).toHaveLength(20)
    expect(headings(skillTemplate, 2).at(-1)).toBe("Approve the draft")
    expect(tableRows(skillTemplate, "Run the stage").slice(7)).toEqual(["| `approval` | Approve the draft |", "| `published` | None yet |", "| `regenerate` | None yet |"])
  })

  it("says in its first paragraph that an approved draft is published as a numbered version", () => {
    const first = sectionLines(skillTemplate, "Approve the draft").find((line) => line !== "") ?? ""
    expect(first.startsWith("The step of the stage `approval`.")).toBe(true)
    expect(first.endsWith("An approved draft is published as a numbered version, and the process moves to the stage `published`.")).toBe(true)
    expect(first).not.toContain("The process stays in the stage `approval`.")
  })

  it("publishes a draft that is already approved without asking the user again", () => {
    expect(step(3)).toBe(
      "3. When the file `processes/<process-id>/versions/approval-draft-<m>.md` is there, read it. Tell the user that this draft is already approved, by whom and when, as the file says. Then publish the draft, as step 8 says, without asking the user again.",
    )
  })

  it("publishes directly after a successful approve, and stops when approve fails", () => {
    expect(step(6)).toContain('run `approve <process-id> --by "<person>"`, with the name exactly as the user typed it in that answer')
    expect(step(6).endsWith("When it fails, show the user everything it printed, unchanged, and stop. Do not run it again with another name. Otherwise tell the user what it printed, and then publish the draft, as step 8 says.")).toBe(true)
    expect(step(7)).toBe("7. When the user says anything else, or gives no name, run nothing. Tell them that the draft is not approved and that the process stays in the stage `approval`.")
  })

  it("publishes with move <process-id> published, reads the version from show and tells the user its number and its folder", () => {
    expect(step(8).startsWith("8. To publish the draft, run `move <process-id> published`.")).toBe(true)
    expect(step(8)).toContain("into a new folder `processes/<process-id>/versions/<v>/`")
    expect(step(8)).toContain("When it fails, show the user everything it printed, unchanged, and stop.")
    expect(step(8)).toContain("Otherwise run `show <process-id>` and take the last line under the line `Versions:`, which starts with the number of the new version, `<v>`.")
    expect(step(8)).toContain("Tell the user that the process is published as version `<v>`, that the version is in the folder `processes/<process-id>/versions/<v>/`")
    expect(step(8).endsWith("and that a published version is never changed: a later change to the process becomes a new version.")).toBe(true)
  })

  it("no longer says the factory cannot publish, names no move but the one to published, starts no agent and publishes only an approved draft", () => {
    const text = section(skillTemplate, "Approve the draft")
    expect(text).not.toContain("the factory cannot publish a process yet")
    expect(text.match(/move <process-id> \S+/g)).toEqual(["move <process-id> published`."])
    expect(text).not.toContain("Start one")
    expect(text).toContain("Never approve on your own.")
    expect(text).toContain("Publish only as step 3 and step 6 say: a draft whose approval file is there.")
  })
})

describe("the copy under .claude/skills/process", () => {
  it("has SKILL.md with the bullet about versions/ and step 8, byte-identical to its template", () => {
    const copy = readFile(root, `${installedFolder}/SKILL.md`)
    expect(copy).toContain(versionsBullet)
    expect(copy).toContain("8. To publish the draft, run `move <process-id> published`.")
    expect(copy).toBe(readFile(root, skillTemplate))
  })
})
