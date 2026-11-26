import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { specText } from "../012-spec-completeness-gate/gate.ts"
import { post } from "../027-reader-feedback/feedback.ts"
import { berg, createBoth, emptyProject, firstStage, fjord, fjordName, get, laptopId, localAddresses, names, read, run, start, stopAll, store, write, writeBoard, writePublished } from "./organisations.ts"

const fjordTitle = "Handle a lost laptop"
const bergTitle = "Lost laptop at Berg"
const fjordLine = `<p>Organisation: ${fjordName}</p>`
const fjordLineOfTwo = `<p>Organisation: ${fjordName} (<a href="/">all organisations</a>)</p>`
const bergLineOfTwo = '<p>Organisation: Berg &amp; Dal AS (<a href="/">all organisations</a>)</p>'
const servers: ["serve" | "dashboard"][] = [["serve"], ["dashboard"]]

let project = ""

/** Both organisations with the process `001-handle-a-lost-laptop` as published version 1, each with its own title and document. */
function writeTwoPublished(): void {
  createBoth(project)
  writePublished(project, fjord, fjordTitle, "# Handle a lost laptop\n\n## Steps\n\n1. Call the IT manager.\n")
  writePublished(project, berg, bergTitle, "# Lost laptop at Berg\n\n## Steps\n\n1. Call the office.\n")
}

/** Both organisations with the process `001-handle-a-lost-laptop` in `spec`, each with its own title and a specification of which every section is decided. */
function writeTwoInSpec(): void {
  createBoth(project)
  const titles = new Map([
    [fjord, fjordTitle],
    [berg, bergTitle],
  ])
  for (const [organisation, title] of titles) {
    writeBoard(project, organisation, [{ id: laptopId, title, stage: "spec", history: [{ at: "2026-11-19T15:40:02.456Z", stage: "spec" }] }])
    write(project, `${store(organisation)}/processes/${laptopId}/spec.md`, specText())
  }
}

beforeEach(() => {
  project = emptyProject()
})

