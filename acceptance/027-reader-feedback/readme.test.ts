import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const pages = "in which every earlier version can be opened."
const only =
  "It shows only versions the board lists, so no draft, no specification, no case and no approval that is not published can be read there, and it writes nothing but the feedback of a reader."
const form =
  "The page of every published version has a form for feedback: the reader says whether they did not understand the document or the process itself failed them, picks a step of the document or the whole document, writes what happened and may leave a name."
const stores =
  "The view stores each feedback as a file `feedback-<n>.md` in the folder `feedback` of the process, with the version, the step, the kind and the status `open`, and shows it to no reader."
const show =
  "`process-factory show` prints the number of open feedback behind every process that has any, and `process-factory show <process-id>` lists each open feedback with its version, its step, its kind and its text."

describe("the Status section of README.md", () => {
  it("says that the view writes nothing but the feedback of a reader, directly after the sentence about the pages, and no longer that it never writes a file", () => {
    expect(readmeStatus()).toContain(`${pages} ${only}`)
    expect(readmeStatus()).not.toContain("and it never writes a file.")
  })

  it("says what the form on the page of a published version asks", () => {
    expect(readmeStatus()).toContain(`${only} ${form}`)
  })

  it("says where the view stores feedback and that it shows it to no reader", () => {
    expect(readmeStatus()).toContain(`${form} ${stores}`)
  })

  it("says what show prints of the open feedback", () => {
    expect(readmeStatus()).toContain(`${stores} ${show}`)
  })
})
