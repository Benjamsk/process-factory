import { existsSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { organisationFolder, processes, projectOf, runCommand as runInOrganisation } from "../006-process-state-machine/store.ts"
import { emptyFolder, entries, installedFolder, root, runCommand } from "../010-clarifying-questions/clarify.ts"
import { findings, processId, writeDrafts, writeFindings, writeProcess } from "../017-review-rounds/rounds.ts"
import { gdprInstalled, gdprTemplate } from "./gdpr.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

describe("process-factory init with the templates of this repository", () => {
  it("prints the Installed line of gdpr-reviewer.md after the one of reviewer.md, nothing to standard error, and exits with 0", () => {
    const result = runCommand(project, ["init"])
    const lines = result.stdout.split("\n")

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(lines).toContain(`Installed ${installedFolder}/reviewer.md`)
    expect(lines).toContain(`Installed ${gdprInstalled}`)
    expect(lines.indexOf(`Installed ${gdprInstalled}`)).toBeGreaterThan(lines.indexOf(`Installed ${installedFolder}/reviewer.md`))
  })

  it("writes .claude/skills/process/gdpr-reviewer.md byte-identical to its template", () => {
    expect(runCommand(project, ["init"]).status).toBe(0)

    expect(existsSync(path.join(root, gdprTemplate))).toBe(true)
    expect(existsSync(path.join(project, gdprInstalled))).toBe(true)
    expect(readFileSync(path.join(project, gdprInstalled)).equals(readFileSync(path.join(root, gdprTemplate)))).toBe(true)
  })
})

describe("the copy that Claude Code loads in this repository", () => {
  it("has .claude/skills/process/gdpr-reviewer.md byte-identical to its template", () => {
    expect(existsSync(path.join(root, gdprTemplate))).toBe(true)
    expect(existsSync(path.join(root, gdprInstalled))).toBe(true)
    expect(readFileSync(path.join(root, gdprInstalled)).equals(readFileSync(path.join(root, gdprTemplate)))).toBe(true)
  })
})

describe("process-factory round in a project where init ran", () => {
  it("records the verdict of the gdpr reviewer when every installed reviewer wrote a findings file with PASS", () => {
    const organisation = organisationFolder("process-factory-gdpr-")
    expect(runCommand(projectOf(organisation), ["init"]).status).toBe(0)
    writeProcess(organisation)
    writeDrafts(organisation, [1])
    const reviewers = entries(projectOf(organisation), installedFolder)
      .filter((name) => /^[a-z0-9-]+-reviewer\.md$/.test(name))
      .map((name) => name.replace("-reviewer.md", ""))
    for (const reviewer of reviewers) writeFindings(organisation, 1, `${reviewer}.md`, findings(reviewer, "PASS", []))

    const result = runInOrganisation(organisation, ["round", processId])
    const rounds: unknown = processes(organisation)[1]?.rounds
    rmSync(projectOf(organisation), { recursive: true, force: true })

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(result.stdout.split("\n")).toContain("  gdpr  PASS  0 high, 0 medium, 0 low")
    const recorded: unknown = Array.isArray(rounds) ? rounds[0] : undefined
    expect(rounds).toHaveLength(1)
    expect(recorded).toMatchObject({ round: 1, draft: "draft-1.md" })
    expect(recorded).toHaveProperty("verdicts", expect.arrayContaining([{ reviewer: "gdpr", verdict: "PASS" }]))
  })
})
