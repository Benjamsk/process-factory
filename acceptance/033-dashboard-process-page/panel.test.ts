import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { compact, firstDocument, laptopEntry as publishedEntry, openView, request, stopViews, tree, writeLaptopVersions } from "../026-reading-view-on-localhost/view.ts"
import { cardOf, cards, employeeId, employeeTitle, entry, kari, laptopId, laptopTitle, openDashboard, refresh, round, sections, stages, stagesOf, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { boardOf, caseHtml, findingsText, fullEntry, openPanel, panelOf, part, parts, reloadSentence, specText, stillSentence, stopReason, writeFullFiles } from "./panel.ts"

const headers: [string, string][] = [
  ["content-type", "text/html; charset=utf-8"],
  ["cache-control", "no-store"],
  ["x-content-type-options", "nosniff"],
  ["content-security-policy", "default-src 'none'; style-src 'unsafe-inline'"],
]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The panel of the process of the spec's examples, with all its files, next to a second process on the board. */
async function fullPanel(): Promise<{ body: string; panel: string }> {
  writeBoard(project, [fullEntry(), entry(employeeId, employeeTitle, "intake")])
  writeFullFiles(project)
  return openPanel(await openDashboard(project), laptopId)
}

/** What stands inside every `<article>` of a part of the panel, in order. */
function articles(html: string): string[] {
  return [...html.matchAll(/<article>(.*?)<\/article>/gs)].map((match) => match[1] ?? "")
}

describe("the answer of the dashboard at the address of a process", () => {
  it("is 200 with the four headers and a complete document that has the title of the process, no refresh element, no sentence about the reload, no script, no form and no image", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)

    const page = await request(await openDashboard(project), `/${laptopId}`)

    expect(page.status).toBe(200)
    for (const [name, value] of headers) expect(page.headers.get(name)).toBe(value)
    expect(page.body.toLowerCase().startsWith("<!doctype html>")).toBe(true)
    expect(page.body.trimEnd().endsWith("</html>")).toBe(true)
    expect(page.body).toContain(`<title>${laptopTitle}</title>`)
    expect(page.body).not.toContain('http-equiv="refresh"')
    expect(page.body).not.toContain("This page reloads every 5 seconds.")
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<form")
    expect(page.body).not.toContain("<img")
  })

  it("still holds the board before the panel: the heading Dashboard and the ten sections with the cards that the board itself shows", async () => {
    writeBoard(project, [fullEntry(), entry(employeeId, employeeTitle, "intake"), entry("003-close-the-books", "Close the books", "published")])
    writeFullFiles(project)
    const address = await openDashboard(project)

    const { body } = await openPanel(address, laptopId)

    const board = boardOf(body)
    expect(board).toContain("<h1>Dashboard</h1>")
    expect(sections(board).map((section) => section.stage)).toEqual(stages)
    expect(cards(board)).toHaveLength(3)
    expect(cards(board)).toEqual(cards((await request(address, "/")).body))
    expect(stagesOf(board, laptopId)).toEqual(["rework"])
    expect(stagesOf(board, employeeId)).toEqual(["intake"])
    expect(stagesOf(board, "003-close-the-books")).toEqual(["published"])
  })

  it("has exactly one aside, after the ten sections of the board and at the end of the body, and the board itself has none", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)
    const address = await openDashboard(project)

    const page = await request(address, `/${laptopId}`)

    expect(page.status).toBe(200)
    expect(page.body.split("<aside")).toHaveLength(2)
    expect(sections(boardOf(page.body))).toHaveLength(10)
    for (const [id] of parts) expect(boardOf(page.body)).not.toContain(`id="${id}"`)
    expect(compact(page.body)).toContain("</aside></body>")
    expect((await request(address, "/")).body).not.toContain("<aside")
  })

  it("opens the panel of a process whose stage is none of the ten, which has no card on the board", async () => {
    writeBoard(project, [entry(laptopId, laptopTitle, "archived"), entry(employeeId, employeeTitle, "intake")])

    const { body, panel } = await openPanel(await openDashboard(project), laptopId)

    expect(cards(boardOf(body))).toHaveLength(1)
    expect(compact(panel)).toContain(`<h2>${laptopTitle}</h2><p>${laptopId}</p>`)
    expect(compact(panel)).toContain("<dt>Stage</dt><dd>archived</dd>")
  })

  it("ignores a query string", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)
    const address = await openDashboard(project)

    const page = await request(address, `/${laptopId}?part=rounds`)

    expect(page.status).toBe(200)
    expect(panelOf(page.body)).not.toBe("")
    expect(page.body).toBe((await request(address, `/${laptopId}`)).body)
  })
})

