import { existsSync, rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, readFile, writeFile } from "../006-process-state-machine/store.ts"
import { kari, processId } from "../024-named-owner-and-approval/approval.ts"
import { compact, request, tree } from "../026-reading-view-on-localhost/view.ts"
import { post, send } from "../027-reader-feedback/feedback.ts"
import { openDashboard, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { openPanel, part } from "../033-dashboard-process-page/panel.ts"
import { notDone, ownProcess } from "../034-dashboard-decisions/decisions.ts"
import { backLink, cannotEditSpec, caseFile, caseText, editAddress, firstNewLine, lineItems, needsSentence, newSpec, oldLine, oldSpec, prepare, saveAddress, secondNewLine, specFile } from "./authoring.ts"

const headers: [string, string][] = [
  ["content-type", "text/html; charset=utf-8"],
  ["cache-control", "no-store"],
  ["x-content-type-options", "nosniff"],
  ["content-security-policy", "default-src 'none'; style-src 'unsafe-inline'"],
]
const movesBack = `<p>Saving moves the process back to the stage draft, so that /process next ${processId} in Claude Code writes a new draft from the edited files.</p>`
const saveForm = `<form method="post" action="${saveAddress}">`

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** What stands in the field `text` of an edit page after the one line break that follows its opening tag, or `missing`. */
function fieldText(body: string): string {
  return /<textarea id="text" name="text" rows="30" required>\r?\n(.*?)<\/textarea>/s.exec(body)?.[1] ?? "missing"
}

/** The value of the hidden field `text` of a check page as it is written in the page, or `missing`. */
function hiddenText(body: string): string {
  return /<input type="hidden" name="text" value="([^"]*)">/.exec(body)?.[1] ?? "missing"
}

