import { rmSync } from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { approveDraft, boardFile, emptyFolder, entries, processes, readFile, runCommand, writeBoard, writeFile, writeRegeneratedDraft } from "../006-process-state-machine/store.ts"
import {
  boardEntry,
  breachId,
  breachTitle,
  headOfItSection,
  laptopId,
  laptopTitle,
  nothingChanged,
  officerSection,
  policiesFile,
  policiesText,
  processorsFile,
  processorsText,
  publishBreach,
  rolesFile,
  rolesText,
  specWith,
  systemsFile,
  systemsText,
  work,
  writeOrganisation,
} from "./dependencies.ts"

const usage =
  'Usage: process-factory init\n       process-factory new "<title>" ["<prompt>"]\n       process-factory move <process-id> <stage>\n       process-factory show [<process-id>]\n       process-factory answer <process-id> <file>\n       process-factory accept-spec <process-id>\n       process-factory round <process-id>\n       process-factory owner <process-id> "<person>"\n       process-factory approve <process-id> --by "<person>"\n       process-factory respec <process-id>\n       process-factory send-back <process-id> <file>\n       process-factory edit <process-id> <name> <file> --by "<person>"\n       process-factory org init\n       process-factory check\n       process-factory export <process-id> --format html|markdown --link <address>\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n'
const newOfficer = "## Data protection officer\n\nOla Hansen is the data protection officer. Kari Nordmann steps in when he is away.\n"

/** Runs `check` and expects it to succeed with nothing on standard error; gives what it printed. */
function check(folder: string): string {
  const result = runCommand(folder, ["check"])
  expect(result.stderr).toBe("")
  expect(result.status).toBe(0)
  return result.stdout
}

let project: string

beforeEach(() => {
  project = emptyFolder()
})

describe("process-factory check with nothing to list", () => {
  it("prints the one line in a folder without a board and creates nothing", () => {
    expect(check(project)).toBe(nothingChanged)
    expect(entries(project)).toEqual([])
  })

  it("prints the one line for a board without processes", () => {
    writeBoard(project, [])

    expect(check(project)).toBe(nothingChanged)
  })

  it("prints the one line when no process is in published, also when the others carry changed dependencies", () => {
    writeOrganisation(project)
    const stale = [{ kind: "Role", name: "Data protection officer", hash: "0".repeat(64) }]
    writeBoard(
      project,
      ["intake", "spec", "approval", "regenerate"].map((stage, index) => ({ ...boardEntry(`00${String(index + 1)}-process-in-${stage}`, `Process in ${stage}`, stage), dependencies: stale })),
    )

    expect(check(project)).toBe(nothingChanged)
  })

  it("prints the one line for a published process whose organisation context is as it was", () => {
    expect(publishBreach(project).status).toBe(0)

    expect(check(project)).toBe(nothingChanged)
  })

  it("prints the one line for a published process without dependencies on its entry", () => {
    writeOrganisation(project)
    writeBoard(project, [boardEntry(breachId, breachTitle, "published")])

    expect(check(project)).toBe(nothingChanged)
  })

  it.each([
    ["the line ends of an organisation file changed to \\r\\n", rolesText.replaceAll("\n", "\r\n")],
    ["spaces were added at the end of the lines of the section", rolesText.replace("Kari Nordmann is the data protection officer. Ola Hansen steps in when she is away.", "Kari Nordmann is the data protection officer. Ola Hansen steps in when she is away.   ")],
    ["a different section of the same file changed", rolesText.replace("Per Olsen is the head of IT.", "Nina Berg is the head of IT.")],
    ["a section was added to the same file", `${rolesText}\n## Head of finance\n\nLiv Dahl is the head of finance.\n`],
  ])("prints the one line after only %s", (_name, roles) => {
    publishBreach(project)
    writeFile(project, rolesFile, roles)

    expect(check(project)).toBe(nothingChanged)
  })
})

