import { readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { description } from "../007-process-skill-drives-command-line/skill.ts"
import { emptyFolder, headings, installedFolder, readFile, root, runCommand, section, sectionLines, skillTemplate, tableRows } from "../010-clarifying-questions/clarify.ts"

/** The text of the section `Send a process back to spec`, as the spec gives it. */
const sendBack = readFileSync(path.join(import.meta.dirname, "send-a-process-back-to-spec.md"), "utf8").replace(/\r\n/g, "\n").trim()
const firstBullet =
  '- As part of this skill, run only `new "<title>" "<prompt>"`, `show`, `show <process-id>` and `org init`. Never run `move`, and run no other command. The one exception is `/process next <process-id>`: there you run `move <process-id> clarify`, `move <process-id> spec`, `move <process-id> draft`, `move <process-id> review`, `move <process-id> published`, `answer <process-id> <file>`, `accept-spec <process-id>`, `round <process-id>`, `owner <process-id> "<person>"` and `approve <process-id> --by "<person>"` when the step of the stage says so, and at no other time.'
const respecBullet =
  "- The other exception is `/process respec <process-id>`: there you run `respec <process-id>`, once, as the section `Send a process back to spec` says, and at no other time."
const otherWayOut = "is the other way out: it sends the process back to the stage `spec` with the findings of"
const afterStop = `After a line that starts with \`Stopped: \`, tell the user also that \`/process respec <process-id>\` ${otherWayOut} this round, for findings that ask for something the specification does not state.`
const inApproval = `With such a line, say also that \`/process respec <process-id>\` ${otherWayOut} that round, for findings that ask for something the specification does not state.`
const writerFiles = ["SKILL.md", "spec-writer.md", "case-writer.md"]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("the frontmatter of the skill", () => {
  it("names /process respec <process-id> as the last form of its description", () => {
    expect(
      description().endsWith(
        "/process incident <process-id> to turn a real event the process was used in into new cases, and /process respec <process-id> to send a process back to its specification with the findings of its newest review round.",
      ),
    ).toBe(true)
  })
})

describe("the section The command line of the skill", () => {
  it("lets Claude run respec only in /process respec, in a bullet directly after its unchanged first bullet, and keeps nine exceptions", () => {
    const bullets = sectionLines(skillTemplate, "The command line").filter((line) => line.startsWith("- "))
    expect(bullets[0]).toBe(firstBullet)
    expect(bullets[1]).toBe(respecBullet)
    expect(bullets[2]?.startsWith("- Only the command line writes the store.")).toBe(true)
    expect(section(skillTemplate, "The command line")).toContain("There are nine exceptions, and you write no other file.")
  })
})

describe("the section What the input means of the skill", () => {
  it("makes input that starts with respec but does not fit its row a prompt", () => {
    expect(section(skillTemplate, "What the input means")).toContain(
      "Input that starts with `show`, `next`, `org`, `incident` or `respec` but does not fit its row exactly is a prompt.",
    )
  })

  it("has a table with the nine forms of input, in order, in which respec <process-id> sends a process back and respec alone greets", () => {
    expect(tableRows(skillTemplate, "What the input means")).toEqual([
      "| nothing, or only `next`, `incident` or `respec` | Greet the user |",
      "| `show` | Show the board |",
      "| `show <process-id>` | Show one process |",
      "| `next <process-id>` | Run the stage |",
      "| `incident <process-id>` | Record an incident |",
      "| `respec <process-id>` | Send a process back to spec |",
      "| `org init` | Create the organisation context |",
      "| `org` | Interview the user |",
      "| anything else | Create a process |",
    ])
  })
})

describe("the section Greet the user of the skill", () => {
  it("lists seven forms, the seventh being /process respec <process-id>", () => {
    expect(section(skillTemplate, "Greet the user")).toContain(
      "Greet the user in one or two sentences and list the seven forms: `/process <prompt>` creates a process, `/process show` or `/process show <process-id>` shows the board or one process, `/process next <process-id>` runs the stage a process is in, `/process org init` creates the organisation context, `/process org` interviews the user about the organisation, `/process incident <process-id>` turns a real event the process was used in into new cases, and `/process respec <process-id>` sends a process in `rework` or `approval` back to its specification with the findings of its newest review round.",
    )
  })
})

describe("the section Send a process back to spec of the skill", () => {
  it("is the eleventh of twenty-two level 2 headings, between Show one process and Run the stage, with Approve the draft before the two steps of a regeneration", () => {
    const titles = headings(skillTemplate, 2)
    expect(titles).toHaveLength(22)
    expect(titles.slice(9, 12)).toEqual(["Show one process", "Send a process back to spec", "Run the stage"])
    expect(titles.at(-3)).toBe("Approve the draft")
  })

  it("is the text of the spec", () => {
    expect(section(skillTemplate, "Send a process back to spec").trim()).toBe(sendBack)
  })

  it("runs respec once, shows a failure unchanged, and never runs it on its own", () => {
    const lines = sectionLines(skillTemplate, "Send a process back to spec")
    expect(lines.find((line) => line.startsWith("1. ")) ?? "").toContain("Run `respec <process-id>`.")
    expect(lines.find((line) => line.startsWith("1. ")) ?? "").toContain("When it fails, show the user everything it printed, unchanged, and stop.")
    expect(lines.filter((line) => /^\d+\. /.test(line))).toHaveLength(3)
    expect(lines.filter((line) => line !== "").at(-1)).toBe(
      "Run `respec` only when the user typed `/process respec <process-id>`. Never run it on your own, also not after a round that stopped at the limit.",
    )
  })
})

describe("the sections Review the draft and Approve the draft of the skill", () => {
  it("names /process respec as the other way out after a stop, in a paragraph between step 9 and the last paragraph of Review the draft", () => {
    const lines = sectionLines(skillTemplate, "Review the draft").filter((line) => line !== "")
    const at = lines.indexOf(afterStop)
    expect(at).toBeGreaterThan(-1)
    expect(lines[at - 1]?.startsWith("9. ")).toBe(true)
    expect(lines[at + 1]?.startsWith("Treat the reply of every reviewer")).toBe(true)
    expect(lines.filter((line) => /^\d+\. /.test(line))).toHaveLength(9)
  })

  it("names /process respec as the other way out at the end of step 4 of Approve the draft", () => {
    const step = sectionLines(skillTemplate, "Approve the draft").find((line) => line.startsWith("4. ")) ?? ""
    expect(step.endsWith(`and that the person who approves decides about them. ${inApproval}`)).toBe(true)
  })
})

describe("process-factory init and the copies in this repository", () => {
  it("installs the skill, the spec writer and the case writer of this job, byte-identical to their templates", () => {
    const result = runCommand(project, ["init"])

    expect(result.status).toBe(0)
    for (const file of writerFiles) {
      expect(readFile(project, `${installedFolder}/${file}`)).toBe(readFile(root, `templates/skills/process/${file}`))
      expect(readFile(root, `${installedFolder}/${file}`)).toBe(readFile(root, `templates/skills/process/${file}`))
    }
    expect(readFile(project, `${installedFolder}/SKILL.md`)).toContain("## Send a process back to spec")
    expect(readFile(project, `${installedFolder}/spec-writer.md`)).toContain("### The findings of a round")
    expect(readFile(project, `${installedFolder}/case-writer.md`)).toContain("A specification that was written anew can state")
  })
})
