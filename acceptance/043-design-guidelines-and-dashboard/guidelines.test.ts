import { describe, expect, it } from "vitest"
import { repositoryFile, tokens } from "./design.ts"

const writingPointer =
  "- Follow `DESIGN.md` for everything a page shows: use its design tokens and its parts, and add a token or a part there before a page uses one it does not name."
const reviewingPointer =
  "- Flag a page that does not follow `DESIGN.md`: a colour, a size or a spacing that is no design token, a part it does not name, or a rule it breaks. These are [medium] findings."
const reviewer = ".claude/agents/ui-design-reviewer.md"
const userInterfacePaths = [
  "bin/process-factory.mjs",
  "bin/dashboard.mjs",
  "bin/panel.mjs",
  "bin/process-page.mjs",
  "bin/page-style.mjs",
  "bin/dashboard-style.mjs",
  "bin/reading-view.mjs",
  "bin/export.mjs",
  "DESIGN.md",
]

/** The lines of a file of the repository. */
function lines(file: string): string[] {
  return repositoryFile(file).split("\n")
}

/** The bullets between `**Does:**` and the next empty line of the reviewer file. */
function doesBullets(): string[] {
  const all = lines(reviewer)
  const body = all.slice(all.findIndex((line) => line.startsWith("**Does:**")) + 1)
  return body.filter((line) => line !== "").slice(0, body.filter((line) => line !== "").findIndex((line) => !line.startsWith("- ")))
}

