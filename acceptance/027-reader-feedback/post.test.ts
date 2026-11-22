import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, readFile, runCommand, writeFile } from "../006-process-state-machine/store.ts"
import { items, laptopId, olderId, openView, request, stopViews, tree, writeLaptop } from "../026-reading-view-on-localhost/view.ts"
import type { Answer } from "./Answer.ts"
import { feedbackFolder, feedbackPath, feedbackText, fields, laptopPath, post, send } from "./feedback.ts"

const kindReason = "Choose what went wrong: the document or the process."
const stepReason = "Choose a step of this version or the whole document."
const textReason = "Write what happened."
const { kind, step, text, name } = fields

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** Expects the page `Feedback not stored` with the link back to version 2. */
function expectNotStored(answer: Answer, status: number): void {
  expect(answer.status).toBe(status)
  expect(answer.headers["content-type"]).toBe("text/html; charset=utf-8")
  expect(answer.body).toContain("<title>Feedback not stored</title>")
  expect(answer.body).toContain("<h1>Feedback not stored</h1>")
  expect(answer.body).toContain(`<p><a href="${laptopPath}/2">Back to the document</a></p>`)
}

describe("a post of feedback that is accepted", () => {
  it("is answered with 303 to the address itself and writes feedback-1.md with the version, the step, the kind, the name, the time and Status: open, and nothing else", async () => {
    writeLaptop(project)
    const before = tree(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, fields)

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(feedbackPath)
    expect(answer.body).toBe("")
    expect(readFile(project, `${feedbackFolder}/feedback-1.md`)).toMatch(
      /^# Feedback 1\n\nProcess: 001-handle-a-lost-laptop\nVersion: 2\nStep: 1\nKind: document\nFrom: Ola Hansen\nReceived at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\nStatus: open\n\n## Text\n\nI did not understand step one\.\n$/,
    )
    const after = tree(project)
    expect(after[boardFile]).toBe(before[boardFile])
    expect(Object.keys(after).filter((file) => !(file in before)).sort()).toEqual([`${feedbackFolder}/`, `${feedbackFolder}/feedback-1.md`])
    for (const [file, content] of Object.entries(before)) expect(after[file]).toBe(content)
  })

  it("stores the other kind, the whole document, the version of the address and anonymous for a post without a name or with a name of spaces", async () => {
    writeLaptop(project)
    const address = await openView(project)

    expect((await post(address, `${laptopPath}/1/feedback`, { kind: "process", step: "whole", text: "The police did not answer." })).status).toBe(303)
    expect((await post(address, feedbackPath, { ...fields, name: "   " })).status).toBe(303)

    const first = readFile(project, `${feedbackFolder}/feedback-1.md`).split("\n")
    expect(first.slice(0, 7)).toEqual(["# Feedback 1", "", `Process: ${laptopId}`, "Version: 1", "Step: whole document", "Kind: process", "From: anonymous"])
    expect(first.slice(8)).toEqual(["Status: open", "", "## Text", "", "The police did not answer.", ""])
    expect(readFile(project, `${feedbackFolder}/feedback-2.md`)).toContain("\nVersion: 2\nStep: 1\nKind: document\nFrom: anonymous\n")
  })

  it("gives every feedback the next number and never changes a file that is there", async () => {
    writeLaptop(project)
    const address = await openView(project)

    expect((await post(address, feedbackPath, fields)).status).toBe(303)
    const first = readFile(project, `${feedbackFolder}/feedback-1.md`)
    expect((await post(address, feedbackPath, { ...fields, text: "A second remark." })).status).toBe(303)

    expect(entries(project, feedbackFolder)).toEqual(["feedback-1.md", "feedback-2.md"])
    expect(readFile(project, `${feedbackFolder}/feedback-1.md`)).toBe(first)
    expect(readFile(project, `${feedbackFolder}/feedback-2.md`)).toContain("# Feedback 2\n")
    expect(readFile(project, `${feedbackFolder}/feedback-2.md`)).toContain("\n## Text\n\nA second remark.\n")
  })

  it("writes feedback-8.md when feedback-7.md is the highest in the folder", async () => {
    writeLaptop(project)
    const seventh = feedbackText(7, ["Status: open"], "An earlier remark.")
    writeFile(project, `${feedbackFolder}/feedback-7.md`, seventh)
    const address = await openView(project)

    expect((await post(address, feedbackPath, fields)).status).toBe(303)

    expect(entries(project, feedbackFolder)).toEqual(["feedback-7.md", "feedback-8.md"])
    expect(readFile(project, `${feedbackFolder}/feedback-7.md`)).toBe(seventh)
    expect(readFile(project, `${feedbackFolder}/feedback-8.md`)).toContain("# Feedback 8\n")
  })

  it("stores a text of exactly 2000 characters and a name of exactly 100", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, { ...fields, text: "t".repeat(2000), name: "n".repeat(100) })

    expect(answer.status).toBe(303)
    const stored = readFile(project, `${feedbackFolder}/feedback-1.md`)
    expect(stored).toContain(`\nFrom: ${"n".repeat(100)}\n`)
    expect(stored.endsWith(`\n## Text\n\n${"t".repeat(2000)}\n`)).toBe(true)
  })

  it("stores a post whose Origin is the address of the view, also written with localhost", async () => {
    writeLaptop(project)
    const address = await openView(project)

    expect((await post(address, feedbackPath, fields, { Origin: address })).status).toBe(303)
    expect((await post(address, feedbackPath, fields, { Origin: address.replace("127.0.0.1", "localhost") })).status).toBe(303)

    expect(entries(project, feedbackFolder)).toEqual(["feedback-1.md", "feedback-2.md"])
  })

  it("stores a text of two lines without its control characters but with its tab, and a name as one line that cannot change the status", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, { ...fields, text: "  first\r\n\u001bsecond\tpart\u0007  ", name: "Ola\r\nStatus: closed" })

    expect(answer.status).toBe(303)
    const lines = readFile(project, `${feedbackFolder}/feedback-1.md`).split("\n")
    expect(lines).toContain("From: Ola Status: closed")
    expect(lines.filter((line) => line.startsWith("Status: "))).toEqual(["Status: open"])
    expect(lines.slice(lines.indexOf("## Text"))).toEqual(["## Text", "", "first", "second\tpart", ""])
  })

  it("stores a text with lines of its own as it was typed, and show still lists it as open on one line", async () => {
    writeLaptop(project)
    const address = await openView(project)
    const typed = "Status: closed\n## Text\n<script>alert(1)</script>"

    expect((await post(address, feedbackPath, { ...fields, text: typed })).status).toBe(303)

    expect(readFile(project, `${feedbackFolder}/feedback-1.md`).endsWith(`\nStatus: open\n\n## Text\n\n${typed}\n`)).toBe(true)
    const shown = runCommand(project, ["show", laptopId]).stdout.split("\n")
    expect(shown).toContain("  1  version 2  step 1  document  Status: closed ## Text <script>alert(1)</script>")
    expect(shown.filter((line) => line.startsWith("Stage: "))).toEqual(["Stage: published"])
  })

  it("leaves every page of the view as it was: no page shows a feedback or a count", async () => {
    writeLaptop(project)
    const address = await openView(project)
    const paths = ["/", laptopPath, `${laptopPath}/1`]
    const before: string[] = []
    for (const pathname of paths) before.push((await request(address, pathname)).body)

    expect((await post(address, feedbackPath, { ...fields, text: "Nobody else may read this." })).status).toBe(303)
    expect((await post(address, `${laptopPath}/1/feedback`, fields)).status).toBe(303)

    const after: string[] = []
    for (const pathname of paths) after.push((await request(address, pathname)).body)
    expect(after).toEqual(before)
    expect(after.join("")).not.toContain("Nobody else may read this.")
  })
})

