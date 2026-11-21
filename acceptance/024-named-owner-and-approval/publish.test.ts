import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, historyStages, processes, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { approvalFile, approve, kari, prepareApproval, processFolder, processId, writeDrafts, writeProcess } from "./approval.ts"

const refusal = `process-factory: cannot move ${processId} from approval to published: the newest draft has no approval: only approve ${processId} --by "<person>" records one\n`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** Runs `move <process-id> published` for a refusal: the board must stay as it was. */
function expectRefused(): void {
  const before = readFile(project, boardFile)

  const result = runCommand(project, ["move", processId, "published"])

  expect(result.stderr).toBe(refusal)
  expect(result.stdout).toBe("")
  expect(result.status).toBe(1)
  expect(readFile(project, boardFile)).toBe(before)
}

describe("process-factory move <process-id> published without an approval of the newest draft", () => {
  it("refuses a process whose newest draft has no approval file, and publishes it once the file is there", () => {
    writeProcess(project, "approval")
    writeDrafts(project, [1])

    expectRefused()

    writeFile(project, approvalFile(1), "# Approval of draft-1.md\n")
    const result = runCommand(project, ["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
  })

  it("refuses a process without any draft", () => {
    prepareApproval(project, [])

    expectRefused()
  })

  it("refuses a process whose draft-1.md is approved and whose newest draft is draft-2.md", () => {
    prepareApproval(project, [1])
    approve(project, kari)
    writeDrafts(project, [2])

    expectRefused()
  })

  it("still moves a process from approval to rework without an approval", () => {
    prepareApproval(project, [1])
    expectRefused()

    const result = runCommand(project, ["move", processId, "rework"])

    expect(result.stdout).toBe("rework\n")
    expect(result.status).toBe(0)
    expect(processes(project)[1]?.stage).toBe("rework")
  })
})

describe("process-factory move <process-id> published after approve", () => {
  it("prints published, moves the process and records its dependencies as before", () => {
    prepareApproval(project, [1, 2])
    writeFile(project, `${processFolder}/spec.md`, "# Specification: Handle a lost laptop\n\n## Dependencies\n\nStatus: decided\n\n- Role: Data protection officer\n- Law: GDPR article 33\n")
    expect(approve(project, kari).status).toBe(0)

    const result = runCommand(project, ["move", processId, "published"])

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    const entry = processes(project)[1]
    expect(entry?.stage).toBe("published")
    expect(entry?.owner).toBe(kari)
    expect(historyStages(entry)).toEqual(["approval", "published"])
    expect(entry?.dependencies).toEqual([{ kind: "Role", name: "Data protection officer", hash: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown }])
  })
})
