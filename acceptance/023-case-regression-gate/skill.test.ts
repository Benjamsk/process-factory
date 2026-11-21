import { describe, expect, it } from "vitest"
import { installedFolder, readFile, root, section, sectionLines, skillTemplate } from "../010-clarifying-questions/clarify.ts"
import { simulationTemplate } from "./gate.ts"

const rework = "When it printed the stage `rework`, tell the user that `/process next <process-id>` sends the draft back to the draft writer with every finding."
const regressed =
  "When it printed lines that start with `Regressed: `, tell the user also that every case such a line names passed with the draft the line names and fails with this draft, and that the process goes back to `rework` for it, also past the limit of five rounds, until no such case fails."
const approval = "When it printed the stage `approval` and no line that starts with `Stopped: `, tell the user that every reviewer passed the draft and that the factory cannot run the stage `approval` yet."
const bullet =
  "- The command line reads the heading and the line of the result of every section. It refuses the file when a case in `cases/` has no section with such a line, or when the verdict is `PASS` while a section says `FAIL`, and it sends the draft back to rework while a case fails that passed in an earlier round."

describe("the section Review the draft of the skill", () => {
  it("tells the user in step 7 what the lines Regressed: mean, directly after the sentence about rework, and keeps the rest of the step", () => {
    const step = sectionLines(skillTemplate, "Review the draft").find((line) => line.startsWith("7. ")) ?? ""
    expect(step).toContain(`7. ${rework} ${regressed} ${approval} When it printed a line that starts with \`Stopped: \``)
    expect(step).toContain("the limit of five rounds while reviewers still ask for changes")
    expect(step).toContain("the files `conflicts.md` of the rounds")
    expect(step.endsWith("and that the factory cannot run the stage `approval` yet.")).toBe(true)
  })

  it("names the regressed cases without asking the user to accept anything and without a move", () => {
    const text = section(skillTemplate, "Review the draft")
    expect(text).toContain("`Regressed: `")
    expect(text).not.toContain("Ask the user")
    expect(text).not.toContain("accept")
    expect(text).not.toContain("move <process-id>")
  })
})

describe("the section The account of every case of the simulation reviewer", () => {
  it("ends its bullets with what the command line does with the results, after the bullet about the lines of a section", () => {
    const bullets = sectionLines(simulationTemplate, "The account of every case").filter((line) => line.startsWith("- "))
    expect(bullets.at(-1)).toBe(bullet)
    expect(bullets.at(-2)?.startsWith("- Start no line of a section with `- ` or with `Verdict:`.")).toBe(true)
  })
})

describe("the copies under .claude/skills/process", () => {
  it("has SKILL.md with the sentence about the lines Regressed:, byte-identical to its template", () => {
    const copy = readFile(root, `${installedFolder}/SKILL.md`)
    expect(copy).toContain(regressed)
    expect(copy).toBe(readFile(root, skillTemplate))
  })

  it("has simulation-reviewer.md with the bullet about the command line, byte-identical to its template", () => {
    const copy = readFile(root, `${installedFolder}/simulation-reviewer.md`)
    expect(copy).toContain(bullet)
    expect(copy).toBe(readFile(root, simulationTemplate))
  })
})
