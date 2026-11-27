import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  boardPath,
  postForm,
  readWorkingFile,
  requestPage,
  runCommand,
  send,
  stopServers,
  storedProcesses,
  timeForm,
  workingDirectory,
  writeBoardFile,
  writeWorkingFile,
} from "./command-line.ts"
import {
  answeredQuestion,
  cardOf,
  dashboardBody,
  openDashboard,
  owner,
  processId,
  refresh,
  sectionsOf,
  stages,
  stagesWithCard,
  title,
  trail,
  writeQuestions,
} from "./dashboard-pages.ts"

describe("the dashboard of process-factory dashboard", () => {
  afterEach(stopServers)

  it("prints its address, answers GET / with the ten sections of an empty store and creates nothing there", async () => {
    const body = await dashboardBody()

    expect(body).toContain("<title>Dashboard</title>")
    expect(body).toContain("<h1>Dashboard</h1>")
    expect(body).toContain("<p>This page reloads every 5 seconds.</p>")
    expect(sectionsOf(body).map((section) => section.stage)).toEqual(stages)
    for (const section of sectionsOf(body)) expect(section.html).toContain("<p>No process.</p>")
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it("has the four headers, the refresh element and no script on its page", async () => {
    const page = await requestPage(await openDashboard(), "/")

    expect(page.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(page.headers.get("cache-control")).toBe("no-store")
    expect(page.headers.get("x-content-type-options")).toBe("nosniff")
    expect(page.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(page.body.startsWith("<!doctype html>")).toBe(true)
    expect(page.body).toContain(refresh)
    expect(page.body).not.toContain("<script")
  })

  it("shows the owner, the newest recorded round, the counts of the open questions and of the failing cases of that round, the line that says whose turn it is and the trail on the card", async () => {
    writeBoardFile([
      {
        id: processId,
        title,
        stage: "rework",
        owner,
        rounds: [
          { round: 1, draft: "draft-1.md", cases: [{ case: 4, result: "FAIL" }] },
          {
            round: 2,
            draft: "draft-2.md",
            cases: [
              { case: 1, result: "PASS" },
              { case: 3, result: "FAIL" },
              { case: 5, result: "FAIL" },
            ],
          },
        ],
      },
    ])
    writeQuestions(1, [answeredQuestion])
    writeWorkingFile(`processes/${processId}/answers-1.md`, "1. Whoever lost it.\n")
    writeQuestions(2, ["Who decides that the police are called?", "How long may the laptop stay unblocked?"])

    const body = await dashboardBody()

    expect(stagesWithCard(body)).toEqual(["rework"])
    expect(cardOf(body)).toBe(
      `<h3><a href="/${processId}">${title}</a></h3><p>${processId}</p><dl><dt>Owner</dt><dd>${owner}</dd><dt>Round</dt><dd>2</dd><dt>Open questions</dt><dd>2</dd><dt>Failing cases</dt><dd>2</dd></dl><p>Waits for Claude Code: /process next ${processId}.</p>${trail("rework")}`,
    )
    expect(body).not.toContain(answeredQuestion)
    expect(body).not.toContain("Who decides that the police are called?")
    expect(body).not.toContain("case 3")
    expect(body).not.toContain("case 4")
  })

  it("shows not recorded, none and 0 on the card of a new process whose newest questions file is answered", async () => {
    writeBoardFile([{ id: processId, title, stage: "intake" }])
    writeQuestions(1, [answeredQuestion])
    writeWorkingFile(`processes/${processId}/answers-1.md`, "1. Whoever lost it.\n")

    const body = await dashboardBody()

    expect(cardOf(body)).toBe(
      `<h3><a href="/${processId}">${title}</a></h3><p>${processId}</p><dl><dt>Owner</dt><dd>not recorded</dd><dt>Round</dt><dd>none</dd><dt>Open questions</dt><dd>0</dd><dt>Failing cases</dt><dd>0</dd></dl><p>Waits for Claude Code: /process next ${processId}.</p>${trail("intake")}`,
    )
    expect(body).not.toContain(answeredQuestion)
  })

  it("escapes the title and the owner, counts a question of a process in clarify and shows no text of it", async () => {
    writeBoardFile([{ id: processId, title: "Laptops & <phones>", stage: "clarify", owner: `Kari "K" O'Hara` }])
    writeQuestions(1, ["Is <b>this</b> & that decided?"])

    const body = await dashboardBody()

    expect(body).toContain(`<h3><a href="/${processId}">Laptops &amp; &lt;phones&gt;</a></h3>`)
    expect(body).toContain("<dd>Kari &quot;K&quot; O&#39;Hara</dd>")
    expect(cardOf(body)).toContain("<dt>Open questions</dt><dd>1</dd>")
    expect(cardOf(body)).toContain("<p>Waits for a person: answer the open questions.</p>")
    expect(body).not.toContain("that decided?")
    expect(body).not.toContain("<b>")
  })

  it("shows a process in the section of its new stage after a move, without a restart", async () => {
    writeBoardFile([{ id: processId, title, stage: "draft" }])
    const address = await openDashboard()
    expect(stagesWithCard((await requestPage(address, "/")).body)).toEqual(["draft"])

    expect(runCommand(["move", processId, "review"]).status).toBe(0)

    expect(stagesWithCard((await requestPage(address, "/")).body)).toEqual(["review"])
  })

  it("answers 404 with the page Not found, without the path that was asked for and without a process", async () => {
    writeBoardFile([{ id: processId, title, stage: "draft" }])

    const page = await requestPage(await openDashboard(), "/board")

    expect(page.status).toBe(404)
    expect(page.body).toContain("<title>Not found</title>")
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain("<p>There is nothing at this address.</p>")
    expect(page.body).toContain('<p><a href="/">Dashboard</a></p>')
    expect(page.body).toContain(refresh)
    expect(page.body).not.toContain("/board")
    expect(page.body).not.toContain(title)
  })

  it("answers POST with 405 and Allow: GET, HEAD, and HEAD without a page", async () => {
    const address = await openDashboard()

    const refused = await requestPage(address, "/", "POST")

    expect(refused.status).toBe(405)
    expect(refused.headers.get("allow")).toBe("GET, HEAD")
    expect(refused.body).toBe("")
    const head = await requestPage(address, "/", "HEAD")
    expect(head.status).toBe(200)
    expect(head.body).toBe("")
  })

  it("answers 500 without the name of the file while the board cannot be read, and 200 again after it is repaired", async () => {
    writeWorkingFile(boardPath, "{ not json")
    const address = await openDashboard()

    const broken = await requestPage(address, "/")

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<title>Error</title>")
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain("<p>The dashboard cannot read the processes.</p>")
    expect(broken.body).toContain(refresh)
    expect(broken.body).not.toContain(boardPath)
    expect(broken.body).not.toContain("JSON")

    writeBoardFile([{ id: processId, title, stage: "draft" }])

    expect(stagesWithCard((await requestPage(address, "/")).body)).toEqual(["draft"])
  })

  it.each([["abc"], ["70000"], ["-1"], ["4174x"]])("refuses the port %s with one line, starts no server and exits with 1", (port) => {
    const result = runCommand(["dashboard", "--port", port])

    expect(result.stderr).toBe("process-factory: the port must be a number from 0 to 65535\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  describe("the decisions a person takes on the dashboard", () => {
    const processFolder = `processes/${processId}`
    const firstQuestion = "Who decides that the police are called?"
    const secondQuestion = "How long may the laptop stay unblocked?"
    const rolesText = `# Roles\n\n## Data protection officer\n\n${owner} is the data protection officer.\n`
    const specSections = ["Trigger", "Scope", "Roles", "Steps", "AI steps", "Deadlines", "Legal basis", "Duties to notify", "Escalation", "Records", "Dependencies"]
    const backLink = `<p><a href="/${processId}">Back to the process</a></p>`
    const rounds = [{ round: 1, draft: "draft-1.md", at: "2026-11-22T10:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }]

    /** The address a decision is posted to. */
    function address(action: string): string {
      return `/${processId}/${action}`
    }

    /** A board with the laptop process in `stage`, owned by Kari Nordmann, who is named in `organisation/roles.md`. */
    function writeWaiting(stage: string, more: Record<string, unknown> = {}): void {
      writeWorkingFile("organisation/roles.md", rolesText)
      writeBoardFile([{ id: processId, title, stage, owner, history: [{ at: "2026-11-22T10:00:00.000Z", stage }], ...more }])
    }

    /** The process in `spec` with a specification of which every section is decided. */
    function writeDecidedSpec(): void {
      writeWaiting("spec")
      writeWorkingFile(`${processFolder}/spec.md`, `# Specification: ${title}\n\n${specSections.map((name) => `## ${name}\n\nStatus: decided\n`).join("\n")}`)
    }

    /** The process in `approval` with the recorded round 1 and the drafts 1 and 2, of which none is approved. */
    function writeWaitingApproval(): void {
      writeWaiting("approval", { rounds })
      for (const number of [1, 2]) writeWorkingFile(`${processFolder}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\nDraft ${String(number)}.\n`)
    }

    it("stores the answers in the form of the skill, Not known. for a field left empty, and moves the process to spec", async () => {
      writeWaiting("clarify")
      writeQuestions(2, [firstQuestion, secondQuestion])

      const answer = await postForm(await openDashboard(), address("answer"), { "answer-1": "  The IT manager.\r\n", "answer-2": "" })

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(`/${processId}`)
      expect(answer.body).toBe("")
      expect(readWorkingFile(`${processFolder}/answers-2.md`)).toBe(`# Answers 2\n\n## 1. ${firstQuestion}\n\nThe IT manager.\n\n## 2. ${secondQuestion}\n\nNot known.\n`)
      expect(storedProcesses()[0]?.stage).toBe("spec")
    })

    const emptyAnswers: [string, Record<string, string>][] = [
      ["both fields hold only whitespace", { "answer-1": "  \r\n ", "answer-2": "\t" }],
      ["no field is sent", {}],
    ]

    it.each(emptyAnswers)("answers 400 with the page Not done and stores nothing when %s", async (_name, values) => {
      writeWaiting("clarify")
      writeQuestions(2, [firstQuestion, secondQuestion])

      const answer = await postForm(await openDashboard(), address("answer"), values)

      expect(answer.status).toBe(400)
      expect(answer.body).toContain("<title>Not done</title>")
      expect(answer.body).toContain("<h1>Not done</h1>")
      expect(answer.body).toContain("<li>Answer at least one question.</li>")
      expect(answer.body).toContain(backLink)
      expect(answer.body).not.toContain(refresh)
      expect(existsSync(path.join(workingDirectory, `${processFolder}/answers-2.md`))).toBe(false)
      expect(storedProcesses()[0]?.stage).toBe("clarify")
    })

    it("accepts a specification of which every section is decided and records the time on the board", async () => {
      writeDecidedSpec()

      const answer = await postForm(await openDashboard(), address("accept-spec"), {})

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(`/${processId}`)
      expect(storedProcesses()[0]?.stage).toBe("cases")
      expect(storedProcesses()[0]?.specAcceptedAt).toMatch(timeForm)
    })

    it("answers 409 with the line of the command line for a process in another stage, and changes no file", async () => {
      writeWaiting("draft")
      const before = readWorkingFile(boardPath)

      const answer = await postForm(await openDashboard(), address("accept-spec"), {})

      expect(answer.status).toBe(409)
      expect(answer.body).toContain("<h1>Not done</h1>")
      expect(answer.body).toContain(`<li>process-factory: cannot accept the spec of ${processId}: it is in the stage draft, not in spec</li>`)
      expect(answer.body).toContain(backLink)
      expect(readWorkingFile(boardPath)).toBe(before)
    })

    it("refuses a post from another origin with 403 and changes nothing, and carries out the same post from the dashboard itself", async () => {
      writeDecidedSpec()
      const dashboard = await openDashboard()

      const foreign = await postForm(dashboard, address("accept-spec"), {}, { Origin: "http://evil.example" })

      expect(foreign.status).toBe(403)
      expect(foreign.body).toContain("<li>A decision can only be sent from the dashboard itself.</li>")
      expect(storedProcesses()[0]?.stage).toBe("spec")
      expect((await postForm(dashboard, address("accept-spec"), {}, { Origin: dashboard })).status).toBe(303)
      expect(storedProcesses()[0]?.stage).toBe("cases")
    })

    it("approves the newest draft as its owner and publishes it as version 1 with the same click", async () => {
      writeWaitingApproval()

      const answer = await postForm(await openDashboard(), address("approve"), { by: owner })

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(`/${processId}`)
      expect(readWorkingFile(`${processFolder}/versions/approval-draft-2.md`)).toContain(`Approved by: ${owner}\n`)
      expect(readWorkingFile(`${processFolder}/versions/1/process.md`)).toContain("Draft 2.")
      expect(storedProcesses()[0]?.stage).toBe("published")
      expect(storedProcesses()[0]?.versions).toEqual([{ version: 1, draft: "draft-2.md", approvedBy: owner, at: expect.stringMatching(timeForm) }])
    })

    it("answers 409 with the page Not done, the line of the command line and the link back for a name that is not the owner, and writes nothing", async () => {
      writeWaitingApproval()

      const answer = await postForm(await openDashboard(), address("approve"), { by: "Ola Hansen" })

      expect(answer.status).toBe(409)
      expect(answer.headers["content-type"]).toBe("text/html; charset=utf-8")
      expect(answer.headers["cache-control"]).toBe("no-store")
      expect(answer.headers["x-content-type-options"]).toBe("nosniff")
      expect(answer.headers["content-security-policy"]).toBe("default-src 'none'; style-src 'unsafe-inline'")
      expect(answer.body).toContain("<title>Not done</title>")
      expect(answer.body).toContain(`<li>process-factory: cannot approve ${processId}: --by does not name its owner</li>`)
      expect(answer.body).toContain(backLink)
      expect(answer.body).not.toContain(refresh)
      expect(answer.body).not.toContain("<script")
      expect(existsSync(path.join(workingDirectory, `${processFolder}/versions`))).toBe(false)
      expect(storedProcesses()[0]?.stage).toBe("approval")
    })

    it("stores the lines of the note as findings of the owner of the newest recorded round and moves the process to rework", async () => {
      writeWaitingApproval()

      const answer = await postForm(await openDashboard(), address("send-back"), { note: "Step 3 must name the IT manager.\r\nShorten the first section." })

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(`/${processId}`)
      expect(readWorkingFile(`${processFolder}/rounds/round-1/owner.md`)).toContain(
        "Verdict: CHANGES\n\n- [high] Step 3 must name the IT manager.\n- [high] Shorten the first section.\n",
      )
      expect(storedProcesses()[0]?.stage).toBe("rework")
    })

    it("answers 409 with the line of the command line for a note without text, and changes nothing", async () => {
      writeWaitingApproval()
      const before = readWorkingFile(boardPath)

      const answer = await postForm(await openDashboard(), address("send-back"), { note: " \r\n " })

      expect(answer.status).toBe(409)
      expect(answer.body).toContain(`<li>process-factory: cannot send ${processId} back to rework: the note is empty</li>`)
      expect(existsSync(path.join(workingDirectory, `${processFolder}/rounds`))).toBe(false)
      expect(readWorkingFile(boardPath)).toBe(before)
    })

    it("answers 413 for a post of more than 32768 bytes, and changes nothing", async () => {
      writeWaitingApproval()
      const before = readWorkingFile(boardPath)

      const answer = await send(await openDashboard(), address("send-back"), `note=${"x".repeat(40_000)}`)

      expect(answer.status).toBe(413)
      expect(answer.body).toContain("<li>The decision is too long.</li>")
      expect(existsSync(path.join(workingDirectory, `${processFolder}/rounds`))).toBe(false)
      expect(readWorkingFile(boardPath)).toBe(before)
    })

    it("starts a regeneration of a published process that has an open feedback", async () => {
      writeWaiting("published", { versions: [{ version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-11-21T09:00:00.000Z" }] })
      writeWorkingFile(`${processFolder}/feedback/feedback-1.md`, "# Feedback 1\n\nVersion: 1\nStatus: open\n\n## Text\n\nStep 1 is unclear.\n")

      const answer = await postForm(await openDashboard(), address("regenerate"), {})

      expect(answer.status).toBe(303)
      expect(storedProcesses()[0]?.stage).toBe("regenerate")
      expect(readWorkingFile(`${processFolder}/regeneration-1.md`)).toContain("- feedback-1.md\n")
    })

    it("answers 409 with the line of move for a published process with nothing to regenerate it for", async () => {
      writeWaiting("published", { versions: [{ version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-11-21T09:00:00.000Z" }] })

      const answer = await postForm(await openDashboard(), address("regenerate"), {})

      expect(answer.status).toBe(409)
      expect(answer.body).toContain(
        `<li>process-factory: cannot move ${processId} from published to regenerate: there is nothing to regenerate it for: no open feedback, no case newer than version 1 and no changed dependency</li>`,
      )
      expect(storedProcesses()[0]?.stage).toBe("published")
    })

    it("answers 500 with the page Error and without the refresh element while the board cannot be read", async () => {
      writeWorkingFile(boardPath, "{ not json")

      const answer = await postForm(await openDashboard(), address("approve"), { by: owner })

      expect(answer.status).toBe(500)
      expect(answer.body).toContain("<h1>Error</h1>")
      expect(answer.body).toContain("<p>The dashboard cannot read the processes.</p>")
      expect(answer.body).not.toContain(refresh)
    })

    it("answers every other post and every other method of a decision with 405 and Allow: GET, HEAD, and a GET of a decision with 404", async () => {
      writeWaitingApproval()
      const before = readWorkingFile(boardPath)
      const dashboard = await openDashboard()
      const refused: [string, string][] = [
        ["POST", `/${processId}`],
        ["POST", "/"],
        ["POST", address("publish")],
        ["POST", "/003-not-on-the-board/approve"],
        ["PUT", address("approve")],
      ]

      for (const [method, pathname] of refused) {
        const answer = await send(dashboard, pathname, `by=${encodeURIComponent(owner)}`, { method })
        expect(answer.status).toBe(405)
        expect(answer.headers.allow).toBe("GET, HEAD")
        expect(answer.body).toBe("")
      }
      const page = await requestPage(dashboard, address("approve"))
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(readWorkingFile(boardPath)).toBe(before)
    })
  })
})
