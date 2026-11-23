import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { boardFile, emptyFolder, entries, runCommand, writeBoard, writeFile } from "../006-process-state-machine/store.ts"
import { compact, request, tree } from "../026-reading-view-on-localhost/view.ts"
import {
  answeredQuestion,
  cardOf,
  cards,
  cardsIn,
  employeeId,
  employeeTitle,
  entry,
  fact,
  firstQuestion,
  kari,
  laptopEntry,
  laptopId,
  laptopTitle,
  missingFact,
  openDashboard,
  questionsText,
  refresh,
  round,
  secondQuestion,
  sections,
  stages,
  stagesOf,
  stopDashboards,
  terms,
  writeLaptopQuestions,
} from "./dashboard.ts"

const headers: [string, string][] = [
  ["content-type", "text/html; charset=utf-8"],
  ["cache-control", "no-store"],
  ["x-content-type-options", "nosniff"],
  ["content-security-policy", "default-src 'none'; style-src 'unsafe-inline'"],
]

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopDashboards()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The body of the dashboard of the project, which must answer with 200. */
async function dashboard(): Promise<string> {
  const page = await request(await openDashboard(project), "/")
  expect(page.status).toBe(200)
  return page.body
}

/** The card of the one process on a board that holds only this entry. */
async function cardOfEntry(written: Record<string, unknown>): Promise<string> {
  writeBoard(project, [written])
  const card = cardOf(await dashboard(), String(written.id))
  expect(card).not.toBe("")
  return card
}

describe("every page of the dashboard", () => {
  it.each([
    ["the dashboard", "/", 200],
    ["the page Not found", "/board", 404],
  ])("is a complete HTML document with the four headers and the refresh element, and without script: %s", async (_name, pathname, status) => {
    writeBoard(project, [laptopEntry()])
    writeLaptopQuestions(project)

    const page = await request(await openDashboard(project), pathname)

    expect(page.status).toBe(status)
    for (const [name, value] of headers) expect(page.headers.get(name)).toBe(value)
    expect(page.body.toLowerCase().startsWith("<!doctype html>")).toBe(true)
    expect(page.body).toContain(refresh)
    expect(page.body).not.toContain("<script")
    expect(page.body).not.toContain("<form")
    expect(page.body).not.toContain("<img")
  })

  it("has the four headers and the refresh element on the page Error too", async () => {
    writeFile(project, boardFile, "{ not json")

    const page = await request(await openDashboard(project), "/")

    expect(page.status).toBe(500)
    for (const [name, value] of headers) expect(page.headers.get(name)).toBe(value)
    expect(page.body).toContain(refresh)
    expect(page.body).not.toContain("<script")
  })
})

