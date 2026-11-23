import { mkdirSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, history, processes, readFile, runCommand, writeFile, writeOpenFeedback, writeRegeneratedDraft } from "../006-process-state-machine/store.ts"
import { approvalFile, approve, kari, olderEntry, prepareApproval, processFolder, processId, writeDrafts, writeProcess } from "../024-named-owner-and-approval/approval.ts"
import { backToApproval, caseText, ownStored, prepareApproved, publish, specText, storedVersions, versionFolder, writeSpecAndCases } from "./versions.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

/** The content of every file of a version, by its path in the version folder. */
function versionFiles(number: number): Record<string, string> {
  const folder = versionFolder(number)
  const files: Record<string, string> = {}
  for (const name of entries(project, folder)) {
    if (name === "cases") {
      for (const stored of entries(project, `${folder}/cases`)) {
        files[`cases/${stored}`] = readFile(project, `${folder}/cases/${stored}`)
      }
    } else {
      files[name] = readFile(project, `${folder}/${name}`)
    }
  }
  return files
}

describe("process-factory move <process-id> published and the version it writes", () => {
  it("prints published and creates versions/1 with process.md, spec.md, approval.md and the cases", () => {
    prepareApproved(project)

    const result = publish(project)

    expect(result.stdout).toBe("published\n")
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, versionFolder(1))).toEqual(["approval.md", "cases", "process.md", "spec.md"])
    expect(entries(project, `${versionFolder(1)}/cases`)).toEqual(["case-1.md", "case-2.md"])
  })

  it("copies the newest draft, the spec, every case and the approval byte for byte, and leaves the originals where they were", () => {
    prepareApproved(project)
    const draft = readFile(project, `${processFolder}/drafts/draft-3.md`)
    const approval = readFile(project, approvalFile(3))
    expect(approval).toContain("Approved by: Kari Nordmann")

    expect(publish(project).status).toBe(0)

    expect(versionFiles(1)).toEqual({
      "approval.md": approval,
      "cases/case-1.md": caseText(1),
      "cases/case-2.md": caseText(2),
      "process.md": draft,
      "spec.md": specText,
    })
    expect(readFile(project, `${processFolder}/drafts/draft-3.md`)).toBe(draft)
    expect(entries(project, `${processFolder}/drafts`)).toEqual(["draft-1.md", "draft-2.md", "draft-3.md"])
    expect(readFile(project, `${processFolder}/spec.md`)).toBe(specText)
    expect(entries(project, `${processFolder}/cases`)).toEqual(["case-1.md", "case-2.md"])
    expect(readFile(project, approvalFile(3))).toBe(approval)
  })

  it("does not copy a file of cases/ whose name is not of the form case-<k>.md", () => {
    prepareApproved(project)
    writeFile(project, `${processFolder}/cases/notes.md`, "Notes.\n")

    expect(publish(project).status).toBe(0)

    expect(entries(project, `${versionFolder(1)}/cases`)).toEqual(["case-1.md", "case-2.md"])
  })

  it("publishes a process without spec.md and without cases as a version with approval.md, an empty cases folder and process.md", () => {
    prepareApproval(project, [1])
    approve(project, kari)

    const result = publish(project)

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(entries(project, versionFolder(1))).toEqual(["approval.md", "cases", "process.md"])
    expect(entries(project, `${versionFolder(1)}/cases`)).toEqual([])
    expect(readFile(project, `${versionFolder(1)}/process.md`)).toBe(readFile(project, `${processFolder}/drafts/draft-1.md`))
  })
})

describe("process-factory move <process-id> published and the list versions on the board", () => {
  it("stores the version with its draft, who approved it and the time of the history entry, next to the stage and the dependencies", () => {
    prepareApproved(project)

    expect(publish(project).status).toBe(0)

    const entry = ownStored(project)
    const published = history(entry).at(-1)
    expect(published?.stage).toBe("published")
    expect(storedVersions(project)).toEqual([{ version: 1, draft: "draft-3.md", approvedBy: "Kari Nordmann", at: published?.at }])
    expect(entry?.stage).toBe("published")
    expect(entry?.owner).toBe(kari)
    expect(entry?.dependencies).toEqual([{ kind: "Role", name: "Data protection officer", hash: expect.stringMatching(/^[0-9a-f]{64}$/) as unknown }])
    expect(processes(project)[0]).toEqual(olderEntry)
  })

  it("leaves approvedBy out when the approval file has no line that starts with Approved by:", () => {
    prepareApproval(project, [1])
    writeFile(project, approvalFile(1), "# Approval of draft-1.md\n")

    expect(publish(project).status).toBe(0)

    const versions = storedVersions(project)
    expect(versions).toHaveLength(1)
    expect(Object.keys(versions[0] ?? {}).sort()).toEqual(["at", "draft", "version"])
    expect(versions[0]).toMatchObject({ version: 1, draft: "draft-1.md" })
    expect(readFile(project, `${versionFolder(1)}/approval.md`)).toBe("# Approval of draft-1.md\n")
  })
})

