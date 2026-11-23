import { rmSync } from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, historyStages, processes, runCommand, writeBoard, writeFile, writeRegeneratedDraft } from "../006-process-state-machine/store.ts"
import {
  boardEntry,
  breachId,
  breachTitle,
  fourRecorded,
  publishBreach,
  recorded,
  rolesFile,
  sixLines,
  specWith,
  systemsFile,
  tenDecided,
  writeApproved,
  writeOrganisation,
} from "./dependencies.ts"

const hashForm = /^[0-9a-f]{64}$/

/** The recorded dependencies as records, or an empty list when the entry has none. */
function recordedList(folder: string): Record<string, unknown>[] {
  const list = recorded(folder)
  return Array.isArray(list) ? list.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null) : []
}

let project: string

beforeEach(() => {
  project = emptyFolder()
})

describe("process-factory move to published", () => {
  it("prints published and records the Role, System, Agreement and Policy lines in their order, each with kind, name and a hash", () => {
    const result = publishBreach(project)

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = processes(project)[0]
    expect(entry?.stage).toBe("published")
    expect(historyStages(entry)).toEqual(["approval", "published"])
    const list = recordedList(project)
    expect(list).toHaveLength(4)
    expect(list.map((dependency) => ({ kind: dependency.kind, name: dependency.name }))).toEqual(fourRecorded)
    for (const dependency of list) {
      expect(Object.keys(dependency).sort()).toEqual(["hash", "kind", "name"])
      expect(dependency.hash).toMatch(hashForm)
    }
  })

  it("does not record the Law and the Process line", () => {
    publishBreach(project)

    const kinds = recordedList(project).map((dependency) => dependency.kind)
    expect(kinds).toEqual(["Role", "System", "Agreement", "Policy"])
    expect(JSON.stringify(recorded(project))).not.toContain("GDPR article 33")
    expect(JSON.stringify(recorded(project))).not.toContain("Handle a lost laptop")
  })

  it("records the lines in the order of spec.md, whatever the order of the kinds", () => {
    publishBreach(project, ["- Policy: Information security policy", "- Role: Head of IT", "- Role: Data protection officer"])

    expect(recordedList(project).map((dependency) => `${String(dependency.kind)}: ${String(dependency.name)}`)).toEqual([
      "Policy: Information security policy",
      "Role: Head of IT",
      "Role: Data protection officer",
    ])
  })

  it("records hash null for a name that is no heading in the file of its kind and for a kind whose file is missing", () => {
    writeOrganisation(project)
    rmSync(path.join(project, systemsFile))
    writeApproved(project, specWith(breachTitle, ["- Role: Chief of nothing", "- System: Payroll system", "- Role: Data protection officer"]))

    const result = runCommand(project, ["move", breachId, "published"])

    expect(result.status).toBe(0)
    const list = recordedList(project)
    expect(list).toHaveLength(3)
    expect(list[0]).toEqual({ kind: "Role", name: "Chief of nothing", hash: null })
    expect(list[1]).toEqual({ kind: "System", name: "Payroll system", hash: null })
    expect(list[2]?.hash).toMatch(hashForm)
  })

  it("records an empty list for a process without a spec.md", () => {
    writeOrganisation(project)
    writeApproved(project)

    const result = runCommand(project, ["move", breachId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(recorded(project)).toEqual([])
  })

  it("records an empty list for a spec.md without a Dependencies section, also when another section has a line of the form - Role: <name>", () => {
    writeOrganisation(project)
    writeApproved(project, tenDecided(breachTitle).replace("## Roles\n\nStatus: decided\n\nSettled.\n", "## Roles\n\nStatus: decided\n\n- Role: Data protection officer\n"))

    runCommand(project, ["move", breachId, "published"])

    expect(recorded(project)).toEqual([])
  })

  it("records only the lines under Dependencies, not a line of the same form in another section", () => {
    writeOrganisation(project)
    const spec = specWith(breachTitle, ["- Role: Data protection officer"]).replace("## Roles\n\nStatus: decided\n\nSettled.\n", "## Roles\n\nStatus: decided\n\n- Role: Head of IT\n")
    writeApproved(project, `${spec}\n## Notes\n\n- System: Payroll system\n`)

    runCommand(project, ["move", breachId, "published"])

    expect(recordedList(project).map((dependency) => dependency.name)).toEqual(["Data protection officer"])
  })

  it("adds no dependencies on a move to another stage and replaces the list on a second move to published", () => {
    publishBreach(project, ["- Role: Data protection officer"])
    expect(recordedList(project).map((dependency) => dependency.name)).toEqual(["Data protection officer"])
    const firstHash = recordedList(project)[0]?.hash

    writeBoard(project, [...processes(project), boardEntry("002-other-process", "Other process", "review")])
    writeFile(project, "processes/002-other-process/spec.md", specWith("Other process", sixLines))
    expect(runCommand(project, ["move", "002-other-process", "approval"]).status).toBe(0)
    expect(Object.keys(processes(project)[1] ?? {})).not.toContain("dependencies")

    writeFile(
      project,
      rolesFile,
      "# Roles\n\n## Data protection officer\n\nOla Hansen is the data protection officer. Kari Nordmann steps in when he is away.\n\n## Head of IT\n\nPer Olsen is the head of IT.\n",
    )
    writeFile(project, `processes/${breachId}/spec.md`, specWith(breachTitle, ["- Role: Head of IT", "- Role: Data protection officer"]))
    for (const stage of ["regenerate", "review", "approval", "published"]) {
      if (stage === "review") writeRegeneratedDraft(project, breachId, 2, ["Role: Data protection officer"])
      if (stage === "published") expect(runCommand(project, ["approve", breachId, "--by", "Kari Nordmann"]).status).toBe(0)
      expect(runCommand(project, ["move", breachId, stage]).status).toBe(0)
    }

    const list = recordedList(project)
    expect(list.map((dependency) => dependency.name)).toEqual(["Head of IT", "Data protection officer"])
    expect(list[1]?.hash).toMatch(hashForm)
    expect(list[1]?.hash).not.toBe(firstHash)
  })
})
