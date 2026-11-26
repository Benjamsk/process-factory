import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { root } from "../006-process-state-machine/store.ts"

const writingBullet =
  "- Keep every file within 600 lines: `pnpm lint` (`max-lines`) and `pnpm test` (`lint/line-budget.test.ts`) fail on a tracked `.ts` or `.mjs` file that is longer. When a change would push a file past 600 lines, do not append: the specification of the job names the split, the new files and the code that moves into each, and the change makes that split."
const reviewingBullet =
  "- A split that the specification names to keep a file within 600 lines is code the task needs: do not flag it as code the task does not need or as a diff that could be smaller. Flag a file that a change pushes past 600 lines, and a split the specification does not name; both are [medium] findings."
/** The lines of `CLAUDE.md` before this job. */
const linesBefore = [
  "# Coding guidelines",
  "",
  "These rules apply to everyone who writes or reviews code in this repository, including the factory builder and the code reviewer.",
  "",
  "## Writing code",
  "",
  "- YAGNI: build only what the task asks for now. Add no options, parameters, abstractions, exports, configuration or error handling for cases the task does not name.",
  "- Reuse before you write: search the codebase for an existing function, component, hook, model or helper that already does the job and use it. Extract a shared helper only when the same logic would otherwise appear twice.",
  "- Keep the diff small: write the fewest lines that stay readable. Remove code your change leaves unused, and add no wrappers, intermediate variables or types that only restate other code.",
  "",
  "## Reviewing code",
  "",
  "- Flag code the task does not need: unused parameters, options, exports, abstractions or branches.",
  "- Flag new code that duplicates an existing function, component, hook or pattern, and name the one to reuse.",
  "- Flag code that could be clearly shorter without losing readability.",
  "- Code the task does not need and duplication of existing code are [medium] findings and mean CHANGES. Suggestions that only shorten code are [low] findings and alone are not a reason for CHANGES.",
]

function guidelineLines(): string[] {
  return readFileSync(path.join(root, "CLAUDE.md"), "utf8").replace(/\r?\n$/, "").split(/\r?\n/)
}

/** The bullets under a heading of `CLAUDE.md`, up to the next heading. */
function bulletsUnder(heading: string): string[] {
  const lines = guidelineLines()
  const body = lines.slice(lines.indexOf(heading) + 1)
  const end = body.findIndex((line) => line.startsWith("## "))
  return (end === -1 ? body : body.slice(0, end)).filter((line) => line.startsWith("- "))
}

describe("CLAUDE.md", () => {
  it("states the budget of 600 lines as the last bullet of Writing code", () => {
    expect(bulletsUnder("## Writing code").at(-1)).toBe(writingBullet)
  })

  it("tells reviewers to accept a split the specification names as the last bullet of Reviewing code", () => {
    expect(bulletsUnder("## Reviewing code").at(-1)).toBe(reviewingBullet)
  })

  it("has the two bullets once each and no other changed line", () => {
    const lines = guidelineLines()

    expect(lines.filter((line) => line === writingBullet || line === reviewingBullet)).toEqual([writingBullet, reviewingBullet])
    expect(lines.filter((line) => line !== writingBullet && line !== reviewingBullet)).toEqual(linesBefore)
  })
})
