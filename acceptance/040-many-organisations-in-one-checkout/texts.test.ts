import { describe, expect, it } from "vitest"
import { readFile, root, section, sectionLines, skillTemplate } from "../010-clarifying-questions/clarify.ts"

const listBullet =
  '- Every organisation has its own store in the folder `organisations/<org-id>/` in the project\'s folder. Besides the commands above you run `org list`, before any other command: it prints one line `<org-id>  <name>` for every organisation. When it prints one line, that is the organisation you work on. When it prints more, show the user the lines and ask which organisation they mean. When it prints `No organisations.`, tell the user that `process-factory org new "<name>"` creates one, and stop. End every other command you run with `--org <org-id>`.'
const pathsBullet =
  "- In this file and in every file next to it, a path that starts with `organisation/` or `processes/` lies in the folder of the organisation you work on: `organisation/systems.md` is `organisations/<org-id>/organisation/systems.md`, and `processes/<process-id>/` is `organisations/<org-id>/processes/<process-id>/`. The command line prints such a path with `organisations/<org-id>/` in front. Start the task of every agent you start with the line `Organisation: <org-id>`. Never read or write a file of another organisation."
const paragraph =
  "You work on one organisation: the one whose id `<org-id>` your task names in its line `Organisation: <org-id>`, or the one the skill file chose when you hold an interview yourself. Every path in this file that starts with `organisation/` or `processes/` lies in the folder of that organisation, `organisations/<org-id>/` in the project's folder. Never read or write a file of another organisation."
const otherFiles = ["interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "incident.md", "reviewer.md", "gdpr-reviewer.md", "legal-reviewer.md", "readability-reviewer.md", "simulation-reviewer.md"]

/** The lines of a file of the skill templates. */
function templateLines(file: string): string[] {
  return readFile(root, `templates/skills/process/${file}`).split(/\r?\n/)
}

/** The paragraphs under `## Status` in README.md, each on one line. */
function statusParagraphs(): string[] {
  const status = readFile(root, "README.md").replace(/\r\n/g, "\n").split("\n## Status\n")[1] ?? ""
  return (status.split(/\n#{1,6} /)[0] ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
}

describe("the section The command line of the skill", () => {
  it("ends with the bullet about org list and --org and the bullet about the paths of the organisation", () => {
    const bullets = sectionLines(skillTemplate, "The command line").filter((line) => line.startsWith("- "))

    expect(bullets.at(-2)).toBe(listBullet)
    expect(bullets.at(-1)).toBe(pathsBullet)
  })
})

describe("the section The organisation context of the skill", () => {
  it("says that the folder organisation/ is that of the organisation you work on, not of the project", () => {
    const text = section(skillTemplate, "The organisation context")

    expect(text).toContain("The folder `organisation/` of the organisation you work on is the factory's codebase")
    expect(text).not.toContain("The folder `organisation/` in the project's folder")
  })
})

describe("every other file of the skill", () => {
  it.each(otherFiles)("has the paragraph about its one organisation directly above its first heading of level 2, and its installed copy is the template: %s", (file) => {
    const lines = templateLines(file)
    const heading = lines.findIndex((line) => line.startsWith("## "))

    expect(heading).toBeGreaterThan(3)
    expect(lines.slice(heading - 3, heading)).toEqual(["", paragraph, ""])
    expect(lines.filter((line) => line === paragraph)).toHaveLength(1)
    expect(readFile(root, `.claude/skills/process/${file}`)).toBe(readFile(root, `templates/skills/process/${file}`))
  })

  it("is installed next to a SKILL.md that is the template with the two bullets", () => {
    const installed = readFile(root, ".claude/skills/process/SKILL.md")

    expect(installed).toBe(readFile(root, skillTemplate))
    expect(installed).toContain(listBullet)
    expect(installed).toContain(pathsBullet)
  })
})

describe("the Status section of README.md", () => {
  it("has a paragraph about organisations directly before its last paragraph, which is still the one about the dashboard", () => {
    const paragraphs = statusParagraphs()
    const organisations = paragraphs.at(-2) ?? ""

    expect(paragraphs.at(-1)?.startsWith("`process-factory dashboard` starts a dashboard of the process store")).toBe(true)
    for (const named of ["organisations/<org-id>/", 'process-factory org new "<name>"', "process-factory org list", "--org <org-id>", "organisations/fjordlys-laering/", "/<org-id>"]) {
      expect(organisations).toContain(named)
    }
    expect(paragraphs.at(-3)?.startsWith("The factory reads what it knows about the organisation from the folder `organisation/`.")).toBe(true)
  })

  it("says in the paragraph about export that the file lies in the folder of the organisation and that the address carries the organisation", () => {
    const exported = statusParagraphs().find((part) => part.startsWith("`process-factory export <process-id>")) ?? ""

    expect(exported).toContain("the file `exports/<process-id>-v<n>.html` in the folder of the organisation")
    expect(exported).toContain("the current version is at `<address>/<org-id>/<process-id>/<n>`")
    expect(exported).not.toContain("in the project's folder")
  })
})
