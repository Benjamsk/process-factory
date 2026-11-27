import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { processFolder, processId } from "../024-named-owner-and-approval/approval.ts"
import { compact, request, tree } from "../026-reading-view-on-localhost/view.ts"
import { post } from "../027-reader-feedback/feedback.ts"
import { laptopId, laptopTitle, openDashboard, refresh, round, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { fullEntry, headerOf, mainOf, parts, reloadSentence, stillSentence, writeFullFiles } from "../033-dashboard-process-page/panel.ts"
import { ownProcess, prepareApproval, prepareClarify, preparePublishedQuiet, writeStore } from "../034-dashboard-decisions/decisions.ts"

const others = parts.filter(([id]) => id !== "decision")

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The dashboard of the process of the spec's examples, in `rework` unless `more` says otherwise, with all its files. */
async function fullDashboard(more: Record<string, unknown> = {}): Promise<string> {
  writeBoard(project, [fullEntry(more)])
  writeFullFiles(project)
  return openDashboard(project)
}

/** The tabs of a header that are marked as the current page, as their texts. */
function currentTabs(header: string): string[] {
  const nav = /<nav>(.*?)<\/nav>/s.exec(header)?.[1] ?? ""
  return [...nav.matchAll(/<a href="[^"]*" aria-current="page">(.*?)<\/a>/g)].map((match) => match[1] ?? "")
}

/** A header without the mark of the current tab. */
function unmarked(header: string): string {
  return compact(header).replaceAll(' aria-current="page"', "")
}

/** The draft part of a page: the addresses of its list, the one that is marked, and its facts. */
function draftPart(body: string): { links: string[]; chosen: string[]; facts: string } {
  const shown = compact(mainOf(body))
  const list = /<ul>(.*?)<\/ul>/s.exec(shown)?.[1] ?? ""
  return {
    links: [...list.matchAll(/<a href="([^"]*)"/g)].map((match) => match[1] ?? ""),
    chosen: [...list.matchAll(/<a href="[^"]*" aria-current="page">(.*?)<\/a>/g)].map((match) => match[1] ?? ""),
    facts: /<dl>.*?<\/dl>/s.exec(shown)?.[0] ?? "",
  }
}

describe("the page of a process at /<process-id>", () => {
  it("shows the part Decision under the header, with the tab Decision as the current one and the title of the process as its title", async () => {
    const address = await fullDashboard()

    const page = await request(address, `/${laptopId}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain(`<title>${laptopTitle}</title>`)
    expect(compact(headerOf(page.body)).startsWith(`<p><a href="/">Back to the board</a></p><h1>${laptopTitle}</h1><p>${laptopId}</p><dl><dt>Stage</dt><dd>rework</dd>`)).toBe(true)
    expect(currentTabs(headerOf(page.body))).toEqual(["Decision"])
    expect(compact(mainOf(page.body))).toBe("<h2>Decision</h2><p>There is nothing to decide here now.</p>")
    expect(page.body.split("<h1>")).toHaveLength(2)
  })
})

describe("the page of a process at /<process-id>/<part>", () => {
  it.each(others)("shows only the part %s under its heading %s, with the same header, its own tab as the current one and its heading in the title", async (id, heading) => {
    const address = await fullDashboard()
    const first = await request(address, `/${laptopId}`)

    const page = await request(address, `/${laptopId}/${id}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain(`<title>${laptopTitle}: ${heading}</title>`)
    expect(headerOf(first.body)).not.toBe("")
    expect(unmarked(headerOf(page.body))).toBe(unmarked(headerOf(first.body)))
    expect(currentTabs(headerOf(page.body))).toEqual([heading])
    expect(compact(mainOf(page.body)).startsWith(`<h2>${heading}</h2>`)).toBe(true)
    expect(page.body.split("<h2>")).toHaveLength(2)
    expect(page.body.split("<h1>")).toHaveLength(2)
    expect(page.body).not.toContain("<aside")
  })

  it("shows nothing of the other parts on the page of one part", async () => {
    const address = await fullDashboard()

    const versions = await request(address, `/${laptopId}/versions`)
    const cases = await request(address, `/${laptopId}/cases`)

    expect(versions.status).toBe(200)
    expect(versions.body).toContain("<td>draft-16.md</td>")
    expect(versions.body).not.toContain("Step of draft 3.")
    expect(versions.body).not.toContain("An employee reports that a laptop is lost.")
    expect(versions.body).not.toContain("Round 2")
    expect(cases.body).toContain("The laptop of case 9 is lost.")
    expect(cases.body).not.toContain("<td>draft-16.md</td>")
    expect(cases.body).not.toContain("The process takes too long.")
  })
})

describe("the part Draft", () => {
  it("shows an earlier draft at /<process-id>/draft/<n>, with its number, the round it was reviewed in and its whole text, and nothing of another draft", async () => {
    const address = await fullDashboard()

    const page = await request(address, `/${laptopId}/draft/2`)

    expect(page.status).toBe(200)
    expect(page.body).toContain(`<title>${laptopTitle}: Draft</title>`)
    expect(currentTabs(headerOf(page.body))).toEqual(["Draft"])
    const shown = draftPart(page.body)
    expect(shown.links).toEqual([3, 2, 1].map((number) => `/${laptopId}/draft/${String(number)}`))
    expect(shown.chosen).toEqual(["draft-2.md"])
    expect(shown.facts).toBe("<dl><dt>Draft</dt><dd>2</dd><dt>Reviewed in</dt><dd>round 2</dd></dl>")
    expect(compact(mainOf(page.body)).endsWith('</dl><h3>Handle a lost laptop</h3><h4>Steps</h4><ol><li value="1">Step of draft 2.</li></ol>')).toBe(true)
    expect(page.body).not.toContain("Step of draft 3.")
    expect(page.body).not.toContain("Step of draft 1.")
  })

  it("shows the newest draft at /<process-id>/draft and at the address of its number alike, and says that no round reviewed it yet", async () => {
    const address = await fullDashboard()

    const newest = await request(address, `/${laptopId}/draft`)
    const third = await request(address, `/${laptopId}/draft/3`)

    expect(newest.status).toBe(200)
    expect(third.status).toBe(200)
    expect(draftPart(newest.body).chosen).toEqual(["draft-3.md"])
    expect(draftPart(newest.body).facts).toBe("<dl><dt>Draft</dt><dd>3</dd><dt>Reviewed in</dt><dd>no round yet</dd></dl>")
    expect(mainOf(third.body)).toBe(mainOf(newest.body))
  })

  it("names every round that reviewed the draft, in ascending order", async () => {
    const address = await fullDashboard({ rounds: [round(1), { ...round(2), draft: "draft-1.md" }, { ...round(3), draft: "draft-3.md" }] })

    expect(draftPart((await request(address, `/${laptopId}/draft/1`)).body).facts).toBe("<dl><dt>Draft</dt><dd>1</dd><dt>Reviewed in</dt><dd>round 1, round 2</dd></dl>")
    expect(draftPart((await request(address, `/${laptopId}/draft/2`)).body).facts).toBe("<dl><dt>Draft</dt><dd>2</dd><dt>Reviewed in</dt><dd>no round yet</dd></dl>")
    expect(draftPart((await request(address, `/${laptopId}/draft`)).body).facts).toBe("<dl><dt>Draft</dt><dd>3</dd><dt>Reviewed in</dt><dd>round 3</dd></dl>")
  })

  it("lists the drafts by their numbers, the newest first, also past the ninth", async () => {
    writeBoard(project, [fullEntry()])
    for (const number of [2, 9, 10]) writeFile(project, `processes/${laptopId}/drafts/draft-${String(number)}.md`, `# Draft ${String(number)}\n`)
    writeFile(project, `processes/${laptopId}/drafts/changes-10.md`, "# Changes\n")

    const page = await request(await openDashboard(project), `/${laptopId}/draft`)

    expect(page.status).toBe(200)
    expect(draftPart(page.body).links).toEqual([10, 9, 2].map((number) => `/${laptopId}/draft/${String(number)}`))
    expect(draftPart(page.body).chosen).toEqual(["draft-10.md"])
  })
})

describe("the addresses of a process", () => {
  it("answer 404 with the page Not found for a part that is none of the eight, a longer path and a draft that is not there, next to the drafts that are", async () => {
    const address = await fullDashboard()

    expect((await request(address, `/${laptopId}/draft/3`)).status).toBe(200)
    expect((await request(address, `/${laptopId}/draft/1`)).status).toBe(200)

    const missing = ["decision", "", "spec/more", "draft/0", "draft/4", "draft/03", "draft/x", "draft/3/more", "draft/..%2f..%2fspec", "panel"].map((rest) => `/${laptopId}/${rest}`)
    for (const pathname of [...missing, "/003-not-on-the-board/spec", "/003-not-on-the-board/draft/1"]) {
      const page = await request(address, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(page.body).not.toContain("<main>")
      expect(page.body).not.toContain("Step of draft")
    }
  })
})

describe("the reload of a page of a process", () => {
  it("stands on every part of a process that waits for nobody, with the sentence about the reload as the last line of the header", async () => {
    const address = await fullDashboard()

    for (const [id] of parts) {
      const page = await request(address, id === "decision" ? `/${laptopId}` : `/${laptopId}/${id}`)
      expect(page.status).toBe(200)
      expect(page.body).toContain(refresh)
      expect(compact(headerOf(page.body)).endsWith(`</nav>${reloadSentence}`)).toBe(true)
    }
    expect((await request(address, `/${laptopId}/draft/1`)).body).toContain(refresh)
  })

  it("is off on the part Decision while it holds a form, which says so, and on the edit page, and stays on at the other parts of that process", async () => {
    const address = await fullDashboard({ stage: "approval" })

    const decision = await request(address, `/${laptopId}`)
    const edit = await request(address, `/${laptopId}/edit/spec.md`)

    expect(decision.status).toBe(200)
    expect(mainOf(decision.body)).toContain("<form")
    expect(decision.body).not.toContain('http-equiv="refresh"')
    expect(decision.body).not.toContain("This page reloads every 5 seconds.")
    expect(compact(headerOf(decision.body)).endsWith(`</nav>${stillSentence}`)).toBe(true)
    expect(edit.status).toBe(200)
    expect(edit.body).not.toContain('http-equiv="refresh"')
    for (const [id] of others) {
      const page = await request(address, `/${laptopId}/${id}`)
      expect(page.body).toContain(refresh)
      expect(page.body).not.toContain("<form")
      expect(compact(headerOf(page.body)).endsWith(`</nav>${reloadSentence}`)).toBe(true)
    }
  })
})

describe("a verdict and a case result in the part Rounds", () => {
  it("stand in a badge with the word as its text: done for PASS, stop for CHANGES and FAIL, and no mark for another word, which is escaped", async () => {
    const rounds = [
      {
        round: 1,
        draft: "draft-1.md",
        at: "2026-11-21T10:00:00.000Z",
        verdicts: [
          { reviewer: "gdpr", verdict: "CHANGES" },
          { reviewer: "legal", verdict: "PASS" },
          { reviewer: "readability", verdict: "<b>MAYBE</b>" },
        ],
        cases: [
          { case: 1, result: "PASS" },
          { case: 2, result: "FAIL" },
          { case: 3, result: "done stop" },
        ],
      },
    ]
    const address = await fullDashboard({ rounds })

    const shown = compact(mainOf((await request(address, `/${laptopId}/rounds`)).body))

    expect(shown).toContain('<h4>gdpr: <span class="badge stop">CHANGES</span></h4>')
    expect(shown).toContain('<h4>legal: <span class="badge done">PASS</span></h4>')
    expect(shown).toContain('<h4>readability: <span class="badge">&lt;b&gt;MAYBE&lt;/b&gt;</span></h4>')
    expect(shown).toContain('<p>case 1 <span class="badge done">PASS</span>, case 2 <span class="badge stop">FAIL</span>, case 3 <span class="badge">done stop</span></p>')
    expect(shown).not.toContain("<b>")
  })
})

describe("the decisions and the edits of the dashboard", () => {
  it("post from the part Decision to the address they had, and a decision sends the browser back to the page of the process in its new stage", async () => {
    writeStore(project, "spec")
    writeFile(project, `${processFolder}/spec.md`, specText())
    const address = await openDashboard(project)

    const before = await request(address, `/${processId}`)
    expect(compact(mainOf(before.body)).startsWith(`<h2>Decision</h2><form method="post" action="/${processId}/accept-spec">`)).toBe(true)

    const answer = await post(address, `/${processId}/accept-spec`, {}, { Origin: address })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(ownProcess(project).stage).toBe("cases")
    const after = await request(address, answer.headers.location ?? "")
    expect(after.status).toBe(200)
    expect(compact(headerOf(after.body))).toContain("<dt>Stage</dt><dd>cases</dd>")
    expect(headerOf(after.body)).toContain('<li class="done">spec: passed</li>')
    expect(compact(mainOf(after.body))).toBe("<h2>Decision</h2><p>There is nothing to decide here now.</p>")
  })

  it.each([
    ["clarify", ["answer"]],
    ["approval", ["approve", "send-back"]],
    ["published", ["regenerate"]],
  ])("have their forms in the part Decision of a process in %s", async (stage, actions) => {
    if (stage === "clarify") prepareClarify(project)
    else if (stage === "approval") prepareApproval(project)
    else preparePublishedQuiet(project)

    const page = await request(await openDashboard(project), `/${processId}`)

    expect(page.status).toBe(200)
    expect([...mainOf(page.body).matchAll(/<form method="post" action="([^"]*)">/g)].map((match) => match[1])).toEqual(actions.map((action) => `/${processId}/${action}`))
    expect(headerOf(page.body)).not.toContain("<form")
  })

  it("reach the edit page from the links of the parts Specification and Cases, and reading the pages changes no file", async () => {
    const address = await fullDashboard()
    const before = tree(project)

    const specification = await request(address, `/${laptopId}/spec`)
    const cases = await request(address, `/${laptopId}/cases`)

    expect(mainOf(specification.body)).toContain(`<a href="/${laptopId}/edit/spec.md">Edit spec.md</a>`)
    expect(mainOf(cases.body)).toContain(`<a href="/${laptopId}/edit/case-9.md">Edit case-9.md</a>`)
    const edit = await request(address, `/${laptopId}/edit/spec.md`)
    expect(edit.status).toBe(200)
    expect(edit.body).toContain(`<form method="post" action="/${laptopId}/edit/spec.md">`)
    expect(edit.body).toContain(`<a href="/${laptopId}">Back to the process</a>`)
    expect(tree(project)).toEqual(before)
  })
})
