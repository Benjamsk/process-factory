import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { approvalFile, kari, ownEntry, processFolder, processId, rolesFile, rolesText } from "../024-named-owner-and-approval/approval.ts"
import { compact, request } from "../026-reading-view-on-localhost/view.ts"
import { prepareInApproval } from "../031-controlled-regeneration/regeneration.ts"
import { entry, firstQuestion, openDashboard, questionsText, secondQuestion, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { openPanel, part } from "../033-dashboard-process-page/panel.ts"
import { acceptForm, answerForm, approveForm, decision, prepareApproval, prepareClarify, preparePublishedQuiet, regenerateForm, sendBackForm, waitSentence, writeStore } from "./decisions.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The panel of a process on the dashboard of the project. */
async function panelOfProcess(id = processId): Promise<string> {
  return (await openPanel(await openDashboard(project), id)).panel
}

/** The ids of the sections of a panel, in order. */
function sectionIds(panel: string): string[] {
  return [...panel.matchAll(/<section id="([^"]*)">/g)].map((match) => match[1] ?? "")
}

/** The addresses of the links in the `<nav>` of a panel, in order. */
function navLinks(panel: string): string[] {
  const nav = /<nav>(.*?)<\/nav>/s.exec(panel)?.[1] ?? ""
  return [...nav.matchAll(/<a href="([^"]*)">/g)].map((match) => match[1] ?? "")
}

describe("the panel of a process in clarify", () => {
  it("starts its links and its sections with Decision, which holds one empty field per open question, the sentence about an empty field and the button Store the answers", async () => {
    prepareClarify(project)

    const panel = await panelOfProcess()

    expect(compact(panel)).toContain('<nav><ul><li><a href="#decision">Decision</a></li><li><a href="#timeline">Timeline</a></li>')
    expect(navLinks(panel)).toEqual(["#decision", "#timeline", "#spec", "#cases", "#draft", "#rounds", "#versions", "#feedback"])
    expect(sectionIds(panel)).toEqual(["decision", "timeline", "spec", "cases", "draft", "rounds", "versions", "feedback"])
    expect(part(panel, "decision")).toBe(decision(answerForm([firstQuestion, secondQuestion])))
  })

  it("escapes a question in its label", async () => {
    prepareClarify(project, ["Who calls <the police> & when?"])

    const { body, panel } = await openPanel(await openDashboard(project), processId)

    expect(part(panel, "decision")).toContain('<label for="answer-1">1. Who calls &lt;the police&gt; &amp; when?</label>')
    expect(body).not.toContain("<the police>")
  })
})

describe("the panel of a process in spec", () => {
  it("holds the button Accept the specification when every section is decided, and no decision and no form with an open section or without spec.md", async () => {
    writeStore(project, "spec")
    writeFile(project, `${processFolder}/spec.md`, specText())
    const address = await openDashboard(project)

    const decided = (await openPanel(address, processId)).panel

    expect(sectionIds(decided)[0]).toBe("decision")
    expect(part(decided, "decision")).toBe(decision(acceptForm))

    writeFile(project, `${processFolder}/spec.md`, specText(["Scope"]))
    const open = (await openPanel(address, processId)).panel
    expect(open).not.toContain('id="decision"')
    expect(open).not.toContain("<form")

    writeBoard(project, [ownEntry("spec"), entry("002-no-specification", "No specification", "spec")])
    const without = (await openPanel(address, "002-no-specification")).panel
    expect(without).not.toContain('id="decision"')
    expect(without).not.toContain("<form")
  })
})

describe("the panel of a process in approval", () => {
  it("holds a field for the full name without a value and the button Approve and publish, and then a field for a note and the button Send back for one more round", async () => {
    prepareApproval(project)

    const panel = await panelOfProcess()

    expect(sectionIds(panel)[0]).toBe("decision")
    expect(part(panel, "decision")).toBe(decision(approveForm, sendBackForm))
    expect(part(panel, "decision")).not.toContain("value=")
    expect(part(panel, "decision")).not.toContain(kari)
    expect(part(panel, "decision")).not.toContain("changes-")
  })

  it("says that a process without an owner cannot be approved here, with the send back form and without the approve form", async () => {
    prepareApproval(project, { owner: undefined })

    const panel = await panelOfProcess()

    const noOwner = `<p>This process has no owner, so its draft cannot be approved here. /process next ${processId} in Claude Code names one.</p>`
    expect(part(panel, "decision")).toBe(decision(noOwner, sendBackForm))
    expect(panel).not.toContain(`action="/${processId}/approve"`)
  })

  it("says that the newest draft is already approved when its approval file is there, with the send back form and without the approve form", async () => {
    prepareApproval(project, {}, [1, 2, 3])
    writeFile(project, approvalFile(3), `# Approval of draft-3.md\n\nProcess: ${processId}\nDraft: draft-3.md\nApproved by: ${kari}\nApproved at: 2026-11-24T09:00:00.000Z\n`)

    const panel = await panelOfProcess()

    const approved = `<p>draft-3.md is already approved. /process next ${processId} in Claude Code publishes it.</p>`
    expect(part(panel, "decision")).toBe(decision(approved, sendBackForm))
    expect(panel).not.toContain(`action="/${processId}/approve"`)
  })

  it("shows the change list of the newest draft before the approve form while the process is being regenerated", async () => {
    prepareInApproval(project)

    const shown = part(await panelOfProcess(), "decision")

    expect(shown.startsWith("<h3>Decision</h3><p>changes-2.md</p><h4>Changes of draft-2.md against version 1</h4><h5>Change 1</h5>")).toBe(true)
    expect(shown).toContain("<li>Section: Steps</li>")
    expect(shown).toContain("<li>Reason: feedback-1.md</li>")
    expect(shown).toContain("<h5>Not changed</h5><h6>feedback-2.md</h6>")
    expect(shown.indexOf("<h6>feedback-2.md</h6>")).toBeLessThan(shown.indexOf(`<form method="post" action="/${processId}/approve">`))
    expect(shown.endsWith(compact(`${approveForm}${sendBackForm}${waitSentence}`))).toBe(true)
  })
})

describe("the panel of a published process", () => {
  it("holds the button Start a regeneration", async () => {
    preparePublishedQuiet(project)

    const panel = await panelOfProcess()

    expect(sectionIds(panel)[0]).toBe("decision")
    expect(navLinks(panel)[0]).toBe("#decision")
    expect(part(panel, "decision")).toBe(decision(regenerateForm))
  })
})

describe("the panels of a board", () => {
  it("have a decision only for a process that waits for a person: not in intake, cases, draft, review, rework and regenerate, not in clarify without an open question, and the board has no form", async () => {
    const quiet = ["intake", "clarify", "cases", "draft", "review", "rework", "regenerate"]
    writeFile(project, rolesFile, rolesText)
    writeBoard(project, [ownEntry("approval", { owner: kari }), ...quiet.map((stage, index) => entry(`01${String(index)}-in-${stage}`, `In ${stage}`, stage))])
    writeFile(project, "processes/011-in-clarify/questions-1.md", questionsText(1, [firstQuestion]))
    writeFile(project, "processes/011-in-clarify/answers-1.md", "# Answers 1\n\n## 1. Who decides that the police are called?\n\nNot known.\n")
    const address = await openDashboard(project)

    const waiting = (await openPanel(address, processId)).panel
    expect(sectionIds(waiting)).toHaveLength(8)
    expect(sectionIds(waiting)[0]).toBe("decision")
    expect(waiting).toContain("<form")

    for (const [index, stage] of quiet.entries()) {
      const panel = (await openPanel(address, `01${String(index)}-in-${stage}`)).panel
      expect(panel).not.toContain('id="decision"')
      expect(panel).not.toContain("<form")
      expect(navLinks(panel)).toEqual(["#timeline", "#spec", "#cases", "#draft", "#rounds", "#versions", "#feedback"])
      expect(sectionIds(panel)).toEqual(["timeline", "spec", "cases", "draft", "rounds", "versions", "feedback"])
    }
    expect((await request(address, "/")).body).not.toContain("<form")
  })
})