describe("the panel of a process", () => {
  it("starts with the link Close, the title, the id, the sentence that the dashboard does not reload, the stage and the owner, and the seven links", async () => {
    const { panel } = await fullPanel()

    expect(
      compact(panel).startsWith(
        compact(`
          <p><a href="/">Close</a></p>
          <h2>Handle a lost laptop</h2>
          <p>001-handle-a-lost-laptop</p>
          ${stillSentence}
          <dl>
          <dt>Stage</dt><dd>rework</dd>
          <dt>Owner</dt><dd>Kari Nordmann</dd>
          </dl>
          <nav>
          <ul>
          <li><a href="#timeline">Timeline</a></li>
          <li><a href="#spec">Specification</a></li>
          <li><a href="#cases">Cases</a></li>
          <li><a href="#draft">Draft</a></li>
          <li><a href="#rounds">Rounds</a></li>
          <li><a href="#versions">Versions</a></li>
          <li><a href="#feedback">Open feedback</a></li>
          </ul>
          </nav>
          <section id="timeline">`),
      ),
    ).toBe(true)
    expect(panel.split("<nav")).toHaveLength(2)
  })

  it("says not recorded for the owner of a process without one", async () => {
    writeBoard(project, [entry(employeeId, employeeTitle, "intake")])

    const { panel } = await openPanel(await openDashboard(project), employeeId)

    expect(compact(panel)).toContain("<dl><dt>Stage</dt><dd>intake</dd><dt>Owner</dt><dd>not recorded</dd></dl>")
  })

  it("has seven sections with the ids of the links, in their order, each starting with its heading", async () => {
    const { panel } = await fullPanel()

    const found = [...panel.matchAll(/<section id="([^"]*)">\s*<h3>(.*?)<\/h3>/gs)].map((match) => [match[1], match[2]])
    expect(found).toEqual(parts)
    expect(panel.split("<section")).toHaveLength(8)
    expect(compact(panel).endsWith("</section>")).toBe(true)
  })

  it("shows the stage history as one ordered list, oldest first, each stage with its time", async () => {
    const { panel } = await fullPanel()

    expect(part(panel, "timeline")).toBe(
      compact(`
        <h3>Timeline</h3>
        <ol>
        <li><time>2026-11-20T09:00:00.000Z</time> intake</li>
        <li><time>2026-11-20T11:30:00.000Z</time> spec</li>
        <li><time>2026-11-22T10:00:00.000Z</time> rework</li>
        </ol>`),
    )
  })

  it("shows the whole specification, with its headings three levels lower and at most of the sixth level, its numbered items and its paragraphs", async () => {
    const { panel } = await fullPanel()

    expect(part(panel, "spec")).toBe(
      compact(`
        <h3>Specification</h3>
        <h4>Specification: Handle a lost laptop</h4>
        <h5>Trigger</h5>
        <p>Status: decided</p>
        <p>An employee reports that a laptop is lost.</p>
        <h6>Detail</h6>
        <h6>Deeper</h6>
        <h5>Steps</h5>
        <ol>
        <li value="1">The employee tells the IT manager.</li>
        <li value="2">The IT manager blocks the laptop.</li>
        </ol>`),
    )
  })

  it("shows every case in full, one article per case, in ascending order of the number", async () => {
    const { panel } = await fullPanel()

    const shown = part(panel, "cases")
    expect(shown.startsWith("<h3>Cases</h3><article>")).toBe(true)
    expect(articles(shown)).toEqual([caseHtml(1), caseHtml(2), caseHtml(9), caseHtml(10)])
  })

  it("shows the name and the whole text of the newest draft, and nothing of an earlier draft", async () => {
    const { body, panel } = await fullPanel()

    expect(part(panel, "draft")).toBe('<h3>Draft</h3><p>draft-3.md</p><h4>Handle a lost laptop</h4><h5>Steps</h5><ol><li value="1">Step of draft 3.</li></ol>')
    expect(body).not.toContain("Step of draft 1.")
    expect(body).not.toContain("Step of draft 2.")
  })

  it("shows one article per recorded round, the newest first, with per reviewer the verdict and the tagged findings of its file of that round, and the result of each case", async () => {
    const { body, panel } = await fullPanel()

    const shown = part(panel, "rounds")
    expect(shown.startsWith("<h3>Rounds</h3><article>")).toBe(true)
    expect(articles(shown)).toEqual([
      compact(`
        <h4>Round 2</h4>
        <dl>
        <dt>Draft</dt><dd>draft-2.md</dd>
        <dt>Recorded at</dt><dd>2026-11-22T10:00:00.000Z</dd>
        <dt>Stopped</dt><dd>${stopReason}</dd>
        </dl>
        <h5>gdpr: CHANGES</h5>
        <ul>
        <li>[high] Step 3 still names nobody.</li>
        </ul>
        <h5>legal: PASS</h5>
        <p>No findings.</p>
        <h5>readability: CHANGES</h5>
        <p>The findings file cannot be read.</p>`),
      compact(`
        <h4>Round 1</h4>
        <dl>
        <dt>Draft</dt><dd>draft-1.md</dd>
        <dt>Recorded at</dt><dd>2026-11-21T10:00:00.000Z</dd>
        </dl>
        <h5>gdpr: CHANGES</h5>
        <ul>
        <li>[high] Step 3 does not say who notifies Datatilsynet.</li>
        <li>[medium] Step 5 names no deadline.</li>
        <li>[low] Step 7 uses a word the reader may not know.</li>
        </ul>
        <h5>legal: PASS</h5>
        <p>No findings.</p>
        <h5>Cases</h5>
        <p>case 1 PASS, case 3 FAIL, case 5 FAIL</p>`),
    ])
    expect(body).not.toContain("review of the draft")
    expect(body).not.toContain("Verdict:")
    expect(body).not.toContain("A line that is no finding.")
    expect(body).not.toContain("Nothing to report from legal.")
  })

  it("skips a round of the board whose number is not an integer of 1 or more", async () => {
    writeBoard(project, [fullEntry({ rounds: [{ ...round(1), round: "../../secret" }, { ...round(1), round: 0 }, round(3)] })])
    writeFile(project, `processes/${laptopId}/rounds/secret/simulation.md`,findingsText("simulation", "CHANGES", ["- [high] A finding outside the process."]))

    const { body, panel } = await openPanel(await openDashboard(project), laptopId)

    const shown = articles(part(panel, "rounds"))
    expect(shown).toHaveLength(1)
    expect(shown[0]?.startsWith("<h4>Round 3</h4>")).toBe(true)
    expect(body).not.toContain("secret")
    expect(body).not.toContain("A finding outside the process.")
  })

  it("shows the versions of the board as one table with their number, draft, approver and time, not recorded for a version without an approver, and nothing of a version folder", async () => {
    const { body, panel } = await fullPanel()

    expect(part(panel, "versions")).toBe(
      compact(`
        <h3>Versions</h3>
        <table>
        <tr><th>Version</th><th>Draft</th><th>Approved by</th><th>Approved at</th></tr>
        <tr><td>1</td><td>draft-16.md</td><td>Ingrid Solheim</td><td>2026-11-23T09:49:32.525Z</td></tr>
        <tr><td>2</td><td>draft-17.md</td><td>not recorded</td><td>2026-11-24T08:00:00.000Z</td></tr>
        </table>`),
    )
    expect(body).not.toContain("Text of the approved document.")
  })

  it("shows every open feedback in ascending order with its version, what it is about, its kind and its whole text, and no closed feedback or findings of a respec", async () => {
    const { body, panel } = await fullPanel()

    const shown = part(panel, "feedback")
    expect(shown.startsWith("<h3>Open feedback</h3><article>")).toBe(true)
    expect(articles(shown)).toEqual([
      compact(`
        <h4>Feedback 2</h4>
        <dl>
        <dt>Version</dt><dd>1</dd>
        <dt>About</dt><dd>step 4</dd>
        <dt>Kind</dt><dd>document</dd>
        </dl>
        <p>I did not understand who to call when the laptop was stolen abroad.</p>`),
      compact(`
        <h4>Feedback 3</h4>
        <dl>
        <dt>Version</dt><dd>not recorded</dd>
        <dt>About</dt><dd>step not recorded</dd>
        <dt>Kind</dt><dd>not recorded</dd>
        </dl>
        <p>A feedback without its facts.</p>`),
      compact(`
        <h4>Feedback 10</h4>
        <dl>
        <dt>Version</dt><dd>2</dd>
        <dt>About</dt><dd>whole document</dd>
        <dt>Kind</dt><dd>process</dd>
        </dl>
        <p>The process takes too long.</p>`),
    ])
    expect(body).not.toContain("This feedback is closed.")
    expect(body).not.toContain("Findings of a respec.")
    expect(body).not.toContain("Per Hansen")
  })

  it("shows the one stage of a new process in the timeline and says in each of the other six sections that there is none", async () => {
    writeBoard(project, [entry(employeeId, employeeTitle, "intake")])

    const { panel } = await openPanel(await openDashboard(project), employeeId)

    expect(part(panel, "timeline")).toBe("<h3>Timeline</h3><ol><li><time>2026-11-20T09:00:00.000Z</time> intake</li></ol>")
    expect(part(panel, "spec")).toBe("<h3>Specification</h3><p>No specification yet.</p>")
    expect(part(panel, "cases")).toBe("<h3>Cases</h3><p>No case yet.</p>")
    expect(part(panel, "draft")).toBe("<h3>Draft</h3><p>No draft yet.</p>")
    expect(part(panel, "rounds")).toBe("<h3>Rounds</h3><p>No round is recorded.</p>")
    expect(part(panel, "versions")).toBe("<h3>Versions</h3><p>No version is published.</p>")
    expect(part(panel, "feedback")).toBe("<h3>Open feedback</h3><p>No open feedback.</p>")
  })

  it("says that no stage is recorded for an entry of the board without history", async () => {
    writeBoard(project, [{ id: employeeId, title: employeeTitle, stage: "intake" }])

    const { panel } = await openPanel(await openDashboard(project), employeeId)

    expect(part(panel, "timeline")).toBe("<h3>Timeline</h3><p>No stage is recorded.</p>")
  })

  it("escapes the title, a finding and a line of the specification", async () => {
    writeBoard(project, [entry(laptopId, "Laptops & <phones>", "rework", { rounds: [{ ...round(1), verdicts: [{ reviewer: "gdpr", verdict: "CHANGES" }] }] })])
    writeFile(project, `processes/${laptopId}/rounds/round-1/gdpr.md`, findingsText("gdpr", "CHANGES", ['- [high] Use <b>bold</b> & "quotes"']))
    writeFile(project, `processes/${laptopId}/spec.md`, "# Specification\n\n<script>alert(1)</script>\n")

    const { body, panel } = await openPanel(await openDashboard(project), laptopId)

    expect(body).toContain("<title>Laptops &amp; &lt;phones&gt;</title>")
    expect(panel).toContain("<h2>Laptops &amp; &lt;phones&gt;</h2>")
    expect(panel).toContain("<li>[high] Use &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;</li>")
    expect(panel).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")
    expect(body).not.toContain("<b>")
    expect(body).not.toContain("<phones>")
    expect(body).not.toContain("<script")
  })
})