describe("the page Feedback received", () => {
  it("says for which version of which process the feedback is stored, links back to the document, and shows nothing of a post and writes nothing", async () => {
    writeLaptop(project)
    const address = await openView(project)
    expect((await post(address, feedbackPath, { ...fields, text: "Nobody else may read this." })).status).toBe(303)
    const before = tree(project)

    const page = await request(address, feedbackPath)

    expect(page.status).toBe(200)
    expect(page.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(page.headers.get("cache-control")).toBe("no-store")
    expect(page.headers.get("x-content-type-options")).toBe("nosniff")
    expect(page.headers.get("content-security-policy")).toBe("default-src 'none'; style-src 'unsafe-inline'")
    expect(page.body).toContain("<title>Feedback received</title>")
    expect(page.body).toContain("<h1>Feedback received</h1>")
    expect(page.body).toContain("<p>Thank you. Your feedback on version 2 of Handle a lost laptop is stored.</p>")
    expect(page.body).toContain(`<p><a href="${laptopPath}/2">Back to the document</a></p>`)
    expect(page.body).not.toContain("Nobody else may read this.")
    expect(page.body).not.toContain("Ola Hansen")
    expect(page.body).not.toContain("<script")
    expect(tree(project)).toEqual(before)
  })

  it("is there for an earlier version without a post before it, and answers HEAD", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, `${laptopPath}/1/feedback`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<p>Thank you. Your feedback on version 1 of Handle a lost laptop is stored.</p>")
    expect(page.body).toContain(`<p><a href="${laptopPath}/1">Back to the document</a></p>`)
    expect((await request(address, feedbackPath, "HEAD")).status).toBe(200)
    expect(entries(project, feedbackFolder)).toEqual([])
  })
})

