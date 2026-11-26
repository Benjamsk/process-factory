import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, emptyFolder, entries, installedFolder, root, runCommand, runNode, skillFiles, writeFile } from "../010-clarifying-questions/clarify.ts"
import { reviewerTemplate } from "./rounds.ts"

const templateFolder = "templates/skills/process"
const eightFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "incident.md", "reviewer.md"]
const eightLines = installedLines(eightFiles)
/** The reviewers the package ships, sorted by name: what `skillFiles` holds after the eight fixed files. */
const shippedReviewers = skillFiles.slice(eightFiles.length)

/** The lines `init` prints for these files, in their order. */
function installedLines(files: string[]): string {
  return files.map((file) => `Installed ${installedFolder}/${file}\n`).join("")
}

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Copies the package to `node_modules/process-factory` of the project and returns that folder. */
function installedPackage(): string {
  const packageFolder = path.join(project, "node_modules", "process-factory")
  mkdirSync(packageFolder, { recursive: true })
  cpSync(path.join(root, "bin"), path.join(packageFolder, "bin"), { recursive: true })
  cpSync(path.join(root, "templates"), path.join(packageFolder, "templates"), { recursive: true })
  cpSync(path.join(root, "package.json"), path.join(packageFolder, "package.json"))
  return packageFolder
}

describe("process-factory init with the templates of this repository", () => {
  it("ships reviewer.md", () => {
    expect(existsSync(path.join(root, reviewerTemplate))).toBe(true)
    expect(skillFiles.slice(0, eightFiles.length)).toEqual(eightFiles)
    expect(shippedReviewers).toEqual(entries(root, templateFolder).filter((name) => name.endsWith("-reviewer.md")))
    expect(shippedReviewers).not.toContain("reviewer.md")
    const lines = runCommand(project, ["init"]).stdout.split("\n")
    expect(lines.filter((line) => line === `Installed ${installedFolder}/reviewer.md`)).toHaveLength(1)
  })

  it("prints the eight Installed lines in order, ending with reviewer.md, then one for every reviewer the repository ships, sorted by name, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(eightLines + installedLines(shippedReviewers))
    expect(result.status).toBe(0)
  })

  it("creates .claude/skills/process with exactly the eight files and the shipped reviewers, each byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([...eightFiles, ...shippedReviewers].sort())
    for (const file of [...eightFiles, ...shippedReviewers]) {
      const template = readFileSync(path.join(root, templateFolder, file))
      expect(readFileSync(path.join(project, installedFolder, file)).equals(template)).toBe(true)
    }
  })
})

describe("process-factory init from an installed copy", () => {
  it("takes reviewer.md from the copy under node_modules", () => {
    expect(existsSync(path.join(root, reviewerTemplate))).toBe(true)
    const packageFolder = installedPackage()
    appendFileSync(path.join(packageFolder, reviewerTemplate), "\nFrom the installed copy.\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(eightLines + installedLines(shippedReviewers))
    expect(result.status).toBe(0)
    const installed = readFileSync(path.join(project, installedFolder, "reviewer.md"))
    expect(installed.equals(readFileSync(path.join(packageFolder, reviewerTemplate)))).toBe(true)
    expect(installed.equals(readFileSync(path.join(root, reviewerTemplate)))).toBe(false)
  })

  it("installs every <name>-reviewer.md the copy ships after the eight files, sorted by name, and no other template", () => {
    const packageFolder = installedPackage()
    writeFile(packageFolder, `${templateFolder}/reviewer.md`, "# Reviewer\n")
    writeFile(packageFolder, `${templateFolder}/zeta-reviewer.md`, "# Zeta reviewer\n")
    writeFile(packageFolder, `${templateFolder}/alpha-reviewer.md`, "# Alpha reviewer\n")
    writeFile(packageFolder, `${templateFolder}/notes.md`, "# Notes\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    const reviewers = [...shippedReviewers, "alpha-reviewer.md", "zeta-reviewer.md"].sort()
    expect(result.stdout).toBe(eightLines + installedLines(reviewers))
    expect(result.status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([...eightFiles, ...reviewers].sort())
    expect(readFileSync(path.join(project, installedFolder, "alpha-reviewer.md"), "utf8")).toBe("# Alpha reviewer\n")
    expect(readFileSync(path.join(project, installedFolder, "zeta-reviewer.md"), "utf8")).toBe("# Zeta reviewer\n")
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has the eight files in .claude/skills/process, each byte-identical to its template", () => {
    for (const file of eightFiles) {
      const template = path.join(root, templateFolder, file)
      const copy = path.join(root, installedFolder, file)
      expect(existsSync(template)).toBe(true)
      expect(existsSync(copy)).toBe(true)
      expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
    }
  })
})