describe("the dashboard", () => {
  it("has its title, its heading, the sentence about the reload and a section for each of the ten stages in the order of the state machine", async () => {
    writeBoard(project, [laptopEntry()])

    const body = await dashboard()

    expect(body).toContain("<title>Dashboard</title>")
    expect(body).toContain("<h1>Dashboard</h1>")
    expect(body).toContain("<p>This page reloads every 5 seconds.</p>")
    expect(sections(body).map((section) => section.stage)).toEqual(stages)
  })

  it("says No process. in each of the ten sections in a folder without processes, and creates nothing there", async () => {
    const body = await dashboard()

    const all = sections(body)
    expect(all.map((section) => section.stage)).toEqual(stages)
    for (const section of all) {
      expect(compact(section.html)).toContain("<p>No process.</p>")
      expect(cards(section.html)).toEqual([])
    }
    expect(entries(project)).toEqual([])
  })

  it("shows every process as one card in the section of its stage and in no other, with its title and its id", async () => {
    writeBoard(project, [laptopEntry(), entry(employeeId, employeeTitle, "intake"), entry("003-close-the-books", "Close the books", "published")])

    const body = await dashboard()

    expect(cards(body)).toHaveLength(3)
    expect(stagesOf(body, laptopId)).toEqual(["rework"])
    expect(stagesOf(body, employeeId)).toEqual(["intake"])
    expect(stagesOf(body, "003-close-the-books")).toEqual(["published"])
    expect(cardOf(body, laptopId)).toContain(`<h3>${laptopTitle}</h3><p>${laptopId}</p>`)
    expect(cardOf(body, employeeId)).toContain(`<h3>${employeeTitle}</h3><p>${employeeId}</p>`)
  })

  it("puts two processes in the same stage in the order of the board, and says No process. only in the sections without one", async () => {
    writeBoard(project, [entry(employeeId, employeeTitle, "draft"), entry(laptopId, laptopTitle, "draft")])

    const body = await dashboard()

    const inDraft = cardsIn(body, "draft")
    expect(inDraft).toHaveLength(2)
    expect(inDraft[0]).toContain(`<p>${employeeId}</p>`)
    expect(inDraft[1]).toContain(`<p>${laptopId}</p>`)
    for (const section of sections(body)) expect(section.html.includes("No process.")).toBe(section.stage !== "draft")
  })

  it.each(stages)("shows a process in the stage %s in the section of that stage", async (stage) => {
    writeBoard(project, [entry(laptopId, laptopTitle, stage)])

    expect(stagesOf(await dashboard(), laptopId)).toEqual([stage])
  })

  it("shows a process whose stage is none of the ten in no section", async () => {
    writeBoard(project, [entry(laptopId, laptopTitle, "archived"), entry(employeeId, employeeTitle, "intake")])

    const body = await dashboard()

    expect(cards(body)).toHaveLength(1)
    expect(stagesOf(body, laptopId)).toEqual([])
    expect(stagesOf(body, employeeId)).toEqual(["intake"])
  })

  it("skips an entry of the board whose id is not made of lower case letters, digits and hyphens", async () => {
    writeBoard(project, [entry("../secret", "Secret process", "draft"), entry(employeeId, employeeTitle, "draft")])

    const body = await dashboard()

    expect(cards(body)).toHaveLength(1)
    expect(body).not.toContain("Secret process")
    expect(body).not.toContain("secret")
  })
})

