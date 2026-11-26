import { expect } from "vitest"
import { organisationAddress, requestPage, startServer, writeWorkingFile } from "./command-line.ts"

export const processId = "001-handle-a-lost-laptop"
export const title = "Handle a lost laptop"
export const owner = "Kari Nordmann"
export const refresh = '<meta http-equiv="refresh" content="5">'
export const stages = ["intake", "clarify", "spec", "cases", "draft", "review", "rework", "approval", "published", "regenerate"]
export const answeredQuestion = "Who reports a lost laptop?"

/** Starts the dashboard on a free port of the project and gives the address of its one organisation. */
export async function openDashboard(): Promise<string> {
  const printed = await startServer("dashboard")
  expect(printed).toMatch(/^Dashboard on http:\/\/127\.0\.0\.1:[1-9]\d*\n$/)
  return organisationAddress(printed.trim().replace("Dashboard on ", ""))
}

/** The page of the dashboard of the working directory, which must answer with 200. */
export async function dashboardBody(): Promise<string> {
  const page = await requestPage(await openDashboard(), "/")
  expect(page.status).toBe(200)
  return page.body
}

/** The sections of a page in their order, each with the stage of its `<h2>` and what stands inside it. */
export function sectionsOf(body: string): { stage: string; html: string }[] {
  return [...body.matchAll(/<section>\s*<h2>(.*?)<\/h2>(.*?)<\/section>/gs)].map((match) => ({ stage: match[1] ?? "", html: match[2] ?? "" }))
}

/** What stands inside the one `<article>` of a page, without the whitespace between its elements. */
export function cardOf(body: string): string {
  const found = [...body.matchAll(/<article>(.*?)<\/article>/gs)]
  expect(found).toHaveLength(1)
  return (found[0]?.[1] ?? "").replace(/>\s+</g, "><").trim()
}

/** The stages whose section holds a card. */
export function stagesWithCard(body: string): string[] {
  return sectionsOf(body)
    .filter((section) => section.html.includes("<article>"))
    .map((section) => section.stage)
}

export function writeQuestions(number: number, questions: string[]): void {
  const items = questions.map((question, index) => `${String(index + 1)}. ${question}`).join("\n")
  writeWorkingFile(`processes/${processId}/questions-${String(number)}.md`, `# Questions ${String(number)}\n\n## Questions\n\n${items}\n`)
}
