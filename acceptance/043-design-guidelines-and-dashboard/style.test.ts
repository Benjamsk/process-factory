import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, readFile, runCommand, writeBoard } from "../006-process-state-machine/store.ts"
import { laptopId, openView, request, stopViews, writeLaptop } from "../026-reading-view-on-localhost/view.ts"
import { openDashboard, sections, stopDashboards } from "../032-dashboard-on-localhost/dashboard.ts"
import { fullEntry, writeFullFiles } from "../033-dashboard-process-page/panel.ts"
import { contrast, declaredTokens, pairs, stages, styleOf, tokens } from "./design.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The style of the front page of the reading view of the project. */
async function viewStyle(): Promise<string> {
  const page = await request(await openView(project), "/")
  expect(page.status).toBe(200)
  return styleOf(page.body)
}

describe("the shared style of the pages", () => {
  it("declares every design token with its value on :root, on a page of the reading view", async () => {
    const style = await viewStyle()

    const declared = declaredTokens(/:root\s*\{([^}]*)\}/.exec(style)?.[1] ?? "")

    for (const [name, value] of tokens) expect(declared.get(name)).toBe(value)
  })

  it("keeps the reading measure of 40rem on the body of the reading view, through the token", async () => {
    const style = await viewStyle()

    expect(declaredTokens(style).get("--measure")).toBe("40rem")
    expect(style).toMatch(/body\s*\{[^}]*max-width:\s*var\(--measure\)/)
    expect(style).not.toContain("max-width: 40rem")
  })

  it("uses the tokens for its colours and no colour of its own after their declaration", async () => {
    const style = await viewStyle()
    const rules = style.replace(/:root\s*\{[^}]*\}/, "")

    expect(style).toMatch(/:root\s*\{[^}]*--stop-surface/)
    expect(rules).toContain("var(--text)")
    expect(rules).toContain("var(--link)")
    expect(rules).not.toMatch(/#[0-9a-fA-F]{3,6}\b/)
  })

  it("is the style of an HTML export and of the dashboard too", async () => {
    writeLaptop(project)

    const exported = runCommand(project, ["export", laptopId, "--format", "html", "--link", "http://intranet.example"])
    const board = await request(await openDashboard(project), "/")

    expect(exported.status).toBe(0)
    for (const page of [readFile(project, `exports/${laptopId}-v2.html`), board.body]) {
      const declared = declaredTokens(styleOf(page))
      for (const [name, value] of tokens) expect(declared.get(name)).toBe(value)
    }
  })

  it.each(pairs)("gives %s on %s a contrast of at least 4.5:1", async (text, surface) => {
    const declared = declaredTokens(await viewStyle())
    const colours = [declared.get(text) ?? "", declared.get(surface) ?? ""]

    for (const colour of colours) expect(colour).toMatch(/^#[0-9a-f]{6}$/)
    expect(contrast(colours[0] ?? "", colours[1] ?? "")).toBeGreaterThanOrEqual(4.5)
  })
})

describe("the style of the dashboard", () => {
  it("wraps the columns of the board in a grid inside main.board, without a minimum width", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)

    const page = await request(await openDashboard(project), "/")
    const style = styleOf(page.body)

    expect(page.status).toBe(200)
    expect(style).toContain("grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr))")
    expect(style).toMatch(/body\s*\{[^}]*max-width:\s*80rem/)
    expect(page.body).not.toContain("min-width")
    const board = /<main class="board">(.*)<\/main>/s.exec(page.body)?.[1] ?? ""
    expect(sections(board).map((section) => section.stage)).toEqual(stages)
    expect(page.body.split("<section")).toHaveLength(11)
  })

  it.each([
    ["the board", "/"],
    ["the page of a process", `/${laptopId}`],
    ["a part of a process", `/${laptopId}/draft`],
    ["the page Not found", `/${laptopId}/nothing`],
  ])("has no minimum width, no fixed or sticky position, no aside, no style attribute and no width in px on %s", async (_name, pathname) => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)

    const page = await request(await openDashboard(project), pathname)
    const style = styleOf(page.body)

    expect(style).toContain("--measure")
    expect(page.body).not.toContain("min-width")
    expect(page.body).not.toContain("position: fixed")
    expect(page.body).not.toContain("position: sticky")
    expect(page.body).not.toContain("<aside")
    expect(page.body).not.toMatch(/\sstyle="/)
    expect(style).not.toMatch(/width:\s*\d+px/)
    expect(page.body).not.toContain("<script")
  })

  it("holds a part of a process at the reading measure", async () => {
    writeBoard(project, [fullEntry()])
    writeFullFiles(project)

    const page = await request(await openDashboard(project), `/${laptopId}/draft`)

    expect(page.status).toBe(200)
    expect(styleOf(page.body)).toMatch(/main\s*\{[^}]*max-width:\s*var\(--measure\)/)
  })
})
