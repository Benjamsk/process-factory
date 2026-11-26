import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import path from "node:path"
import { expect } from "vitest"
import { projectOf, root, writeFile } from "../006-process-state-machine/store.ts"
import { compact, organisationAddress } from "../026-reading-view-on-localhost/view.ts"

const commandFile = path.join(root, "bin/process-factory.mjs")
const addressLine = /^Dashboard on (http:\/\/127\.0\.0\.1:\d+)\n$/
const running: ChildProcess[] = []

export const stages = ["intake", "clarify", "spec", "cases", "draft", "review", "rework", "approval", "published", "regenerate"]
export const refresh = '<meta http-equiv="refresh" content="5">'
export const laptopId = "001-handle-a-lost-laptop"
export const laptopTitle = "Handle a lost laptop"
export const employeeId = "002-onboard-a-new-employee"
export const employeeTitle = "Onboard a new employee"
export const kari = "Kari Nordmann"
export const firstQuestion = "Who decides that the police are called?"
export const secondQuestion = "How long may the laptop stay unblocked?"
export const answeredQuestion = "Who reports a lost laptop?"
export const missingFact = "The name of the insurer, in organisation/processors.md"

/** Runs `dashboard` in the project of `project`, the folder of an organisation, with arguments that must make it exit at once. Gives up after fifteen seconds. */
export function runDashboard(project: string, args: string[]) {
  return spawnSync(process.execPath, [commandFile, "dashboard", ...args], { cwd: projectOf(project), encoding: "utf8", timeout: 15_000 })
}

/** Starts `dashboard` in the project of `project`, the folder of an organisation, and waits until it printed a line to standard output or ended. `isRunning` says whether it still runs when it is called. */
export async function startDashboard(project: string, args: string[]): Promise<{ stdout: string; stderr: string; isRunning: () => boolean }> {
  const child = spawn(process.execPath, [commandFile, "dashboard", ...args], { cwd: projectOf(project), stdio: ["ignore", "pipe", "pipe"] })
  running.push(child)
  let stdout = ""
  let stderr = ""
  child.stdout.setEncoding("utf8")
  child.stderr.setEncoding("utf8")
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk
  })
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 15_000)
    const finish = (): void => {
      clearTimeout(timer)
      resolve()
    }
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk
      if (stdout.includes("\n")) finish()
    })
    child.on("close", finish)
  })
  return { stdout, stderr, isRunning: () => child.exitCode === null && child.signalCode === null }
}

/** Starts the dashboard of the project of `project`, the folder of an organisation, on a free port and gives the address of that organisation, such as `http://127.0.0.1:50123/acme`. */
export async function openDashboard(project: string): Promise<string> {
  const started = await startDashboard(project, ["--port", "0"])
  expect(started.stdout).toMatch(addressLine)
  expect(started.stderr).toBe("")
  return organisationAddress(addressLine.exec(started.stdout)?.[1] ?? "")
}

/** Stops every dashboard the tests started and waits until each has ended. */
export async function stopDashboards(): Promise<void> {
  await Promise.all(
    running.splice(0).map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) {
            resolve()
            return
          }
          child.once("exit", () => {
            resolve()
          })
          child.kill()
        }),
    ),
  )
}

/** The sections of the dashboard in their order, each with the stage in its `<h2>` and what stands inside it. */
export function sections(body: string): { stage: string; html: string }[] {
  return [...body.matchAll(/<section\b[^>]*>(.*?)<\/section>/gs)].map((match) => {
    const html = match[1] ?? ""
    return { stage: (/<h2>(.*?)<\/h2>/s.exec(html)?.[1] ?? "").trim(), html }
  })
}

/** What stands inside every `<article>` of a piece of HTML, in order, without the whitespace between its elements. */
export function cards(html: string): string[] {
  return [...html.matchAll(/<article\b[^>]*>(.*?)<\/article>/gs)].map((match) => compact(match[1] ?? ""))
}

/** The cards in the section of a stage. */
export function cardsIn(body: string, stage: string): string[] {
  return cards(sections(body).find((section) => section.stage === stage)?.html ?? "")
}

/** The one card on the dashboard whose `<p>` holds this id, or an empty string when there is none or more than one. */
export function cardOf(body: string, id: string): string {
  const found = cards(body).filter((card) => card.includes(`<p>${id}</p>`))
  return found.length === 1 ? (found[0] ?? "") : ""
}

/** The stages whose section holds a card with this id. */
export function stagesOf(body: string, id: string): string[] {
  return sections(body)
    .filter((section) => cards(section.html).some((card) => card.includes(`<p>${id}</p>`)))
    .map((section) => section.stage)
}

/** The terms of the `<dl>` of a card, in order. */
export function terms(card: string): string[] {
  return [...card.matchAll(/<dt>(.*?)<\/dt>/gs)].map((match) => match[1] ?? "")
}

/** What stands in the `<dd>` after the `<dt>` with this term on a card, or `missing` when the card has no such term. */
export function fact(card: string, term: string): string {
  return new RegExp(`<dt>${term}</dt><dd>(.*?)</dd>`, "s").exec(card)?.[1] ?? "missing"
}

/** A recorded round as `round` writes it on the board, with the result per case when given. */
export function round(number: number, cases?: [number, string][]): Record<string, unknown> {
  return {
    round: number,
    draft: `draft-${String(number)}.md`,
    at: `2026-11-2${String(number)}T10:00:00.000Z`,
    verdicts: [{ reviewer: "simulation", verdict: cases?.some(([, result]) => result === "FAIL") === true ? "CHANGES" : "PASS" }],
    ...(cases === undefined ? {} : { cases: cases.map(([caseNumber, result]) => ({ case: caseNumber, result })) }),
  }
}

/** A board entry in a stage, with one history line. */
export function entry(id: string, title: string, stage: string, more: Record<string, unknown> = {}): Record<string, unknown> {
  return { id, title, stage, history: [{ at: "2026-11-20T09:00:00.000Z", stage }], ...more }
}

/** The process of the spec's example card: in `rework`, owned by Kari Nordmann, with two recorded rounds of which the newest has the cases 3 and 5 failing. */
export function laptopEntry(more: Record<string, unknown> = {}): Record<string, unknown> {
  return entry(laptopId, laptopTitle, "rework", {
    owner: kari,
    rounds: [
      round(1, [
        [1, "PASS"],
        [3, "PASS"],
        [4, "FAIL"],
      ]),
      round(2, [
        [1, "PASS"],
        [3, "FAIL"],
        [4, "PASS"],
        [5, "FAIL"],
      ]),
    ],
    ...more,
  })
}

/** The text of a questions file as the questioner writes it. */
export function questionsText(number: number, questions: string[], missing?: string): string {
  const head = [`# Questions ${String(number)}`, "", "## Questions", "", ...questions.map((question, index) => `${String(index + 1)}. ${question}`), ""]
  const tail =
    missing === undefined ? [] : ["## Missing from the organisation context", "", "These are not questions to answer here. Give them in `/process org`.", "", `- ${missing}`, ""]
  return [...head, ...tail].join("\n")
}

/** Writes the questions files of the spec's example card: an answered `questions-1.md` and a `questions-2.md` without answers. */
export function writeLaptopQuestions(project: string): void {
  writeFile(project, `processes/${laptopId}/questions-1.md`, questionsText(1, [answeredQuestion]))
  writeFile(project, `processes/${laptopId}/answers-1.md`, "1. Whoever lost it.\n")
  writeFile(project, `processes/${laptopId}/questions-2.md`, questionsText(2, [firstQuestion, secondQuestion], missingFact))
}
