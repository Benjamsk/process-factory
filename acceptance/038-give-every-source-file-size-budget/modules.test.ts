import { describe, expect, it } from "vitest"
import { entryFile, exportedNames, importedNames, lineCount, presentNames, source } from "../037-split-command-line-into-modules/modules.ts"

const reviewNames = [
  "recordRound",
  "respecProcess",
  "sendBackDraft",
  "editProcessFile",
  "roundFindings",
  "isEditableName",
  "editedPath",
  "isEditable",
  "editableText",
  "stagesThatMoveToDraft",
]
const panelNames = ["processPanel", "boardText", "openQuestions", "needsDraftMark"]

/** The names of the list a file of `bin/` declares as a function or as a constant. */
function declared(file: string, names: string[]): string[] {
  const text = source(file)
  return names.filter((name) => new RegExp(String.raw`^(?:export\s+)?(?:async\s+)?(?:function|const)\s+${name}\b`, "m").test(text))
}

describe("the split of bin/state-machine.mjs", () => {
  it("moves the commands of the review loop to bin/review.mjs, which exports them", () => {
    expect(exportedNames("review.mjs")).toEqual(expect.arrayContaining(reviewNames))
    expect(declared("state-machine.mjs", reviewNames)).toEqual([])
  })

  it("lets bin/process-factory.mjs take round, respec, send-back and edit from ./review.mjs and the other five commands from ./state-machine.mjs", () => {
    const from = (file: string): string[] =>
      importedNames(entryFile)
        .filter((imported) => imported.from === file)
        .map((imported) => imported.imported)
        .sort()

    expect(from("./review.mjs")).toEqual(["editProcessFile", "recordRound", "respecProcess", "sendBackDraft"])
    expect(from("./state-machine.mjs")).toEqual(["acceptSpec", "answerProcess", "approveDraft", "moveProcess", "setOwner"])
  })
})

describe("the split of bin/dashboard.mjs", () => {
  it("moves the panel of a process to bin/panel.mjs, which exports what the dashboard uses of it", () => {
    expect(exportedNames("panel.mjs").sort()).toEqual([...panelNames].sort())
    expect(declared("dashboard.mjs", panelNames)).toEqual([])
  })
})

describe("the files of bin", () => {
  it("have at most 600 lines each", () => {
    const tooLong = presentNames()
      .filter((name) => lineCount(name) > 600)
      .map((name) => `${name}: ${String(lineCount(name))} lines`)

    expect(tooLong).toEqual([])
  })
})
