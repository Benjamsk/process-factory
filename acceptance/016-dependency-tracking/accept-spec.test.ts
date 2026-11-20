import { beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, processes, runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { boardEntry, breachId, breachTitle, firstTenSections, sixLines, specWith, tenDecided } from "./dependencies.ts"

const specFile = `processes/${breachId}/spec.md`
const openLine = `process-factory: cannot accept the spec of ${breachId}: these sections of ${specFile} are open`
const staysLine = `process-factory: ${breachId} stays in spec: /process next ${breachId} writes the questions for the open sections`

function refusal(open: string[]): string {
  return `${[openLine, ...open.map((name) => `  ${name}`), staysLine].join("\n")}\n`
}

let project: string

beforeEach(() => {
  project = emptyFolder()
  writeBoard(project, [boardEntry(breachId, breachTitle, "spec")])
})

describe("process-factory accept-spec and the section Dependencies", () => {
  it("refuses a spec.md with the ten earlier sections decided and no Dependencies section, and accepts it once the section is decided", () => {
    writeFile(project, specFile, tenDecided(breachTitle))

    const refused = runCommand(project, ["accept-spec", breachId])

    expect(refused.stderr).toBe(refusal(["Dependencies"]))
    expect(refused.stdout).toBe("")
    expect(refused.status).toBe(1)
    expect(processes(project)[0]?.stage).toBe("spec")

    writeFile(project, specFile, specWith(breachTitle, sixLines))

    const accepted = runCommand(project, ["accept-spec", breachId])

    expect(accepted.stdout).toBe(`Accepted ${specFile}\ncases\n`)
    expect(accepted.stderr).toBe("")
    expect(accepted.status).toBe(0)
    expect(processes(project)[0]?.stage).toBe("cases")
  })

  it("refuses a spec.md whose Dependencies section is open and names it as the only open section", () => {
    writeFile(project, specFile, `${tenDecided(breachTitle)}\n## Dependencies\n\nStatus: open\n\n- Role: Data protection officer\n- Missing: the payroll system, in \`organisation/systems.md\`\n`)

    const result = runCommand(project, ["accept-spec", breachId])

    expect(result.stderr).toBe(refusal(["Dependencies"]))
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(processes(project)[0]?.stage).toBe("spec")
  })

  it("names all eleven sections, Dependencies last, for a process without a spec.md", () => {
    const result = runCommand(project, ["accept-spec", breachId])

    expect(result.stderr).toBe(refusal([...firstTenSections, "Dependencies"]))
    expect(result.status).toBe(1)
  })
})
