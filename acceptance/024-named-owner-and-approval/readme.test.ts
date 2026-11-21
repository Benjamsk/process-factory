import { describe, expect, it } from "vitest"
import { readmeStatus } from "../010-clarifying-questions/clarify.ts"

const withoutReviewer = "Without a reviewer `next` on a process in `review` says so and moves nothing."
const approval =
  "In `approval` Claude asks who the owner of the process is when it has none, shows the newest draft, the verdict of every reviewer and the reason of a stop, and asks the user for their full name and whether they approve; the command line records the approval only when that name is the owner of the process, and the process stays in `approval`."
const otherStages = "For every other stage `next` reports the stage and moves nothing."
const regressed = "so the loop ends only when no case regresses."
const owner =
  'Every process needs an owner before it can be approved: `process-factory owner <process-id> "<person>"` stores the name on the board, in every stage and again to change it, and refuses a name that does not stand in `organisation/roles.md` as whole words, letter for letter, outside the sections whose heading starts with `Example:`.'
const show = "`process-factory show <process-id>` prints the owner."
const approve =
  '`process-factory approve <process-id> --by "<person>"` approves the newest draft of a process in `approval`: it refuses a process without an owner, a name that is not the owner and an owner who is no longer named in `organisation/roles.md`, and writes who approved which draft and when to `approval-draft-<n>.md` in the folder `versions` of the process.'
const published = "The process stays in `approval`, and `move <process-id> published` is refused until the newest draft has such a file."

describe("the Status section of README.md", () => {
  it("says eight stages have a step and no longer seven", () => {
    const text = readmeStatus()
    expect(text).toContain("Eight stages have a step.")
    expect(text).not.toContain("Seven stages have a step.")
  })

  it("says what happens in approval, between the sentence about a missing reviewer and the sentence about every other stage", () => {
    expect(readmeStatus()).toContain(`${withoutReviewer} ${approval} ${otherStages}`)
  })

  it("says after the sentence about regressed cases how a process gets its owner and that show prints it", () => {
    expect(readmeStatus()).toContain(`${regressed} ${owner} ${show}`)
  })

  it("says what approve refuses and writes, and that a move to published is refused until the newest draft has the file", () => {
    expect(readmeStatus()).toContain(`${show} ${approve} ${published}`)
  })
})
