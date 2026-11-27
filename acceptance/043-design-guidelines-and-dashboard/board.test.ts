import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { approvalFile, kari, processFolder, processId } from "../024-named-owner-and-approval/approval.ts"
import { compact, request } from "../026-reading-view-on-localhost/view.ts"
import { cardOf, entry, fact, firstQuestion, laptopEntry, laptopId, laptopTitle, openDashboard, questionsText, secondQuestion, stopDashboards, writeLaptopQuestions } from "../032-dashboard-on-localhost/dashboard.ts"
import { headerOf } from "../033-dashboard-process-page/panel.ts"
import { prepareApproval, prepareClarify, preparePublishedQuiet, writeStore } from "../034-dashboard-decisions/decisions.ts"
import { stages, trail, trailOf } from "./design.ts"

const claudeCode = `<p>Waits for Claude Code: /process next ${processId}.</p>`
const answerQuestions = "<p>Waits for a person: answer the open questions.</p>"
const acceptSpecification = "<p>Waits for a person: accept the specification.</p>"
const ownerDecides = "<p>Waits for the owner: approve the draft or send it back.</p>"
const nobody = "<p>Waits for nobody: the process is published.</p>"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The card of the process on the board and the header of its page, each without the whitespace between its elements. */
async function cardAndHeader(): Promise<{ card: string; header: string }> {
  const address = await openDashboard(project)
  const board = await request(address, "/")
  const page = await request(address, `/${processId}`)
  expect(board.status).toBe(200)
  expect(page.status).toBe(200)
  return { card: cardOf(board.body, processId), header: compact(headerOf(page.body)) }
}

/** Every line `Waits for ...` in a piece of HTML. */
function turnLines(html: string): string[] {
  return [...html.matchAll(/<p>Waits for [^<]*<\/p>/g)].map((match) => match[0])
}

describe("a card of the board", () => {
  it("shows the number of open questions and of failing cases, then the line that says whose turn it is and the trail, and no text of a question and no number of a case", async () => {
    writeLaptopQuestions(project)
    writeBoard(project, [laptopEntry()])

    const board = (await request(await openDashboard(project), "/")).body
    const card = cardOf(board, laptopId)

    expect(card.startsWith(`<h3><a href="/${laptopId}">${laptopTitle}</a></h3><p>${laptopId}</p><dl>`)).toBe(true)
    expect(fact(card, "Open questions")).toBe("2")
    expect(fact(card, "Failing cases")).toBe("2")
    expect(card.endsWith(`</dl>${claudeCode}${trail("rework", [])}`)).toBe(true)
    expect(board).not.toContain(firstQuestion)
    expect(board).not.toContain(secondQuestion)
    expect(board).not.toContain("case 3")
    expect(board).not.toContain("case 5")
  })

  it("shows 0 for the open questions and the failing cases of a process that has none", async () => {
    writeBoard(project, [entry(laptopId, laptopTitle, "draft")])

    const card = cardOf((await request(await openDashboard(project), "/")).body, laptopId)

    expect(fact(card, "Round")).toBe("none")
    expect(fact(card, "Open questions")).toBe("0")
    expect(fact(card, "Failing cases")).toBe("0")
  })
})

