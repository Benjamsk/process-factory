import { describe, expect, it } from "vitest"
import { headings, organisationFiles, readFile, root, section, skillTemplate, tableRows } from "./interview.ts"

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
  it("names /process org for the interview next to the four earlier forms, in a frontmatter of two lines", () => {
    expect(frontmatterLines()).toHaveLength(2)
    expect(description()).toContain("/process org to be interviewed about the organisation")
    expect(description()).toContain("/process <prompt>")
    expect(description()).toContain("/process show")
    expect(description()).toContain("/process next <process-id>")
    expect(description()).toContain("/process org init")
    expect(description()).not.toContain(": ")
  })
})

describe("the section The command line of the skill", () => {
  it("makes the interview one of the exceptions to the rule that Claude writes no files", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("In the interview of `/process org` you write the files in `organisation/` as `interviewer.md` says.")
    expect(text).toContain('run only `new "<title>" "<prompt>"`, `show`, `show <process-id>` and `org init`')
    expect(text).toContain("Only the command line writes the store.")
    expect(text).toContain("Do not create, change or delete files yourself, and do not start factory jobs.")
  })
})

describe("the section The organisation context of the skill", () => {
  it("says the interview keeps organisation/unknown.md and that what it lists is never filled in with a guess", () => {
    const text = section(skillTemplate, "The organisation context")
    expect(text).toContain("keeps `organisation/unknown.md`")
    expect(text).toContain("What `organisation/unknown.md` lists is missing. Never fill it in with a guess")
  })

  it("names unknown.md only with its folder, so the five files stay the only bare file names", () => {
    const text = section(skillTemplate, "The organisation context")
    const named = [...text.matchAll(/`([a-z]+\.md)`/g)].map((match) => match[1])
    expect(text).toContain("`organisation/unknown.md`")
    expect(named).toEqual(organisationFiles)
  })
})

describe("the section What the input means of the skill", () => {
  it("has a table with the eight forms of input, in order, in which org interviews the user", () => {
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

describe("the level 2 headings of the skill", () => {
  it("are the eighteen of the spec, with Interview the user after Create the organisation context", () => {
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
    ])
  })
})

describe("the section Greet the user of the skill", () => {
  it("lists six forms, the fifth being /process org", () => {
    const text = section(skillTemplate, "Greet the user")
    expect(text).toContain("list the six forms")
    expect(text).toContain("`/process org` interviews the user about the organisation")
  })
})

describe("the section Create the organisation context of the skill", () => {
  it("says the examples are replaced by hand or in the interview", () => {
    expect(section(skillTemplate, "Create the organisation context")).toContain("by hand or in the interview of `/process org`")
  })
})

describe("the section Interview the user of the skill", () => {
  it("reads interviewer.md next to the skill file and says what to do when it is missing", () => {
    const text = section(skillTemplate, "Interview the user")
    expect(text).toContain("Read the file `interviewer.md` that lies next to this skill file, in `.claude/skills/process/`")
    expect(text).toContain("tell the user that `process-factory init` installs it")
  })

  it("holds the interview in the conversation and starts no agent for it", () => {
    const text = section(skillTemplate, "Interview the user")
    expect(text).toContain("Hold the interview as that file says.")
    expect(text).toContain("start no agent for it")
  })
})
