import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { approveDraft, boardFile, emptyFolder, readFile, runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import {
  approvalText,
  compact,
  firstDocument,
  historyItems,
  items,
  kari,
  laptopEntry,
  laptopId,
  mainOf,
  olderEntry,
  olderId,
  openView,
  request,
  secondDocument,
  stopViews,
  tree,
  visibleText,
  writeLaptop,
  writeVersion,
} from "./view.ts"

const laptopPath = `/${laptopId}`
const currentItem = `<a href="${laptopPath}/2">Version 2</a> Approved by: Kari Nordmann. Approved on: 2026-11-21. (this version)`
const earlierItem = `<a href="${laptopPath}/1">Version 1</a> Approved by: Kari Nordmann. Approved on: 2026-10-02.`
const facts = (owner: string, version: number, by: string, on: string): string =>
  `<dl><dt>Owner</dt><dd>${owner}</dd><dt>Version</dt><dd>${String(version)}</dd><dt>Approved by</dt><dd>${by}</dd><dt>Approved on</dt><dd>${on}</dd></dl>`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** Expects the page `Not found`, which never repeats what was asked for. */
function expectNotFound(page: { status: number; body: string }): void {
  expect(page.status).toBe(404)
  expect(page.body).toContain("<title>Not found</title>")
  expect(page.body).toContain("<h1>Not found</h1>")
  expect(page.body).toContain("<p>There is no published process at this address.</p>")
  expect(page.body).toContain('<p><a href="/">All processes</a></p>')
}

describe("the front page of the reading view", () => {
  it("says that no process is published yet in a folder without a board", async () => {
    const address = await openView(project)

    const front = await request(address, "/")

    expect(front.status).toBe(200)
    expect(front.body).toContain("<title>Published processes</title>")
    expect(front.body).toContain("<h1>Published processes</h1>")
    expect(front.body).toContain("<p>No process is published yet.</p>")
    expect(front.body).not.toContain("<li")
  })

  it("says that no process is published yet when no process on the board has a version", async () => {
    writeBoard(project, [olderEntry, laptopEntry({ versions: [] })])
    const address = await openView(project)

    const front = await request(address, "/")

    expect(front.status).toBe(200)
    expect(front.body).toContain("<h1>Published processes</h1>")
    expect(front.body).toContain("<p>No process is published yet.</p>")
    expect(front.body).not.toContain("<li")
    expect(front.body).not.toContain("Older process")
  })

  it("lists every process with a published version in the order of the board, with its owner, its current version and its approval date", async () => {
    const breach = {
      id: "002-handle-a-breach",
      title: "Handle a breach",
      stage: "published",
      owner: "Ola Hansen",
      history: [{ at: "2026-11-05T12:00:00.000Z", stage: "published" }],
      versions: [{ version: 1, draft: "draft-4.md", approvedBy: "Ola Hansen", at: "2026-11-05T12:00:00.000Z" }],
    }
    writeLaptop(project)
    writeBoard(project, [breach, olderEntry, laptopEntry()])
    writeVersion(project, "002-handle-a-breach", 1, "# Handle a breach\n", approvalText("002-handle-a-breach", "draft-4.md", "Ola Hansen", "2026-11-04T16:30:00.000Z"))
    const address = await openView(project)

    const front = await request(address, "/")

    expect(front.status).toBe(200)
    expect(items(front.body)).toEqual([
      '<a href="/002-handle-a-breach">Handle a breach</a> Owner: Ola Hansen. Version 1. Approved on: 2026-11-04.',
      `<a href="${laptopPath}">Handle a lost laptop</a> Owner: Kari Nordmann. Version 2. Approved on: 2026-11-21.`,
    ])
    expect(front.body).not.toContain("Older process")
    expect(front.body).not.toContain(olderId)
    expect(front.body).not.toContain("No process is published yet.")
  })
})

describe("the page of a process", () => {
  it("shows the current version with its title, the link to all processes, the owner, the version, who approved it and when, and no notice", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(page.body).toContain('<p><a href="/">All processes</a></p>')
    expect(compact(page.body)).toContain(facts(kari, 2, kari, "2026-11-21"))
    expect(mainOf(page.body)).toBe('<h1>Handle a lost laptop</h1><h2>Steps</h2><ol><li value="1">IT manager (Ola Hansen): Block the laptop in Intune.</li></ol>')
    expect(page.body).not.toContain("Call the police first.")
    expect(page.body).not.toContain("notice")
    expect(page.body).not.toContain("not the current version")
  })

  it("puts the facts above the document and the version history under it", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const body = compact((await request(address, laptopPath)).body)

    const positions = ['<a href="/">All processes</a>', "<dl>", "<main>", "</main>", "<h2>Version history</h2>"].map((part) => body.indexOf(part))
    expect(positions.every((position) => position !== -1)).toBe(true)
    expect([...positions].sort((first, second) => first - second)).toEqual(positions)
  })

  it("has the version history with a link per version, the highest first, and marks the version it shows", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(page.body).toContain("<h2>Version history</h2>")
    expect(historyItems(page.body)).toEqual([currentItem, earlierItem])
  })

  it("gives the same page for the number of the current version", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const byNumber = await request(address, `${laptopPath}/2`)

    expect(byNumber.status).toBe(200)
    expect(byNumber.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(byNumber.body).toBe((await request(address, laptopPath)).body)
  })

  it("ignores a query string", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, `${laptopPath}/1?version=2`)

    expect(page.status).toBe(200)
    expect(page.body).toBe((await request(address, `${laptopPath}/1`)).body)
  })
})

