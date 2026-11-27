import { afterEach, describe, expect, it } from "vitest"
import { requestPage, stopServers, writeBoardFile, writeWorkingFile } from "./command-line.ts"
import {
  compactHtml,
  headerOf,
  mainOf,
  openDashboard,
  owner,
  partAddress,
  parts,
  processId,
  refresh,
  reloadSentence,
  specText,
  title,
  trail,
  writeQuestions,
} from "./dashboard-pages.ts"

const claudeCode = `<p>Waits for Claude Code: /process next ${processId}.</p>`
const stillSentence = "<p>This page does not reload, so that what you type is kept. Load it again to see what has changed.</p>"
const approvalRound = { round: 1, draft: "draft-1.md", at: "2026-11-21T10:00:00.000Z", verdicts: [{ reviewer: "legal", verdict: "PASS" }] }

/** The board with the laptop process in `stage`, owned by Kari Nordmann unless `more` says otherwise. */
function writeWaiting(stage: string, more: Record<string, unknown> = {}): void {
  writeBoardFile([{ id: processId, title, stage, owner, history: [{ at: "2026-11-22T10:00:00.000Z", stage }], ...more }])
}

/** Writes `draft-<n>.md` of the laptop process for each of these numbers. */
function writeDrafts(numbers: number[]): void {
  for (const number of numbers) writeWorkingFile(`processes/${processId}/drafts/draft-${String(number)}.md`, `# Handle a lost laptop\n\n1. Step of draft ${String(number)}.\n`)
}

/** The header of the page of the laptop process at one of its addresses, which must answer with 200. */
async function headerAt(address: string, pathname: string): Promise<string> {
  const page = await requestPage(address, pathname)
  expect(page.status).toBe(200)
  return headerOf(page.body)
}