describe("the line that says whose turn it is", () => {
  it("says on the card and in the header that a process in clarify with an open question waits for a person who answers", async () => {
    prepareClarify(project)

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([answerQuestions])
    expect(turnLines(header)).toEqual([answerQuestions])
  })

  it("says that a process in clarify whose questions are answered waits for Claude Code", async () => {
    writeStore(project, "clarify")
    writeFile(project, `${processFolder}/questions-1.md`, questionsText(1, [firstQuestion]))
    writeFile(project, `${processFolder}/answers-1.md`, "# Answers 1\n\n## 1. Who decides that the police are called?\n\nNot known.\n")

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([claudeCode])
    expect(turnLines(header)).toEqual([claudeCode])
  })

  it("says that a process in spec waits for a person who accepts when every section is decided, and for Claude Code with an open section", async () => {
    writeStore(project, "spec")
    writeFile(project, `${processFolder}/spec.md`, specText())
    const address = await openDashboard(project)

    const decided = await request(address, "/")
    expect(turnLines(cardOf(decided.body, processId))).toEqual([acceptSpecification])
    expect(turnLines(headerOf((await request(address, `/${processId}`)).body))).toEqual([acceptSpecification])

    writeFile(project, `${processFolder}/spec.md`, specText(["Scope"]))
    expect(turnLines(cardOf((await request(address, "/")).body, processId))).toEqual([claudeCode])
    expect(turnLines(headerOf((await request(address, `/${processId}`)).body))).toEqual([claudeCode])
  })

  it("says that a process in approval with an owner and a newest draft that is not approved waits for the owner", async () => {
    prepareApproval(project)

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([ownerDecides])
    expect(turnLines(header)).toEqual([ownerDecides])
  })

  it.each([
    ["without an owner", { owner: undefined }, false],
    ["whose newest draft is approved", {}, true],
  ])("says that a process in approval %s waits for Claude Code", async (_name, more, isApproved) => {
    prepareApproval(project, more)
    if (isApproved) writeFile(project, approvalFile(2), `# Approval of draft-2.md\n\nProcess: ${processId}\nDraft: draft-2.md\nApproved by: ${kari}\nApproved at: 2026-11-24T09:00:00.000Z\n`)

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([claudeCode])
    expect(turnLines(header)).toEqual([claudeCode])
  })

  it("says that a published process waits for nobody", async () => {
    preparePublishedQuiet(project)

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([nobody])
    expect(turnLines(header)).toEqual([nobody])
  })

  it.each(["intake", "cases", "draft", "review", "rework", "regenerate"])("says that a process in %s waits for Claude Code", async (stage) => {
    writeStore(project, stage)

    const { card, header } = await cardAndHeader()

    expect(turnLines(card)).toEqual([claudeCode])
    expect(turnLines(header)).toEqual([claudeCode])
  })
})

describe("the trail of a process", () => {
  it("has the ten stages in their order, marks the stage of the process as current and the other stages of its history as passed, on the card and in the header alike", async () => {
    writeStore(project, "draft", {
      history: [
        { at: "2026-11-20T09:00:00.000Z", stage: "intake" },
        { at: "2026-11-20T10:00:00.000Z", stage: "clarify" },
        { at: "2026-11-20T11:00:00.000Z", stage: "spec" },
        { at: "2026-11-20T12:00:00.000Z", stage: "cases" },
        { at: "2026-11-20T13:00:00.000Z", stage: "draft" },
        { at: "2026-11-20T14:00:00.000Z", stage: "review" },
        { at: "2026-11-20T15:00:00.000Z", stage: "draft", edited: "spec.md", by: kari },
      ],
    })

    const { card, header } = await cardAndHeader()

    const expected = trail("draft", ["intake", "clarify", "spec", "cases", "review"])
    expect(trailOf(card)).toBe(expected)
    expect(trailOf(header)).toBe(expected)
    expect(expected.split("<li")).toHaveLength(stages.length + 1)
    expect(expected).toContain('<li class="done">review: passed</li><li>rework</li>')
  })

  it("marks only the stage of a process with one line of history, and no stage as current for a stage that is none of the ten", async () => {
    writeStore(project, "intake")
    const address = await openDashboard(project)

    expect(trailOf(headerOf((await request(address, `/${processId}`)).body))).toBe(trail("intake", []))

    writeStore(project, "archived")
    const archived = trailOf(headerOf((await request(address, `/${processId}`)).body))
    expect(archived).toBe(trail("archived", []))
    expect(archived).not.toContain("aria-current")
    expect(archived).not.toContain("<li class=")
  })
})