describe("a post of feedback that is refused", () => {
  const refusedPosts: [string, Record<string, string>, string][] = [
    ["no kind", { step, text, name }, kindReason],
    ["a kind that is not one of the two", { ...fields, kind: "other" }, kindReason],
    ["no step", { kind, text, name }, stepReason],
    ["a step the version does not have", { ...fields, step: "2" }, stepReason],
    ["a step with a leading zero", { ...fields, step: "01" }, stepReason],
    ["a step that is a path", { ...fields, step: "../1" }, stepReason],
    ["no text", { kind, step, name }, textReason],
    ["a text of only whitespace", { ...fields, text: " \r\n\t " }, textReason],
    ["a text of 2001 characters", { ...fields, text: "t".repeat(2001) }, "The text may be at most 2000 characters."],
    ["a name of 101 characters", { ...fields, name: "n".repeat(101) }, "The name may be at most 100 characters."],
  ]

  it.each(refusedPosts)("answers 400 with the one reason and writes no file for %s", async (_name, values, reason) => {
    writeLaptop(project)
    const before = tree(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, values)

    expectNotStored(answer, 400)
    expect(items(answer.body)).toEqual([reason])
    expect(tree(project)).toEqual(before)
  })

  it("names the kind, the step and the text, in that order, for an empty post", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const answer = await send(address, feedbackPath, "")

    expectNotStored(answer, 400)
    expect(items(answer.body)).toEqual([kindReason, stepReason, textReason])
    expect(entries(project, feedbackFolder)).toEqual([])
  })

  it("repeats neither the name nor the text of the post on the page", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, { step, text: "Nobody else may read this.", name: "Secret Reader" })

    expectNotStored(answer, 400)
    expect(answer.body).not.toContain("Nobody else may read this.")
    expect(answer.body).not.toContain("Secret Reader")
  })

  it.each([["http://evil.example"], ["null"], ["http://127.0.0.1:1"], ["https://127.0.0.1"]])("answers 403 and writes no file for a post with the Origin %s", async (origin) => {
    writeLaptop(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, fields, { Origin: origin })

    expectNotStored(answer, 403)
    expect(items(answer.body)).toEqual(["Feedback can only be sent from the reading view itself."])
    expect(entries(project, feedbackFolder)).toEqual([])
  })

  it("answers 413 and writes no file for a body of 40000 bytes, and answers the next request", async () => {
    writeLaptop(project)
    const address = await openView(project)
    const body = `kind=document&step=1&text=${"a".repeat(40_000 - 26)}`
    expect(Buffer.byteLength(body)).toBe(40_000)

    const answer = await send(address, feedbackPath, body)

    expectNotStored(answer, 413)
    expect(items(answer.body)).toEqual(["The feedback is too long."])
    expect(entries(project, feedbackFolder)).toEqual([])
    expect((await request(address, "/")).status).toBe(200)
  })
})

