import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { boardPath, organisationId, readWorkingFile, runCommand, workingDirectory, writeBoardFile, writeWorkingFile } from "./command-line.ts"

describe("process-factory export", () => {
  const processId = "001-handle-a-lost-laptop"
  const title = "Handle a lost laptop"
  const owner = "Kari Nordmann"
  const address = "https://intranet.example/processes"
  /** The address of version 2 in the reading view: the organisation stands between the address and the process. */
  const link = `${address}/${organisationId}/${processId}/2`
  const documentText = "# Handle a lost laptop\n\n## Steps\n\n1. IT manager (Ola Hansen): Block the laptop in Intune."
  const htmlFile = `exports/${processId}-v2.html`
  const markdownFile = `exports/${processId}-v2.md`
  const linkRefusal = "process-factory: the link must be an address that starts with http:// or https://, without a user name, a query or a fragment\n"

  function runExport(format: string, to = address, id = processId) {
    return runCommand(["export", id, "--format", format, "--link", to])
  }

  /** Writes the laptop process with the versions 1 and 2 on the board, the second approved on 2026-11-21. */
  function writeExportableProcess(more: Record<string, unknown> = {}, newestDocument = `${documentText}\n`): void {
    writeBoardFile([
      { id: "000-older-process", title: "Older process", stage: "draft", owner },
      {
        id: processId,
        title,
        stage: "published",
        owner,
        versions: [
          { version: 1, draft: "draft-1.md", approvedBy: owner, at: "2026-10-03T08:00:00.000Z" },
          { version: 2, draft: "draft-2.md", approvedBy: owner, at: "2026-11-22T08:00:00.000Z" },
        ],
        ...more,
      },
    ])
    writeWorkingFile(`processes/${processId}/versions/1/process.md`, "# Handle a lost laptop\n\n1. IT manager (Ola Hansen): Call the police first.\n")
    writeWorkingFile(`processes/${processId}/versions/2/process.md`, newestDocument)
    writeWorkingFile(`processes/${processId}/versions/2/approval.md`, `# Approval of draft-2.md\n\nApproved by: ${owner}\nApproved at: 2026-11-21T10:05:00.000Z\n`)
  }

  /** The six paragraphs of the stamp of an HTML export, as the page holds them. */
  function htmlStamp(stampTitle: string, stampOwner: string, by: string, on: string, to: string): string {
    return [
      `<p><strong>${stampTitle}</strong></p>`,
      "<p>Version 2</p>",
      `<p>Owner: ${stampOwner}</p>`,
      `<p>Approved by: ${by}</p>`,
      `<p>Approved on: ${on}</p>`,
      `<p>This is a copy. The reading view is the source of truth, and the current version is at <a href="${to}">${to}</a>.</p>`,
    ].join("\n")
  }

  /** The whole Markdown export, with the stamp around the document. */
  function markdownExport(stampTitle: string, stampOwner: string, by: string, on: string, body: string): string {
    const stamp = `**${stampTitle}**\n\n- Version 2\n- Owner: ${stampOwner}\n- Approved by: ${by}\n- Approved on: ${on}\n\nThis is a copy. The reading view is the source of truth, and the current version is at <${link}>.`
    return `${stamp}\n\n---\n\n${body}\n\n---\n\n${stamp}\n`
  }

  it("writes the newest published version as an HTML file, prints its path and exits with 0", () => {
    writeExportableProcess()

    const result = runExport("html")

    expect(result.stdout).toBe(`${htmlFile}\n`)
    expect(result.stderr).toBe("")
    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, "exports"))).toEqual([`${processId}-v2.html`])
    expect(readWorkingFile(htmlFile)).toContain("Block the laptop in Intune.")
    expect(readWorkingFile(htmlFile)).not.toContain("Call the police first.")
  })

  it("writes a page with the stamp in the header and in the footer, the document in main and nothing else", () => {
    writeExportableProcess()

    runExport("html")

    const page = readWorkingFile(htmlFile)
    const stamp = htmlStamp(title, owner, owner, "2026-11-21", link)
    expect(page.startsWith("<!doctype html>")).toBe(true)
    expect(page).toContain(`<title>${title}, version 2</title>`)
    expect(page).toContain(`<header>\n${stamp}\n</header>`)
    expect(page).toContain(`<footer>\n${stamp}\n</footer>`)
    expect(page).toContain('<main>\n<h1>Handle a lost laptop</h1>\n<h2>Steps</h2>\n<ol>\n<li value="1">IT manager (Ola Hansen): Block the laptop in Intune.</li>\n</ol>\n</main>')
    expect(page).not.toContain("<form")
    expect(page).not.toContain("<script")
    expect(page).not.toContain("Version history")
    expect(page).not.toContain("All processes")
    expect(page).not.toContain("src=")
    expect(page).not.toContain("<link")
  })

  it("writes the Markdown export as the stamp, a line ---, the document, a line --- and the stamp again", () => {
    writeExportableProcess({}, "\n# Handle a lost laptop  \n\n## Steps\n\n1. IT manager (Ola Hansen): Block the laptop in Intune.\n\n\n")

    const result = runExport("markdown")

    expect(result.stdout).toBe(`${markdownFile}\n`)
    expect(result.status).toBe(0)
    expect(readWorkingFile(markdownFile)).toBe(markdownExport(title, owner, owner, "2026-11-21", documentText))
  })

  it("builds the link from the address without the slashes at the end of its path", () => {
    writeExportableProcess()

    runExport("html")
    const plain = readWorkingFile(htmlFile)
    runExport("html", `${address}//`)

    expect(readWorkingFile(htmlFile)).toBe(plain)
    runExport("html", "http://10.0.0.5:4173")
    expect(readWorkingFile(htmlFile)).toContain(htmlStamp(title, owner, owner, "2026-11-21", `http://10.0.0.5:4173/${organisationId}/${processId}/2`))
  })

  it("says not recorded for an owner the board does not have and for a version without an approval", () => {
    writeExportableProcess({ owner: undefined })
    rmSync(path.join(workingDirectory, `processes/${processId}/versions/2/approval.md`))

    runExport("html")
    runExport("markdown")

    expect(readWorkingFile(htmlFile)).toContain(htmlStamp(title, "not recorded", "not recorded", "not recorded", link))
    expect(readWorkingFile(markdownFile)).toBe(markdownExport(title, "not recorded", "not recorded", "not recorded", documentText))
  })

  it("escapes markup of the board and of the document in the HTML file, and markup of the board in the Markdown file", () => {
    writeExportableProcess({ title: "Tom & <b>Jerry</b>" }, "# Tom and Jerry\n\n<script>alert(1)</script>\n")

    runExport("html")
    runExport("markdown")

    const page = readWorkingFile(htmlFile)
    expect(page).toContain("<title>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;, version 2</title>")
    expect(page).toContain("<p><strong>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;</strong></p>")
    expect(page).toContain("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")
    expect(page).not.toContain("<script")
    expect(readWorkingFile(markdownFile).split("\n").filter((line) => line === "**Tom \\& \\<b\\>Jerry\\</b\\>**")).toHaveLength(2)
  })

  it("replaces the file of the same version and leaves the store as it was", () => {
    writeExportableProcess()
    const board = readWorkingFile(boardPath)
    runExport("html")
    writeWorkingFile(`processes/${processId}/versions/2/process.md`, "# Handle a lost laptop\n\n1. Call the service desk.\n")

    const result = runExport("html")

    expect(result.status).toBe(0)
    expect(readdirSync(path.join(workingDirectory, "exports"))).toEqual([`${processId}-v2.html`])
    expect(readWorkingFile(htmlFile)).toContain("Call the service desk.")
    expect(readWorkingFile(htmlFile)).not.toContain("Block the laptop in Intune.")
    expect(readWorkingFile(boardPath)).toBe(board)
    expect(readdirSync(path.join(workingDirectory, `processes/${processId}/versions`))).toEqual(["1", "2"])
  })

  it.each([
    ["pdf", "process-factory: the format must be html or markdown\n"],
    ["HTML", "process-factory: the format must be html or markdown\n"],
  ])("refuses the format %s and writes nothing", (format, line) => {
    writeExportableProcess()

    const result = runExport(format)

    expect(result.stderr).toBe(line)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, "exports"))).toBe(false)
  })

  it.each(["intranet.example/processes", "javascript:alert(1)", "https://kari:secret@intranet.example", "https://intranet.example/?a=1", "https://intranet.example/#top"])(
    "refuses the link %s and writes nothing",
    (to) => {
      writeExportableProcess()

      const result = runExport("html", to)

      expect(result.stderr).toBe(linkRefusal)
      expect(result.stdout).toBe("")
      expect(result.status).toBe(1)
      expect(existsSync(path.join(workingDirectory, "exports"))).toBe(false)
    },
  )

  it("checks the format before the link", () => {
    writeExportableProcess()

    expect(runExport("pdf", "ftp://intranet.example").stderr).toBe("process-factory: the format must be html or markdown\n")
  })

  it.each([
    ["an id the board does not list", "009-no-such-process", "process-factory: there is no process 009-no-such-process\n"],
    ["an id with another character", `../${processId}`, `process-factory: there is no process ../${processId}\n`],
    ["a process that was never published", "000-older-process", "process-factory: cannot export 000-older-process: it has no published version\n"],
  ])("refuses %s and writes nothing", (_name, id, line) => {
    writeExportableProcess()

    const result = runExport("html", address, id)

    expect(result.stderr).toBe(line)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, "exports"))).toBe(false)
  })

  it("says that it cannot read the version when process.md of the newest published version is a folder", () => {
    writeExportableProcess()
    rmSync(path.join(workingDirectory, `processes/${processId}/versions/2/process.md`))
    mkdirSync(path.join(workingDirectory, `processes/${processId}/versions/2/process.md`))

    const result = runExport("html")

    expect(result.stderr).toBe(`process-factory: cannot export ${processId}: cannot read processes/${processId}/versions/2/process.md\n`)
    expect(result.status).toBe(1)
  })

  it("says why it cannot write the file when exports is a file", () => {
    writeExportableProcess()
    writeWorkingFile("exports", "kept\n")

    const result = runExport("html")

    expect(result.stderr.startsWith(`process-factory: cannot write exports/${processId}-v2.html: `)).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(readWorkingFile("exports")).toBe("kept\n")
  })

  it("says that it cannot read the board when the board is not JSON", () => {
    writeWorkingFile(boardPath, "{ not json")

    const result = runExport("html")

    expect(result.stderr.startsWith(`process-factory: cannot read ${boardPath}: `)).toBe(true)
    expect(result.stdout).toBe("")
    expect(result.status).toBe(1)
    expect(existsSync(path.join(workingDirectory, "exports"))).toBe(false)
  })
})