describe("a second publication", () => {
  it("writes versions/2 for the same draft with the spec and the cases as they are then, and leaves versions/1 as it was", () => {
    prepareApproved(project)
    publish(project)
    const first = versionFiles(1)
    expect(Object.keys(first)).toHaveLength(5)
    backToApproval(project)
    const changedSpec = `${specText}- Role: Head of IT\n`
    writeFile(project, `${processFolder}/spec.md`, changedSpec)
    writeFile(project, `${processFolder}/cases/case-3.md`, caseText(3))

    const result = publish(project)

    expect(result.stdout).toBe("published\n")
    expect(result.status).toBe(0)
    expect(versionFiles(2)).toEqual({ ...first, "spec.md": changedSpec, "cases/case-3.md": caseText(3) })
    expect(versionFiles(1)).toEqual(first)
    expect(storedVersions(project).map((stored) => [stored.version, stored.draft])).toEqual([
      [1, "draft-3.md"],
      [2, "draft-3.md"],
    ])
  })

  it("writes versions/2 from a new draft and its approval, and keeps draft-3.md as versions/1/process.md", () => {
    prepareApproved(project)
    publish(project)
    const third = readFile(project, `${processFolder}/drafts/draft-3.md`)
    backToApproval(project)
    writeDrafts(project, [4])
    expect(approve(project, kari).status).toBe(0)

    expect(publish(project).status).toBe(0)

    expect(readFile(project, `${versionFolder(2)}/process.md`)).toBe(readFile(project, `${processFolder}/drafts/draft-4.md`))
    expect(readFile(project, `${versionFolder(2)}/approval.md`)).toBe(readFile(project, approvalFile(4)))
    expect(readFile(project, `${versionFolder(2)}/approval.md`)).toContain("Draft: draft-4.md")
    expect(readFile(project, `${versionFolder(1)}/process.md`)).toBe(third)
    expect(storedVersions(project).map((stored) => [stored.version, stored.draft])).toEqual([
      [1, "draft-3.md"],
      [2, "draft-4.md"],
    ])
  })
})

describe("the number of a version", () => {
  it("is above a folder versions/1 that is already there, which stays as it was", () => {
    prepareApproved(project)
    writeFile(project, `${versionFolder(1)}/kept.md`, "Kept.\n")

    expect(publish(project).status).toBe(0)

    expect(entries(project, versionFolder(1))).toEqual(["kept.md"])
    expect(readFile(project, `${versionFolder(1)}/kept.md`)).toBe("Kept.\n")
    expect(entries(project, versionFolder(2))).toEqual(["approval.md", "cases", "process.md", "spec.md"])
    expect(storedVersions(project).map((stored) => stored.version)).toEqual([2])
  })

  it("is above the versions the board lists, also when their folders are not on disk", () => {
    const listed = [
      { version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-11-20T18:00:00.000Z" },
      { version: 2, draft: "draft-2.md", approvedBy: kari, at: "2026-11-20T19:00:00.000Z" },
    ]
    writeProcess(project, "approval", { owner: kari, versions: listed })
    writeDrafts(project, [1, 2, 3])
    writeSpecAndCases(project)
    approve(project, kari)

    expect(publish(project).status).toBe(0)

    expect(entries(project, `${processFolder}/versions`)).toEqual(["3", "approval-draft-3.md"])
    const versions = storedVersions(project)
    expect(versions.slice(0, 2)).toEqual(listed)
    expect(versions[2]).toMatchObject({ version: 3, draft: "draft-3.md", approvedBy: kari })
    expect(versions).toHaveLength(3)
  })
})

describe("a publication that cannot write its version", () => {
  it("names the version folder, exits with 1 and leaves the board byte for byte as it was", () => {
    prepareApproval(project)
    writeSpecAndCases(project, [2])
    mkdirSync(path.join(project, processFolder, "cases/case-1.md"))
    approve(project, kari)
    const before = readFile(project, boardFile)

    const result = publish(project)

    expect(result.stderr.startsWith(`process-factory: cannot write ${versionFolder(1)}: `)).toBe(true)
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readFile(project, boardFile)).toBe(before)
  })
})

describe("a refused move to published and a move to another stage", () => {
  it("write no version and leave the list versions as it was", () => {
    prepareApproved(project)
    publish(project)
    const versions = storedVersions(project)
    expect(versions).toHaveLength(1)
    const stored = ["1", "approval-draft-3.md"]
    expect(entries(project, `${processFolder}/versions`)).toEqual(stored)

    writeOpenFeedback(project, processId)
    for (const stage of ["regenerate", "review", "approval"]) {
      if (stage === "review") writeRegeneratedDraft(project, processId, 4, ["feedback-1.md"])
      expect(runCommand(project, ["move", processId, stage]).status).toBe(0)
      expect(storedVersions(project)).toEqual(versions)
      expect(entries(project, `${processFolder}/versions`)).toEqual(stored)
    }

    writeDrafts(project, [4])
    const refused = publish(project)
    expect(refused.status).toBe(1)
    expect(refused.stderr).toContain("the newest draft has no approval")
    expect(storedVersions(project)).toEqual(versions)
    expect(entries(project, `${processFolder}/versions`)).toEqual(stored)

    expect(runCommand(project, ["move", processId, "rework"]).status).toBe(0)
    expect(storedVersions(project)).toEqual(versions)
    expect(entries(project, `${processFolder}/versions`)).toEqual(stored)
  })
})
