import { spawn, type ChildProcess } from "node:child_process"
import { appendFileSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, processes, projectOf, readFile, usage, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { processFolder, processId } from "../024-named-owner-and-approval/approval.ts"
import { organisationAddress } from "../026-reading-view-on-localhost/view.ts"
import { post } from "../027-reader-feedback/feedback.ts"
import { ownProcess, writeStore } from "../034-dashboard-decisions/decisions.ts"
import { installedCommand, installPackage, runInstalled } from "./modules.ts"

const organisationFiles = ["authority.md", "policies.md", "processors.md", "roles.md", "systems.md"]
const addressLine = /^Dashboard on (http:\/\/127\.0\.0\.1:\d+)\n$/
const running: ChildProcess[] = []

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await Promise.all(
    running.splice(0).map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve()
            return
          }
          child.once("exit", () => {
            resolve()
          })
          child.kill()
        }),
    ),
  )
  rmSync(projectOf(project), { recursive: true, force: true, maxRetries: 5 })
})

/** Starts the dashboard of the copy of the package on a free port and gives the address of the organisation there, or an empty string when it printed none. */
async function openInstalledDashboard(): Promise<string> {
  const child = spawn(process.execPath, [installedCommand(project), "dashboard", "--port", "0"], { cwd: projectOf(project), stdio: ["ignore", "pipe", "pipe"] })
  running.push(child)
  let stdout = ""
  child.stdout.setEncoding("utf8")
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 15_000)
    const finish = (): void => {
      clearTimeout(timer)
      resolve()
    }
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
      if (stdout.includes("\n")) finish()
    })
    child.on("close", finish)
  })
  const address = addressLine.exec(stdout)?.[1] ?? ""
  return address === "" ? "" : organisationAddress(address)
}

describe("a copy of the package under node_modules with the twelve files of bin, templates and package.json only", () => {
  it("consists of bin, package.json and templates, with the twelve files in bin", () => {
    const packageFolder = installPackage(project)

    expect(entries(packageFolder)).toEqual(["bin", "package.json", "templates"])
    expect(entries(packageFolder, "bin")).toHaveLength(12)
  })

  it("installs the skill with init from the templates of that copy and exits 0", () => {
    const packageFolder = installPackage(project)
    appendFileSync(path.join(packageFolder, "templates/skills/process/SKILL.md"), "\nFrom the installed copy.\n")

    const result = runInstalled(project, ["init"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("Installed .claude/skills/process/SKILL.md\n")
    expect(readFile(projectOf(project), ".claude/skills/process/SKILL.md")).toBe(readFile(packageFolder, "templates/skills/process/SKILL.md"))
    expect(readFile(projectOf(project), ".claude/skills/process/SKILL.md").endsWith("\nFrom the installed copy.\n")).toBe(true)
  })

  it("creates the organisation context with org init from the templates of that copy and exits 0", () => {
    const packageFolder = installPackage(project)
    appendFileSync(path.join(packageFolder, "templates/organisation/roles.md"), "\nFrom the installed copy.\n")

    const result = runInstalled(project, ["org", "init"])

    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, "organisation")).toEqual(organisationFiles)
    expect(readFile(project, "organisation/roles.md")).toBe(readFile(packageFolder, "templates/organisation/roles.md"))
    expect(readFile(project, "organisation/roles.md").endsWith("\nFrom the installed copy.\n")).toBe(true)
  })

  it("prints the unchanged usage text to standard error and exits 1 without arguments", () => {
    installPackage(project)

    const result = runInstalled(project, [])

    expect(result.stdout).toBe("")
    expect(result.stderr).toBe(usage)
    expect(result.status).toBe(1)
  })

  it("runs new, show, move and check in the project folder", () => {
    installPackage(project)

    const created = runInstalled(project, ["new", "Handle a lost laptop"])
    expect(created.stderr).toBe("")
    expect(created.stdout).toBe("001-handle-a-lost-laptop\n")
    expect(created.status).toBe(0)

    const shown = runInstalled(project, ["show"])
    expect(shown.stdout).toBe("001-handle-a-lost-laptop  intake  Handle a lost laptop\n")
    expect(shown.status).toBe(0)

    const moved = runInstalled(project, ["move", "001-handle-a-lost-laptop", "clarify"])
    expect(moved.stdout).toBe("clarify\n")
    expect(moved.status).toBe(0)
    expect(processes(project)[0]?.stage).toBe("clarify")

    const checked = runInstalled(project, ["check"])
    expect(checked.stdout).toBe("No published process has a changed dependency.\n")
    expect(checked.status).toBe(0)
  })

  it("still runs the command line for a decision posted to its dashboard: accept-spec moves the process to cases", async () => {
    installPackage(project)
    writeStore(project, "spec")
    writeFile(project, `${processFolder}/spec.md`, specText())
    const dashboard = await openInstalledDashboard()
    expect(dashboard).not.toBe("")

    const answer = await post(dashboard, `/${processId}/accept-spec`, {}, { Origin: dashboard })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(ownProcess(project).stage).toBe("cases")
  })
})
