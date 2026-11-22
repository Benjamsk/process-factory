import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const never =
  "The command line never writes into a version folder that exists: every publication gets the next number, also a second publication of the same draft, so every earlier version stays readable as it was published."
const serve =
  "`process-factory serve` starts a reading view of the published processes on the machine it runs on, at the address `127.0.0.1:4173`, or at another port with `--port <number>`, and runs until it is stopped."
const pages =
  "Its front page lists every process that has a published version, and the page of a process shows the newest published document with the owner, who approved it and on which date, the version number and the version history, in which every earlier version can be opened."
const only =
  "It shows only versions the board lists, so no draft, no specification, no case and no approval that is not published can be read there, and it writes nothing but the feedback of a reader."

describe("the Status section of README.md", () => {
  it("says what process-factory serve starts, directly after the sentence about version folders", () => {
    expect(readmeStatus()).toContain(`${never} ${serve}`)
  })

  it("says what the front page and the page of a process show", () => {
    expect(readmeStatus()).toContain(`${serve} ${pages}`)
  })

  it("says that the view shows only versions the board lists and writes nothing but the feedback of a reader", () => {
    expect(readmeStatus()).toContain(`${pages} ${only}`)
  })
})
