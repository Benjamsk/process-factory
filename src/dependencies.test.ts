import { readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { boardPath, isRecord, readWorkingFile, runCommand, storedProcesses, workingDirectory, writeBoardFile, writeWorkingFile } from "./command-line.ts"

describe("process-factory move to published and process-factory check", () => {
  const processId = "001-handle-a-breach"
  const rolesText = "# Roles\n\n## Data protection officer\n\nKari Nordmann holds the role.\n\n## Head of IT\n\nPer Olsen holds the role.\n"
  const dependencyLines = [
    "- Law: GDPR article 33",
    "- Role: Data protection officer",
    "- System: Payroll system",
    "- Agreement: Example Payroll AS",
    "- Policy: Information security policy",
    "- Process: Handle a lost laptop",
  ]

  function writeOrganisation(): void {
    writeWorkingFile("organisation/roles.md", rolesText)
    writeWorkingFile("organisation/systems.md", "# Systems\n\n## Payroll system\n\nIt pays the salaries.\n")
    writeWorkingFile("organisation/processors.md", "# Agreements\n\n## Example Payroll AS\n\nSigned on 1 March 2024.\n")
    writeWorkingFile("organisation/policies.md", "# Policies\n\n## Information security policy\n\nApproved on 15 January 2025.\n")
  }

  /** A `spec.md` whose section `Dependencies` holds these lines, with a line of the same form in two other sections. */
  function specText(lines: string[]): string {
    return `# Specification: Handle a breach\n\n## Roles\n\n- Role: Head of IT\n\n## Dependencies\n\nStatus: decided\n\n${lines.join("\n")}\n\n## Notes\n\n- System: Payroll system\n`
  }

  /** Writes a board with the process in `approval`, its `spec.md` and the approval of its newest draft, and moves it to `published`. */
  function publish(lines: string[] = dependencyLines, spec = true) {
    writeBoardFile([{ id: processId, title: "Handle a breach", stage: "approval" }])
    if (spec) writeWorkingFile(`processes/${processId}/spec.md`, specText(lines))
    writeWorkingFile(`processes/${processId}/drafts/draft-1.md`, "# Handle a breach\n")
    writeWorkingFile(`processes/${processId}/versions/approval-draft-1.md`, "# Approval of draft-1.md\n")
    return runCommand(["move", processId, "published"])
  }

  function recordedDependencies(): Record<string, unknown>[] {
    const list: unknown = storedProcesses()[0]?.dependencies
    return Array.isArray(list) ? list.filter(isRecord) : []
  }

  it("records the Role, System, Agreement and Policy lines of Dependencies in their order, and no other line", () => {
    writeOrganisation()

    const result = publish()

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(recordedDependencies()).toEqual([
      { kind: "Role", name: "Data protection officer", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "System", name: "Payroll system", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "Agreement", name: "Example Payroll AS", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
      { kind: "Policy", name: "Information security policy", hash: expect.stringMatching(/^[0-9a-f]{64}$/) },
    ])
  })

  it("records hash null for a name that is no heading in the file of its kind and for a missing file", () => {
    writeWorkingFile("organisation/roles.md", rolesText)

    expect(publish(["- Role: Chief of nothing", "- Policy: Information security policy"]).status).toBe(0)

    expect(recordedDependencies()).toEqual([
      { kind: "Role", name: "Chief of nothing", hash: null },
      { kind: "Policy", name: "Information security policy", hash: null },
    ])
  })

  it("records an empty list for a process without a spec.md", () => {
    expect(publish([], false).status).toBe(0)

    expect(storedProcesses()[0]?.dependencies).toEqual([])
  })

  it("adds no dependencies on a move to another stage", () => {
    writeBoardFile([{ id: processId, title: "Handle a breach", stage: "approval" }])
    writeWorkingFile(`processes/${processId}/spec.md`, specText(dependencyLines))

    expect(runCommand(["move", processId, "rework"]).status).toBe(0)

    expect(Object.keys(storedProcesses()[0] ?? {})).not.toContain("dependencies")
  })

  it("prints the one line when every recorded dependency is as it was, and creates nothing without a board", () => {
    const empty = runCommand(["check"])
    expect(empty.stdout).toBe("No published process has a changed dependency.\n")
    expect(empty.stderr).toBe("")
    expect(empty.status).toBe(0)
    expect(readdirSync(workingDirectory)).toEqual([])
    writeOrganisation()
    publish()

    const result = runCommand(["check"])

    expect(result.stdout).toBe("No published process has a changed dependency.\n")
    expect(result.status).toBe(0)
  })

  it("lists the changed and the removed dependency of a published process and leaves every file as it was", () => {
    writeOrganisation()
    publish()
    writeWorkingFile("organisation/roles.md", rolesText.replace("Kari Nordmann holds the role.", "Ola Hansen holds the role."))
    rmSync(path.join(workingDirectory, "organisation/policies.md"))
    const before = [boardPath, "organisation/roles.md", "organisation/systems.md"].map((file) => readWorkingFile(file))

    const result = runCommand(["check"])

    expect(result.stdout).toBe(
      "Work waiting for the owner:\n001-handle-a-breach  Handle a breach\n  Role: Data protection officer  changed in organisation/roles.md\n  Policy: Information security policy  removed from organisation/policies.md\n",
    )
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect([boardPath, "organisation/roles.md", "organisation/systems.md"].map((file) => readWorkingFile(file))).toEqual(before)
  })

  it("lists no process that is no longer in published", () => {
    writeOrganisation()
    publish()
    writeWorkingFile("organisation/roles.md", rolesText.replace("Kari Nordmann holds the role.", "Ola Hansen holds the role."))
    expect(runCommand(["check"]).stdout).toContain("Work waiting for the owner:\n")

    expect(runCommand(["move", processId, "regenerate"]).status).toBe(0)

    expect(runCommand(["check"]).stdout).toBe("No published process has a changed dependency.\n")
  })

  it("names the board it cannot read and exits with 1", () => {
    writeWorkingFile(boardPath, "{ not json\n")

    const result = runCommand(["check"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})
