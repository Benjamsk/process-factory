import { describe, expect, it } from "vitest"
import { headings, readFile, root, section, skillTemplate, tableRows } from "../010-clarifying-questions/clarify.ts"

function frontmatterLines(): string[] {
  const lines = readFile(root, skillTemplate).split(/\r?\n/)
  const end = lines.indexOf("---", 1)
  return lines[0] !== "---" || end === -1 ? [] : lines.slice(1, end)
}

function description(): string {
  const prefix = "description: "
  return frontmatterLines().find((line) => line.startsWith(prefix))?.slice(prefix.length) ?? ""
}

describe("the description of the process skill", () => {
  it("names /process incident <process-id> next to the five earlier forms, in a frontmatter of two lines", () => {
    expect(frontmatterLines().map((line) => line.slice(0, line.indexOf(":")))).toEqual(["name", "description"])
    expect(description()).toContain("/process incident <process-id> to turn a real event the process was used in into new cases")
    expect(description()).toContain("/process <prompt>")
    expect(description()).toContain("/process show")
    expect(description()).toContain("/process next <process-id>")
    expect(description()).toContain("/process org init")
    expect(description()).toContain("/process org to be interviewed about the organisation")
    expect(description()).not.toContain(": ")
  })
})

describe("the section The command line of the skill", () => {
  it("names nine exceptions to the rule that Claude writes no files, the ninth being the interview of /process incident", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("There are nine exceptions, and you write no other file.")
    expect(text).not.toContain("There are eight exceptions")
    const bullet = text.split(/\r?\n/).find((line) => line.startsWith("- Only the command line writes the store.")) ?? ""
    expect(
      bullet.endsWith(
        "In the interview of `/process incident <process-id>` you write new files `case-<n>.md` in the folder `cases` of the process, as `incident.md` says.",
      ),
    ).toBe(true)
    expect(text).toContain(
      "In the step `Rework the draft` the draft writer you start writes one new file `draft-<n>.md` in the folder `drafts` of the process, as `draft-writer.md` says. There it also writes at most one file `conflicts.md` in the folder `rounds/round-<r>` of the process, as `draft-writer.md` says. In the interview of `/process incident <process-id>` you write new files `case-<n>.md` in the folder `cases` of the process, as `incident.md` says.",
    )
    expect(text).toContain(
      "In the step `Write the draft` the draft writer you start writes one new file `draft-<n>.md` in the folder `drafts` of the process, as `draft-writer.md` says.",
    )
  })

  it("keeps the eight sentences about exceptions the section has on main", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("There are nine exceptions")
    for (const sentence of [
      "In the interview of `/process org` you write the files in `organisation/` as `interviewer.md` says.",
      "In the step `Ask the questions` the questioner you start writes one `questions-<n>.md` in the folder of the process, as `questioner.md` says.",
      "In the step `Collect the answers` you write `.process-answers.md` in the project's folder.",
      "In the step `Write the spec` the spec writer you start writes `spec.md` and at most one `questions-<n>.md` in the folder of the process, as `spec-writer.md` says.",
      "In the step `Write the cases` the case writer you start writes new files `case-<n>.md` in the folder `cases` of the process, as `case-writer.md` says.",
      "In the step `Write the draft` the draft writer you start writes one new file `draft-<n>.md` in the folder `drafts` of the process, as `draft-writer.md` says.",
      "In the step `Review the draft` every reviewer you start writes one findings file `<name>.md` in the folder `rounds/round-<n>` of the process, as `reviewer.md` says.",
      "In the step `Rework the draft` the draft writer you start writes one new file `draft-<n>.md` in the folder `drafts` of the process, as `draft-writer.md` says.",
    ]) {
      expect(text).toContain(sentence)
    }
  })

  it("adds no command and no agent for the interview of /process incident", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("`incident.md`")
    expect(text).toContain('run only `new "<title>" "<prompt>"`, `show`, `show <process-id>` and `org init`')
    expect(text).toContain(
      "- Start no agent, except the questioner in the step `Ask the questions`, the spec writer in the step `Write the spec`, the case writer in the step `Write the cases`, the draft writer in the steps `Write the draft` and `Rework the draft`, and the reviewers in the step `Review the draft`.",
    )
    expect(text).not.toContain("move <process-id> cases")
  })
})

describe("the section What the input means of the skill", () => {
  it("makes input that starts with incident but does not fit its row a prompt", () => {
    expect(section(skillTemplate, "What the input means")).toContain(
      "Input that starts with `show`, `next`, `org` or `incident` but does not fit its row exactly is a prompt.",
    )
  })

  it("has a table with the eight forms of input, in order, in which incident <process-id> records an incident and incident alone greets", () => {
    expect(tableRows(skillTemplate, "What the input means")).toEqual([
      "| nothing, or only `next` or `incident` | Greet the user |",
      "| `show` | Show the board |",
      "| `show <process-id>` | Show one process |",
      "| `next <process-id>` | Run the stage |",
      "| `incident <process-id>` | Record an incident |",
      "| `org init` | Create the organisation context |",
      "| `org` | Interview the user |",
      "| anything else | Create a process |",
    ])
  })
})

describe("the section Greet the user of the skill", () => {
  it("lists six forms, the sixth being /process incident <process-id>", () => {
    const text = section(skillTemplate, "Greet the user")
    expect(text).toContain("list the six forms")
    expect(text).toContain("`/process incident <process-id>` turns a real event the process was used in into new cases")
    expect(text).toContain("Run no command and create nothing.")
  })
})

describe("the headings of the skill", () => {
  it("has nineteen level 2 headings, with Record an incident between Interview the user and Show the board", () => {
    expect(headings(skillTemplate, 2)).toEqual([
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
      "Run the stage",
      "Ask the questions",
      "Collect the answers",
      "Write the spec",
      "Write the cases",
      "Write the draft",
      "Review the draft",
      "Rework the draft",
      "Approve the draft",
    ])
  })

  it("has # Process Factory as its only line that starts with # and nineteen lines that start with ##", () => {
    const lines = readFile(root, skillTemplate).split(/\r?\n/)
    expect(lines.filter((line) => line.startsWith("# "))).toEqual(["# Process Factory"])
    expect(lines.filter((line) => line.startsWith("## "))).toHaveLength(19)
  })
})

describe("the section Record an incident of the skill", () => {
  it("says what the form is for: cases every later version of the process must pass", () => {
    expect(section(skillTemplate, "Record an incident")).toContain("that every later version of the process must pass")
  })

  it("reads incident.md next to the skill file and says what to do when it is missing", () => {
    const text = section(skillTemplate, "Record an incident")
    expect(text).toContain("Read the file `incident.md` that lies next to this skill file, in `.claude/skills/process/`")
    expect(text).toContain("tell the user that `process-factory init` installs it")
  })

  it("holds the interview in the conversation, starts no agent for it and moves nothing", () => {
    const text = section(skillTemplate, "Record an incident")
    expect(text).toContain("Hold the interview as that file says")
    expect(text).toContain("start no agent for it")
    expect(text).toContain("Move nothing. The process stays in the stage it is in.")
    expect(text).not.toContain("Start one general-purpose agent")
    expect(text).not.toContain("run `move")
  })
})
