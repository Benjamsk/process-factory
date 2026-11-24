import { rmSync } from "node:fs"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, entries, readFile, writeBoard } from "../006-process-state-machine/store.ts"
import { kari, laptopEntry, laptopId, laptopTitle, mainOf, openView, request, stopViews, tree, writeLaptop, writeLaptopVersions, writeVersion } from "../026-reading-view-on-localhost/view.ts"
import { address, bodyOf, elementOf, htmlFile, htmlStamp, link, runExport } from "./export.ts"

let project = ""
const stamp = htmlStamp(laptopTitle, 2, kari, kari, "2026-11-21", link)

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

describe("process-factory export with --format html", () => {
  it("writes exports/<process-id>-v<n>.html, prints that path and exits with 0", () => {
    writeLaptop(project)

    const result = runExport(project, "html")

    expect(result.stdout).toBe(`${htmlFile}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.html`])
  })

  it("writes a complete HTML page with the title of the version page, whose body is a header, a main and a footer in that order", () => {
    writeLaptop(project)

    runExport(project, "html")

    const page = readFile(project, htmlFile)
    expect(page.startsWith("<!doctype html>")).toBe(true)
    expect(page).toContain(`<title>${laptopTitle}, version 2</title>`)
    expect(page.trimEnd().endsWith("</html>")).toBe(true)
    expect(bodyOf(page)).toMatch(/^<header>.*<\/header><main>.*<\/main><footer>.*<\/footer>$/s)
  })

  it("has the six paragraphs of the stamp in the header, with the link to the version in the reading view, and the same in the footer", () => {
    writeLaptop(project)

    runExport(project, "html")

    const page = readFile(project, htmlFile)
    expect(elementOf(page, "header")).toBe(stamp)
    expect(elementOf(page, "footer")).toBe(stamp)
  })

  it("has in main what the reading view has in main for that version", async () => {
    writeLaptop(project)

    runExport(project, "html")

    const view = await openView(project)
    const shown = await request(view, `/${laptopId}/2`)
    expect(mainOf(shown.body)).not.toBe("")
    expect(mainOf(readFile(project, htmlFile))).toBe(mainOf(shown.body))
  })

  it("has no form, no script, no version history, no link to all processes and no reference to another file", () => {
    writeLaptop(project)

    const result = runExport(project, "html")

    const page = readFile(project, htmlFile)
    expect(result.status).toBe(0)
    expect(page).toContain("<main>")
    expect(page).not.toContain("<form")
    expect(page).not.toContain("<script")
    expect(page).not.toContain("Version history")
    expect(page).not.toContain("All processes")
    expect(page).not.toContain("src=")
    expect(page).not.toContain("<link")
  })

  it("builds the link from the address without the slashes at its end", () => {
    writeLaptop(project)

    runExport(project, "html")
    const plain = readFile(project, htmlFile)
    const withSlash = runExport(project, "html", `${address}/`)

    expect(withSlash.status).toBe(0)
    expect(plain).not.toBe("")
    expect(readFile(project, htmlFile)).toBe(plain)
  })

  it("builds the link from an address that is only an origin with a port", () => {
    writeLaptop(project)

    runExport(project, "html", "http://10.0.0.5:4173")

    const to = `http://10.0.0.5:4173/${laptopId}/2`
    expect(elementOf(readFile(project, htmlFile), "header")).toBe(htmlStamp(laptopTitle, 2, kari, kari, "2026-11-21", to))
  })

  it("exports the newest published version and writes no file for an earlier one", () => {
    writeLaptop(project)

    runExport(project, "html")

    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.html`])
    expect(readFile(project, htmlFile)).toContain("Block the laptop in Intune.")
    expect(readFile(project, htmlFile)).not.toContain("Call the police first.")
  })

  it("exports the newest published version while the process is in the stage regenerate", () => {
    writeLaptop(project, { stage: "regenerate" })

    const result = runExport(project, "html")

    expect(result.stdout).toBe(`${htmlFile}\n`)
    expect(result.status).toBe(0)
    expect(elementOf(readFile(project, htmlFile), "header")).toBe(stamp)
  })

  it("does not export a version the board lists whose process.md is not there", () => {
    const listed = [
      { version: 1, draft: "draft-1.md", approvedBy: kari, at: "2026-10-03T08:00:00.000Z" },
      { version: 2, draft: "draft-2.md", approvedBy: kari, at: "2026-11-22T08:00:00.000Z" },
      { version: 3, draft: "draft-3.md", approvedBy: kari, at: "2026-11-23T08:00:00.000Z" },
    ]
    writeLaptop(project, { versions: listed })

    const result = runExport(project, "html")

    expect(result.stdout).toBe(`${htmlFile}\n`)
    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.html`])
  })

  it("says not recorded for an owner the board does not have and for an approval the version does not have", () => {
    writeBoard(project, [{ ...laptopEntry(), owner: undefined }])
    writeVersion(project, laptopId, 2, "# Handle a lost laptop\n")

    runExport(project, "html")

    const page = readFile(project, htmlFile)
    const expected = htmlStamp(laptopTitle, 2, "not recorded", "not recorded", "not recorded", link)
    expect(elementOf(page, "header")).toBe(expected)
    expect(elementOf(page, "footer")).toBe(expected)
  })

  it("escapes a title with markup in the stamp and in the page title, and a line with a script in the document", () => {
    writeBoard(project, [laptopEntry({ title: "Tom & <b>Jerry</b>" })])
    writeLaptopVersions(project, "# Tom and Jerry\n\n<script>alert(1)</script>\n")

    runExport(project, "html")

    const page = readFile(project, htmlFile)
    expect(page).toContain("<title>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;, version 2</title>")
    expect(elementOf(page, "header")).toContain("<p><strong>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;</strong></p>")
    expect(mainOf(page)).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(page).not.toContain("<script")
    expect(page).not.toContain("<b>")
  })

  it("replaces the file with a second export of the same version", () => {
    writeLaptop(project)
    runExport(project, "html")
    writeVersion(project, laptopId, 2, "# Handle a lost laptop\n\n## Steps\n\n1. Call the service desk.\n")

    const result = runExport(project, "html")

    expect(result.status).toBe(0)
    expect(entries(project, "exports")).toEqual([`${laptopId}-v2.html`])
    expect(readFile(project, htmlFile)).toContain("Call the service desk.")
    expect(readFile(project, htmlFile)).not.toContain("Block the laptop in Intune.")
  })

  it("changes nothing in the store", () => {
    writeLaptop(project)
    const before = tree(path.join(project, "processes"))

    const result = runExport(project, "html")

    expect(result.status).toBe(0)
    expect(tree(path.join(project, "processes"))).toEqual(before)
  })
})
