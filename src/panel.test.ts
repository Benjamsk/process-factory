import { afterEach, describe, expect, it } from "vitest"
import { requestPage, stopServers, writeBoardFile, writeWorkingFile } from "./command-line.ts"
import { cardOf, compactHtml, headerOf, mainOf, openDashboard, owner, partAddress, parts, processId, specText, title, writeQuestions } from "./dashboard-pages.ts"

describe("the dashboard of process-factory dashboard", () => {
  afterEach(stopServers)

  describe("the panel of a process at the address of that process", () => {
    const stopReason = "the limit of 5 rounds is reached and these reviewers still ask for changes: gdpr"

    /** What stands inside the `<main>` of the page of one part of the laptop process, which must answer with 200. */
    async function part(address: string, name: string): Promise<string> {
      const page = await requestPage(address, partAddress(name))
      expect(page.status).toBe(200)
      return mainOf(page.body)
    }

    /** The pages of the eight parts of the laptop process after each other. */
    async function allParts(address: string): Promise<string> {
      const pages: string[] = []
      for (const [name] of parts) pages.push(await part(address, name))
      return pages.join("\n")
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

    it("answers at the address of the process with its title, one header and one main that holds only the part Decision, and no board", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      const page = await requestPage(address, `/${processId}`)

      expect(page.status).toBe(200)
      expect(page.body).toContain(`<title>${title}</title>`)
      expect(mainOf(page.body)).toBe("<h2>Decision</h2><p>There is nothing to decide here now.</p>")
      expect(page.body).not.toContain("<h1>Dashboard</h1>")
      expect(page.body).not.toContain("<section")
      expect(page.body).not.toContain("<aside")
      expect(compactHtml(page.body)).toContain("</main></body>")
      expect((await requestPage(address, "/")).body).not.toContain("<header>")
    })

    it("has the eight parts, each at its own address under its heading of the second level", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      for (const [name, heading] of parts) expect((await part(address, name)).startsWith(`<h2>${heading}</h2>`)).toBe(true)
      expect(parts).toHaveLength(8)
    })

    it("starts its header with the link back to the board, the title, the id, the stage and the owner, and shows the history as a timeline", async () => {
      writeFullBoard()
      const address = await openDashboard()

      const page = await requestPage(address, `/${processId}`)

      expect(headerOf(page.body).startsWith(`<p><a href="/">Back to the board</a></p><h1>${title}</h1><p>${processId}</p><dl><dt>Stage</dt><dd>rework</dd><dt>Owner</dt><dd>${owner}</dd></dl>`)).toBe(true)
      expect(await part(address, "timeline")).toBe(
        "<h2>Timeline</h2><ol><li><time>2026-11-20T09:00:00.000Z</time> intake</li><li><time>2026-11-22T10:00:00.000Z</time> rework</li></ol>",
      )
    })

    it("shows the whole specification with every heading two levels lower and at most of the sixth level", async () => {
      writeFullBoard()
      writeProcessFiles()

      const shown = await part(await openDashboard(), "spec")

      expect(shown).toBe(
        `<h2>Specification</h2><p><a href="/${processId}/edit/spec.md">Edit spec.md</a></p><h3>Specification: Handle a lost laptop</h3><h4>Trigger</h4><p>An employee reports it.</p><h5>Detail</h5><h6>Deeper</h6><h4>Steps</h4><ol><li value="1">The employee tells the IT manager.</li></ol>`,
      )
    })

    it("shows every case in ascending order of its number, one article each", async () => {
      writeFullBoard()
      writeProcessFiles()

      const shown = await part(await openDashboard(), "cases")

      expect(shown).toBe(
        [1, 9, 10].reduce(
          (html, number) =>
            `${html}<article><p><a href="/${processId}/edit/case-${String(number)}.md">Edit case-${String(number)}.md</a></p><h3>Case ${String(number)}: Laptop ${String(number)}</h3><p>Text of case ${String(number)}.</p></article>`,
          "<h2>Cases</h2>",
        ),
      )
    })

    it("shows the recorded rounds newest first, with the verdict and the result of each case as a badge and the tagged findings of each reviewer", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      const shown = await part(address, "rounds")

      expect(shown).toBe(
        [
          "<h2>Rounds</h2>",
          "<article><h3>Round 2</h3>",
          `<dl><dt>Draft</dt><dd>draft-2.md</dd><dt>Recorded at</dt><dd>2026-11-22T10:00:00.000Z</dd><dt>Stopped</dt><dd>${stopReason}</dd></dl>`,
          '<h4>gdpr: <span class="badge stop">CHANGES</span></h4><ul><li>[high] Step 3 still names nobody.</li></ul>',
          '<h4>readability: <span class="badge stop">CHANGES</span></h4><p>The findings file cannot be read.</p></article>',
          "<article><h3>Round 1</h3>",
          "<dl><dt>Draft</dt><dd>draft-1.md</dd><dt>Recorded at</dt><dd>2026-11-21T10:00:00.000Z</dd></dl>",
          '<h4>gdpr: <span class="badge stop">CHANGES</span></h4><ul><li>[high] Step 3 does not say who notifies Datatilsynet.</li><li>[low] Step 7 uses a hard word.</li></ul>',
          '<h4>legal: <span class="badge done">PASS</span></h4><p>No findings.</p>',
          '<h4>Cases</h4><p>case 1 <span class="badge done">PASS</span>, case 3 <span class="badge stop">FAIL</span></p></article>',
        ].join(""),
      )
      expect(shown).not.toContain("A line that is no finding.")
      expect(shown).not.toContain("Nothing to report from legal.")
      expect(shown).not.toContain("Verdict:")
    })

    it("shows the versions of the board and every open feedback, and nothing of a version folder or a closed feedback", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      const shown = await allParts(address)

      expect(await part(address, "versions")).toBe(
        [
          "<h2>Versions</h2><table>",
          "<tr><th>Version</th><th>Draft</th><th>Approved by</th><th>Approved at</th></tr>",
          "<tr><td>1</td><td>draft-16.md</td><td>Ingrid Solheim</td><td>2026-11-23T09:49:32.525Z</td></tr>",
          "<tr><td>2</td><td>draft-17.md</td><td>not recorded</td><td>2026-11-24T08:00:00.000Z</td></tr>",
          "</table>",
        ].join(""),
      )
      expect(await part(address, "feedback")).toBe(
        [
          "<h2>Open feedback</h2>",
          "<article><h3>Feedback 2</h3><dl><dt>Version</dt><dd>1</dd><dt>About</dt><dd>step 4</dd><dt>Kind</dt><dd>document</dd></dl>",
          "<p>I did not understand who to call when the laptop was stolen abroad.</p></article>",
          "<article><h3>Feedback 10</h3><dl><dt>Version</dt><dd>not recorded</dd><dt>About</dt><dd>step not recorded</dd><dt>Kind</dt><dd>not recorded</dd></dl>",
          "<p>A feedback without its facts.</p></article>",
        ].join(""),
      )
      expect(shown).not.toContain("Text of the approved document.")
      expect(shown).not.toContain("This feedback is closed.")
      expect(shown).not.toContain("Per Hansen")
    })

    it("shows nothing of another part on the page of one part", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      const versions = await part(address, "versions")
      const cases = await part(address, "cases")

      expect(versions).toContain("<td>draft-16.md</td>")
      expect(versions).not.toContain("Text of case 1.")
      expect(versions).not.toContain("Step of draft 3.")
      expect(cases).toContain("Text of case 1.")
      expect(cases).not.toContain("<td>draft-16.md</td>")
    })

    it("says in each part of a process that has only its board entry that there is none", async () => {
      writeBoardFile([{ id: processId, title, stage: "intake", history: [{ at: "2026-11-20T09:00:00.000Z", stage: "intake" }] }])
      const address = await openDashboard()

      expect(await part(address, "decision")).toBe("<h2>Decision</h2><p>There is nothing to decide here now.</p>")
      expect(await part(address, "timeline")).toBe("<h2>Timeline</h2><ol><li><time>2026-11-20T09:00:00.000Z</time> intake</li></ol>")
      expect(await part(address, "spec")).toBe("<h2>Specification</h2><p>No specification yet.</p>")
      expect(await part(address, "cases")).toBe("<h2>Cases</h2><p>No case yet.</p>")
      expect(await part(address, "draft")).toBe("<h2>Draft</h2><p>No draft yet.</p>")
      expect(await part(address, "rounds")).toBe("<h2>Rounds</h2><p>No round is recorded.</p>")
      expect(await part(address, "versions")).toBe("<h2>Versions</h2><p>No version is published.</p>")
      expect(await part(address, "feedback")).toBe("<h2>Open feedback</h2><p>No open feedback.</p>")
    })

    it("says that no stage is recorded for an entry of the board without a history, and that the owner is not recorded", async () => {
      writeBoardFile([{ id: processId, title, stage: "intake" }])
      const address = await openDashboard()

      expect(await part(address, "timeline")).toBe("<h2>Timeline</h2><p>No stage is recorded.</p>")
      expect(headerOf((await requestPage(address, `/${processId}`)).body)).toContain("<dt>Owner</dt><dd>not recorded</dd>")
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
      const address = await openDashboard()

      const page = await requestPage(address, `/${processId}/rounds`)
      const shown = await allParts(address)

      expect(page.body).toContain("<title>Laptops &amp; &lt;phones&gt;: Rounds</title>")
      expect(headerOf(page.body)).toContain("<h1>Laptops &amp; &lt;phones&gt;</h1>")
      expect(mainOf(page.body)).toContain("<li>[high] Use &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quotes&quot;</li>")
      expect(mainOf(page.body).split("<article>")).toHaveLength(2)
      expect(shown).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")
      expect(shown).not.toContain("<b>")
      expect(shown).not.toContain("<script")
      expect(shown).not.toContain("secret")
    })

    it("has the link Edit spec.md above the specification, a link above every case, and none while the process is being regenerated", async () => {
      writeFullBoard()
      writeProcessFiles()
      const address = await openDashboard()

      expect((await part(address, "spec")).split("/edit/")).toHaveLength(2)
      expect((await part(address, "cases")).split("/edit/")).toHaveLength(4)

      writeBoardFile([{ id: processId, title, stage: "review", regeneration: { version: 1, round: 0, at: "2026-11-23T09:00:00.000Z" } }])
      writeProcessFiles()

      expect(await allParts(address)).not.toContain("/edit/")
      expect((await part(address, "spec")).startsWith("<h2>Specification</h2><h3>Specification: Handle a lost laptop</h3>")).toBe(true)
    })

    it("shows the mark that a process needs a new draft on its card and in the header of its page, and nothing without it", async () => {
      writeBoardFile([{ id: processId, title, stage: "draft", needsDraft: ["spec.md", "case-2.md"] }])
      const mark = "<p>Needs a new draft: spec.md, case-2.md</p>"
      const address = await openDashboard()

      const board = (await requestPage(address, "/")).body
      const header = headerOf((await requestPage(address, `/${processId}`)).body)

      expect(cardOf(board)).toContain(`<p>${processId}</p>${mark}<dl>`)
      expect(header).toContain(`</dl>${mark}<p>Waits for Claude Code: /process next ${processId}.</p>`)

      writeBoardFile([{ id: processId, title, stage: "draft" }])

      expect((await requestPage(address, "/")).body).not.toContain("Needs a new draft")
      expect(headerOf((await requestPage(address, `/${processId}`)).body)).not.toContain("Needs a new draft")
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
      const address = await openDashboard()

      const shown = await part(address, "timeline")

      expect(shown).toBe(
        "<h2>Timeline</h2><ol><li><time>2026-11-22T10:00:00.000Z</time> rework</li><li><time>2026-11-24T12:00:00.000Z</time> draft, spec.md edited by Kari &lt;Nordmann&gt;</li></ol>",
      )
      expect(shown).not.toContain("<Nordmann>")
    })

    describe("the part Decision of a process that waits for a person", () => {
      const firstQuestion = "Who decides that the police are called?"
      const secondQuestion = "How long may the laptop stay unblocked?"
      const nothingToDecide = "<h2>Decision</h2><p>There is nothing to decide here now.</p>"
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

      it("stands at the address of the process in clarify, with one empty field per open question", async () => {
        writeWaitingBoard("clarify")
        writeQuestions(2, [firstQuestion, secondQuestion])

        const shown = await part(await openDashboard(), "decision")

        expect(shown).toBe(
          [
            "<h2>Decision</h2>",
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

        const shown = await part(await openDashboard(), "decision")

        expect(shown).toContain('<label for="answer-1">1. Who calls &lt;the police&gt; &amp; when?</label>')
        expect(shown).not.toContain("<the police>")
      })

      it("accepts the specification of a process in spec of which every section is decided, and has nothing to decide with an open section", async () => {
        writeWaitingBoard("spec")
        writeWorkingFile(`processes/${processId}/spec.md`, specText())
        const address = await openDashboard()

        expect(await part(address, "decision")).toBe(
          [
            "<h2>Decision</h2>",
            `<form method="post" action="/${processId}/accept-spec">`,
            "<p>Every section of the specification is decided. Read it under Specification before you accept it.</p>",
            '<p><button type="submit">Accept the specification</button></p>',
            "</form>",
            waits,
          ].join(""),
        )

        writeWorkingFile(`processes/${processId}/spec.md`, specText(["Scope"]))

        expect(await part(address, "decision")).toBe(nothingToDecide)
      })

      it("offers the owner of a process in approval the approve form and then the send back form, with no field filled in", async () => {
        writeWaitingBoard("approval")
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")

        const shown = await part(await openDashboard(), "decision")

        expect(shown).toBe(`<h2>Decision</h2>${approveForm}${sendBackForm}${waits}`)
        expect(shown).not.toContain("value=")
        expect(shown).not.toContain(owner)
      })

      it("says that a process in approval without an owner cannot be approved here, and still offers the send back form", async () => {
        writeWaitingBoard("approval", { owner: undefined })
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")

        const shown = await part(await openDashboard(), "decision")

        const noOwner = `<p>This process has no owner, so its draft cannot be approved here. /process next ${processId} in Claude Code names one.</p>`
        expect(shown).toBe(`<h2>Decision</h2>${noOwner}${sendBackForm}${waits}`)
        expect(shown).not.toContain(`action="/${processId}/approve"`)
      })

      it("says that the newest draft is already approved when its approval file is there, and still offers the send back form", async () => {
        writeWaitingBoard("approval")
        writeWorkingFile(`processes/${processId}/drafts/draft-2.md`, "# Handle a lost laptop\n\nDraft 2.\n")
        writeWorkingFile(`processes/${processId}/versions/approval-draft-2.md`, `# Approval of draft-2.md\n\nApproved by: ${owner}\n`)

        const shown = await part(await openDashboard(), "decision")

        const approved = `<p>draft-2.md is already approved. /process next ${processId} in Claude Code publishes it.</p>`
        expect(shown).toBe(`<h2>Decision</h2>${approved}${sendBackForm}${waits}`)
        expect(shown).not.toContain(`action="/${processId}/approve"`)
      })

      it("starts a regeneration of a published process", async () => {
        writeWaitingBoard("published")

        const shown = await part(await openDashboard(), "decision")

        expect(shown).toBe(
          [
            "<h2>Decision</h2>",
            `<form method="post" action="/${processId}/regenerate">`,
            "<p>A regeneration writes the published document again with only the changes that open feedback, new cases and changed dependencies ask for. The command line refuses it when there is none of these.</p>",
            '<p><button type="submit">Start a regeneration</button></p>',
            "</form>",
            waits,
          ].join(""),
        )
      })

      it.each(["intake", "cases", "draft", "review", "rework", "regenerate"])("has nothing to decide for a process in %s, which keeps its eight parts", async (stage) => {
        writeWaitingBoard(stage)
        const address = await openDashboard()

        expect(await part(address, "decision")).toBe(nothingToDecide)
        expect(await allParts(address)).not.toContain("<form")
      })

      it("has nothing to decide for a process in clarify whose newest questions file is answered", async () => {
        writeWaitingBoard("clarify")
        writeQuestions(1, [firstQuestion])
        writeWorkingFile(`processes/${processId}/answers-1.md`, "# Answers 1\n\n## 1. Who decides that the police are called?\n\nNot known.\n")
        const address = await openDashboard()

        expect(await part(address, "decision")).toBe(nothingToDecide)
        expect(await allParts(address)).not.toContain("<form")
      })
    })
  })
})