describe("the addresses of the dashboard", () => {
  it("answers 404 with the page Not found and without a panel for an id that is not on the board, for a longer path and for an id that is no folder name, next to the panel of a process", async () => {
    writeBoard(project, [fullEntry(), entry("../secret", "Secret process", "draft")])
    writeFullFiles(project)
    const address = await openDashboard(project)

    await openPanel(address, laptopId)

    for (const pathname of ["/003-not-on-the-board", `/${laptopId}/`, `/${laptopId}/spec`, "/..%2fsecret","/%2e%2e%2fsecret"]) {
      const page = await request(address, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(page.body).toContain(refresh)
      expect(page.body).not.toContain("<aside")
      expect(page.body).not.toContain("Secret process")
    }
  })

  it("answers HEAD without a page and POST with 405 and Allow: GET, HEAD, and never changes a file of the project", async () => {
    writeBoard(project, [fullEntry(), entry(employeeId, employeeTitle, "intake")])
    writeFullFiles(project)
    const before = tree(project)
    const address = await openDashboard(project)

    const head = await request(address, `/${laptopId}`, "HEAD")
    expect(head.status).toBe(200)
    expect(head.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(head.body).toBe("")
    const refused = await request(address, `/${laptopId}`, "POST")
    expect(refused.status).toBe(405)
    expect(refused.headers.get("allow")).toBe("GET, HEAD")
    expect(refused.body).toBe("")
    await openPanel(address, laptopId)
    await openPanel(address, employeeId)
    expect((await request(address, "/003-not-on-the-board")).status).toBe(404)
    expect(tree(project)).toEqual(before)
  })

  it("shows a round that was recorded and a stage the process moved to after the dashboard started, without a restart", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)
    const address = await openDashboard(project)
    const first = await openPanel(address, laptopId)
    expect(first.panel).not.toContain("Round 3")
    expect(stagesOf(boardOf(first.body), laptopId)).toEqual(["rework"])

    writeBoard(project, [fullEntry({ stage: "review", rounds: [round(1), round(2), round(3)] })])

    const second = await openPanel(address, laptopId)
    expect(articles(part(second.panel, "rounds")).map((shown) => shown.slice(0, 16))).toEqual(["<h4>Round 3</h4>", "<h4>Round 2</h4>", "<h4>Round 1</h4>"])
    expect(compact(second.panel)).toContain("<dt>Stage</dt><dd>review</dd>")
    expect(stagesOf(boardOf(second.body), laptopId)).toEqual(["review"])
  })

  it("answers 500 with the page Error and the refresh element while the board cannot be read, and the board with the panel again after it is repaired", async () => {
    writeFile(project, boardFile, "{ not json")
    const address = await openDashboard(project)

    const broken = await request(address, `/${laptopId}`)

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain("<p>The dashboard cannot read the processes.</p>")
    expect(broken.body).toContain(refresh)

    writeBoard(project, [fullEntry()])
    const repaired = await openPanel(address, laptopId)
    expect(repaired.panel).toContain(`<h2>${laptopTitle}</h2>`)
    expect(repaired.body).not.toContain('http-equiv="refresh"')
  })
})

