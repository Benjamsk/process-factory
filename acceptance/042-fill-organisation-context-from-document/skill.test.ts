import { readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, headings, installedFolder, readFile, root, runCommand, section, sectionLines, skillFiles, skillTemplate, tableRows } from "../010-clarifying-questions/clarify.ts"
import { interviewerTemplate, readADocument, repositoryText } from "./read.ts"

const readForm = "/process org read <path> to fill the organisation context from a document the user already has"
const descriptionEnd =
  "/process org to be interviewed about the organisation, /process org read <path> to fill the organisation context from a document the user already has, /process incident <process-id> to turn a real event the process was used in into new cases, and /process respec <process-id> to send a process back to its specification with the findings of its newest review round."
const readBullet =
  "- `/process org read` adds one thing to these rules: there you write the files in `organisation/` as the section `Read a document` of `interviewer.md` says, only after the user confirmed what you read, and at no other time."
const greeting =
  "Run no command and create nothing. Greet the user in one or two sentences and list the eight forms: `/process <prompt>` creates a process, `/process show` or `/process show <process-id>` shows the board or one process, `/process next <process-id>` runs the stage a process is in, `/process org init` creates the organisation context, `/process org` interviews the user about the organisation, `/process org read <path>`, or `/process org read` followed by pasted text, fills the organisation context from a document the user already has, `/process incident <process-id>` turns a real event the process was used in into new cases, and `/process respec <process-id>` sends a process in `rework` or `approval` back to its specification with the findings of its newest review round."
const readParagraph =
  "When the input starts with `org read`, do step 1 and then, instead of the interview, read the document as the section `Read a document` of that file says. What follows `org read` in the input is the path or the text. You do this yourself too, in this conversation: start no agent for it."
const twentyTwoHeadings = [
  "The command line",
  "The organisation context",
  "What the input means",
  "Greet the user",
  "Create a process",
  "Create the organisation context",
  "Interview the user",
  "Record an incident",
  "Show the board",
  "Show one process",
  "Send a process back to spec",
  "Run the stage",
  "Ask the questions",
  "Collect the answers",
  "Write the spec",
  "Write the cases",
  "Write the draft",
  "Review the draft",
  "Rework the draft",
  "Approve the draft",
  "Start a regeneration",
  "Write the changes",
]

function frontmatterLines(): string[] {
  const lines = readFile(root, skillTemplate).split(/\r?\n/)
  const end = lines.indexOf("---", 1)
  return lines[0] !== "---" || end === -1 ? [] : lines.slice(1, end)
}

function description(): string {
  const prefix = "description: "
  return frontmatterLines().find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? ""
}

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("the description of the process skill", () => {
  it("names /process org read <path> between /process org and /process incident, in a frontmatter of two lines without a colon and a space", () => {
    expect(frontmatterLines()).toHaveLength(2)
    expect(description()).toContain(readForm)
    expect(description().endsWith(descriptionEnd)).toBe(true)
    expect(description()).not.toContain(": ")
  })
})

describe("the section The command line of the skill", () => {
  it("has the bullet about /process org read directly after the bullet about a regeneration and directly before the bullet about a failing command, and keeps nine exceptions", () => {
    const bullets = sectionLines(skillTemplate, "The command line").filter((line) => line.startsWith("- "))
    const regeneration = bullets.findIndex((line) => line.startsWith("- A regeneration adds three things to these rules."))

    expect(regeneration).toBeGreaterThan(-1)
    expect(bullets[regeneration + 1]).toBe(readBullet)
    expect(bullets[regeneration + 2]?.startsWith("- When a command fails")).toBe(true)
    expect(section(skillTemplate, "The command line")).toContain("There are nine exceptions, and you write no other file.")
  })
})

describe("the section What the input means of the skill", () => {
  it("has a table with the ten forms of input, in order, with org read directly before org", () => {
    expect(tableRows(skillTemplate, "What the input means")).toEqual([
      "| nothing, or only `next`, `incident` or `respec` | Greet the user |",
      "| `show` | Show the board |",
      "| `show <process-id>` | Show one process |",
      "| `next <process-id>` | Run the stage |",
      "| `incident <process-id>` | Record an incident |",
      "| `respec <process-id>` | Send a process back to spec |",
      "| `org init` | Create the organisation context |",
      "| `org read`, alone or followed by a path or by text | Interview the user |",
      "| `org` | Interview the user |",
      "| anything else | Create a process |",
    ])
  })
})

describe("the section Greet the user of the skill", () => {
  it("is the text of the spec, with eight forms and /process org read <path> between /process org and /process incident <process-id>", () => {
    expect(section(skillTemplate, "Greet the user").trim()).toBe(greeting)
  })
})

describe("the section Interview the user of the skill", () => {
  it("keeps its two numbered steps and ends with the paragraph about org read, in a skill that still has its twenty-two level 2 headings", () => {
    const lines = sectionLines(skillTemplate, "Interview the user").filter((line) => line !== "")

    expect(headings(skillTemplate, 2)).toEqual(twentyTwoHeadings)
    expect(lines.filter((line) => /^\d+\. /.test(line))).toEqual([
      "1. Read the file `interviewer.md` that lies next to this skill file, in `.claude/skills/process/`. When it is missing, tell the user that `process-factory init` installs it, and stop.",
      "2. Hold the interview as that file says. You hold it yourself, in this conversation: start no agent for it.",
    ])
    expect(lines.at(-1)).toBe(readParagraph)
    expect(lines).toHaveLength(3)
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has SKILL.md and interviewer.md byte-identical to their templates, with the form and the section", () => {
    for (const file of ["SKILL.md", "interviewer.md"]) {
      const copy = readFileSync(path.join(root, installedFolder, file))
      expect(copy.equals(readFileSync(path.join(root, "templates/skills/process", file)))).toBe(true)
    }
    expect(repositoryText(`${installedFolder}/SKILL.md`)).toContain(readParagraph)
    expect(repositoryText(`${installedFolder}/interviewer.md`)).toContain(`## Read a document\n\n${readADocument}\n`)
  })
})

describe("process-factory init in an empty working directory", () => {
  it("prints the same Installed lines as before and installs an interviewer.md that holds the section Read a document", () => {
    const result = runCommand(project, ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(skillFiles.map((file) => `Installed .claude/skills/process/${file}\n`).join(""))
    expect(result.status).toBe(0)
    const installed = readFile(project, `${installedFolder}/interviewer.md`)
    expect(installed).toBe(readFile(root, interviewerTemplate))
    expect(installed.replace(/\r\n/g, "\n")).toContain(`## Read a document\n\n${readADocument}\n`)
  })
})
