import { rmSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { emptyFolder } from "../006-process-state-machine/store.ts"
import { openView, request, stopViews, writeLaptop } from "../026-reading-view-on-localhost/view.ts"
import { flat, forms, laptopPath } from "./feedback.ts"

let project = ""

beforeEach(() => {
  project = emptyFolder()
})

afterEach(async () => {
  await stopViews()
  rmSync(project, { recursive: true, force: true, maxRetries: 5 })
})

/** The values and the texts of the options of the step, in the order of the page. */
function options(body: string): string[][] {
  return [...body.matchAll(/<option value="([^"]*)">(.*?)<\/option>/gs)].map((match) => [match[1] ?? "", (match[2] ?? "").trim()])
}

describe("the feedback form on the page of a version", () => {
  it("stands between the document and the version history, with the two kinds, the steps, the text, the name and the button, and without script", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(page.status).toBe(200)
    const body = flat(page.body)
    const part = body.slice(body.indexOf("</main>"), body.indexOf("<h2>Version history</h2>"))
    const pieces = [
      "<h2>Feedback</h2>",
      `<form method="post" action="${laptopPath}/2/feedback">`,
      "<legend>What went wrong?</legend>",
      '<label><input type="radio" name="kind" value="document" required> I did not understand the document</label>',
      '<label><input type="radio" name="kind" value="process" required> The process itself failed me</label>',
      '<label for="step">What is it about?</label>',
      '<select id="step" name="step"><option value="whole">The whole document</option><option value="1">Step 1</option></select>',
      '<label for="text">What happened?</label>',
      '<textarea id="text" name="text" rows="6" maxlength="2000" required></textarea>',
      '<label for="name">Your name (may be left empty)</label>',
      '<input id="name" name="name" maxlength="100">',
      "<p>Your feedback is stored with this version and is read by the owner of the process. Other readers do not see it.</p>",
      '<button type="submit">Send feedback</button>',
      "</form>",
    ]
    for (const piece of pieces) expect(part).toContain(piece)
    const positions = pieces.map((piece) => part.indexOf(piece))
    expect([...positions].sort((first, second) => first - second)).toEqual(positions)
    expect(forms(page.body)).toBe(1)
    expect(part).not.toContain("checked")
    expect(part).not.toContain("selected")
    expect(page.body).not.toContain("<script")
    expect((await request(address, `${laptopPath}/2`)).body).toBe(page.body)
  })

  it("posts to the address of the version it is on, and is not on the front page or the page Not found", async () => {
    writeLaptop(project)
    const address = await openView(project)

    const earlier = await request(address, `${laptopPath}/1`)

    expect(earlier.status).toBe(200)
    expect(earlier.body).toContain(`<form method="post" action="${laptopPath}/1/feedback">`)
    expect(earlier.body).not.toContain(`action="${laptopPath}/2/feedback"`)
    expect(forms(earlier.body)).toBe(1)
    expect((await request(address, "/")).body).not.toContain("<form")
    expect((await request(address, "/no-such-process")).body).not.toContain("<form")
  })

  it("offers the whole document and every number of a numbered item once, in the order of the document", async () => {
    writeLaptop(project, {}, "# Handle a lost laptop\n\n## Steps\n\n1. Block the laptop.\n2. Call the owner.\n10. Write the report.\n\n## Afterwards\n\n1. Tell the team.\n2. Close the case.\n")
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(options(page.body)).toEqual([
      ["whole", "The whole document"],
      ["1", "Step 1"],
      ["2", "Step 2"],
      ["10", "Step 10"],
    ])
  })

  it("offers only the whole document for a document without a numbered item", async () => {
    writeLaptop(project, {}, "# Handle a lost laptop\n\nCall the IT manager.\n\n- One point\n")
    const address = await openView(project)

    const page = await request(address, laptopPath)

    expect(forms(page.body)).toBe(1)
    expect(options(page.body)).toEqual([["whole", "The whole document"]])
  })
})