describe("a card of the dashboard", () => {
  it("is the card of the spec for a process in rework with an owner, two rounds, an unanswered questions-2.md and two failing cases", async () => {
    writeLaptopQuestions(project)

    const card = await cardOfEntry(laptopEntry())

    expect(card).toBe(
      compact(`
        <h3>Handle a lost laptop</h3>
        <p>001-handle-a-lost-laptop</p>
        <dl>
        <dt>Owner</dt><dd>Kari Nordmann</dd>
        <dt>Round</dt><dd>2</dd>
        <dt>Open questions</dt><dd><ol>
        <li value="1">Who decides that the police are called?</li>
        <li value="2">How long may the laptop stay unblocked?</li>
        </ol></dd>
        <dt>Failing cases</dt><dd>case 3, case 5</dd>
        </dl>`),
    )
  })

  it("is the card of the spec for a new process: not recorded for the owner and none for the round, the open questions and the failing cases", async () => {
    const card = await cardOfEntry(entry(employeeId, employeeTitle, "intake"))

    expect(card).toBe(
      compact(`
        <h3>Onboard a new employee</h3>
        <p>002-onboard-a-new-employee</p>
        <dl>
        <dt>Owner</dt><dd>not recorded</dd>
        <dt>Round</dt><dd>none</dd>
        <dt>Open questions</dt><dd>none</dd>
        <dt>Failing cases</dt><dd>none</dd>
        </dl>`),
    )
  })

  it("has one list with the terms Owner, Round, Open questions and Failing cases, in that order", async () => {
    const card = await cardOfEntry(laptopEntry())

    expect(card.split("<dl>")).toHaveLength(2)
    expect(terms(card)).toEqual(["Owner", "Round", "Open questions", "Failing cases"])
  })

  it("shows the owner of the board entry, and not recorded for a process without one", async () => {
    writeBoard(project, [laptopEntry(), entry(employeeId, employeeTitle, "intake")])

    const body = await dashboard()

    expect(fact(cardOf(body, laptopId), "Owner")).toBe(kari)
    expect(fact(cardOf(body, employeeId), "Owner")).toBe("not recorded")
  })

  it("shows the number of the newest recorded round", async () => {
    expect(fact(await cardOfEntry(laptopEntry({ rounds: [round(1), round(2), round(3)] })), "Round")).toBe("3")
  })

  it("shows none for the round of a process without a recorded round, also when a folder rounds/round-1 is there", async () => {
    writeFile(project, `processes/${laptopId}/rounds/round-1/simulation.md`, "# simulation review of draft-1.md\n\nVerdict: PASS\n\nNo findings.\n")

    expect(fact(await cardOfEntry(entry(laptopId, laptopTitle, "review")), "Round")).toBe("none")
  })

  it("lists the questions of the newest questions file that has no answers, with their numbers, and nothing of an answered file or of the missing facts", async () => {
    writeLaptopQuestions(project)
    writeBoard(project, [laptopEntry()])

    const body = await dashboard()

    expect(fact(cardOf(body, laptopId), "Open questions")).toBe(`<ol><li value="1">${firstQuestion}</li><li value="2">${secondQuestion}</li></ol>`)
    expect(body).not.toContain(answeredQuestion)
    expect(body).not.toContain(missingFact)
    expect(body).not.toContain("These are not questions to answer here.")
  })

  it("shows the open questions in every stage, also in clarify", async () => {
    writeFile(project, `processes/${laptopId}/questions-1.md`, questionsText(1, [firstQuestion]))

    expect(fact(await cardOfEntry(entry(laptopId, laptopTitle, "clarify")), "Open questions")).toBe(`<ol><li value="1">${firstQuestion}</li></ol>`)
  })

  it("shows none for the open questions of a process without a questions file", async () => {
    writeFile(project, `processes/${laptopId}/request.md`, `# ${laptopTitle}\n\n1. This is the request, not a question.\n`)

    expect(fact(await cardOfEntry(laptopEntry()), "Open questions")).toBe("none")
  })

  it("shows none for the open questions of a process whose newest questions file has answers", async () => {
    writeFile(project, `processes/${laptopId}/questions-1.md`, questionsText(1, [answeredQuestion]))
    writeFile(project, `processes/${laptopId}/questions-2.md`, questionsText(2, [firstQuestion]))
    writeFile(project, `processes/${laptopId}/answers-2.md`, "1. The IT manager.\n")
    writeBoard(project, [laptopEntry()])

    const body = await dashboard()

    expect(fact(cardOf(body, laptopId), "Open questions")).toBe("none")
    expect(body).not.toContain(firstQuestion)
    expect(body).not.toContain(answeredQuestion)
  })

  it("names the cases that fail in the newest recorded round, and not a case that failed only in an earlier round", async () => {
    const card = await cardOfEntry(laptopEntry())

    expect(fact(card, "Failing cases")).toBe("case 3, case 5")
    expect(card).not.toContain("case 4")
    expect(card).not.toContain("case 1")
  })

  it.each([
    ["without a recorded round", {}],
    ["whose newest round has no list of cases", { rounds: [round(1, [[1, "FAIL"]]), round(2)] }],
    [
      "whose newest round has only cases that pass",
      {
        rounds: [
          round(1, [[1, "FAIL"]]),
          round(2, [
            [1, "PASS"],
            [2, "PASS"],
          ]),
        ],
      },
    ],
  ])("shows none for the failing cases of a process %s", async (_name, more) => {
    expect(fact(await cardOfEntry(entry(laptopId, laptopTitle, "approval", more)), "Failing cases")).toBe("none")
  })

  it("escapes the title, the owner and a question", async () => {
    writeFile(project, `processes/${laptopId}/questions-1.md`, questionsText(1, ["Is <b>this</b> & that decided?"]))

    const card = await cardOfEntry(entry(laptopId, "Laptops & <phones>", "clarify", { owner: `Kari "K" O'Hara` }))

    expect(card).toContain("<h3>Laptops &amp; &lt;phones&gt;</h3>")
    expect(fact(card, "Owner")).toBe("Kari &quot;K&quot; O&#39;Hara")
    expect(fact(card, "Open questions")).toBe('<ol><li value="1">Is &lt;b&gt;this&lt;/b&gt; &amp; that decided?</li></ol>')
    expect(card).not.toContain("<b>")
    expect(card).not.toContain("<phones>")
  })
})