describe("a card of the dashboard", () => {
  it("has the title as a link that opens the panel of the process, on the board and next to an open panel, and the board itself still reloads", async () => {
    writeBoard(project, [fullEntry(), entry(employeeId, "Staff & <guests>", "intake")])
    const address = await openDashboard(project)

    const board = (await request(address, "/")).body
    const open = (await request(address, `/${laptopId}`)).body

    for (const body of [board, boardOf(open)]) {
      expect(cardOf(body, laptopId).startsWith(`<h3><a href="/${laptopId}">${laptopTitle}</a></h3><p>${laptopId}</p>`)).toBe(true)
      expect(cardOf(body, employeeId).startsWith(`<h3><a href="/${employeeId}">Staff &amp; &lt;guests&gt;</a></h3><p>${employeeId}</p>`)).toBe(true)
    }
    expect(board).toContain(refresh)
    expect(board).toContain(reloadSentence)
    expect((await request(address, `/${employeeId}`)).status).toBe(200)
  })
})

describe("the reading view", () => {
  it("keeps the headings of a published document and its 404 for a process without a version, while the panel shows a heading three levels lower", async () => {
    writeBoard(project, [publishedEntry(), entry(employeeId, employeeTitle, "draft", { owner: kari })])
    writeLaptopVersions(project)
    writeFile(project, `processes/${laptopId}/spec.md`, specText)
    const view = await openView(project)

    const { panel } = await openPanel(await openDashboard(project), laptopId)

    expect(part(panel, "spec").startsWith("<h3>Specification</h3><h4>Specification: Handle a lost laptop</h4><h5>Trigger</h5>")).toBe(true)
    const published = await request(view, `/${laptopId}/1`)
    expect(published.status).toBe(200)
    expect(firstDocument.startsWith(`# ${laptopTitle}\n`)).toBe(true)
    expect(published.body).toContain(`<h1>${laptopTitle}</h1>`)
    expect(published.body).not.toContain("<aside")
    expect((await request(view, `/${employeeId}`)).status).toBe(404)
  })
})