describe("the page of an earlier version", () => {
  it("shows that version, its number and its approval date, with the notice that links to the current version", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, `${laptopPath}/1`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 1</title>")
    expect(page.body).toContain(
      `<p class="notice">This is version 1, not the current version. <a href="${laptopPath}">Read the current version, version 2.</a></p>`,
    )
    expect(compact(page.body)).toContain(facts(kari, 1, kari, "2026-10-02"))
    expect(mainOf(page.body)).toBe('<h1>Handle a lost laptop</h1><h2>Steps</h2><ol><li value="1">IT manager (Ola Hansen): Call the police first.</li></ol>')
    expect(page.body).not.toContain("Block the laptop in Intune.")
  })

  it("has the notice above the facts, and marks version 1 in the history", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, `${laptopPath}/1`)

    const noticeAt = page.body.indexOf('<p class="notice">')
    expect(noticeAt).toBeGreaterThan(page.body.indexOf('<a href="/">All processes</a>'))
    expect(noticeAt).toBeLessThan(page.body.indexOf("<dl>"))
    expect(historyItems(page.body)).toEqual([currentItem.replace(" (this version)", ""), `${earlierItem} (this version)`])
  })
})

describe("a process that is being changed", () => {
  it.each([["regenerate"], ["review"], ["rework"], ["approval"]])("keeps its newest published version in the stage %s, and the view says nothing of the stage or the new draft", async (stage) => {
    writeLaptop(project)
    const address = await openView(project)
    const front = await request(address, "/")
    const page = await request(address, laptopPath)
    expect(page.status).toBe(200)

    writeBoard(project, [olderEntry, laptopEntry({ stage, history: [{ at: "2026-11-23T09:00:00.000Z", stage }] })])
    writeFile(project, `processes/${laptopId}/drafts/draft-9.md`, "# Handle a lost laptop\n\nUnapproved ninth draft.\n")
    writeFile(project, `processes/${laptopId}/versions/approval-draft-9.md`, approvalText(laptopId, "draft-9.md", kari, "2026-11-23T10:00:00.000Z"))

    const frontNow = await request(address, "/")
    const pageNow = await request(address, laptopPath)
    expect(frontNow.body).toBe(front.body)
    expect(pageNow.body).toBe(page.body)
    expect(pageNow.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(pageNow.body).not.toContain("Unapproved ninth draft.")
    expect(pageNow.body).not.toContain("2026-11-23")
    expect(visibleText(pageNow.body)).not.toContain(stage)
    expect(visibleText(frontNow.body)).not.toContain(stage)
  })
})

describe("what is not published", () => {
  it("does not show a folder versions/3 that the board does not list", async () => {
    writeLaptop(project)
    writeVersion(project, laptopId, 3, "# Handle a lost laptop\n\nLeft by a failed publication.\n", approvalText(laptopId, "draft-3.md", kari, "2026-11-24T10:00:00.000Z"))
    const address = await openView(project)

    const page = await request(address, laptopPath)
    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(historyItems(page.body)).toEqual([currentItem, earlierItem])
    expect(items((await request(address, "/")).body)).toEqual([`<a href="${laptopPath}">Handle a lost laptop</a> Owner: Kari Nordmann. Version 2. Approved on: 2026-11-21.`])
    const third = await request(address, `${laptopPath}/3`)
    expectNotFound(third)
    expect(third.body).not.toContain("Left by a failed publication.")
  })

  it("does not show a version the board lists whose process.md is not there", async () => {
    writeLaptop(project, {
      versions: [
        { version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-10-03T08:00:00.000Z" },
        { version: 2, draft: "draft-2.md", approvedBy: kari, at: "2026-11-22T08:00:00.000Z" },
        { version: 3, draft: "draft-3.md", approvedBy: kari, at: "2026-11-24T08:00:00.000Z" },
      ],
    })
    const address = await openView(project)

    const page = await request(address, laptopPath)
    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(historyItems(page.body)).toEqual([currentItem, earlierItem])
    expectNotFound(await request(address, `${laptopPath}/3`))
  })

  it.each([
    ["a process on the board without a version", `/${olderId}`],
    ["a draft of that process", `/${olderId}/drafts/draft-1.md`],
    ["an id that is not on the board", "/999-no-such-process"],
    ["version 0", `${laptopPath}/0`],
    ["a version with a leading zero", `${laptopPath}/02`],
    ["a version that is not a number", `${laptopPath}/two`],
    ["the specification of a version", `${laptopPath}/2/spec.md`],
    ["the approval of a version", `${laptopPath}/2/approval.md`],
    ["a slash at the end", `${laptopPath}/`],
    ["a draft", `${laptopPath}/drafts/draft-1.md`],
    ["the board", "/board.json"],
  ])("answers 404 with the page Not found for %s, without the path that was asked for", async (_name, pathname) => {
    writeLaptop(project)
    writeFile(project, `processes/${olderId}/drafts/draft-1.md`, "# Older process\n\nNever published.\n")
    writeFile(project, `processes/${laptopId}/drafts/draft-1.md`, firstDocument)
    writeFile(project, `processes/${laptopId}/versions/2/spec.md`, "# Specification: Handle a lost laptop\n")
    const address = await openView(project)

    const page = await request(address, pathname)

    expectNotFound(page)
    expect(page.body).not.toContain(laptopId)
    expect(page.body).not.toContain(olderId)
    expect(page.body).not.toContain("999-no-such-process")
    expect(page.body).not.toContain("Never published.")
    expect(page.body).not.toContain("Specification")
    expect(page.body).toBe((await request(address, "/another-address-that-is-not-there")).body)
  })

  it.each([["/..%2f..%2fpackage.json"], [`${laptopPath}/..%2f..%2fboard.json`], ["/..%2fsecret"], ["/..%2fsecret/1"], ["/%2e%2e%2fsecret%2fversions%2f1%2fprocess.md"]])(
    "answers 404 for the path %s, which tries to leave the store",
    async (pathname) => {
      writeLaptop(project)
      writeFile(project, "package.json", '{ "name": "top-secret-package" }\n')
      writeFile(project, "secret/versions/1/process.md", "# Top secret\n")
      const address = await openView(project)

      const page = await request(address, pathname)

      expectNotFound(page)
      expect(page.body).not.toContain("top-secret-package")
      expect(page.body).not.toContain("Top secret")
      expect(page.body).not.toContain("board.json")
    },
  )

  it("skips an entry of the board whose id is not made of lower case letters, digits and hyphens", async () => {
    const outside = { id: "../secret", title: "Outside the store", stage: "published", owner: kari, versions: [{ version: 1, draft: "draft-1.md", at: "2026-11-01T08:00:00.000Z" }] }
    writeLaptop(project)
    writeBoard(project, [outside, laptopEntry()])
    writeFile(project, "secret/versions/1/process.md", "# Top secret\n")
    const address = await openView(project)

    const front = await request(address, "/")

    expect(front.status).toBe(200)
    expect(items(front.body)).toEqual([`<a href="${laptopPath}">Handle a lost laptop</a> Owner: Kari Nordmann. Version 2. Approved on: 2026-11-21.`])
    expect(front.body).not.toContain("Outside the store")
    expect(front.body).not.toContain("secret")
  })
})

describe("the document of a version as HTML", () => {
  it("renders the example of the spec: headings, a numbered list that keeps its numbers, a continued item and a bulleted list, all escaped", async () => {
    const document =
      "# Handle a lost laptop\n\n## Steps\n\n1. IT manager (Ola Hansen): Block the laptop\n   within one hour.\n2. AI: Draft the report. <b>Kari</b> & Ola answer.\n\n- First point\n"
    writeLaptop(project, {}, document)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(mainOf(page.body)).toBe(
      '<h1>Handle a lost laptop</h1><h2>Steps</h2><ol><li value="1">IT manager (Ola Hansen): Block the laptop within one hour.</li><li value="2">AI: Draft the report. &lt;b&gt;Kari&lt;/b&gt; &amp; Ola answer.</li></ol><ul><li>First point</li></ul>',
    )
  })

  it("renders paragraphs, deeper headings and lists that an empty line or another kind of item ends, also with Windows line endings", async () => {
    const document = [
      "# Title",
      "",
      "First line",
      "second line.",
      "",
      "### Deep",
      "#NoSpace",
      "",
      "3. Three",
      "",
      "4. Four",
      "- a",
      "- b",
      "Plain after.",
      "###### Six",
      "Last paragraph.",
      "",
    ].join("\r\n")
    writeLaptop(project, {}, document)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(mainOf(page.body)).toBe(
      '<h1>Title</h1><p>First line second line.</p><h3>Deep</h3><p>#NoSpace</p><ol><li value="3">Three</li></ol><ol><li value="4">Four</li></ol><ul><li>a</li><li>b Plain after.</li></ul><h6>Six</h6><p>Last paragraph.</p>',
    )
  })

  it("shows inline Markdown and typed HTML as the characters that were typed", async () => {
    const document = "# Title\n\nUse **bold**, `code` and [a](http://example.com) here.\n\n- <script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n"
    writeLaptop(project, {}, document)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(page.status).toBe(200)
    expect(mainOf(page.body)).toBe(
      "<h1>Title</h1><p>Use **bold**, `code` and [a](http://example.com) here.</p><ul><li>&lt;script&gt;alert(1)&lt;/script&gt;</li></ul><p>&lt;img src=x onerror=alert(1)&gt;</p>",
    )
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<img")
    expect(page.body).not.toContain("<strong>")
    expect(page.body).not.toContain("<code>")
    expect(page.body).not.toContain('<a href="http://example.com"')
  })
})

describe("text from the store on a page", () => {
  it("escapes the title, the owner and the approver on the front page and on the page of the process", async () => {
    const id = "003-laptops-and-phones"
    const owner = `Kari "K" O'Hara`
    const escaped = "Kari &quot;K&quot; O&#39;Hara"
    writeBoard(project, [{ id, title: "Laptops & <phones>", stage: "published", owner, versions: [{ version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-11-02T08:00:00.000Z" }] }])
    writeVersion(project, id, 1, "# Laptops & <phones>\n", approvalText(id, "draft-1.md", owner, "2026-11-01T08:00:00.000Z"))
    const address = await openView(project)

    const front = await request(address, "/")
    const page = await request(address, `/${id}`)

    expect(items(front.body)).toEqual([`<a href="/${id}">Laptops &amp; &lt;phones&gt;</a> Owner: ${escaped}. Version 1. Approved on: 2026-11-01.`])
    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Laptops &amp; &lt;phones&gt;, version 1</title>")
    expect(compact(page.body)).toContain(facts(escaped, 1, escaped, "2026-11-01"))
    expect(mainOf(page.body)).toBe("<h1>Laptops &amp; &lt;phones&gt;</h1>")
    expect(historyItems(page.body)).toEqual([`<a href="/${id}/1">Version 1</a> Approved by: ${escaped}. Approved on: 2026-11-01. (this version)`])
    expect(page.body).not.toContain("<phones>")
    expect(front.body).not.toContain("<phones>")
    expect(page.body).not.toContain(owner)
    expect(front.body).not.toContain(owner)
  })

  it.each([
    ["an approval.md without the two lines", "# Approval of draft-1.md\n\nProcess: 004-return-a-key\nDraft: draft-1.md\n"],
    ["an approval.md whose time is not a date", "# Approval of draft-1.md\n\nApproved at: yesterday\n"],
    ["no approval.md", undefined],
  ])("says not recorded for the owner, the approver and the date of a process without an owner and with %s", async (_name, approval) => {
    const id = "004-return-a-key"
    writeBoard(project, [{ id, title: "Return a key", stage: "published", versions: [{ version: 1, draft: "draft-1.md", at: "2026-11-02T08:00:00.000Z" }] }])
    writeVersion(project, id, 1, "# Return a key\n", approval)
    const address = await openView(project)

    const front = await request(address, "/")
    const page = await request(address, `/${id}`)

    expect(items(front.body)).toEqual([`<a href="/${id}">Return a key</a> Owner: not recorded. Version 1. Approved on: not recorded.`])
    expect(page.status).toBe(200)
    expect(compact(page.body)).toContain(facts("not recorded", 1, "not recorded", "not recorded"))
    expect(historyItems(page.body)).toEqual([`<a href="/${id}/1">Version 1</a> Approved by: not recorded. Approved on: not recorded. (this version)`])
    expect(page.body).not.toContain("2026-11-02")
  })
})

describe("a view that is running", () => {
  it("shows a version that move published wrote after the view started, without a restart", async () => {
    const id = "005-order-a-badge"
    writeBoard(project, [{ id, title: "Order a badge", stage: "approval", history: [{ at: "2026-11-20T17:00:00.000Z", stage: "approval" }] }])
    approveDraft(project, id)
    const address = await openView(project)
    expect((await request(address, "/")).body).toContain("<p>No process is published yet.</p>")
    expect((await request(address, `/${id}`)).status).toBe(404)

    expect(runCommand(project, ["move", id, "published"]).stdout).toBe("published\n")

    const approvedOn = (/^Approved at: (\d{4}-\d{2}-\d{2})/m.exec(readFile(project, `processes/${id}/versions/1/approval.md`)) ?? [])[1] ?? ""
    expect(approvedOn).not.toBe("")
    const front = await request(address, "/")
    expect(items(front.body)).toEqual([`<a href="/${id}">Order a badge</a> Owner: Kari Nordmann. Version 1. Approved on: ${approvedOn}.`])
    const page = await request(address, `/${id}`)
    expect(page.status).toBe(200)
    expect(page.body).toContain("<title>Order a badge, version 1</title>")
    expect(compact(page.body)).toContain(facts(kari, 1, kari, approvedOn))
    expect(mainOf(page.body)).toBe("<h1>Draft 1</h1>")
  })

  it("makes a second version the current one at the next request", async () => {
    writeBoard(project, [laptopEntry({ versions: [{ version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-10-03T08:00:00.000Z" }] })])
    writeVersion(project, laptopId, 1, firstDocument, approvalText(laptopId, "draft-1.md", kari, "2026-10-02T09:00:00.000Z"))
    const address = await openView(project)
    expect((await request(address, laptopPath)).body).toContain("<title>Handle a lost laptop, version 1</title>")

    writeVersion(project, laptopId, 2, secondDocument, approvalText(laptopId, "draft-2.md", kari, "2026-11-21T10:05:00.000Z"))
    writeBoard(project, [laptopEntry()])

    const page = await request(address, laptopPath)
    expect(page.body).toContain("<title>Handle a lost laptop, version 2</title>")
    expect(historyItems(page.body)).toEqual([currentItem, earlierItem])
    expect((await request(address, `${laptopPath}/1`)).body).toContain("This is version 1, not the current version.")
  })

  it("answers POST, PUT and DELETE with 405 and Allow: GET, HEAD, answers HEAD, and never changes a file of the project", async () => {
    writeLaptop(project)
    const before = tree(project)
    const address = await openView(project)

    for (const method of ["POST", "PUT", "DELETE"]) {
      for (const pathname of ["/", laptopPath, `${laptopPath}/1`]) {
        const refused = await request(address, pathname, method)
        expect(refused.status).toBe(405)
        expect(refused.headers.get("allow")).toBe("GET, HEAD")
        expect(refused.body).toBe("")
      }
    }
    expect((await request(address, "/", "HEAD")).status).toBe(200)
    for (const pathname of ["/", laptopPath, `${laptopPath}/1`, `${laptopPath}/2`, `${laptopPath}/3`, "/nothing-here"]) await request(address, pathname)

    expect(tree(project)).toEqual(before)
  })

  it("answers 500 without the name of the file while the board cannot be read, and 200 again after it is repaired", async () => {
    writeLaptop(project)
    const board = readFile(project, boardFile)
    const address = await openView(project)
    writeFile(project, boardFile, "{ not json")

    for (const pathname of ["/", laptopPath]) {
      const broken = await request(address, pathname)
      expect(broken.status).toBe(500)
      expect(broken.headers.get("content-type")).toBe("text/html; charset=utf-8")
      expect(broken.body).toContain("<title>Error</title>")
      expect(broken.body).toContain("<h1>Error</h1>")
      expect(broken.body).toContain("<p>The reading view cannot read the processes.</p>")
      expect(broken.body).not.toContain("board.json")
      expect(broken.body).not.toContain("JSON")
      expect(broken.body).not.toContain("Handle a lost laptop")
    }

    writeFile(project, boardFile, board)
    const front = await request(address, "/")
    expect(front.status).toBe(200)
    expect(items(front.body)).toHaveLength(1)
  })
})
