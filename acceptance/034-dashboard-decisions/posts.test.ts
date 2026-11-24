import { existsSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, readFile, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { approvalFile, kari, processFolder, processId, timeForm, versionsFolder } from "../024-named-owner-and-approval/approval.ts"
import { request, tree } from "../026-reading-view-on-localhost/view.ts"
import { post, send } from "../027-reader-feedback/feedback.ts"
import { entry as regeneratedEntry, preparePublished, reasonsFile } from "../031-controlled-regeneration/regeneration.ts"
import { openDashboard, refresh, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { backLink, firstLine, notDone, ownProcess, ownerFile, prepareApproval, prepareClarify, preparePublishedQuiet, secondLine, writeStore } from "./decisions.ts"

const address = (action: string): string => `/${processId}/${action}`
const emptyAnswers: [string, Record<string, string>][] = [
  ["both fields empty", { "answer-1": "", "answer-2": "" }],
  ["both fields of whitespace only", { "answer-1": "  \r\n ", "answer-2": "\t" }],
  ["no field", {}],
]
const notOwner =`<li>process-factory: cannot approve ${processId}: --by does not name its owner</li>`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The process in `spec` with a specification of which every section is decided. */
function prepareDecidedSpec(): void {
  writeStore(project, "spec")
  writeFile(project, `${processFolder}/spec.md`, specText())
}

describe("POST /<process-id>/answer", () => {
  it("stores the answers in the form of the skill, Not known. for a field left empty, sends the browser back to the panel and moves the process to spec", async () => {
    prepareClarify(project)

    const answer = await post(await openDashboard(project), address("answer"), { "answer-1": "  The IT manager.\r\n", "answer-2": "" })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(answer.body).toBe("")
    expect(readFile(project, `${processFolder}/answers-2.md`)).toBe(
      "# Answers 2\n\n## 1. Who decides that the police are called?\n\nThe IT manager.\n\n## 2. How long may the laptop stay unblocked?\n\nNot known.\n",
    )
    expect(ownProcess(project).stage).toBe("spec")
  })

  it.each(emptyAnswers)("answers 400 with the page Not done and stores nothing with %s", async (_name, values) => {
    prepareClarify(project)
    const before = tree(project)

    const answer = await post(await openDashboard(project), address("answer"), values)

    expect(answer.status).toBe(400)
    expect(answer.body).toContain("<title>Not done</title>")
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain("<li>Answer at least one question.</li>")
    expect(answer.body).toContain(backLink)
    expect(answer.body).not.toContain('http-equiv="refresh"')
    expect(tree(project)).toEqual(before)
  })
})

describe("POST /<process-id>/accept-spec", () => {
  it("accepts a specification of which every section is decided: the process is in cases with the time on the board", async () => {
    prepareDecidedSpec()

    const answer = await post(await openDashboard(project), address("accept-spec"), {})

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(ownProcess(project).stage).toBe("cases")
    expect(ownProcess(project).specAcceptedAt).toMatch(timeForm)
  })

  it("answers 409 with the line of the command line for a process in another stage, and changes no file", async () => {
    writeStore(project, "draft")
    writeFile(project, `${processFolder}/spec.md`, specText())
    const before = tree(project)

    const answer = await post(await openDashboard(project), address("accept-spec"), {})

    expect(answer.status).toBe(409)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(`<li>process-factory: cannot accept the spec of ${processId}: it is in the stage draft, not in spec</li>`)
    expect(tree(project)).toEqual(before)
  })

  it("refuses a post from another origin with 403 and changes nothing, and carries out the same post from the dashboard itself", async () => {
    prepareDecidedSpec()
    const before = tree(project)
    const dashboard = await openDashboard(project)

    const foreign = await post(dashboard, address("accept-spec"), {}, { Origin: "http://evil.example" })

    expect(foreign.status).toBe(403)
    expect(foreign.body).toContain(notDone)
    expect(foreign.body).toContain("<li>A decision can only be sent from the dashboard itself.</li>")
    expect(tree(project)).toEqual(before)

    const own = await post(dashboard, address("accept-spec"), {}, { Origin: dashboard })

    expect(own.status).toBe(303)
    expect(ownProcess(project).stage).toBe("cases")
  })
})

describe("POST /<process-id>/approve", () => {
  it("approves the newest draft as its owner and publishes it as version 1 with the same click", async () => {
    prepareApproval(project)

    const answer = await post(await openDashboard(project), address("approve"), { by: kari })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(readFile(project, approvalFile(2))).toContain(`Approved by: ${kari}\n`)
    expect(readFile(project, `${versionsFolder}/1/process.md`)).toBe(readFile(project, `${processFolder}/drafts/draft-2.md`))
    expect(readFile(project, `${versionsFolder}/1/process.md`)).toContain("Draft 2.")
    expect(ownProcess(project).stage).toBe("published")
    expect(ownProcess(project).versions).toEqual([{ version: 1, draft: "draft-2.md", approvedBy: kari, at: expect.stringMatching(timeForm) }])
  })

  it("answers 409 with the page Not done, the line of the command line and the link back for a name that is not the owner, and writes nothing", async () => {
    prepareApproval(project)
    const before = tree(project)

    const answer = await post(await openDashboard(project), address("approve"), { by: "Ola Hansen" })

    expect(answer.status).toBe(409)
    expect(answer.headers["content-type"]).toBe("text/html; charset=utf-8")
    expect(answer.headers["cache-control"]).toBe("no-store")
    expect(answer.headers["x-content-type-options"]).toBe("nosniff")
    expect(answer.headers["content-security-policy"]).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(answer.body.toLowerCase().startsWith("<!doctype html>")).toBe(true)
    expect(answer.body).toContain("<title>Not done</title>")
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(notOwner)
    expect(answer.body).toContain(backLink)
    expect(answer.body).not.toContain('http-equiv="refresh"')
    expect(answer.body).not.toContain("<script")
    expect(tree(project)).toEqual(before)
    expect(ownProcess(project).stage).toBe("approval")
  })

  it("answers 500 with the page Error and without the refresh element while the board cannot be read", async () => {
    writeFile(project, boardFile, "{ not json")

    const answer = await post(await openDashboard(project), address("approve"), { by: kari })

    expect(answer.status).toBe(500)
    expect(answer.body).toContain("<h1>Error</h1>")
    expect(answer.body).toContain("<p>The dashboard cannot read the processes.</p>")
    expect(answer.body).not.toContain(refresh)
  })
})

describe("POST /<process-id>/send-back", () => {
  it("stores the lines of the note as findings of the owner with the newest recorded round and moves the process to rework", async () => {
    prepareApproval(project)

    const answer = await post(await openDashboard(project), address("send-back"), { note: `${firstLine}\r\n${secondLine}` })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    const stored = readFile(project, ownerFile)
    expect(stored.startsWith("# Findings of the owner\n")).toBe(true)
    expect(stored).toContain("\nRound: 2\n")
    expect(stored.endsWith(`\nVerdict: CHANGES\n\n- [high] ${firstLine}\n- [high] ${secondLine}\n`)).toBe(true)
    expect(ownProcess(project).stage).toBe("rework")
  })

  it("answers 409 with the line of the command line for an empty note, and changes nothing", async () => {
    prepareApproval(project)
    const before = tree(project)

    const answer = await post(await openDashboard(project), address("send-back"), { note: " \r\n " })

    expect(answer.status).toBe(409)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(`<li>process-factory: cannot send ${processId} back to rework: the note is empty</li>`)
    expect(tree(project)).toEqual(before)
  })

  it("answers 413 for a post of more than 32768 bytes, and changes nothing", async () => {
    prepareApproval(project)
    const before = tree(project)

    const answer = await send(await openDashboard(project), address("send-back"), `note=${"x".repeat(40_000)}`)

    expect(answer.status).toBe(413)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain("<li>The decision is too long.</li>")
    expect(tree(project)).toEqual(before)
  })

  it("never lets a shell read a note or a name: the note is stored as it was typed, the name is refused, and no file is made", async () => {
    prepareApproval(project)
    const dashboard = await openDashboard(project)
    const quoted = '"; echo hacked > hacked.txt; "'
    const substituted = "$(touch hacked.txt)"

    const refused = await post(dashboard, address("approve"), { by: `${substituted} & echo hacked > hacked.txt` })

    expect(refused.status).toBe(409)
    expect(refused.body).toContain(notOwner)

    const sent = await post(dashboard, address("send-back"), { note: `${quoted}\n${substituted}` })

    expect(sent.status).toBe(303)
    expect(readFile(project, ownerFile).endsWith(`\n- [high] ${quoted}\n- [high] ${substituted}\n`)).toBe(true)
    expect(existsSync(path.join(project, "hacked.txt"))).toBe(false)
    expect(Object.keys(tree(project)).filter((file) => file.includes("hacked"))).toEqual([])
  })
})

describe("POST /<process-id>/regenerate", () => {
  it("starts a regeneration of a published process that has open feedback", async () => {
    preparePublished(project)

    const answer = await post(await openDashboard(project), address("regenerate"), {})

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(regeneratedEntry(project).stage).toBe("regenerate")
    expect(readFile(project, reasonsFile)).toContain("- feedback-1.md\n")
  })

  it("answers 409 with the line of move for a published process with nothing to regenerate it for, which stays published", async () => {
    preparePublishedQuiet(project)
    const before = tree(project)

    const answer = await post(await openDashboard(project), address("regenerate"), {})

    expect(answer.status).toBe(409)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(
      `<li>process-factory: cannot move ${processId} from published to regenerate: there is nothing to regenerate it for: no open feedback, no case newer than version 1 and no changed dependency</li>`,
    )
    expect(tree(project)).toEqual(before)
    expect(ownProcess(project).stage).toBe("published")
  })
})

describe("the addresses of the dashboard", () => {
  it("take a post only at the five decisions of a process on the board: every other post, and PUT of a decision, is 405 with Allow: GET, HEAD, and GET of a decision is 404", async () => {
    prepareApproval(project)
    const before = tree(project)
    const dashboard = await openDashboard(project)

    const decision = await post(dashboard, address("approve"), { by: "Ola Hansen" })
    expect(decision.status).toBe(409)

    const refused: [string, string][] = [
      ["POST", `/${processId}`],
      ["POST", "/"],
      ["POST", address("publish")],
      ["POST", "/003-not-on-the-board/approve"],
      ["PUT", address("approve")],
    ]
    for (const [method, pathname] of refused) {
      const answer = await send(dashboard, pathname, `by=${encodeURIComponent(kari)}`, { method })
      expect(answer.status).toBe(405)
      expect(answer.headers.allow).toBe("GET, HEAD")
      expect(answer.body).toBe("")
    }
    const page = await request(dashboard, address("approve"))
    expect(page.status).toBe(404)
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(tree(project)).toEqual(before)
  })
})
