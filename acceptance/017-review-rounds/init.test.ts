import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { binFile, emptyFolder, entries, root, runCommand, runNode, skillFiles, writeFile } from "../010-clarifying-questions/clarify.ts"
import { installedFolder, reviewerTemplate } from "./rounds.ts"

const templateFolder = "templates/skills/process"
const sevenFiles = ["SKILL.md", "interviewer.md", "questioner.md", "spec-writer.md", "case-writer.md", "draft-writer.md", "reviewer.md"]
const sevenLines = installedLines(sevenFiles)
/** The reviewers the package ships, sorted by name: what `skillFiles` holds after the seven fixed files. */
const shippedReviewers = skillFiles.slice(sevenFiles.length)

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
  it("ships reviewer.md, which is one of the seven files, is installed once and is not a reviewer", () => {
    expect(existsSync(path.join(root, reviewerTemplate))).toBe(true)
    expect(skillFiles.slice(0, sevenFiles.length)).toEqual(sevenFiles)
    expect(shippedReviewers).toEqual(entries(root, templateFolder).filter((name) => name.endsWith("-reviewer.md")))
    expect(shippedReviewers).not.toContain("reviewer.md")
    const lines = runCommand(project, ["init"]).stdout.split("\n")
    expect(lines.filter((line) => line === `Installed ${installedFolder}/reviewer.md`)).toHaveLength(1)
  })

  it("prints the seven Installed lines in order, ending with reviewer.md, then one line per shipped reviewer, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(sevenLines + installedLines(shippedReviewers))
    expect(result.status).toBe(0)
  })

  it("creates .claude/skills/process with exactly the seven files and the shipped reviewers, each byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([...sevenFiles, ...shippedReviewers].sort())
    for (const file of [...sevenFiles, ...shippedReviewers]) {
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
    expect(result.stdout).toBe(sevenLines + installedLines(shippedReviewers))
    expect(result.status).toBe(0)
    const installed = readFileSync(path.join(project, installedFolder, "reviewer.md"))
    expect(installed.equals(readFileSync(path.join(packageFolder, reviewerTemplate)))).toBe(true)
    expect(installed.equals(readFileSync(path.join(root, reviewerTemplate)))).toBe(false)
  })

  it("installs every <name>-reviewer.md the copy ships after the seven files, sorted by name, and no other template", () => {
    const packageFolder = installedPackage()
    writeFile(packageFolder, `${templateFolder}/reviewer.md`, "# Reviewer\n")
    writeFile(packageFolder, `${templateFolder}/zeta-reviewer.md`, "# Zeta reviewer\n")
    writeFile(packageFolder, `${templateFolder}/alpha-reviewer.md`, "# Alpha reviewer\n")
    writeFile(packageFolder, `${templateFolder}/notes.md`, "# Notes\n")

    const result = runNode(project, path.join("node_modules", "process-factory", binFile), ["init"])

    expect(result.stderr).toBe("")
    const reviewers = [...shippedReviewers, "alpha-reviewer.md", "zeta-reviewer.md"].sort()
    expect(result.stdout).toBe(sevenLines + installedLines(reviewers))
    expect(result.status).toBe(0)
    expect(entries(project, installedFolder)).toEqual([...sevenFiles, ...reviewers].sort())
    expect(readFileSync(path.join(project, installedFolder, "alpha-reviewer.md"), "utf8")).toBe("# Alpha reviewer\n")
    expect(readFileSync(path.join(project, installedFolder, "zeta-reviewer.md"), "utf8")).toBe("# Zeta reviewer\n")
  })
})

describe("the copies that Claude Code loads in this repository", () => {
  it("has the seven files in .claude/skills/process, each byte-identical to its template", () => {
    for (const file of sevenFiles) {
      const template = path.join(root, templateFolder, file)
      const copy = path.join(root, installedFolder, file)
      expect(existsSync(template)).toBe(true)
      expect(existsSync(copy)).toBe(true)
      expect(readFileSync(copy).equals(readFileSync(template))).toBe(true)
    }
  })
})
