import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  boardPath,
  organisationAddress,
  organisationId,
  postForm,
  readWorkingFile,
  requestPage,
  runCommand,
  send,
  startServer,
  stopServers,
  workingDirectory,
  writeBoardFile,
  writeWorkingFile,
} from "./command-line.ts"

describe("the reading view of process-factory serve", () => {
  const processId = "001-handle-a-lost-laptop"
  const owner = "Kari Nordmann"
  const firstDocument = "# Handle a lost laptop\n\n1. IT manager (Ola Hansen): Call the police first.\n"
  const secondDocument = "# Handle a lost laptop\n\n1. IT manager (Ola Hansen): Block the laptop in Intune.\n"

  afterEach(stopServers)

  /** Starts the view on a free port of the project and gives the address of its one organisation. */
  async function openView(): Promise<string> {
    const printed = await startServer("serve")
    expect(printed).toMatch(/^Reading view on http:\/\/127\.0\.0\.1:[1-9]\d*\n$/)
    return organisationAddress(printed.trim().replace("Reading view on ", ""))
  }

  /** The text between `<li>` and `</li>` of every such item of a page, in order. */
  function items(body: string): string[] {
    return [...body.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => (match[1] ?? "").trim())
  }

  /** What stands inside `<main>`, without the whitespace between the elements. */
  function documentOf(body: string): string {
    return (/<main>(.*)<\/main>/s.exec(body)?.[1] ?? "").replace(/>\s+</g, "><").trim()
  }

  function writeVersionFolder(number: number, document: string, approval: string | undefined): void {
    writeWorkingFile(`processes/${processId}/versions/${String(number)}/process.md`, document)
    if (approval !== undefined) writeWorkingFile(`processes/${processId}/versions/${String(number)}/approval.md`, approval)
  }

  function approvalText(by: string, at: string): string {
    return `# Approval of a draft\n\nApproved by: ${by}\nApproved at: ${at}\n`
  }

  /** Writes a process that was never published and the laptop process with the published versions 1 and 2. */
  function writeView(more: Record<string, unknown> = {}, newestDocument = secondDocument): void {
    writeBoardFile([
      { id: "000-older-process", title: "Older process", stage: "draft", owner },
      {
        id: processId,
        title: "Handle a lost laptop",
        stage: "published",
        owner,
        versions: [
          { version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-10-03T08:00:00.000Z" },
          { version: 2, draft: "draft-2.md", approvedBy: owner, at: "2026-11-22T08:00:00.000Z" },
        ],
        ...more,
      },
    ])
    writeVersionFolder(1, firstDocument, approvalText(owner, "2026-10-02T09:00:00.000Z"))
    writeVersionFolder(2, newestDocument, approvalText(owner, "2026-11-21T10:05:00.000Z"))
  }

  it("says that no process is published yet in a folder without processes, and creates nothing there", async () => {
    const address = await openView()

    const front = await requestPage(address, "/")

    expect(front.status).toBe(200)
    expect(front.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(front.headers.get("cache-control")).toBe("no-store")
    expect(front.headers.get("x-content-type-options")).toBe("nosniff")
    expect(front.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(front.body).toContain("<title>Published processes</title>")
    expect(front.body).toContain("<h1>Published processes</h1>")
    expect(front.body).toContain("<p>No process is published yet.</p>")
    expect(front.body).not.toContain("<li")
    expect(front.body).not.toContain("<script")
    expect(readdirSync(workingDirectory)).toEqual([])
  })

  it("lists only the processes with a published version, with the owner, the current version and its approval date", async () => {
    writeView()
    const address = await openView()

    const front = await requestPage(address, "/")

    expect(items(front.body)).toEqual([`<a href="/${processId}">Handle a lost laptop</a> Owner: Kari Nordmann. Version 2. Approved on: 2026-11-21.`])
    expect(front.body).not.toContain("Older process")
  })

  it("shows the current version with its facts, its document and the version history, and no notice", async () => {
    writeView()
    const address = await openView()

    const page = await requestPage(address, `/${processId}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(page.body).toContain('<p><a href="/">All processes</a></p>')
    expect(page.body.replace(/>\s+</g, "><")).toContain(
      "<dl><dt>Owner</dt><dd>Kari Nordmann</dd><dt>Version</dt><dd>2</dd><dt>Approved by</dt><dd>Kari Nordmann</dd><dt>Approved on</dt><dd>2026-11-21</dd></dl>",
    )
    expect(documentOf(page.body)).toBe('<h1>Handle a lost laptop</h1><ol><li value="1">IT manager (Ola Hansen): Block the laptop in Intune.</li></ol>')
    expect(page.body).toContain("<h2>Version history</h2>")
    expect(items(page.body)).toEqual([
      `<a href="/${processId}/2">Version 2</a> Approved by: Kari Nordmann. Approved on: 2026-11-21. (this version)`,
      `<a href="/${processId}/1">Version 1</a> Approved by: Kari Nordmann. Approved on: 2026-10-02.`,
    ])
    expect(page.body).not.toContain("not the current version")
    expect(page.body).toBe((await requestPage(address, `/${processId}/2`)).body)
  })

  it("shows an earlier version with the notice that links to the current one, and marks it in the history", async () => {
    writeView()
    const address = await openView()

    const page = await requestPage(address, `/${processId}/1`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 1</title>")
    expect(page.body).toContain(
      `<p class="notice">This is version 1, not the current version. <a href="/${processId}">Read the current version, version 2.</a></p>`,
    )
    expect(page.body.indexOf('<p class="notice">')).toBeLessThan(page.body.indexOf("<dl>"))
    expect(documentOf(page.body)).toBe('<h1>Handle a lost laptop</h1><ol><li value="1">IT manager (Ola Hansen): Call the police first.</li></ol>')
    expect(items(page.body).at(-1)).toBe(`<a href="/${processId}/1">Version 1</a> Approved by: Kari Nordmann. Approved on: 2026-10-02. (this version)`)
  })

  it("keeps showing the newest published version of a process in regenerate, and nothing of its stage or its new draft", async () => {
    writeView({ stage: "regenerate" })
    writeWorkingFile(`processes/${processId}/drafts/draft-9.md`, "# Handle a lost laptop\n\nUnapproved ninth draft.\n")
    const address = await openView()

    const page = await requestPage(address, `/${processId}`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(page.body).not.toContain("Unapproved ninth draft.")
    expect(page.body).not.toContain("regenerate")
  })

  it.each([
    ["a process without a published version", "/000-older-process"],
    ["a version folder the board does not list", `/${processId}/3`],
    ["a path that tries to leave the store", "/..%2f..%2fpackage.json"],
    ["a draft of a process", `/${processId}/drafts/draft-1.md`],
    ["a slash at the end", `/${processId}/`],
  ])("answers 404 with the page Not found for %s", async (_name, pathname) => {
    writeView()
    writeVersionFolder(3, "# Handle a lost laptop\n\nLeft by a failed publication.\n", undefined)
    const address = await openView()

    const page = await requestPage(address, pathname)

    expect(page.status).toBe(404)
    expect(page.body).toContain("<title>Not found</title>")
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain("<p>There is no published process at this address.</p>")
    expect(page.body).toContain('<p><a href="/">All processes</a></p>')
    expect(page.body).not.toContain(pathname)
    expect(page.body).not.toContain("Left by a failed publication.")
  })

  it("shows a name of the organisation that holds a substitution pattern letter for letter, and inserts no second body", async () => {
    const trickyName = 'A$& B $` C $1 D $$ E & F'
    writeWorkingFile("organisation.json", `{\n  "name": ${JSON.stringify(trickyName)}\n}\n`)
    writeView()
    const printed = await startServer("serve")
    const page = await fetch(`${printed.trim().replace("Reading view on ", "")}/${organisationId}`)
    const body = await page.text()

    expect(body).toContain('<body>\n<p>Organisation: A$&amp; B $` C $1 D $$ E &amp; F</p>\n')
    expect(body.split("<body>")).toHaveLength(2)
    expect(body).toContain("<h1>Published processes</h1>")
  })

  it("escapes the title, the owner and the document, and interprets no inline Markdown", async () => {
    writeView({ title: "Laptops & <phones>", owner: `Kari "K" O'Hara` }, "# Laptops & <phones>\n\nUse **bold** and `code`.\n\n- <script>alert(1)</script>\n")
    const address = await openView()

    const front = await requestPage(address, "/")
    const page = await requestPage(address, `/${processId}`)

    expect(items(front.body)).toEqual([`<a href="/${processId}">Laptops &amp; &lt;phones&gt;</a> Owner: Kari &quot;K&quot; O&#39;Hara. Version 2. Approved on: 2026-11-21.`])
    expect(page.body).toContain("<title>Laptops &amp; &lt;phones&gt;, version 2</title>")
    expect(documentOf(page.body)).toBe(
      "<h1>Laptops &amp; &lt;phones&gt;</h1><p>Use **bold** and `code`.</p><ul><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul>",
    )
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<strong>")
  })

  it("says not recorded for the owner, the approver and the date that the store does not give", async () => {
    writeBoardFile([{ id: processId, title: "Handle a lost laptop", stage: "published", versions: [{ version: 1, draft: "draft-1.md", at: "2026-11-02T08:00:00.000Z" }] }])
    writeVersionFolder(1, firstDocument, undefined)
    const address = await openView()

    const front = await requestPage(address, "/")
    const page = await requestPage(address, `/${processId}`)

    expect(items(front.body)).toEqual([`<a href="/${processId}">Handle a lost laptop</a> Owner: not recorded. Version 1. Approved on: not recorded.`])
    expect(page.body.replace(/>\s+</g, "><")).toContain("<dt>Owner</dt><dd>not recorded</dd>")
    expect(page.body).toContain("Approved by: not recorded. Approved on: not recorded.")
    expect(page.body).not.toContain("2026-11-02")
  })

  it("answers a method other than GET or HEAD with 405 and Allow: GET, HEAD, and HEAD with 200", async () => {
    writeView()
    const address = await openView()

    const refused = await requestPage(address, "/", "POST")

    expect(refused.status).toBe(405)
    expect(refused.headers.get("allow")).toBe("GET, HEAD")
    expect(refused.body).toBe("")
    expect((await requestPage(address, "/", "HEAD")).status).toBe(200)
  })

  it("answers 500 without the reason while the board cannot be read, and 200 again after it is repaired", async () => {
    writeView()
    const board = readWorkingFile(boardPath)
    const address = await openView()
    writeWorkingFile(boardPath, "{ not json")

    const broken = await requestPage(address, "/")

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<title>Error</title>")
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain("<p>The reading view cannot read the processes.</p>")
    expect(broken.body).not.toContain(boardPath)
    expect(broken.body).not.toContain("JSON")

    writeWorkingFile(boardPath, board)

    expect((await requestPage(address, "/")).status).toBe(200)
  })

  it.each([["abc"], ["70000"], ["-1"], ["4173x"]])("refuses the port %s with one line, starts no server and exits with 1", (port) => {
    const result = runCommand(["serve", "--port", port])

    expect(result.stderr).toBe("process-factory: the port must be a number from 0 to 65535\n")
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
  })

  describe("the feedback a reader sends from the page of a version", () => {
    const feedbackFolder = `processes/${processId}/feedback`
    const feedbackPath = `/${processId}/2/feedback`
    const fields = { kind: "document", step: "1", text: "I did not understand step one.", name: "Ola Hansen" }
    const kindReason = "Choose what went wrong: the document or the process."
    const stepReason = "Choose a step of this version or the whole document."
    const textReason = "Write what happened."
    const refusedPosts: [string, Record<string, string>, string][] = [
      ["no kind", { step: fields.step, text: fields.text }, kindReason],
      ["a kind that is neither of the two", { ...fields, kind: "other" }, kindReason],
      ["no step", { kind: fields.kind, text: fields.text }, stepReason],
      ["a step the version does not have", { ...fields, step: "2" }, stepReason],
      ["a step with a leading zero", { ...fields, step: "01" }, stepReason],
      ["no text", { kind: fields.kind, step: fields.step }, textReason],
      ["a text of only whitespace", { ...fields, text: " \r\n\t " }, textReason],
      ["a text of 2001 characters", { ...fields, text: "t".repeat(2001) }, "The text may be at most 2000 characters."],
      ["a name of 101 characters", { ...fields, name: "n".repeat(101) }, "The name may be at most 100 characters."],
    ]

    function storedFeedback(number: number): string {
      return readWorkingFile(`${feedbackFolder}/feedback-${String(number)}.md`)
    }

    /** The sorted names in the folder `feedback` of the laptop process, empty when there is no such folder. */
    function feedbackFiles(): string[] {
      const folder = path.join(workingDirectory, feedbackFolder)
      return existsSync(folder) ? readdirSync(folder).sort() : []
    }

    it("stands with its two kinds, its steps, its text and its name between the document and the version history", async () => {
      writeView()
      const address = await openView()

      const page = await requestPage(address, `/${processId}`)

      const body = page.body.replace(/\s+/g, " ").replace(/> </g, "><")
      const part = body.slice(body.indexOf("</main>"), body.indexOf("<h2>Version history</h2>"))
      expect(part).toContain("<h2>Feedback</h2>")
      expect(part).toContain(`<form method="post" action="${feedbackPath}">`)
      expect(part).toContain('<label><input type="radio" name="kind" value="document" required> I did not understand the document</label>')
      expect(part).toContain('<label><input type="radio" name="kind" value="process" required> The process itself failed me</label>')
      expect(part).toContain('<select id="step" name="step"><option value="whole">The whole document</option><option value="1">Step 1</option></select>')
      expect(part).toContain('<textarea id="text" name="text" rows="6" maxlength="2000" required></textarea>')
      expect(part).toContain('<input id="name" name="name" maxlength="100">')
      expect(part).toContain('<button type="submit">Send feedback</button>')
      expect(part).not.toContain("checked")
      expect(page.body).not.toContain("<script")
    })

    it("posts to the version it is on, and is not on the front page", async () => {
      writeView()
      const address = await openView()

      const earlier = await requestPage(address, `/${processId}/1`)

      expect(earlier.body).toContain(`<form method="post" action="/${processId}/1/feedback">`)
      expect(earlier.body).not.toContain(feedbackPath)
      expect((await requestPage(address, "/")).body).not.toContain("<form")
    })

    it("answers an accepted post with 303 to the address itself and stores it as feedback-1.md", async () => {
      writeView()
      const address = await openView()

      const answer = await postForm(address, feedbackPath, fields)

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(feedbackPath)
      expect(answer.body).toBe("")
      expect(storedFeedback(1)).toMatch(
        /^# Feedback 1\n\nProcess: 001-handle-a-lost-laptop\nVersion: 2\nStep: 1\nKind: document\nFrom: Ola Hansen\nReceived at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\nStatus: open\n\n## Text\n\nI did not understand step one\.\n$/,
      )
      const received = await requestPage(address, feedbackPath)
      expect(received.status).toBe(200)
      expect(received.body).toContain("<title>Feedback received</title>")
      expect(received.body).toContain("<p>Thank you. Your feedback on version 2 of Handle a lost laptop is stored.</p>")
      expect(received.body).toContain(`<p><a href="/${processId}/2">Back to the document</a></p>`)
      expect(received.body).not.toContain(fields.text)
      expect(received.body).not.toContain(fields.name)
    })

    it("stores the other kind, the whole document, the version of the address and anonymous for a post without a name", async () => {
      writeView()
      const address = await openView()

      const answer = await postForm(address, `/${processId}/1/feedback`, { kind: "process", step: "whole", text: "The police did not answer." })

      expect(answer.status).toBe(303)
      expect(storedFeedback(1)).toContain("\nVersion: 1\nStep: whole document\nKind: process\nFrom: anonymous\n")
    })

    it("gives every feedback the next number and leaves the file that is there as it was", async () => {
      writeView()
      const address = await openView()

      expect((await postForm(address, feedbackPath, fields)).status).toBe(303)
      const first = storedFeedback(1)
      expect((await postForm(address, feedbackPath, { ...fields, text: "A second remark." })).status).toBe(303)

      expect(feedbackFiles()).toEqual(["feedback-1.md", "feedback-2.md"])
      expect(storedFeedback(1)).toBe(first)
      expect(storedFeedback(2)).toContain("# Feedback 2\n")
      expect(storedFeedback(2)).toContain("\n## Text\n\nA second remark.\n")
    })

    it("stores a text with its lines and its tab but without its other control characters, and a name as one line", async () => {
      writeView()
      const address = await openView()

      const answer = await postForm(address, feedbackPath, { ...fields, text: "  first\r\n\u001bsecond\tpart\u0007  ", name: "  Ola\r\nStatus: closed  " })

      expect(answer.status).toBe(303)
      const lines = storedFeedback(1).split("\n")
      expect(lines).toContain("From: Ola Status: closed")
      expect(lines.filter((line) => line.startsWith("Status: "))).toEqual(["Status: open"])
      expect(lines.slice(lines.indexOf("## Text"))).toEqual(["## Text", "", "first", "second\tpart", ""])
    })

    it("stores a text of exactly 2000 characters and a name of exactly 100", async () => {
      writeView()
      const address = await openView()

      const answer = await postForm(address, feedbackPath, { ...fields, text: "t".repeat(2000), name: "n".repeat(100) })

      expect(answer.status).toBe(303)
      expect(storedFeedback(1)).toContain(`\nFrom: ${"n".repeat(100)}\n`)
      expect(storedFeedback(1).endsWith(`\n## Text\n\n${"t".repeat(2000)}\n`)).toBe(true)
    })

    it.each(refusedPosts)("answers 400 with the reason and writes no file for %s", async (_name, values, reason) => {
      writeView()
      const address = await openView()

      const answer = await postForm(address, feedbackPath, values)

      expect(answer.status).toBe(400)
      expect(answer.body).toContain("<title>Feedback not stored</title>")
      expect(answer.body).toContain("<h1>Feedback not stored</h1>")
      expect(answer.body).toContain(`<li>${reason}</li>`)
      expect(answer.body).toContain(`<p><a href="/${processId}/2">Back to the document</a></p>`)
      expect(feedbackFiles()).toEqual([])
    })

    it("names the kind, the step and the text, in that order, for an empty post, and repeats nothing of it", async () => {
      writeView()
      const address = await openView()

      const answer = await send(address, feedbackPath, "")
      const refused = await postForm(address, feedbackPath, { step: fields.step, text: "Nobody else may read this.", name: "Secret Reader" })

      expect(answer.status).toBe(400)
      expect(items(answer.body)).toEqual([kindReason, stepReason, textReason])
      expect(refused.body).not.toContain("Nobody else may read this.")
      expect(refused.body).not.toContain("Secret Reader")
      expect(feedbackFiles()).toEqual([])
    })

    it("answers 403 and writes no file for a post from another origin, and stores one from the view itself", async () => {
      writeView()
      const address = await openView()

      const refused = await postForm(address, feedbackPath, fields, { Origin: "http://evil.example" })

      expect(refused.status).toBe(403)
      expect(items(refused.body)).toEqual(["Feedback can only be sent from the reading view itself."])
      expect(feedbackFiles()).toEqual([])
      expect((await postForm(address, feedbackPath, fields, { Origin: address })).status).toBe(303)
      expect((await postForm(address, feedbackPath, fields, { Origin: address.replace("127.0.0.1", "localhost") })).status).toBe(303)
      expect(feedbackFiles()).toEqual(["feedback-1.md", "feedback-2.md"])
    })

    it("answers 413 and writes no file for a body of 40000 bytes, and answers the next request", async () => {
      writeView()
      const address = await openView()

      const answer = await send(address, feedbackPath, `kind=document&step=1&text=${"a".repeat(40_000)}`)

      expect(answer.status).toBe(413)
      expect(items(answer.body)).toEqual(["The feedback is too long."])
      expect(feedbackFiles()).toEqual([])
      expect((await requestPage(address, "/")).status).toBe(200)
    })

    it.each([["PUT"], ["DELETE"]])("answers %s at the address with 405 and Allow: GET, HEAD, POST", async (method) => {
      writeView()
      const address = await openView()

      const refused = await send(address, feedbackPath, "", { method })

      expect(refused.status).toBe(405)
      expect(refused.headers.allow).toBe("GET, HEAD, POST")
      expect(refused.body).toBe("")
      expect(feedbackFiles()).toEqual([])
    })

    it.each([
      ["a version that is not published", `/${processId}/3/feedback`],
      ["a version with a leading zero", `/${processId}/02/feedback`],
      ["a process without a published version", "/000-older-process/1/feedback"],
      ["a path without a version", `/${processId}/feedback`],
    ])("answers a post with 405 and Allow: GET, HEAD and a GET with 404 for %s", async (_name, pathname) => {
      writeView()
      const address = await openView()

      const refused = await postForm(address, pathname, fields)

      expect(refused.status).toBe(405)
      expect(refused.headers.allow).toBe("GET, HEAD")
      expect(refused.body).toBe("")
      const page = await requestPage(address, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(feedbackFiles()).toEqual([])
    })

    it("answers 500 without a path when the feedback cannot be written, and keeps running", async () => {
      writeView()
      writeWorkingFile(feedbackFolder, "a file where the folder should be\n")
      const address = await openView()

      const answer = await postForm(address, feedbackPath, fields)

      expect(answer.status).toBe(500)
      expect(answer.body).toContain("<title>Error</title>")
      expect(answer.body).toContain("<p>The feedback could not be stored.</p>")
      expect(answer.body).not.toContain("processes")
      expect((await requestPage(address, "/")).status).toBe(200)
    })
  })
})
