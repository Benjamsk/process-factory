import { afterEach, describe, expect, it } from "vitest"
import { requestPage, stopServers, writeBoardFile, writeWorkingFile } from "./command-line.ts"
import { cardOf, openDashboard, owner, processId, refresh, sectionsOf, stages, stagesWithCard, title, writeQuestions } from "./dashboard-pages.ts"

describe("the dashboard of process-factory dashboard", () => {
  afterEach(stopServers)

  describe("the panel of a process at the address of that process", () => {
    const parts: [string, string][] = [
      ["timeline", "Timeline"],
      ["spec", "Specification"],
      ["cases", "Cases"],
      ["draft", "Draft"],
      ["rounds", "Rounds"],
      ["versions", "Versions"],
      ["feedback", "Open feedback"],
    ]
    const stopReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr"

    /** A piece of HTML without the whitespace between its elements. */
    function compactHtml(html: string): string {
      return html.replace(/>\s+</g, "><").trim()
    }

    /** What stands inside the one `<aside>` of a page, which must have exactly one. */
    function panelOf(body: string): string {
      const found = [...body.matchAll(/<aside>(.*?)<\/aside>/gs)]
      expect(found).toHaveLength(1)
      return found[0]?.[1] ?? ""
    }

    /** What stands inside the section of a panel with this id, without the whitespace between its elements. */
    function part(panel: string, id: string): string {
      return compactHtml(new RegExp(`<section id="${id}">(.*?)</section>`, "s").exec(panel)?.[1] ?? "")
    }

    /** The page of the dashboard at the address of the laptop process, which must answer with 200, and its panel. */
    async function openPanel(address: string): Promise<{ body: string; panel: string }> {
      const page = await requestPage(address, `/${processId}`)
      expect(page.status).toBe(200)
      return { body: page.body, panel: panelOf(page.body) }
    }

    /** Writes the board with the laptop process in rework, with two rounds and two versions, and a second process in intake. */
    function writeFullBoard(): void {
      writeBoardFile([
        { id: "002-onboard-a-new-employee", title: "Onboard a new employee", stage: "intake" },
        {
          id: processId,
          title,
          stage: "rework",
          owner,
          history: [
            { at: "2026-11-20T09:00:00.000Z", stage: "intake" },
            { at: "2026-11-22T10:00:00.000Z", stage: "rework" },
          ],
          rounds: [
            {
              round: 1,
              draft: "draft-1.md",
              at: "2026-11-21T10:00:00.000Z",
              verdicts: [
                { reviewer: "gdpr", verdict: "CHANGES" },
                { reviewer: "legal", verdict: "PASS" },
              ],
              cases: [
                { case: 1, result: "PASS" },
                { case: 3, result: "FAIL" },
              ],
            },
            {
              round: 2,
              draft: "draft-2.md",
              at: "2026-11-22T10:00:00.000Z",
              verdicts: [
                { reviewer: "gdpr", verdict: "CHANGES" },
                { reviewer: "readability", verdict: "CHANGES" },
              ],
              stopped: stopReason,
            },
          ],
          versions: [
            { version: 1, draft: "draft-16.md", approvedBy: "Ingrid Solheim", at: "2026-11-23T09:49:32.525Z" },
            { version: 2, draft: "draft-17.md", at: "2026-11-24T08:00:00.000Z" },
          ],
        },
      ])
    }

    /** Writes the specification, three cases, three drafts, the findings of two rounds, a version folder and three feedback files of the laptop process. */
    function writeProcessFiles(): void {
      const folder = `processes/${processId}`
      writeWorkingFile(`${folder}/spec.md`, "# Specification: Handle a lost laptop\n\n## Trigger\n\nAn employee reports it.\n\n### Detail\n\n#### Deeper\n\n## Steps\n\n1. The employee tells the IT manager.\n")
      for (const number of [1, 9, 10]) writeWorkingFile(`${folder}/cases/case-${String(number)}.md`, `# Case ${String(number)}: Laptop ${String(number)}\n\nText of case ${String(number)}.\n`)
      for (const number of [1, 2, 3]) writeWorkingFile(`${folder}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\n1. Step of draft ${String(number)}.\n`)
      writeWorkingFile(
        `${folder}/rounds/round-1/gdpr.md`,
        "# gdpr review of the draft\n\nVerdict: CHANGES\n\n- [high] Step 3 does not say who notifies Datatilsynet.\nA line that is no finding.\n- [low] Step 7 uses a hard word.\n",
      )
      writeWorkingFile(`${folder}/rounds/round-1/legal.md`, "# legal review of the draft\n\nVerdict: PASS\n\nNothing to report from legal.\n")
      writeWorkingFile(`${folder}/rounds/round-2/gdpr.md`, "# gdpr review of the draft\n\nVerdict: CHANGES\n\n- [high] Step 3 still names nobody.\n")
      writeWorkingFile(`${folder}/versions/1/process.md`, "# Handle a lost laptop\n\nText of the approved document.\n")
      writeWorkingFile(`${folder}/feedback/feedback-1.md`, "# Feedback 1\n\nVersion: 1\nStatus: closed\n\n## Text\n\nThis feedback is closed.\n")
      writeWorkingFile(
        `${folder}/feedback/feedback-2.md`,
        "# Feedback 2\n\nVersion: 1\nStep: 4\nKind: document\nFrom: Per Hansen\nStatus: open\n\n## Text\n\nI did not understand who to call\nwhen the laptop was stolen abroad.\n",
      )
      writeWorkingFile(`${folder}/feedback/feedback-10.md`, "# Feedback 10\n\nStatus: open\n\n## Text\n\nA feedback without its facts.\n")
    }

    it("answers with the board of the dashboard, the title of the process, one panel at its end and no refresh", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      const { body } = await openPanel(address)

      const board = body.split("<aside")[0] ?? ""
      expect(body).toContain(`<title>${title}</title>`)
      expect(body).not.toContain(refresh)
      expect(body).not.toContain("<p>This page reloads every 5 seconds.</p>")
      expect(body).toContain("<h1>Dashboard</h1>")
      expect(sectionsOf(board).map((section) => section.stage)).toEqual(stages)
      expect(stagesWithCard(board)).toEqual(["intake", "rework"])
      expect(compactHtml(body)).toContain("</aside></body>")
      expect((await requestPage(address, "/")).body).not.toContain("<aside")
    })

    it("links to its seven parts and holds a section for each of them, in that order, with its heading", async () => {
      writeFullBoard()
      writeProcessFiles()

      const { panel } = await openPanel(await openDashboard())

      for (const [id, heading] of parts) expect(panel).toContain(`<li><a href="#${id}">${heading}</a></li>`)
      expect([...panel.matchAll(/<section id="([^"]*)">\s*<h3>(.*?)<\/h3>/gs)].map((match) => [match[1], match[2]])).toEqual(parts)
      expect(panel.split("<nav")).toHaveLength(2)
    })

    it("starts with the link Close, the title, the id, the sentence about the reload, the stage and the owner, and shows the history as a timeline", async () => {
      writeFullBoard()

      const { panel } = await openPanel(await openDashboard())

      expect(
        compactHtml(panel).startsWith(
          `<p><a href="/">Close</a></p><h2>${title}</h2><p>${processId}</p><p>The dashboard does not reload while a process is open. Load the page again to see what has changed.</p><dl><dt>Stage</dt><dd>rework</dd><dt>Owner</dt><dd>${owner}</dd></dl><nav>`,
        ),
      ).toBe(true)
      expect(part(panel, "timeline")).toBe(
        "<h3>Timeline</h3><ol><li><time>2026-11-20T09:00:00.000Z</time> intake</li><li><time>2026-11-22T10:00:00.000Z</time> rework</li></ol>",
      )
    })

    it("shows the whole specification with every heading three levels lower and at most of the sixth level", async () => {
      writeFullBoard()
      writeProcessFiles()

      const { panel } = await openPanel(await openDashboard())

      expect(part(panel, "spec")).toBe(
        `<h3>Specification</h3><p><a href="/${processId}/edit/spec.md">Edit spec.md</a></p><h4>Specification: Handle a lost laptop</h4><h5>Trigger</h5><p>An employee reports it.</p><h6>Detail</h6><h6>Deeper</h6><h5>Steps</h5><ol><li value="1">The employee tells the IT manager.</li></ol>`,
      )
    })

    it("shows every case in ascending order of its number and only the newest draft", async () => {
      writeFullBoard()
      writeProcessFiles()

      const { body, panel } = await openPanel(await openDashboard())

      expect(part(panel, "cases")).toBe(
        [1, 9, 10].reduce(
          (shown, number) =>
            `${shown}<article><p><a href="/${processId}/edit/case-${String(number)}.md">Edit case-${String(number)}.md</a></p><h4>Case ${String(number)}: Laptop ${String(number)}</h4><p>Text of case ${String(number)}.</p></article>`,
          "<h3>Cases</h3>",
        ),
      )
      expect(part(panel, "draft")).toBe('<h3>Draft</h3><p>draft-3.md</p><h4>Handle a lost laptop</h4><ol><li value="1">Step of draft 3.</li></ol>')
      expect(body).not.toContain("Step of draft 2.")
    })

    it("shows the recorded rounds newest first, with the verdict and the tagged findings of each reviewer and the result of each case", async () => {
      writeFullBoard()
      writeProcessFiles()

      const { body, panel } = await openPanel(await openDashboard())

      expect(part(panel, "rounds")).toBe(
        [
          "<h3>Rounds</h3>",
          "<article><h4>Round 2</h4>",
          `<dl><dt>Draft</dt><dd>draft-2.md</dd><dt>Recorded at</dt><dd>2026-11-22T10:00:00.000Z</dd><dt>Stopped</dt><dd>${stopReason}</dd></dl>`,
          "<h5>gdpr: CHANGES</h5><ul><li>[high] Step 3 still names nobody.</li></ul>",
          "<h5>readability: CHANGES</h5><p>The findings file cannot be read.</p></article>",
          "<article><h4>Round 1</h4>",
          "<dl><dt>Draft</dt><dd>draft-1.md</dd><dt>Recorded at</dt><dd>2026-11-21T10:00:00.000Z</dd></dl>",
          "<h5>gdpr: CHANGES</h5><ul><li>[high] Step 3 does not say who notifies Datatilsynet.</li><li>[low] Step 7 uses a hard word.</li></ul>",
          "<h5>legal: PASS</h5><p>No findings.</p>",
          "<h5>Cases</h5><p>case 1 PASS, case 3 FAIL</p></article>",
        ].join(""),
      )
      expect(body).not.toContain("A line that is no finding.")
      expect(body).not.toContain("Nothing to report from legal.")
      expect(body).not.toContain("Verdict:")
    })

    it("shows the versions of the board and every open feedback, and nothing of a version folder or a closed feedback", async () => {
      writeFullBoard()
      writeProcessFiles()

      const { body, panel } = await openPanel(await openDashboard())

      expect(part(panel, "versions")).toBe(
        [
          "<h3>Versions</h3><table>",
          "<tr><th>Version</th><th>Draft</th><th>Approved by</th><th>Approved at</th></tr>",
          "<tr><td>1</td><td>draft-16.md</td><td>Ingrid Solheim</td><td>2026-11-23T09:49:32.525Z</td></tr>",
          "<tr><td>2</td><td>draft-17.md</td><td>not recorded</td><td>2026-11-24T08:00:00.000Z</td></tr>",
          "</table>",
        ].join(""),
      )
      expect(part(panel, "feedback")).toBe(
        [
          "<h3>Open feedback</h3>",
          "<article><h4>Feedback 2</h4><dl><dt>Version</dt><dd>1</dd><dt>About</dt><dd>step 4</dd><dt>Kind</dt><dd>document</dd></dl>",
          "<p>I did not understand who to call when the laptop was stolen abroad.</p></article>",
          "<article><h4>Feedback 10</h4><dl><dt>Version</dt><dd>not recorded</dd><dt>About</dt><dd>step not recorded</dd><dt>Kind</dt><dd>not recorded</dd></dl>",
          "<p>A feedback without its facts.</p></article>",
        ].join(""),
      )
      expect(body).not.toContain("Text of the approved document.")
      expect(body).not.toContain("This feedback is closed.")
      expect(body).not.toContain("Per Hansen")
    })

    it("says in each part of the panel of a process that has only its board entry that there is none", async () => {
      writeBoardFile([{ id: processId, title, stage: "intake", history: [{ at: "2026-11-20T09:00:00.000Z", stage: "intake" }] }])

      const { panel } = await openPanel(await openDashboard())

      expect(part(panel, "timeline")).toBe("<h3>Timeline</h3><ol><li><time>2026-11-20T09:00:00.000Z</time> intake</li></ol>")
      expect(part(panel, "spec")).toBe("<h3>Specification</h3><p>No specification yet.</p>")
      expect(part(panel, "cases")).toBe("<h3>Cases</h3><p>No case yet.</p>")
      expect(part(panel, "draft")).toBe("<h3>Draft</h3><p>No draft yet.</p>")
      expect(part(panel, "rounds")).toBe("<h3>Rounds</h3><p>No round is recorded.</p>")
      expect(part(panel, "versions")).toBe("<h3>Versions</h3><p>No version is published.</p>")
      expect(part(panel, "feedback")).toBe("<h3>Open feedback</h3><p>No open feedback.</p>")
    })

    it("says that no stage is recorded for an entry of the board without a history, and that the owner is not recorded", async () => {
      writeBoardFile([{ id: processId, title, stage: "intake" }])

      const { panel } = await openPanel(await openDashboard())

      expect(part(panel, "timeline")).toBe("<h3>Timeline</h3><p>No stage is recorded.</p>")
      expect(compactHtml(panel)).toContain("<dt>Owner</dt><dd>not recorded</dd>")
    })

    it("escapes the title, a finding and a line of the specification, and skips a round whose number is no number of a round", async () => {
      writeBoardFile([
        {
          id: processId,
          title: "Laptops & <phones>",
          stage: "rework",
          rounds: [
            { round: "../../secret", draft: "draft-1.md", at: "2026-11-21T10:00:00.000Z", verdicts: [] },
            { round: 1, draft: "draft-1.md", at: "2026-11-21T10:00:00.000Z", verdicts: [{ reviewer: "gdpr", verdict: "CHANGES" }] },
          ],
        },
      ])
      writeWorkingFile(`processes/${processId}/rounds/round-1/gdpr.md`, '# gdpr review\n\nVerdict: CHANGES\n\n- [high] Use <b>bold</b> & "quotes"\n')
      writeWorkingFile(`processes/${processId}/spec.md`, "# Specification\n\n<script>alert(1)</script>\n")

      const { body, panel } = await openPanel(await openDashboard())

      expect(body).toContain("<title>Laptops &amp; &lt;phones&gt;</title>")
      expect(panel).toContain("<h2>Laptops &amp; &lt;phones&gt;</h2>")
      expect(panel).toContain("<li>[high] Use &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;</li>")
      expect(panel).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")
      expect(part(panel, "rounds").split("<article>")).toHaveLength(2)
      expect(body).not.toContain("<b>")
      expect(body).not.toContain("<script")
      expect(body).not.toContain("secret")
    })

    it("opens the panel of the process the link on its card leads to, and answers 404 without a panel for another address", async () => {
      writeBoardFile([{ id: processId, title, stage: "draft" }])
      const address = await openDashboard()

      const board = (await requestPage(address, "/")).body

      expect(cardOf(board)).toContain(`<h3><a href="/${processId}">${title}</a></h3>`)
      expect((await openPanel(address)).panel).toContain(`<h2>${title}</h2>`)
      for (const pathname of ["/003-not-on-the-board", `/${processId}/`, `/${processId}/spec`]) {
        const page = await requestPage(address, pathname)
        expect(page.status).toBe(404)
        expect(page.body).toContain("<h1>Not found</h1>")
        expect(page.body).not.toContain("<aside")
      }
    })

    it("has the link Edit spec.md above the specification, a link above every case, and none while the process is being regenerated", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      expect((await openPanel(address)).panel.split("/edit/")).toHaveLength(5)

      writeBoardFile([{ id: processId, title, stage: "review", regeneration: { version: 1, round: 0, at: "2026-11-23T09:00:00.000Z" } }])
      writeProcessFiles()
      const { panel } = await openPanel(address)

      expect(panel).not.toContain("/edit/")
      expect(part(panel, "spec").startsWith("<h3>Specification</h3><h4>Specification: Handle a lost laptop</h4>")).toBe(true)
    })

    it("shows the mark that a process needs a new draft on its card and before the links of its panel, and nothing without it", async () => {
      writeBoardFile([{ id: processId, title, stage: "draft", needsDraft: ["spec.md", "case-2.md"] }])
      const mark = "<p>Needs a new draft: spec.md, case-2.md</p>"
      const address = await openDashboard()

      const board = (await requestPage(address, "/")).body
      const { panel } = await openPanel(address)

      expect(cardOf(board)).toContain(`<p>${processId}</p>${mark}<dl>`)
      expect(compactHtml(panel)).toContain(`</dl>${mark}<nav>`)

      writeBoardFile([{ id: processId, title, stage: "draft" }])

      expect((await requestPage(address, "/")).body).not.toContain("Needs a new draft")
      expect((await openPanel(address)).body).not.toContain("Needs a new draft")
    })

    it("shows an edit of the history in the timeline with its file and the escaped name of the person", async () => {
      writeBoardFile([
        {
          id: processId,
          title,
          stage: "draft",
          history: [
            { at: "2026-11-22T10:00:00.000Z", stage: "rework" },
            { at: "2026-11-24T12:00:00.000Z", stage: "draft", edited: "spec.md", by: "Kari <Nordmann>" },
          ],
        },
      ])

      const { body, panel } = await openPanel(await openDashboard())

      expect(part(panel, "timeline")).toBe(
        "<h3>Timeline</h3><ol><li><time>2026-11-22T10:00:00.000Z</time> rework</li><li><time>2026-11-24T12:00:00.000Z</time> draft, spec.md edited by Kari &lt;Nordmann&gt;</li></ol>",
      )
      expect(body).not.toContain("<Nordmann>")
    })

    describe("the part Decision of a process that waits for a person", () => {
      const firstQuestion = "Who decides that the police are called?"
      const secondQuestion = "How long may the laptop stay unblocked?"
      const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
      const waits = `<p>After a decision the process waits in its new stage until /process next ${processId} is run in Claude Code.</p>`
      const approveForm = [
        `<form method="post" action="/${processId}/approve">`,
        '<p><label for="by">Your full name</label>',
        '<input id="by" name="by" required></p>',
        '<p><button type="submit">Approve and publish</button></p>',
        "</form>",
      ].join("")
      const sendBackForm = [
        `<form method="post" action="/${processId}/send-back">`,
        '<p><label for="note">What must change in the draft</label>',
        '<textarea id="note" name="note" rows="6" required></textarea></p>',
        '<p><button type="submit">Send back for one more round</button></p>',
        "</form>",
      ].join("")

      /** A board with the laptop process in `stage`, owned by Kari Nordmann unless `more` says otherwise. */
      function writeWaitingBoard(stage: string, more: Record<string, unknown> = {}): void {
        writeBoardFile([{ id: processId, title, stage, owner, history: [{ at: "2026-11-22T10:00:00.000Z", stage }], ...more }])
      }

      /** A `spec.md` of the eleven sections, each decided except those named in `open`. */
      function specText(open: string[] = []): string {
        return `# Specification: ${title}\n\n${specSections.map((name) => `## ${name}\n\nStatus: ${open.includes(name) ? "open" : "decided"}\n`).join("\n")}`
      }

      it("is the first link and the first section of a process in clarify, with one empty field per open question", async () => {
        writeWaitingBoard("clarify")
        writeQuestions(2, [firstQuestion, secondQuestion])

        const { panel } = await openPanel(await openDashboard())

        expect(compactHtml(panel)).toContain('<nav><ul><li><a href="#decision">Decision</a></li><li><a href="#timeline">Timeline</a></li>')
        expect([...panel.matchAll(/<section id="([^"]*)">/g)].map((match) => match[1])).toEqual(["decision", ...parts.map(([id]) => id)])
        expect(part(panel, "decision")).toBe(
          [
            "<h3>Decision</h3>",
            `<form method="post" action="/${processId}/answer">`,
            `<p><label for="answer-1">1. ${firstQuestion}</label>`,
            '<textarea id="answer-1" name="answer-1" rows="4"></textarea></p>',
            `<p><label for="answer-2">2. ${secondQuestion}</label>`,
            '<textarea id="answer-2" name="answer-2" rows="4"></textarea></p>',
            "<p>A field left empty is stored as Not known.</p>",
            '<p><button type="submit">Store the answers</button></p>',
            "</form>",
            waits,
          ].join(""),
        )
      })

      it("escapes a question in its label", async () => {
        writeWaitingBoard("clarify")
        writeQuestions(1, ["Who calls <the police> & when?"])

        const { body, panel } = await openPanel(await openDashboard())

        expect(part(panel, "decision")).toContain('<label for="answer-1">1. Who calls &lt;the police&gt; &amp; when?</label>')
        expect(body).not.toContain("<the police>")
      })

      it("accepts the specification of a process in spec of which every section is decided, and waits for nobody with an open section", async () => {
        writeWaitingBoard("spec")
        writeWorkingFile(`processes/${processId}/spec.md`, specText())
        const address = await openDashboard()

        const decided = (await openPanel(address)).panel

        expect(part(decided, "decision")).toBe(
          [
            "<h3>Decision</h3>",
            `<form method="post" action="/${processId}/accept-spec">`,
            "<p>Every section of the specification is decided. Read it under Specification before you accept it.</p>",
            '<p><button type="submit">Accept the specification</button></p>',
            "</form>",
            waits,
          ].join(""),
        )
        writeWorkingFile(`processes/${processId}/spec.md`, specText(["Scope"]))
        const open = (await openPanel(address)).panel
        expect(open).not.toContain('id="decision"')
        expect(open).not.toContain("<form")
      })

      it("offers the owner of a process in approval the approve form and then the send back form, with no field filled in", async () => {
        writeWaitingBoard("approval")
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")

        const { panel } = await openPanel(await openDashboard())

        expect(part(panel, "decision")).toBe(`<h3>Decision</h3>${approveForm}${sendBackForm}${waits}`)
        expect(part(panel, "decision")).not.toContain("value=")
        expect(part(panel, "decision")).not.toContain(owner)
      })

      it("says that a process in approval without an owner cannot be approved here, and still offers the send back form", async () => {
        writeWaitingBoard("approval", { owner: undefined })
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")

        const { panel } = await openPanel(await openDashboard())

        const noOwner = `<p>This process has no owner, so its draft cannot be approved here. /process next ${processId} in Claude Code names one.</p>`
        expect(part(panel, "decision")).toBe(`<h3>Decision</h3>${noOwner}${sendBackForm}${waits}`)
        expect(panel).not.toContain(`action="/${processId}/approve"`)
      })

      it("says that the newest draft is already approved when its approval file is there, and still offers the send back form", async () => {
        writeWaitingBoard("approval")
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")
        writeWorkingFile(`processes/${processId}/versions/approval-draft-2.md`, `# Approval of draft-2.md\n\nApproved by: ${owner}\n`)

        const { panel } = await openPanel(await openDashboard())

        const approved = `<p>draft-2.md is already approved. /process next ${processId} in Claude Code publishes it.</p>`
        expect(part(panel, "decision")).toBe(`<h3>Decision</h3>${approved}${sendBackForm}${waits}`)
        expect(panel).not.toContain(`action="/${processId}/approve"`)
      })

      it("starts a regeneration of a published process", async () => {
        writeWaitingBoard("published")

        const { panel } = await openPanel(await openDashboard())

        expect(part(panel, "decision")).toBe(
          [
            "<h3>Decision</h3>",
            `<form method="post" action="/${processId}/regenerate">`,
            "<p>A regeneration writes the published document again with only the changes that open feedback, new cases and changed dependencies ask for. The command line refuses it when there is none of these.</p>",
            '<p><button type="submit">Start a regeneration</button></p>',
            "</form>",
            waits,
          ].join(""),
        )
      })

      it.each(["intake", "cases", "draft", "review", "rework", "regenerate"])("is not in the panel of a process in %s, which keeps its seven sections", async (stage) => {
        writeWaitingBoard(stage)

        const { panel } = await openPanel(await openDashboard())

        expect(panel).not.toContain('id="decision"')
        expect(panel).not.toContain("<form")
        expect([...panel.matchAll(/<section id="([^"]*)">/g)].map((match) => match[1])).toEqual(parts.map(([id]) => id))
      })

      it("is not in the panel of a process in clarify whose newest questions file is answered", async () => {
        writeWaitingBoard("clarify")
        writeQuestions(1, [firstQuestion])
        writeWorkingFile(`processes/${processId}/answers-1.md`, "# Answers 1\n\n## 1. Who decides that the police are called?\n\nNot known.\n")

        const { body, panel } = await openPanel(await openDashboard())

        expect(panel).not.toContain('id="decision"')
        expect(panel).not.toContain("<form")
        expect(body).not.toContain("<form")
      })
    })
  })
})