describe("process-factory check with a changed dependency", () => {
  it("lists the process and the role whose section changed in organisation/roles.md", () => {
    publishBreach(project)
    writeFile(project, rolesFile, rolesText.replace(officerSection, newOfficer))

    expect(check(project)).toBe(work([[breachId, breachTitle, ["Role: Data protection officer  changed in organisation/roles.md"]]]))
  })

  it.each([
    ["System", "Payroll system", systemsFile, systemsText.replace("Example Payroll AS supplies it.", "Another Payroll AS supplies it.")],
    ["Agreement", "Example Payroll AS", processorsFile, processorsText.replace("1 March 2024", "1 June 2026")],
    ["Policy", "Information security policy", policiesFile, policiesText.replace("15 January 2025", "3 February 2026")],
  ])("lists a changed %s with the file of its kind", (kind, name, file, text) => {
    publishBreach(project)
    writeFile(project, file, text)

    expect(check(project)).toBe(work([[breachId, breachTitle, [`${kind}: ${name}  changed in ${file}`]]]))
  })

  it("lists every changed dependency of a process in the recorded order and leaves out the unchanged ones", () => {
    publishBreach(project)
    writeFile(project, policiesFile, policiesText.replace("15 January 2025", "3 February 2026"))
    writeFile(project, rolesFile, rolesText.replace(officerSection, newOfficer))

    expect(check(project)).toBe(
      work([[breachId, breachTitle, ["Role: Data protection officer  changed in organisation/roles.md", "Policy: Information security policy  changed in organisation/policies.md"]]]),
    )
  })

  it("says removed when the section of a dependency was deleted from its file", () => {
    publishBreach(project)
    writeFile(project, rolesFile, `# Roles\n\nThe roles in the organisation.\n\n${headOfItSection}`)

    expect(check(project)).toBe(work([[breachId, breachTitle, ["Role: Data protection officer  removed from organisation/roles.md"]]]))
  })

  it("says removed when the file of a dependency was deleted", () => {
    publishBreach(project)
    rmSync(path.join(project, systemsFile))

    expect(check(project)).toBe(work([[breachId, breachTitle, ["System: Payroll system  removed from organisation/systems.md"]]]))
  })

  it("says changed when a section was added for a dependency recorded with hash null", () => {
    publishBreach(project, ["- Role: Head of security", "- Role: Data protection officer"])
    expect(check(project)).toBe(nothingChanged)
    writeFile(project, rolesFile, `${rolesText}\n## Head of security\n\nNina Berg is the head of security.\n`)

    expect(check(project)).toBe(work([[breachId, breachTitle, ["Role: Head of security  changed in organisation/roles.md"]]]))
  })

  it("prints the heading once, the two processes with changes in the order of the board, and not the process without a change", () => {
    writeOrganisation(project)
    writeBoard(project, [
      boardEntry(breachId, breachTitle, "approval"),
      boardEntry(laptopId, laptopTitle, "approval"),
      boardEntry("003-pay-salaries", "Pay salaries", "approval"),
    ])
    writeFile(project, `processes/${breachId}/spec.md`, specWith(breachTitle, ["- Role: Data protection officer", "- Policy: Information security policy"]))
    writeFile(project, `processes/${laptopId}/spec.md`, specWith(laptopTitle, ["- System: Payroll system", "- Role: Head of IT", "- Policy: Information security policy"]))
    writeFile(project, "processes/003-pay-salaries/spec.md", specWith("Pay salaries", ["- Agreement: Example Payroll AS", "- System: Payroll system"]))
    for (const id of [breachId, laptopId, "003-pay-salaries"]) {
      approveDraft(project, id)
      expect(runCommand(project, ["move", id, "published"]).status).toBe(0)
    }
    writeFile(project, policiesFile, policiesText.replace("15 January 2025", "3 February 2026"))
    writeFile(project, rolesFile, rolesText.replace("Per Olsen is the head of IT.", "Nina Berg is the head of IT."))

    expect(check(project)).toBe(
      work([
        [breachId, breachTitle, ["Policy: Information security policy  changed in organisation/policies.md"]],
        [laptopId, laptopTitle, ["Role: Head of IT  changed in organisation/roles.md", "Policy: Information security policy  changed in organisation/policies.md"]],
      ]),
    )
  })
})

describe("process-factory check and the stage of a process", () => {
  it("no longer lists a process with a changed dependency after it moved from published to regenerate", () => {
    publishBreach(project)
    writeFile(project, rolesFile, rolesText.replace(officerSection, newOfficer))
    expect(check(project)).toContain(`${breachId}  ${breachTitle}\n`)

    expect(runCommand(project, ["move", breachId, "regenerate"]).status).toBe(0)

    expect(check(project)).toBe(nothingChanged)
  })

  it("no longer lists a process after it went through regenerate, review and approval to published again", () => {
    publishBreach(project)
    writeFile(project, rolesFile, rolesText.replace(officerSection, newOfficer))
    expect(check(project)).toContain(`${breachId}  ${breachTitle}\n`)

    for (const stage of ["regenerate", "review", "approval", "published"]) {
      if (stage === "review") writeRegeneratedDraft(project, breachId, 2, ["Role: Data protection officer"])
      if (stage === "published") expect(runCommand(project, ["approve", breachId, "--by", "Kari Nordmann"]).status).toBe(0)
      expect(runCommand(project, ["move", breachId, stage]).status).toBe(0)
    }

    expect(processes(project)[0]?.stage).toBe("published")
    expect(check(project)).toBe(nothingChanged)
  })
})

describe("process-factory check and the files it reads", () => {
  it("leaves the board and every file in organisation/ byte for byte as they were, also when it lists work", () => {
    publishBreach(project)
    writeFile(project, rolesFile, rolesText.replace(officerSection, newOfficer))
    const files = [boardFile, rolesFile, systemsFile, processorsFile, policiesFile]
    const before = files.map((file) => readFile(project, file))
    const organisation = entries(project, "organisation")

    expect(check(project)).toContain("Work waiting for the owner:\n")

    expect(files.map((file) => readFile(project, file))).toEqual(before)
    expect(entries(project, "organisation")).toEqual(organisation)
    expect(entries(project)).toEqual(["organisation", "processes"])
  })

  it("prints why the board cannot be read to standard error and exits with 1", () => {
    writeFile(project, boardFile, "not json")

    const result = runCommand(project, ["check"])

    expect(result.stderr).toMatch(/^process-factory: cannot read processes\/board\.json: .+\n$/)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })
})

describe("the usage of process-factory", () => {
  it.each([
    ["check extra", ["check", "extra"]],
    ["no argument", []],
    ["an unknown command", ["publish"]],
    ["org check", ["org", "check"]],
  ])("has seventeen lines, with check after org init and before export, and is printed with %s", (_name, args) => {
    const result = runCommand(project, args)

    expect(result.stderr).toBe(usage)
    expect(result.stderr.endsWith("       process-factory org init\n       process-factory check\n       process-factory export <process-id> --format html|markdown --link <address>\n       process-factory serve [--port <number>]\n       process-factory dashboard [--port <number>]\n")).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(entries(project)).toEqual([])
  })
})