describe("GET /<process-id>/edit/<name>", () => {
  it("is the page Edit spec.md with the whole text of the file in one field and the button Show what changes, without a reload and without script", async () => {
    prepare(project, "rework")
    const before = tree(project)

    const page = await request(await openDashboard(project), editAddress)

    expect(page.status).toBe(200)
    for (const [name, value] of headers) expect(page.headers.get(name)).toBe(value)
    expect(page.body.toLowerCase().startsWith("<!doctype html>")).toBe(true)
    expect(page.body).toContain("<title>Edit spec.md</title>")
    expect(page.body).toContain("<h1>Edit spec.md</h1>")
    expect(page.body).toContain(`<p>${backLink}</p>`)
    expect(page.body).toContain(`<p>Handle a lost laptop, ${processId}</p>`)
    expect(page.body).toContain(`<form method="post" action="${editAddress}">`)
    expect(page.body).toContain('<label for="text">The text of spec.md</label>')
    expect(fieldText(page.body)).toBe(oldSpec.trim())
    expect(page.body).toContain("<p>Nothing is saved yet. The next page shows what changes.</p>")
    expect(page.body).toContain('<button type="submit">Show what changes</button>')
    expect(page.body).not.toContain('http-equiv="refresh"')
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<aside")
    expect(tree(project)).toEqual(before)
  })

  it("is the page Edit case-2.md with the text of that case", async () => {
    prepare(project, "cases")

    const page = await request(await openDashboard(project), `/${processId}/edit/case-2.md`)

    expect(page.status).toBe(200)
    expect(page.body).toContain("<h1>Edit case-2.md</h1>")
    expect(page.body).toContain(`<form method="post" action="/${processId}/edit/case-2.md">`)
    expect(page.body).toContain('<label for="text">The text of case-2.md</label>')
    expect(fieldText(page.body)).toBe(caseText(2).trim())
  })

  it("escapes the text of the file in the field", async () => {
    prepare(project, "rework")
    writeFile(project, specFile, '# Specification\n\nCall <the police> & "wait"\n</textarea><script>alert(1)</script>\n')

    const page = await request(await openDashboard(project), editAddress)

    expect(page.status).toBe(200)
    expect(fieldText(page.body)).toBe("# Specification\n\nCall &lt;the police&gt; &amp; &quot;wait&quot;\n&lt;/textarea&gt;&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(page.body).not.toContain("<the police>")
    expect(page.body).not.toContain("<script")
  })
})

describe("POST /<process-id>/edit/<name>", () => {
  it("shows every line of the edited text, the removed line marked with - and the added lines with +, in the place of the change, with their counts", async () => {
    prepare(project, "rework")

    const page = await post(await openDashboard(project), editAddress, { text: newSpec.replace(/\n/g, "\r\n") })

    expect(page.status).toBe(200)
    for (const [name, value] of headers) expect(page.headers[name]).toBe(value)
    expect(page.body).toContain("<title>Check the edit of spec.md</title>")
    expect(page.body).toContain("<h1>Check the edit of spec.md</h1>")
    expect(page.body).toContain(`<p>${backLink}</p>`)
    expect(page.body).toContain(`<p>Handle a lost laptop, ${processId}</p>`)
    expect(page.body).toContain("<p>Lines removed: 1. Lines added: 2. A line that starts with - is removed, a line that starts with + is added.</p>")
    const marked = [`<del>- ${oldLine}</del>`, `<ins>+ ${firstNewLine}</ins>`, `<ins>+ ${secondNewLine}</ins>`]
    expect(lineItems(page.body)).toEqual(
      oldSpec
        .trim()
        .split("\n")
        .flatMap((line) => (line === oldLine ? marked : [line])),
    )
    expect(page.body.split("<del>")).toHaveLength(2)
    expect(page.body.split("<ins>")).toHaveLength(3)
    expect(page.body).not.toContain('http-equiv="refresh"')
    expect(page.body).not.toContain("<script")
  })

  it("asks for the full name next to the button Save, carries the text in a hidden field, writes nothing, and says that a process in rework moves back to draft", async () => {
    prepare(project, "rework")
    const before = tree(project)
    const dashboard = await openDashboard(project)

    const page = await post(dashboard, editAddress, { text: newSpec })

    expect(page.status).toBe(200)
    const form = compact(page.body.slice(page.body.indexOf(saveForm)))
    expect(form.startsWith(`${saveForm}<input type="hidden" name="text" value="`)).toBe(true)
    expect(form).toContain('<p><label for="by">Your full name</label><input id="by" name="by" required></p><p><button type="submit">Save</button></p></form>')
    expect(hiddenText(page.body)).toContain(secondNewLine)
    expect(page.body.split("<form")).toHaveLength(2)
    expect(page.body).not.toContain(kari)
    expect(compact(page.body)).toContain(`</ul>${movesBack}${saveForm}`)
    expect(tree(project)).toEqual(before)

    prepare(project, "cases")
    const quiet = await post(dashboard, editAddress, { text: newSpec })
    expect(quiet.status).toBe(200)
    expect(quiet.body).toContain(saveForm)
    expect(quiet.body).not.toContain("Saving moves")
  })

  it.each([
    ["as it is", oldSpec],
    ["with other line breaks", oldSpec.replace(/\n/g, "\r\n")],
  ])("says that nothing changes, without a form, for the text of the file %s", async (_name, text) => {
    prepare(project, "rework")

    const page = await post(await openDashboard(project), editAddress, { text })

    expect(page.status).toBe(200)
    expect(page.body).toContain("<h1>Check the edit of spec.md</h1>")
    expect(page.body).toContain("<p>Nothing changes in spec.md.</p>")
    expect(page.body).not.toContain("<form")
    expect(page.body).not.toContain("<del>")
    expect(page.body).not.toContain("<ins>")
    expect(page.body).not.toContain("Lines removed")
  })

  it("escapes a posted line in its item and in the hidden field", async () => {
    prepare(project, "rework")

    const page = await post(await openDashboard(project), editAddress, { text: `${oldSpec}<b>bold</b> & "more"\n` })

    expect(page.status).toBe(200)
    expect(lineItems(page.body).at(-1)).toBe("<ins>+ &lt;b&gt;bold&lt;/b&gt; &amp; &quot;more&quot;</ins>")
    expect(hiddenText(page.body)).toContain("&lt;b&gt;bold&lt;/b&gt; &amp; &quot;more&quot;")
    expect(page.body).not.toContain("<b>")
  })
})

describe("POST /<process-id>/save/<name>", () => {
  it("saves the text through the command line as the owner, sends the browser back to the page of the process, and the process is in draft and needs a new draft", async () => {
    prepare(project, "approval")
    const dashboard = await openDashboard(project)

    const answer = await post(dashboard, saveAddress, { text: newSpec.replace(/\n/g, "\r\n"), by: kari })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${processId}`)
    expect(answer.body).toBe("")
    expect(readFile(project, specFile)).toBe(newSpec)
    expect(ownProcess(project).stage).toBe("draft")
    expect(ownProcess(project).needsDraft).toEqual(["spec.md"])
    const { panel } = await openPanel(dashboard, processId)
    expect(compact(panel)).toContain("<dt>Stage</dt><dd>draft</dd>")
    expect(compact(panel)).toContain(`</dl>${needsSentence}<p>Waits for Claude Code: /process next ${processId}.</p><ol class="trail">`)
    expect(part(panel, "timeline").endsWith(` draft, spec.md edited by ${kari}</li></ol>`)).toBe(true)
    expect(part(panel, "spec")).toContain(`<p>${firstNewLine} ${secondNewLine}</p>`)
  })

  it("saves a case", async () => {
    prepare(project, "draft")
    const text = "# Case 1: Laptop 1\n\n## Situation\n\nThe laptop is stolen abroad.\n"

    const answer = await post(await openDashboard(project), `/${processId}/save/case-1.md`, { text, by: kari })

    expect(answer.status).toBe(303)
    expect(readFile(project, caseFile(1))).toBe(text)
    expect(ownProcess(project).stage).toBe("draft")
    expect(ownProcess(project).needsDraft).toEqual(["case-1.md"])
  })

  it("answers 409 with the page Not done, the line of the command line and the link back for a name that is not the owner, and changes nothing", async () => {
    prepare(project, "approval")
    const before = tree(project)

    const answer = await post(await openDashboard(project), saveAddress, { text: newSpec, by: "Nobody Known" })

    expect(answer.status).toBe(409)
    for (const [name, value] of headers) expect(answer.headers[name]).toBe(value)
    expect(answer.body).toContain("<title>Not done</title>")
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(`<li>${cannotEditSpec}: --by does not name its owner</li>`)
    expect(answer.body).toContain(`<p>${backLink}</p>`)
    expect(answer.body).not.toContain('http-equiv="refresh"')
    expect(tree(project)).toEqual(before)
  })

  it("answers 409 with the line of the command line for a published process, and changes nothing", async () => {
    prepare(project, "published")
    const before = tree(project)

    const answer = await post(await openDashboard(project), saveAddress, { text: newSpec, by: kari })

    expect(answer.status).toBe(409)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain(`<li>${cannotEditSpec}: it is in the stage published, not in spec, cases, draft, review, rework or approval</li>`)
    expect(tree(project)).toEqual(before)
  })

  it("saves a specification of more than 40000 bytes, which is longer than a decision may be", async () => {
    prepare(project, "rework")
    const filler = Array.from({ length: 700 }, (_, index) => `Record ${String(index)} is kept for five years in the archive of the organisation.`).join("\n")
    const long = `${oldSpec}\n${filler}\n`
    expect(Buffer.byteLength(long)).toBeGreaterThan(40_000)
    writeFile(project, specFile, long)
    const dashboard = await openDashboard(project)

    const checked = await post(dashboard, editAddress, { text: long.replace(oldLine, firstNewLine) })
    expect(checked.status).toBe(200)
    expect(checked.body).toContain("<p>Lines removed: 1. Lines added: 1. A line that starts with - is removed, a line that starts with + is added.</p>")

    const answer = await post(dashboard, saveAddress, { text: long.replace(oldLine, firstNewLine), by: kari })

    expect(answer.status).toBe(303)
    expect(readFile(project, specFile)).toBe(long.replace(oldLine, firstNewLine))
  })

  it("never lets a shell read a name or a text: the name is refused, the text is stored as it was typed, and no file is made", async () => {
    prepare(project, "rework")
    const dashboard = await openDashboard(project)
    const text = `${newSpec}"; echo hacked > hacked.txt; " $(touch hacked.txt)\n`

    const refused = await post(dashboard, saveAddress, { text, by: "$(touch hacked.txt)" })

    expect(refused.status).toBe(409)
    expect(refused.body).toContain(`<li>${cannotEditSpec}: --by does not name its owner</li>`)
    expect(readFile(project, specFile)).toBe(oldSpec)

    const saved = await post(dashboard, saveAddress, { text, by: kari })

    expect(saved.status).toBe(303)
    expect(readFile(project, specFile)).toBe(text)
    expect(existsSync(path.join(project, "hacked.txt"))).toBe(false)
    expect(existsSync(path.join(project, "processes", "hacked.txt"))).toBe(false)
    expect(existsSync(path.resolve(project, "../..", "hacked.txt"))).toBe(false)
  })
})

describe("a post of an edit", () => {
  it.each([
    ["the edit address", editAddress],
    ["the save address", saveAddress],
  ])("is refused with 413 at %s when it is longer than 524288 bytes, and changes nothing", async (_name, address) => {
    prepare(project, "rework")
    const before = tree(project)

    const answer = await send(await openDashboard(project), address, `by=${encodeURIComponent(kari)}&text=${"x".repeat(600_000)}`)

    expect(answer.status).toBe(413)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain("<li>The edit is too long.</li>")
    expect(tree(project)).toEqual(before)
  })

  it.each([
    ["the edit address", editAddress],
    ["the save address", saveAddress],
  ])("is refused with 403 at %s when it comes from another origin, and changes nothing", async (_name, address) => {
    prepare(project, "rework")
    const before = tree(project)

    const answer = await post(await openDashboard(project), address, { text: newSpec, by: kari }, { Origin: "http://evil.example" })

    expect(answer.status).toBe(403)
    expect(answer.body).toContain(notDone)
    expect(answer.body).toContain("<li>An edit can only be sent from the dashboard itself.</li>")
    expect(tree(project)).toEqual(before)
  })

  it("is carried out when its origin is the dashboard itself", async () => {
    prepare(project, "rework")
    const dashboard = await openDashboard(project)

    const answer = await post(dashboard, saveAddress, { text: newSpec, by: kari }, { Origin: dashboard })

    expect(answer.status).toBe(303)
    expect(readFile(project, specFile)).toBe(newSpec)
  })
})

describe("the addresses of the dashboard", () => {
  it("have an edit page only for a file that can be edited: every other GET is 404, and every other post, and PUT of a save, is 405 with Allow: GET, HEAD", async () => {
    prepare(project, "rework")
    const dashboard = await openDashboard(project)
    expect((await request(dashboard, editAddress)).status).toBe(200)
    expect((await request(dashboard, editAddress, "HEAD")).status).toBe(200)
    const before = tree(project)

    for (const pathname of [`/${processId}/edit/draft-1.md`, `/${processId}/edit/case-7.md`, "/003-not-on-the-board/edit/spec.md", saveAddress, `/${processId}/edit/spec.md/more`]) {
      const page = await request(dashboard, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
    }
    const refused: [string, string][] = [
      ["POST", `/${processId}/edit/draft-1.md`],
      ["POST", `/${processId}/edit/case-7.md`],
      ["POST", "/003-not-on-the-board/save/spec.md"],
      ["POST", `/${processId}/save/draft-1.md`],
      ["PUT", saveAddress],
      ["PUT", editAddress],
    ]
    for (const [method, pathname] of refused) {
      const answer = await send(dashboard, pathname, `by=${encodeURIComponent(kari)}&text=New`, { method })
      expect(answer.status).toBe(405)
      expect(answer.headers.allow).toBe("GET, HEAD")
      expect(answer.body).toBe("")
    }
    expect(tree(project)).toEqual(before)

    prepare(project, "published")
    expect((await request(dashboard, editAddress)).status).toBe(404)
    const closed = await post(dashboard, editAddress, { text: newSpec })
    expect(closed.status).toBe(405)
    expect(closed.headers.allow).toBe("GET, HEAD")
  })
})
