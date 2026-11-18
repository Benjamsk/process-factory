import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { installedFile, readText, root, templateFile } from "./repository.ts"

function templateLines(): string[] {
  return readText(templateFile).split(/\r?\n/)
}

/** The lines between the two --- lines at the start of the template. */
function frontmatterLines(): string[] {
  const lines = templateLines()
  if (lines[0] !== "---") {
    return []
  }
  const end = lines.indexOf("---", 1)
  return end === -1 ? [] : lines.slice(1, end)
}

function frontmatterValue(key: string): string | undefined {
  const prefix = `${key}: `
  const line = frontmatterLines().find((candidate) => candidate.startsWith(prefix))
  return line?.slice(prefix.length)
}

/** Everything after the frontmatter block. */
function body(): string {
  const lines = templateLines()
  const end = lines.indexOf("---", 1)
  return end === -1 ? "" : lines.slice(end + 1).join("\n")
}

describe("the frontmatter of templates/skills/process/SKILL.md", () => {
  it("exists and starts with a frontmatter block that has exactly the keys name and description", () => {
    expect(existsSync(path.join(root, templateFile))).toBe(true)
    expect(templateLines()[0]).toBe("---")
    const keys = frontmatterLines().map((line) => line.slice(0, line.indexOf(":")))
    expect(keys).toEqual(["name", "description"])
  })

  it("names the skill process", () => {
    expect(frontmatterValue("name")).toBe("process")
  })

  it("has a one-line description that names /process <prompt> and /process next <process-id>", () => {
    const description = frontmatterValue("description")
    expect(frontmatterLines()).toHaveLength(2)
    expect(description).toContain("/process <prompt>")
    expect(description).toContain("/process next <process-id>")
  })
})

describe("the body of the skill", () => {
  it("has the level 1 heading # Process Factory and no other level 1 heading", () => {
    const headings = body()
      .split("\n")
      .filter((line) => line.startsWith("# "))
    expect(headings).toEqual(["# Process Factory"])
  })

  it("takes the user's prompt from $ARGUMENTS", () => {
    expect(body()).toContain("$ARGUMENTS")
    expect(body()).toContain("The input is the user's prompt.")
  })

  it("says the skill is how the user talks to the factory and no longer that it only converses", () => {
    expect(body()).toContain("This skill is how the user talks to the factory")
    expect(body()).not.toContain("It does not generate processes yet.")
    expect(body()).not.toContain("For now it only lets the user talk to Claude.")
  })

  it("tells Claude not to change files, run other commands or start factory jobs", () => {
    expect(body()).toContain("Do not create, change or delete files yourself, and do not start factory jobs.")
    expect(body()).toContain("run no other command")
  })
})

describe("the copy that Claude Code loads in this repository", () => {
  it("exists at .claude/skills/process/SKILL.md and is byte-identical to the template", () => {
    const template = path.join(root, templateFile)
    const copy = path.join(root, installedFile)
    expect(existsSync(template)).toBe(true)
    expect(existsSync(copy)).toBe(true)
    expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
  })
})
