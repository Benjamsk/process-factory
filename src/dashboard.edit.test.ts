import { afterEach, describe, expect, it } from "vitest"
import {
  postForm,
  readWorkingFile,
  requestPage,
  send,
  stopServers,
  storedHistory,
  storedProcesses,
  timeForm,
  writeBoardFile,
  writeWorkingFile,
} from "./command-line.ts"
import { openDashboard, owner, processId, refresh, title } from "./dashboard-pages.ts"

describe("the dashboard of process-factory dashboard", () => {
  afterEach(stopServers)

  describe("the pages on which a person edits a file of a process", () => {
    const processFolder = `processes/${processId}`
    const specFile = `${processFolder}/spec.md`
    const caseFile = `${processFolder}/cases/case-2.md`
    const specText = "# Specification: Handle a lost laptop\n\n## Deadlines\n\nThe laptop is blocked within 48 hours.\n"
    const editAddress = `/${processId}/edit/spec.md`
    const saveAddress = `/${processId}/save/spec.md`
    const backLink = `<p><a href="/${processId}">Back to the process</a></p>`
    const saveForm = `<form method="post" action="${saveAddress}">`

    /** The process in `stage`, owned by Kari Nordmann, who is named in `organisation/roles.md`, with its specification, the case 2 and one draft. */
    function prepareEditable(stage: string): void {
      writeWorkingFile("organisation/roles.md", `# Roles\n\n## Data protection officer\n\n${owner} is the data protection officer.\n`)
      writeBoardFile([{ id: processId, title, stage, owner, history: [{ at: "2026-11-22T10:00:00.000Z", stage }] }])
      writeWorkingFile(specFile, specText)
      writeWorkingFile(caseFile, "# Case 2: Laptop 2\n\nThe laptop is lost abroad.\n")
      writeWorkingFile(`${processFolder}/drafts/draft-1.md`, "# Draft 1\n")
    }

    /** What stands in the field `text` of an edit page after the one line break that follows its opening tag. */
    function fieldText(body: string): string {
      return /<textarea id="text" name="text" rows="30" required>\n(.*?)<\/textarea>/s.exec(body)?.[1] ?? "missing"
    }

    /** The value of the hidden field `text` of a check page as it is written in the page. */
    function hiddenText(body: string): string {
      return /<input type="hidden" name="text" value="([^"]*)">/.exec(body)?.[1] ?? "missing"
    }

    /** What stands between `<li>` and `</li>` of every item of a page, in order. */
    function itemsOf(body: string): string[] {
      return [...body.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => match[1] ?? "")
    }

    it("holds the whole text of the file in one field, escaped, and asks to show what changes", async () => {
      prepareEditable("rework")
      writeWorkingFile(specFile, '# Specification\n\nCall <the police> & "wait"\n')

      const page = await requestPage(await openDashboard(), editAddress)

      expect(page.status).toBe(200)
      expect(page.body).toContain("<title>Edit spec.md</title>")
      expect(page.body).toContain("<h1>Edit spec.md</h1>")
      expect(page.body).toContain(backLink)
      expect(page.body).toContain(`<p>${title}, ${processId}</p>`)
      expect(page.body).toContain(`<form method="post" action="${editAddress}">`)
      expect(page.body).toContain('<label for="text">The text of spec.md</label>')
      expect(fieldText(page.body)).toBe('# Specification\n\nCall &lt;the police&gt; &amp; &quot;wait&quot;')
      expect(page.body).toContain("<p>Nothing is saved yet. The next page shows what changes.</p>")
      expect(page.body).toContain('<button type="submit">Show what changes</button>')
      expect(page.body).not.toContain(refresh)
      expect(page.body).not.toContain("<the police>")
    })

    it("holds the text of a case at its own address", async () => {
      prepareEditable("cases")

      const page = await requestPage(await openDashboard(), `/${processId}/edit/case-2.md`)

      expect(page.status).toBe(200)
      expect(page.body).toContain("<h1>Edit case-2.md</h1>")
      expect(page.body).toContain('<label for="text">The text of case-2.md</label>')
      expect(fieldText(page.body)).toBe("# Case 2: Laptop 2\n\nThe laptop is lost abroad.")
    })

    it("marks the removed and the added lines of a posted text in their place, counts them, carries the text in a hidden field and writes nothing", async () => {
      prepareEditable("rework")
      const newText = specText.replace("The laptop is blocked within 48 hours.", "The laptop is blocked within 24 hours.\nThe IT manager confirms it.")

      const page = await postForm(await openDashboard(), editAddress, { text: newText.replace(/\n/g, "\r\n") })

      expect(page.status).toBe(200)
      expect(page.body).toContain("<title>Check the edit of spec.md</title>")
      expect(page.body).toContain("<h1>Check the edit of spec.md</h1>")
      expect(page.body).toContain(backLink)
      expect(page.body).toContain("<p>Lines removed: 1. Lines added: 2. A line that starts with - is removed, a line that starts with + is added.</p>")
      expect(itemsOf(page.body)).toEqual([
        "# Specification: Handle a lost laptop",
        "",
        "## Deadlines",
        "",
        "<del>- The laptop is blocked within 48 hours.</del>",
        "<ins>+ The laptop is blocked within 24 hours.</ins>",
        "<ins>+ The IT manager confirms it.</ins>",
      ])
      const form = page.body.slice(page.body.indexOf(saveForm)).replace(/>\s+</g, "><")
      expect(form.startsWith(`${saveForm}<input type="hidden" name="text" value="`)).toBe(true)
      expect(form).toContain('<p><label for="by">Your full name</label><input id="by" name="by" required></p><p><button type="submit">Save</button></p></form>')
      expect(hiddenText(page.body)).toContain("The IT manager confirms it.")
      expect(page.body).toContain(`<p>Saving moves the process back to the stage draft, so that /process next ${processId} in Claude Code writes a new draft from the edited files.</p>`)
      expect(page.body).not.toContain(owner)
      expect(readWorkingFile(specFile)).toBe(specText)
    })

    it("says that nothing changes without a form for the text of the file, and leaves the sentence about draft out in cases", async () => {
      prepareEditable("cases")
      const address = await openDashboard()

      const same = await postForm(address, editAddress, { text: specText.replace(/\n/g, "\r\n") })

      expect(same.status).toBe(200)
      expect(same.body).toContain("<h1>Check the edit of spec.md</h1>")
      expect(same.body).toContain("<p>Nothing changes in spec.md.</p>")
      expect(same.body).not.toContain("<form")
      expect(same.body).not.toContain("Lines removed")

      const changed = await postForm(address, editAddress, { text: `${specText}The IT manager confirms it.\n` })

      expect(changed.body).toContain(saveForm)
      expect(changed.body).not.toContain("Saving moves")
    })

    it("saves a posted text through the command line, sends the browser to the panel and records the edit on the board", async () => {
      prepareEditable("rework")
      const text = "# Case 2: Laptop 2\n\nThe laptop is stolen abroad.\n"

      const answer = await postForm(await openDashboard(), `/${processId}/save/case-2.md`, { text: text.replace(/\n/g, "\r\n"), by: owner })

      expect(answer.status).toBe(303)
      expect(answer.headers.location).toBe(`/${processId}`)
      expect(answer.body).toBe("")
      expect(readWorkingFile(caseFile)).toBe(text)
      const entry = storedProcesses()[0]
      expect(entry?.stage).toBe("draft")
      expect(entry?.needsDraft).toEqual(["case-2.md"])
      expect(storedHistory(entry).at(-1)).toEqual({ at: expect.stringMatching(timeForm), stage: "draft", edited: "case-2.md", by: owner })
    })

    it("answers 409 with the page Not done and the line of the command line for a name that is not the owner, and changes nothing", async () => {
      prepareEditable("rework")

      const answer = await postForm(await openDashboard(), saveAddress, { text: "# Specification\n\nNew text.\n", by: "Ola Hansen" })

      expect(answer.status).toBe(409)
      expect(answer.body).toContain("<title>Not done</title>")
      expect(answer.body).toContain("<h1>Not done</h1>")
      expect(answer.body).toContain(`<li>process-factory: cannot edit spec.md of ${processId}: --by does not name its owner</li>`)
      expect(answer.body).toContain(backLink)
      expect(answer.body).not.toContain(refresh)
      expect(readWorkingFile(specFile)).toBe(specText)
      expect(storedProcesses()[0]?.stage).toBe("rework")
    })

    it.each([
      ["the edit address", `/${processId}/edit/spec.md`],
      ["the save address", `/${processId}/save/spec.md`],
    ])("refuses a post at %s from another origin with 403 and one of more than 524288 bytes with 413, and changes nothing", async (_name, pathname) => {
      prepareEditable("rework")
      const address = await openDashboard()

      const foreign = await postForm(address, pathname, { text: "# Specification\n\nNew text.\n", by: owner }, { Origin: "http://evil.example" })

      expect(foreign.status).toBe(403)
      expect(foreign.body).toContain("<li>An edit can only be sent from the dashboard itself.</li>")

      const long = await send(address, pathname, `by=${encodeURIComponent(owner)}&text=${"x".repeat(600_000)}`)

      expect(long.status).toBe(413)
      expect(long.body).toContain("<li>The edit is too long.</li>")
      expect(readWorkingFile(specFile)).toBe(specText)
      expect(storedProcesses()[0]?.stage).toBe("rework")
    })

    it("answers 404 for every other address of an edit and 405 for every other post and method", async () => {
      prepareEditable("rework")
      const address = await openDashboard()
      expect((await requestPage(address, editAddress, "HEAD")).status).toBe(200)

      for (const pathname of [`/${processId}/edit/draft-1.md`, `/${processId}/edit/case-7.md`, "/003-not-on-the-board/edit/spec.md", saveAddress, `${editAddress}/more`]) {
        const page = await requestPage(address, pathname)
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
        const answer = await send(address, pathname, `by=${encodeURIComponent(owner)}&text=New`, { method })
        expect(answer.status).toBe(405)
        expect(answer.headers.allow).toBe("GET, HEAD")
        expect(answer.body).toBe("")
      }

      writeBoardFile([{ id: processId, title, stage: "published", owner }])

      expect((await requestPage(address, editAddress)).status).toBe(404)
      const closed = await postForm(address, editAddress, { text: "# Specification\n\nNew text.\n" })
      expect(closed.status).toBe(405)
      expect(closed.headers.allow).toBe("GET, HEAD")
    })
  })
})