afterEach(async () => {
  await stopAll()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

describe("the address / of the reading view and of the dashboard", () => {
  it.each(servers)("says there is no organisation, goes straight to the only one, and lists two with their names, as they are at each request: %s", async (command) => {
    const address = await start(project, command)

    const none = await get(address, "/")
    expect(none.status).toBe(200)
    expect(none.body).toContain("<h1>Organisations</h1>")
    expect(none.body).toContain("<p>No organisation yet.</p>")
    expect(names(project)).toEqual([])

    expect(run(project, ["org", "new", fjordName]).status).toBe(0)
    const one = await get(address, "/")
    expect(one.status).toBe(302)
    expect(one.location).toBe(`/${fjord}`)

    expect(run(project, ["org", "new", "Berg & Dal AS"]).status).toBe(0)
    const two = await get(address, "/")
    expect(two.status).toBe(200)
    expect(two.body).toContain("<h1>Organisations</h1>")
    expect(two.body).not.toContain("No organisation yet.")
    const items = [...two.body.matchAll(/<li>(.*?)<\/li>/gs)].map((match) => (match[1] ?? "").trim())
    expect(items).toEqual([`<a href="/${berg}">Berg &amp; Dal AS</a>`, `<a href="/${fjord}">${fjordName}</a>`])
    expect(two.body).not.toContain("<p>Organisation: ")
  })

  it.each(servers)("answers 404 for an address whose first part is no organisation, also the address of a process without its organisation: %s", async (command) => {
    writeTwoPublished()
    const address = await start(project, command)

    for (const pathname of [`/${laptopId}`, `/${laptopId}/1`, "/no-such-organisation", "/..%2f..%2fpackage.json"]) {
      const page = await get(address, pathname)
      expect(page.status).toBe(404)
      expect(page.body).toContain("<h1>Not found</h1>")
      expect(page.body).not.toContain(fjordTitle)
      expect(page.body).not.toContain("<p>Organisation: ")
    }
  })
})

describe("the reading view of a project with two organisations", () => {
  it("shows the published processes of an organisation at /<org-id>, with every link inside that organisation", async () => {
    writeTwoPublished()
    const address = await start(project, "serve")

    const front = await get(address, `/${fjord}`)

    expect(front.status).toBe(200)
    expect(front.body).toContain("<h1>Published processes</h1>")
    expect(front.body).toContain(`<a href="/${fjord}/${laptopId}">${fjordTitle}</a>`)
    expect(front.body).not.toContain(bergTitle)
    expect(localAddresses(front.body).filter((to) => to !== "/" && !to.startsWith(`/${fjord}/`))).toEqual([])
    expect((await get(address, `/${berg}`)).body).toContain(`<a href="/${berg}/${laptopId}">${bergTitle}</a>`)
  })

  it("shows a version at /<org-id>/<process-id>/<n>, with the document of that organisation and every link and the form inside it", async () => {
    writeTwoPublished()
    const address = await start(project, "serve")

    const current = await get(address, `/${fjord}/${laptopId}`)
    const page = await get(address, `/${fjord}/${laptopId}/1`)

    expect(current.status).toBe(200)
    expect(page.status).toBe(200)
    expect(page.body).toContain(`<title>${fjordTitle}, version 1</title>`)
    expect(page.body).toContain("Call the IT manager.")
    expect(page.body).not.toContain("Call the office.")
    expect(page.body).toContain(`<a href="/${fjord}">All processes</a>`)
    expect(page.body).toContain(`<form method="post" action="/${fjord}/${laptopId}/1/feedback">`)
    expect(page.body).toContain(`<a href="/${fjord}/${laptopId}/1">Version 1</a>`)
    expect(localAddresses(page.body).filter((to) => to !== "/" && to !== `/${fjord}` && !to.startsWith(`/${fjord}/`))).toEqual([])
    expect((await get(address, `/${berg}/${laptopId}/1`)).body).toContain("Call the office.")
  })

  it("answers 404 inside an organisation with the way back to that organisation", async () => {
    writeTwoPublished()
    const address = await start(project, "serve")

    const page = await get(address, `/${fjord}/009-no-such-process`)

    expect(page.status).toBe(404)
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain(`<a href="/${fjord}">All processes</a>`)
  })

  it("stores a feedback in the organisation it was posted to, and redirects inside that organisation", async () => {
    writeTwoPublished()
    const address = await start(project, "serve")
    const feedbackPath = `/${fjord}/${laptopId}/1/feedback`

    const answer = await post(address, feedbackPath, { kind: "document", step: "1", text: "I did not understand step one.", name: "Ola Hansen" })

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(feedbackPath)
    expect(names(project, `${store(fjord)}/processes/${laptopId}/feedback`)).toEqual(["feedback-1.md"])
    expect(read(project, `${store(fjord)}/processes/${laptopId}/feedback/feedback-1.md`)).toContain("I did not understand step one.")
    expect(names(project, `${store(berg)}/processes/${laptopId}/feedback`)).toEqual([])
    expect(names(project)).toEqual(["organisations"])
    const received = await get(address, feedbackPath)
    expect(received.status).toBe(200)
    expect(received.body).toContain("<h1>Feedback received</h1>")
    expect(received.body).toContain(`<a href="/${fjord}/${laptopId}/1">Back to the document</a>`)
    expect(received.body).toContain(fjordLineOfTwo)
  })
})

describe("the name of the organisation on a page", () => {
  it.each(servers)("is the first element of the body of every page inside an organisation, with the way to the others when there are more: %s", async (command) => {
    writeTwoPublished()
    const address = await start(project, command)

    for (const pathname of [`/${fjord}`, `/${fjord}/${laptopId}`, `/${fjord}/009-no-such-process`]) {
      const page = await get(address, pathname)
      expect(page.body).toContain(fjordLineOfTwo)
      expect(page.body).toMatch(/<body>\s*<p>Organisation: Fjord Skole \(<a href="\/">all organisations<\/a>\)<\/p>/)
    }
    const other = await get(address, `/${berg}`)
    expect(other.body).toContain(bergLineOfTwo)
    expect(other.body).not.toContain("Berg & Dal AS")
  })

  it.each(servers)("stands without the way to the others when there is one organisation: %s", async (command) => {
    expect(run(project, ["org", "new", fjordName]).status).toBe(0)
    writePublished(project, fjord, fjordTitle, "# Handle a lost laptop\n\n## Steps\n\n1. Call the IT manager.\n")
    const address = await start(project, command)

    for (const pathname of [`/${fjord}`, `/${fjord}/${laptopId}`, `/${fjord}/009-no-such-process`]) {
      const page = await get(address, pathname)
      expect(page.body).toMatch(/<body>\s*<p>Organisation: Fjord Skole<\/p>/)
      expect(page.body).toContain(fjordLine)
      expect(page.body).not.toContain("all organisations")
    }
  })

  it.each(servers)("is on the page Error of an organisation whose board cannot be read, while the other organisation is shown: %s", async (command) => {
    writeTwoPublished()
    write(project, `${store(fjord)}/processes/board.json`, "{ not json")
    const address = await start(project, command)

    const broken = await get(address, `/${fjord}`)

    expect(broken.status).toBe(500)
    expect(broken.body).toContain("<h1>Error</h1>")
    expect(broken.body).toContain(fjordLineOfTwo)
    expect((await get(address, `/${berg}`)).status).toBe(200)
  })
})

describe("the dashboard of a project with two organisations", () => {
  it("shows the board of an organisation at /<org-id> and the panel of a process at /<org-id>/<process-id>, with every link and form inside that organisation", async () => {
    writeTwoInSpec()
    const address = await start(project, "dashboard")

    const board = await get(address, `/${fjord}`)
    const panel = await get(address, `/${fjord}/${laptopId}`)

    expect(board.status).toBe(200)
    expect(board.body).toContain("<h1>Dashboard</h1>")
    expect(board.body).toContain(`href="/${fjord}/${laptopId}"`)
    expect(board.body).toContain(fjordTitle)
    expect(board.body).not.toContain(bergTitle)
    expect(localAddresses(board.body).filter((to) => to !== "/" && !to.startsWith(`/${fjord}/`))).toEqual([])
    expect(panel.status).toBe(200)
    expect(panel.body).toContain("<aside>")
    expect(panel.body).toContain(`<a href="/${fjord}">Close</a>`)
    expect(panel.body).toContain(`<form method="post" action="/${fjord}/${laptopId}/accept-spec">`)
    expect(panel.body).toContain(`href="/${fjord}/${laptopId}/edit/spec.md"`)
    expect(panel.body).not.toContain(bergTitle)
    expect(localAddresses(panel.body).filter((to) => to !== "/" && to !== `/${fjord}` && !to.startsWith(`/${fjord}/`))).toEqual([])
    expect((await get(address, `/${berg}`)).body).toContain(bergTitle)
  })

  it("answers 404 inside an organisation with the way back to its board", async () => {
    writeTwoInSpec()
    const address = await start(project, "dashboard")

    const page = await get(address, `/${fjord}/009-no-such-process`)

    expect(page.status).toBe(404)
    expect(page.body).toContain("<h1>Not found</h1>")
    expect(page.body).toContain(`<a href="/${fjord}">Dashboard</a>`)
  })

  it("takes a decision for the process of the organisation it was posted to, also when another organisation has a process with the same id", async () => {
    writeTwoInSpec()
    const address = await start(project, "dashboard")

    const answer = await post(address, `/${fjord}/${laptopId}/accept-spec`, {})

    expect(answer.status).toBe(303)
    expect(answer.headers.location).toBe(`/${fjord}/${laptopId}`)
    expect(firstStage(project, fjord)).toBe("cases")
    expect(firstStage(project, berg)).toBe("spec")
  })

  it("shows what the command line refused on the page Not done of that organisation, with the way back to the process", async () => {
    writeTwoInSpec()
    write(project, `${store(fjord)}/processes/${laptopId}/spec.md`, specText(["Roles"]))
    const address = await start(project, "dashboard")

    const answer = await post(address, `/${fjord}/${laptopId}/accept-spec`, {})

    expect(answer.status).toBe(409)
    expect(answer.body).toContain("<h1>Not done</h1>")
    expect(answer.body).toContain(`these sections of ${store(fjord)}/processes/${laptopId}/spec.md are open`)
    expect(answer.body).toContain(`<a href="/${fjord}/${laptopId}">Back to the process</a>`)
    expect(answer.body).toContain(fjordLineOfTwo)
    expect(firstStage(project, fjord)).toBe("spec")
  })
})