/** The texts of the tabs of a header that are marked as the current page. */
function currentTabs(header: string): string[] {
  const nav = /<nav>(.*?)<\/nav>/s.exec(header)?.[1] ?? ""
  return [...nav.matchAll(/<a href="[^"]*" aria-current="page">(.*?)<\/a>/g)].map((match) => match[1] ?? "")
}

/** The addresses of the list of drafts of a part Draft, and the text of the one that is marked. */
function draftList(body: string): { links: string[]; chosen: string[] } {
  const list = /<ul>(.*?)<\/ul>/s.exec(mainOf(body))?.[1] ?? ""
  return {
    links: [...list.matchAll(/<a href="([^"]*)"/g)].map((match) => match[1] ?? ""),
    chosen: [...list.matchAll(/<a href="[^"]*" aria-current="page">(.*?)<\/a>/g)].map((match) => match[1] ?? ""),
  }
}

describe("the page of a process of process-factory dashboard", () => {
  afterEach(stopServers)

  it("has the header of every one of its addresses: the way back, the facts, who it waits for, the trail, the eight tabs and the sentence about the reload", async () => {
    writeWaiting("rework", { history: [{ at: "2026-11-20T09:00:00.000Z", stage: "intake" }, { at: "2026-11-22T10:00:00.000Z", stage: "rework" }] })

    const header = await headerAt(await openDashboard(), `/${processId}`)

    expect(header).toBe(
      [
        '<p><a href="/">Back to the board</a></p>',
        `<h1>${title}</h1>`,
        `<p>${processId}</p>`,
        `<dl><dt>Stage</dt><dd>rework</dd><dt>Owner</dt><dd>${owner}</dd></dl>`,
        claudeCode,
        trail("rework", ["intake"]),
        "<nav><ul>",
        `<li><a href="/${processId}" aria-current="page">Decision</a></li>`,
        ...parts.slice(1).map(([name, heading]) => `<li><a href="/${processId}/${name}">${heading}</a></li>`),
        "</ul></nav>",
        reloadSentence,
      ].join(""),
    )
  })

  it("shows one part under its heading of the second level at each of the eight addresses, with its tab marked and its heading in the title", async () => {
    writeWaiting("rework")
    const address = await openDashboard()
    const first = await headerAt(address, `/${processId}`)

    for (const [name, heading] of parts) {
      const page = await requestPage(address, partAddress(name))
      expect(page.status).toBe(200)
      expect(page.body).toContain(name === "decision" ? `<title>${title}</title>` : `<title>${title}: ${heading}</title>`)
      expect(currentTabs(headerOf(page.body))).toEqual([heading])
      expect(headerOf(page.body).replaceAll(' aria-current="page"', "")).toBe(first.replaceAll(' aria-current="page"', ""))
      expect(mainOf(page.body).startsWith(`<h2>${heading}</h2>`)).toBe(true)
      expect(page.body.split("<h1>")).toHaveLength(2)
      expect(page.body.split("<h2>")).toHaveLength(2)
      expect(page.body).not.toContain("<aside")
    }
  })

  it("marks no stage as current for a process whose stage is none of the ten, which has no card on the board", async () => {
    writeBoardFile([{ id: processId, title, stage: "archived" }])
    const address = await openDashboard()

    const header = await headerAt(address, `/${processId}`)

    expect(header).toContain(trail("archived"))
    expect(header).not.toContain('aria-current="step"')
    expect((await requestPage(address, "/")).body).not.toContain("<article>")
  })

  it.each([
    ["clarify with an open question", "clarify", "<p>Waits for a person: answer the open questions.</p>"],
    ["spec whose sections are all decided", "spec", "<p>Waits for a person: accept the specification.</p>"],
    ["approval with an owner and a draft that is not approved", "approval", "<p>Waits for the owner: approve the draft or send it back.</p>"],
    ["published", "published", "<p>Waits for nobody: the process is published.</p>"],
    ["draft", "draft", claudeCode],
  ])("says in the header of a process in %s who it waits for", async (_name, stage, line) => {
    writeWaiting(stage, stage === "approval" ? { rounds: [approvalRound] } : {})
    if (stage === "clarify") writeQuestions(1, ["Who decides that the police are called?"])
    if (stage === "spec") writeWorkingFile(`processes/${processId}/spec.md`, specText())
    if (stage === "approval") writeDrafts([1, 2])

    const header = await headerAt(await openDashboard(), `/${processId}`)

    expect([...header.matchAll(/<p>Waits for [^<]*<\/p>/g)].map((match) => match[0])).toEqual([line])
  })

  it("lists every draft of the part Draft, the newest first, and shows the newest at its own address alike", async () => {
    writeWaiting("rework")
    writeDrafts([1, 2, 3])
    const address = await openDashboard()

    const newest = await requestPage(address, `/${processId}/draft`)
    const third = await requestPage(address, `/${processId}/draft/3`)

    expect(newest.status).toBe(200)
    expect(draftList(newest.body).links).toEqual([3, 2, 1].map((number) => `/${processId}/draft/${String(number)}`))
    expect(draftList(newest.body).chosen).toEqual(["draft-3.md"])
    expect(mainOf(newest.body)).toContain("<dl><dt>Draft</dt><dd>3</dd><dt>Reviewed in</dt><dd>no round yet</dd></dl>")
    expect(mainOf(newest.body).endsWith('<h3>Handle a lost laptop</h3><ol><li value="1">Step of draft 3.</li></ol>')).toBe(true)
    expect(mainOf(third.body)).toBe(mainOf(newest.body))
  })

  it("shows an earlier draft with the rounds that reviewed it and nothing of another draft", async () => {
    writeWaiting("rework", { rounds: [{ ...approvalRound, round: 1 }, { ...approvalRound, round: 2 }, { ...approvalRound, round: 3, draft: "draft-2.md" }] })
    writeDrafts([1, 2])
    const address = await openDashboard()

    const first = await requestPage(address, `/${processId}/draft/1`)

    expect(first.status).toBe(200)
    expect(first.body).toContain(`<title>${title}: Draft</title>`)
    expect(draftList(first.body).chosen).toEqual(["draft-1.md"])
    expect(mainOf(first.body)).toContain("<dl><dt>Draft</dt><dd>1</dd><dt>Reviewed in</dt><dd>round 1, round 2</dd></dl>")
    expect(first.body).not.toContain("Step of draft 2.")
    expect(mainOf((await requestPage(address, `/${processId}/draft/2`)).body)).toContain("<dt>Reviewed in</dt><dd>round 3</dd>")
  })

  it("lists the drafts by their number, also past the ninth, and reads no other file of the folder", async () => {
    writeWaiting("rework")
    writeDrafts([2, 9, 10])
    writeWorkingFile(`processes/${processId}/drafts/changes-10.md`, "# Changes\n")

    const page = await requestPage(await openDashboard(), `/${processId}/draft`)

    expect(page.status).toBe(200)
    expect(draftList(page.body).links).toEqual([10, 9, 2].map((number) => `/${processId}/draft/${String(number)}`))
    expect(draftList(page.body).chosen).toEqual(["draft-10.md"])
    expect(page.body).not.toContain("changes-10.md")
  })

  it.each(["decision", "", "spec/more", "draft/0", "draft/4", "draft/03", "draft/x", "draft/3/more", "panel"])(
    "answers 404 with the page Not found at the address %s of a process",
    async (rest) => {
      writeWaiting("rework")
      writeDrafts([1, 2, 3])

      const page = await requestPage(await openDashboard(), `/${processId}/${rest}`)

      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(page.body).not.toContain("<main>")
      expect(page.body).not.toContain("Step of draft")
    },
  )

  it("answers 404 for an id that is not on the board and ignores a query string", async () => {
    writeWaiting("rework")
    const address = await openDashboard()

    expect((await requestPage(address, "/003-not-on-the-board/spec")).status).toBe(404)
    const page = await requestPage(address, `/${processId}/rounds?part=spec`)
    expect(page.status).toBe(200)
    expect(page.body).toBe((await requestPage(address, `/${processId}/rounds`)).body)
  })

  it("reloads every part of a process that waits for nobody, with the sentence about the reload as the last line of the header", async () => {
    writeWaiting("rework")
    writeDrafts([1])
    const address = await openDashboard()

    for (const [name] of parts) {
      const page = await requestPage(address, partAddress(name))
      expect(page.status).toBe(200)
      expect(page.body).toContain(refresh)
      expect(headerOf(page.body).endsWith(`</nav>${reloadSentence}`)).toBe(true)
    }
  })

  it("does not reload the part Decision while it holds a form, which says so, and reloads its other seven parts", async () => {
    writeWaiting("approval", { rounds: [approvalRound] })
    writeDrafts([1, 2])
    const address = await openDashboard()

    const decision = await requestPage(address, `/${processId}`)

    expect(decision.status).toBe(200)
    expect(mainOf(decision.body)).toContain("<form")
    expect(decision.body).not.toContain('http-equiv="refresh"')
    expect(decision.body).not.toContain("This page reloads every 5 seconds.")
    expect(headerOf(decision.body).endsWith(`</nav>${stillSentence}`)).toBe(true)
    for (const [name] of parts.slice(1)) {
      const page = await requestPage(address, partAddress(name))
      expect(page.body).toContain(refresh)
      expect(page.body).not.toContain("<form")
    }
  })

  it("holds no board and no card of another process", async () => {
    writeWaiting("rework")
    writeBoardFile([
      { id: processId, title, stage: "rework", owner },
      { id: "002-onboard-a-new-employee", title: "Onboard a new employee", stage: "intake" },
    ])

    const page = await requestPage(await openDashboard(), `/${processId}/timeline`)

    expect(page.status).toBe(200)
    expect(page.body).not.toContain("<h1>Dashboard</h1>")
    expect(page.body).not.toContain("Onboard a new employee")
    expect(compactHtml(page.body)).toContain("</header><main>")
  })
})