describe("the address of feedback", () => {
  it.each([
    ["a process that was never published", `/${olderId}/1/feedback`],
    ["a version that is not published", `${laptopPath}/3/feedback`],
    ["a version with a leading zero", `${laptopPath}/02/feedback`],
    ["a process that is not on the board", "/999-no-such-process/1/feedback"],
    ["a process without a version in the path", `${laptopPath}/feedback`],
    ["a path that tries to leave the store", `/..%2f${laptopId}/2/feedback`],
  ])("takes a post only for a published version: 405 with Allow: GET, HEAD for %s, 404 for GET, and no file", async (_name, pathname) => {
    writeLaptop(project)
    const address = await openView(project)
    expect((await post(address, feedbackPath, fields)).status).toBe(303)
    const before = tree(project)

    const refused = await post(address, pathname, fields)
    const page = await request(address, pathname)

    expect(refused.status).toBe(405)
    expect(refused.headers.allow).toBe("GET, HEAD")
    expect(refused.body).toBe("")
    expect(page.status).toBe(404)
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(tree(project)).toEqual(before)
    expect(entries(project, feedbackFolder)).toEqual(["feedback-1.md"])
  })

  it.each([["PUT"], ["DELETE"]])("answers %s with 405 and Allow: GET, HEAD, POST, and writes no file", async (method) => {
    writeLaptop(project)
    const before = tree(project)
    const address = await openView(project)

    const refused = await send(address, feedbackPath, new URLSearchParams(fields).toString(), { method })

    expect(refused.status).toBe(405)
    expect(refused.headers.allow).toBe("GET, HEAD, POST")
    expect(refused.body).toBe("")
    expect(tree(project)).toEqual(before)
  })

  it("answers a post with 500 and writes no file while the board cannot be read", async () => {
    writeLaptop(project)
    const address = await openView(project)
    writeFile(project, boardFile, "{ not json")

    const answer = await post(address, feedbackPath, fields)

    expect(answer.status).toBe(500)
    expect(answer.body).toContain("<p>The reading view cannot read the processes.</p>")
    expect(answer.body).not.toContain("board.json")
    expect(entries(project, feedbackFolder)).toEqual([])
  })

  it("answers 500 without a path when the file cannot be written, and keeps running", async () => {
    writeLaptop(project)
    writeFile(project, feedbackFolder, "a file where the folder should be\n")
    const before = tree(project)
    const address = await openView(project)

    const answer = await post(address, feedbackPath, fields)

    expect(answer.status).toBe(500)
    expect(answer.headers["content-type"]).toBe("text/html; charset=utf-8")
    expect(answer.body).toContain("<title>Error</title>")
    expect(answer.body).toContain("<h1>Error</h1>")
    expect(answer.body).toContain("<p>The feedback could not be stored.</p>")
    expect(answer.body).not.toContain("processes")
    expect(answer.body).not.toContain(laptopId)
    expect(answer.body).not.toContain("feedback-1.md")
    expect(tree(project)).toEqual(before)
    expect((await request(address, "/")).status).toBe(200)
  })
})