describe("a dashboard that keeps running", () => {
  it("shows a process in the section of its new stage after move moved it, without a restart", async () => {
    writeBoard(project, [entry(laptopId, laptopTitle, "draft")])
    const address = await openDashboard(project)
    expect(stagesOf((await request(address, "/")).body, laptopId)).toEqual(["draft"])

    expect(runCommand(project, ["move", laptopId, "review"]).status).toBe(0)

    expect(stagesOf((await request(address, "/")).body, laptopId)).toEqual(["review"])
  })

  it("shows a process that new created after the dashboard started", async () => {
    const address = await openDashboard(project)
    expect(cards((await request(address, "/")).body)).toEqual([])

    expect(runCommand(project, ["new", laptopTitle]).status).toBe(0)

    expect(stagesOf((await request(address, "/")).body, laptopId)).toEqual(["intake"])
  })

  it.each([
    ["/board", "/board"],
    [`/${laptopId}`, laptopId],
    ["/..%2f..%2fpackage.json", "package.json"],
    ["/index.html", "index.html"],
  ])("answers 404 with the page Not found for %s, without the path that was asked for", async (pathname, asked) => {
    writeBoard(project, [entry(employeeId, employeeTitle, "draft")])

    const page = await request(await openDashboard(project), pathname)

    expect(page.status).toBe(404)
    expect(page.body).toContain("<title>Not found</title>")
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain("<p>There is nothing at this address.</p>")
    expect(page.body).toContain('<p><a href="/">Dashboard</a></p>')
    expect(page.body).not.toContain(asked)
    expect(page.body).not.toContain(employeeTitle)
  })

  it("ignores a query string", async () => {
    writeBoard(project, [laptopEntry()])
    const address = await openDashboard(project)

    const page = await request(address, "/?stage=review")

    expect(page.status).toBe(200)
    expect(page.body).toBe((await request(address, "/")).body)
  })

  it("answers POST, PUT and DELETE with 405 and Allow: GET, HEAD, answers HEAD without a page, and never changes a file of the project", async () => {
    writeBoard(project, [laptopEntry(), entry(employeeId, employeeTitle, "intake")])
    writeLaptopQuestions(project)
    const before = tree(project)
    const address = await openDashboard(project)

    for (const method of ["POST", "PUT", "DELETE"]) {
      const refused = await request(address, "/", method)
      expect(refused.status).toBe(405)
      expect(refused.headers.get("allow")).toBe("GET, HEAD")
      expect(refused.body).toBe("")
    }
    const head = await request(address, "/", "HEAD")
    expect(head.status).toBe(200)
    expect(head.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(head.body).toBe("")
    expect((await request(address, "/")).status).toBe(200)
    expect((await request(address, "/board")).status).toBe(404)
    expect(tree(project)).toEqual(before)
  })

  it("answers 500 without the name of the file while the board cannot be read, and 200 again after it is repaired", async () => {
    writeFile(project, boardFile, "{ not json")
    const address = await openDashboard(project)

    const broken = await request(address, "/")

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<title>Error</title>")
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain("<p>The dashboard cannot read the processes.</p>")
    expect(broken.body).not.toContain("board.json")
    expect(broken.body).not.toContain("JSON")

    writeBoard(project, [laptopEntry()])
    const repaired = await request(address, "/")
    expect(repaired.status).toBe(200)
    expect(stagesOf(repaired.body, laptopId)).toEqual(["rework"])
  })
})
