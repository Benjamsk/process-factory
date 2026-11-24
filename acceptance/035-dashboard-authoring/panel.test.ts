import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder } from "../006-process-state-machine/store.ts"
import { processId } from "../024-named-owner-and-approval/approval.ts"
import { compact, request } from "../026-reading-view-on-localhost/view.ts"
import { cardOf, openDashboard, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { openPanel, part } from "../033-dashboard-process-page/panel.ts"
import { prepare } from "./authoring.ts"

const specLink = `<p><a href="/${processId}/edit/spec.md">Edit spec.md</a></p>`
const caseLink = (number: number): string => `<p><a href="/${processId}/edit/case-${String(number)}.md">Edit case-${String(number)}.md</a></p>`
const regeneration = { version: 1, round: 0, at: "2026-11-23T09:00:00.000Z" }

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** What stands inside every `<article>` of a part of the panel, in order. */
function articles(html: string): string[] {
  return [...html.matchAll(/<article>(.*?)<\/article>/gs)].map((match) => match[1] ?? "")
}

describe("the panel of a process whose specification and cases can be edited", () => {
  it.each(["spec", "cases", "draft", "review", "rework", "approval"])("has the link Edit spec.md above the specification and a link Edit case-<n>.md above each case, in %s", async (stage) => {
    prepare(project, stage)

    const { panel } = await openPanel(await openDashboard(project), processId)

    expect(part(panel, "spec").startsWith(`<h3>Specification</h3>${specLink}<h4>Specification: Handle a lost laptop</h4>`)).toBe(true)
    const cases = articles(part(panel, "cases"))
    expect(cases).toHaveLength(2)
    expect(cases[0]?.startsWith(`${caseLink(1)}<h4>Case 1: Laptop 1</h4>`)).toBe(true)
    expect(cases[1]?.startsWith(`${caseLink(2)}<h4>Case 2: Laptop 2</h4>`)).toBe(true)
    expect(panel.split("/edit/")).toHaveLength(4)
  })

  it("has no such link for a process in intake, clarify, published or regenerate, and for a process in review that is being regenerated", async () => {
    prepare(project, "rework")
    const address = await openDashboard(project)
    expect((await openPanel(address, processId)).panel).toContain(specLink)

    const closed: [string, Record<string, unknown>][] = [
      ["intake", {}],
      ["clarify", {}],
      ["published", {}],
      ["regenerate", { regeneration }],
      ["review", { regeneration }],
    ]
    for (const [stage, more] of closed) {
      prepare(project, stage, more)
      const { panel } = await openPanel(address, processId)
      expect(compact(panel)).toContain(`<dt>Stage</dt><dd>${stage}</dd>`)
      expect(panel).not.toContain("/edit/")
      expect(part(panel, "spec").startsWith("<h3>Specification</h3><h4>Specification: Handle a lost laptop</h4>")).toBe(true)
    }
  })
})

describe("the mark that a process needs a new draft", () => {
  it("stands on the card directly after the id and in the panel directly before the links, and nowhere for a process without it", async () => {
    prepare(project, "draft", { needsDraft: ["spec.md", "case-2.md"] })
    const address = await openDashboard(project)
    const mark = "<p>Needs a new draft: spec.md, case-2.md</p>"

    const board = (await request(address, "/")).body
    const { panel } = await openPanel(address, processId)

    expect(cardOf(board, processId).startsWith(`<h3><a href="/${processId}">Handle a lost laptop</a></h3><p>${processId}</p>${mark}<dl>`)).toBe(true)
    expect(compact(panel)).toContain(`</dl>${mark}<nav>`)

    prepare(project, "draft")
    expect((await request(address, "/")).body).not.toContain("Needs a new draft")
    expect((await openPanel(address, processId)).body).not.toContain("Needs a new draft")
  })
})

describe("the timeline of the panel", () => {
  it("shows an edit with its stage, its file and the escaped name of the person, and a stage move as before", async () => {
    prepare(project, "draft", {
      history: [
        { at: "2026-11-22T10:00:00.000Z", stage: "rework" },
        { at: "2026-11-24T12:00:00.000Z", stage: "draft", edited: "spec.md", by: "Kari <Nordmann>" },
      ],
    })

    const { body, panel } = await openPanel(await openDashboard(project), processId)

    expect(part(panel, "timeline")).toBe(
      compact(`
        <h3>Timeline</h3>
        <ol>
        <li><time>2026-11-22T10:00:00.000Z</time> rework</li>
        <li><time>2026-11-24T12:00:00.000Z</time> draft, spec.md edited by Kari &lt;Nordmann&gt;</li>
        </ol>`),
    )
    expect(body).not.toContain("<Nordmann>")
  })
})
