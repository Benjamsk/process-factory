import { describe, expect, it } from "vitest"
import { headings, readFile, readmeStatus, root, section, sectionLines, skillTemplate } from "../010-clarifying-questions/clarify.ts"

describe("the section The command line of the skill", () => {
  it("lets Claude run accept-spec inside /process next instead of move to cases, next to the commands it ran before", () => {
    const text = section(skillTemplate, "The command line")
    expect(text).toContain("`accept-spec <process-id>`")
    expect(text).not.toContain("move <process-id> cases")
    expect(text).toContain('run only `new "<title>" "<prompt>"`, `show`, `show <process-id>` and `org init`')
    expect(text).toContain("Never run `move`, and run no other command. The one exception is `/process next <process-id>`")
    expect(text).toContain("`move <process-id> clarify`")
    expect(text).toContain("`move <process-id> spec`")
    expect(text).toContain("`answer <process-id> <file>`")
  })
})

describe("the section Write the spec of the skill", () => {
  it("runs accept-spec after a yes, says what it does and shows everything it printed when it fails", () => {
    const text = section(skillTemplate, "Write the spec")
    expect(text).toContain("When the user says yes, run `accept-spec <process-id>`")
    expect(text).toContain("records that the user accepted the specification")
    expect(text).toContain("that `/process next <process-id>` writes the simulation cases")
    expect(text).toContain("When it fails, show the user everything it printed, unchanged, and stop.")
  })

  it("names accept-spec only in the step for a yes and still asks the user first", () => {
    const lines = sectionLines(skillTemplate, "Write the spec")
    const accepts = lines.filter((line) => line.includes("accept-spec <process-id>"))
    expect(accepts).toHaveLength(1)
    expect(accepts[0]).toContain("When the user says yes")
    expect(lines.join("\n")).toContain("Ask the user whether they accept it")
    expect(lines.join("\n")).toContain("When the user says anything else, run nothing and move nothing.")
  })
})

describe("the skill as a whole", () => {
  it("names move <process-id> cases nowhere and has eighteen level 2 headings", () => {
    expect(readFile(root, skillTemplate)).not.toContain("move <process-id> cases")
    expect(headings(skillTemplate, 2)).toHaveLength(18)
  })
})

describe("the Status section of README.md", () => {
  it("describes accept-spec after answer, and says move never moves a process from spec to cases", () => {
    const text = readmeStatus()
    expect(text).toContain(
      "`process-factory accept-spec <process-id>` records on the board that the user accepted `spec.md` of a process in `spec` and moves the process to `cases`.",
    )
    expect(text).toContain("It refuses while one of the eleven sections is not marked decided, names the open sections")
    expect(text).toContain("`move` never moves a process from `spec` to `cases`.")
    expect(text.indexOf("process-factory accept-spec <process-id>")).toBeGreaterThan(text.indexOf("process-factory answer <process-id> <file>"))
  })
})