describe("DESIGN.md", () => {
  it("has the title and the three sections Design tokens, Parts and Rules, in that order", () => {
    const headings = lines("DESIGN.md").filter((line) => /^#{1,2} /.test(line))

    expect(headings).toEqual(["# Design guidelines", "## Design tokens", "## Parts", "## Rules"])
  })

  it.each(tokens)("names the token %s with the value %s", (name, value) => {
    const naming = lines("DESIGN.md").filter((line) => line.includes(`\`${name}\``))

    expect(naming.length).toBeGreaterThan(0)
    expect(naming.some((line) => line.includes(`\`${value}\``))).toBe(true)
  })

  it("says that bin/page-style.mjs declares the tokens and that a page uses them through var()", () => {
    const text = repositoryFile("DESIGN.md")

    expect(text).toContain("bin/page-style.mjs")
    expect(text).toContain("var(--")
  })

  it.each(["page header", "card", "badge", "definition list", "document", "form", "table", "notice"])("names the part %s under Parts", (name) => {
    const parts = (repositoryFile("DESIGN.md").split("\n## Parts\n")[1] ?? "").split("\n## ")[0] ?? ""

    expect(parts.toLowerCase()).toContain(name)
  })

  it.each([
    ["one primary action per area", "one primary action per area"],
    ["headings that scan", "headings that scan"],
    ["a contrast of 4.5:1", "4.5:1"],
    ["a visible focus outline", "focus outline"],
    ["a state in words and never in colour alone", "never in colour alone"],
    ["a layout from a 360px phone without horizontal scrolling", "360px"],
    ["no horizontal scrolling", "no horizontal scrolling"],
    ["no JavaScript under the content security policy of the pages", "default-src 'none'; style-src 'unsafe-inline'"],
    ["folding with details", "<details>"],
    ["switching by address", "by address"],
    ["plain CSS in the one style element", "<style>"],
    ["no reload of a page that holds a form", "does not reload"],
  ])("has the rule about %s under Rules", (_name, words) => {
    const rules = repositoryFile("DESIGN.md").split("\n## Rules\n")[1] ?? ""

    expect(rules).toContain(words)
    expect(rules.split("\n").filter((line) => line.startsWith("- ")).length).toBeGreaterThanOrEqual(9)
  })
})

describe("CLAUDE.md", () => {
  it("points to DESIGN.md under Writing code, directly before the bullet about the 600 lines, once", () => {
    const all = lines("CLAUDE.md")

    expect(all.filter((line) => line === writingPointer)).toHaveLength(1)
    expect(all[all.indexOf(writingPointer) + 1]?.startsWith("- Keep every file within 600 lines")).toBe(true)
    expect(all.indexOf(writingPointer)).toBeGreaterThan(all.indexOf("## Writing code"))
    expect(all.indexOf(writingPointer)).toBeLessThan(all.indexOf("## Reviewing code"))
  })

  it("points to DESIGN.md under Reviewing code, directly before the bullet about a split the specification names, once", () => {
    const all = lines("CLAUDE.md")

    expect(all.filter((line) => line === reviewingPointer)).toHaveLength(1)
    expect(all[all.indexOf(reviewingPointer) + 1]?.startsWith("- A split that the specification names")).toBe(true)
    expect(all.indexOf(reviewingPointer)).toBeGreaterThan(all.indexOf("## Reviewing code"))
  })
})

describe(".claude/agents/ui-design-reviewer.md", () => {
  it("reviews against DESIGN.md and the tokens of bin/page-style.mjs in six bullets, and no longer against Tailwind", () => {
    const text = repositoryFile(reviewer)
    const bullets = doesBullets()

    expect(bullets).toHaveLength(6)
    expect(bullets[0]).toContain("`DESIGN.md`")
    expect(bullets[0]).toContain("`bin/page-style.mjs`")
    expect(bullets[0]).toContain("var(--<name>)")
    expect(bullets[1]).toContain("default-src 'none'; style-src 'unsafe-inline'")
    expect(bullets[2]).toContain("360px")
    expect(bullets[3]).toBe("- visual hierarchy is clear: one primary action per area, and headings that scan")
    expect(bullets[4]).toContain("4.5:1")
    expect(bullets[4]).toContain("never in colour alone")
    expect(bullets[5]).toContain("`bin/page-style.mjs`")
    for (const gone of ["Tailwind", "rounded-lg", "gray and blue palette", "`shadow`"]) expect(text).not.toContain(gone)
  })

  it("reads DESIGN.md and the files that build the pages, and keeps the rest of the file", () => {
    const all = lines(reviewer)
    const reads = all.find((line) => line.startsWith("**Reads:**")) ?? ""

    expect(reads).toContain("`DESIGN.md` in the root of the repository")
    expect(reads).toContain("`bin/dashboard.mjs`")
    expect(reads).not.toContain("app/admin/page.tsx")
    expect(all.slice(0, 3)).toEqual(["---", "name: ui-design-reviewer", "description: Factory review. Reviews the visual design of a job's changes. Runs in parallel with the other reviewers in every /factory review round."])
    expect(all).toContain("You review one factory job for visual design. You get context from files, not from the conversation, and you never edit code.")
    expect(all).toContain("**Does:** Check that:")
    expect(all).toContain("If the change has no visual part, write `VERDICT: PASS` and say so.")
    expect(all.some((line) => line.startsWith("**Writes:** only `factory/jobs/<job-id>/round-<n>/review-ui.md`."))).toBe(true)
    expect(all).toContain("Reply with one line: the file path and the verdict.")
  })
})

describe("factory.config.json", () => {
  it("lists the files that build pages and DESIGN.md under userInterfacePaths, and keeps every other key", () => {
    const parsed: unknown = JSON.parse(repositoryFile("factory.config.json"))
    const config: Record<string, unknown> = typeof parsed === "object" && parsed !== null ? { ...parsed } : {}

    expect(config.userInterfacePaths).toEqual(userInterfacePaths)
    expect({ ...config, userInterfacePaths: undefined }).toEqual({
      $schema: "./node_modules/@olevedeler/kaizen-factory/src/factory.config.schema.json",
      projectId: "process-factory",
      dashboardUrl: "http://localhost:3000",
      sensitivePaths: [".claude/", ".github/", ".gitignore", "factory.config.json", "package.json", "pnpm-lock.yaml"],
      criticalPaths: ["bin/process-factory.mjs", ".github/", ".npmrc"],
      schemaPaths: ["bin/process-factory.mjs", "templates/"],
      performancePaths: ["bin/process-factory.mjs"],
      userInterfacePaths: undefined,
      allowedCommands: ["pnpm test", "pnpm test:acceptance", "pnpm lint", "node node_modules/typescript/bin/tsc"],
    })
  })
})

describe("the Status section of README.md", () => {
  it("describes the board, the page of a process and its tabs in its last paragraph, and no longer a panel", () => {
    const status = repositoryFile("README.md").split("\n## Status\n")[1] ?? ""
    const last =
      status
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph !== "")
        .at(-1) ?? ""

    expect(last.startsWith("`process-factory dashboard` starts a dashboard of the process store")).toBe(true)
    expect(last).toContain("The title on a card opens the page of that process, which has the same line and the same trail in its header and eight tabs, each at its own address:")
    expect(last).toContain("The tab `Draft` lists every draft, the newest first, and shows the chosen one in full with the round it was reviewed in.")
    expect(last).toContain("except the tab `Decision` while it holds a form, so that nothing a person has typed is lost.")
    expect(last).not.toContain("panel")
  })
})
