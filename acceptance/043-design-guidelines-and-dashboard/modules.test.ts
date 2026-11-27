import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { root } from "../006-process-state-machine/store.ts"
import { exportedNames, importedNames, lineCount, presentNames, source } from "../037-split-command-line-into-modules/modules.ts"

/** The names a file of `bin/` imports from another file of `bin/`. */
function importedFrom(file: string, from: string): string[] {
  return importedNames(file)
    .filter((imported) => imported.from === from)
    .map((imported) => imported.imported)
}

describe("the files of bin", () => {
  it("are fifteen: the twelve of before, the two style files and the page of a process", () => {
    expect(presentNames()).toEqual(expect.arrayContaining(["page-style.mjs", "dashboard-style.mjs", "process-page.mjs"]))
    expect(presentNames()).toHaveLength(15)
  })

  it("have at most 600 lines each, like the files of src", () => {
    const tooLongInBin = presentNames().filter((name) => lineCount(name) > 600)
    const tooLongInSrc = readdirSync(path.join(root, "src")).filter((name) => readFileSync(path.join(root, "src", name), "utf8").replace(/\r?\n$/, "").split(/\r?\n/).length > 600)

    expect(presentNames()).toContain("process-page.mjs")
    expect(tooLongInBin).toEqual([])
    expect(tooLongInSrc).toEqual([])
  })
})

describe("bin/page-style.mjs and bin/dashboard-style.mjs", () => {
  it("export the shared style and the style of the dashboard, and import nothing", () => {
    expect(exportedNames("page-style.mjs")).toEqual(["pageStyle"])
    expect(exportedNames("dashboard-style.mjs")).toEqual(["dashboardStyle"])
    expect(importedNames("page-style.mjs")).toEqual([])
    expect(importedNames("dashboard-style.mjs")).toEqual([])
  })

  it("are where the reading view and the dashboard take their style from, which they no longer declare", () => {
    expect(importedFrom("reading-view.mjs", "./page-style.mjs")).toEqual(["pageStyle"])
    expect(importedFrom("dashboard.mjs", "./dashboard-style.mjs")).toEqual(["dashboardStyle"])
    expect(source("reading-view.mjs")).not.toMatch(/^const pageStyle\b/m)
    expect(source("dashboard.mjs")).not.toMatch(/^const (dashboardStyle|panelStyle)\b/m)
  })
})

describe("bin/panel.mjs and bin/process-page.mjs", () => {
  it("split the page of a process: the parts and the forms in panel.mjs, the header, the trail, the tabs and the addresses in process-page.mjs", () => {
    expect(exportedNames("panel.mjs").sort()).toEqual(["boardText", "needsDraftMark", "openQuestions", "processPart", "processParts", "turnLine"])
    expect(exportedNames("process-page.mjs").sort()).toEqual(["processPage", "progressTrail"])
    expect(importedFrom("process-page.mjs", "./panel.mjs")).toEqual(expect.arrayContaining(["processParts", "processPart"]))
    expect(importedFrom("dashboard.mjs", "./process-page.mjs").sort()).toEqual(["processPage", "progressTrail"])
    expect(importedFrom("dashboard.mjs", "./panel.mjs")).toContain("turnLine")
    expect(source("panel.mjs")).not.toContain("processPanel")
    expect(source("panel.mjs")).not.toContain("<aside>")
    expect(source("dashboard.mjs")).not.toContain("dashboardProcessPage")
  })
})

describe("bin/store.mjs", () => {
  it("exports draftNumbers, which the newest draft and the list of drafts are read through, with the pattern of a draft file once", () => {
    const text = source("store.mjs")

    expect(exportedNames("store.mjs")).toContain("draftNumbers")
    expect(importedFrom("panel.mjs", "./store.mjs")).toContain("draftNumbers")
    expect(text.split(String.raw`draft-(\d+)\.md`)).toHaveLength(2)
  })
})
